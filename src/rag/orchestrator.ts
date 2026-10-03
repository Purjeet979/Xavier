import { retrieveChunks, type RetrievalResult, type RetrievalDebugInfo } from './retrieval'
import { loadPreferences } from '@/lib/preferences'
import { getLLMVariant } from '@/llm/llm-models'
import { streamLLMWithToolLoop, type RuntimeMessage, type LLMRuntimeHandles } from '@/llm/llm-runtime'
import { evaluateGate } from './grounding/gate'
import { REWRITE_FOLLOWUPS, REWRITE_SKIP_WORDS, REWRITE_TIMEOUT_MS } from './grounding/config'
import { buildContext } from './grounding/context'
import { AnswerSchemaString, tolerantParseJson, extractPartialAnswer } from './grounding/schema'
import { verifyAnswer } from './grounding/verifier'
import { getEffectiveTierAsync } from './tiers'

export interface RagDebugInfo {
  userQuery: string
  retrievalQuery: string
  wasRewritten: boolean
  historyTurnCount: number
  retrieval: RetrievalDebugInfo
  grounding?: { pass: boolean; topCosine: number; threshold: number }
  contextChars?: number
  contextTokens?: number
  truncatedChunks?: number
  outcome?: 'gate_refused' | 'answered' | 'verifier_all_dropped' | 'parse_fallback' | 'partial_fallback' | 'error' | 'tier0_evidence_only'
  citedIds?: string[]
  invalidCitedIds?: string[]
  citationsInferred?: boolean
}

export interface RAGAnswerChunk {
  type: 'text_delta' | 'thinking_delta' | 'citations' | 'retrieval_query' | 'debug' | 'done' | 'error' | 'verified' | 'context_chunks'
  text?: string
  contextChunks?: RetrievalResult[]
  citations?: RetrievalResult[]
  removedCount?: number
  /** Standalone search query used for retrieval (may differ from the user turn). */
  retrievalQuery?: string
  debug?: RagDebugInfo
  error?: string
}

/** Keep recent turns so local models stay within context limits. */
const MAX_HISTORY_TURNS = 8

function normalizePriorTurns(history: RuntimeMessage[] | undefined): RuntimeMessage[] {
  return (history ?? [])
    .filter((m) => m.role === 'user' || m.role === 'assistant')
    .filter((m) => m.content.trim().length > 0)
    .slice(-MAX_HISTORY_TURNS)
}
function formatHistoryForRewrite(prior: RuntimeMessage[]): string {
  return prior
    .map((m) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
    .join('\n')
}

/**
 * Rewrite a follow-up into a standalone search query using prior turns.
 * Falls back to the original query if rewriting fails or history is empty.
 */
async function rewriteQueryForRetrieval(
  query: string,
  prior: RuntimeMessage[],
  variant: ReturnType<typeof getLLMVariant>,
  llmHandles: LLMRuntimeHandles,
  abortSignal?: AbortSignal
): Promise<string> {
  if (!REWRITE_FOLLOWUPS) return query
  if (prior.length === 0) return query
  if (query.split(/\s+/).length >= REWRITE_SKIP_WORDS) return query

  const rewritePrompt = `Given the conversation history and the latest user message, write a single standalone search query that captures what the user is asking for now.
Resolve pronouns and references (e.g. "it", "that", "the second one") using the history.
Output ONLY the search query text — no quotes, labels, or explanation.
If the latest message is already a complete question, or if the user is asking about a different document or topic, return the latest message unchanged.`

  const rewriteUser = `Conversation history:
${formatHistoryForRewrite(prior)}

Latest user message:
${query}

Standalone search query:`

  try {
    const timeoutController = new AbortController()
    if (abortSignal) {
      abortSignal.addEventListener('abort', () => timeoutController.abort())
    }
    const timeoutId = setTimeout(() => timeoutController.abort(), REWRITE_TIMEOUT_MS)

    let rewritten = ''
    const stream = streamLLMWithToolLoop(
      variant,
      llmHandles,
      [{ role: 'user', content: rewriteUser }],
      rewritePrompt,
      undefined,
      {
        maxTokens: 128,
        thinkingEnabled: false,
        toolsEnabled: false,
      },
      timeoutController.signal
    )

    for await (const event of stream) {
      if (timeoutController.signal.aborted) {
        clearTimeout(timeoutId)
        return query
      }
      if (event.type === 'text_delta' && event.text) {
        rewritten += event.text
      }
    }
    clearTimeout(timeoutId)

    const cleaned = rewritten
      .trim()
      .replace(/^["'`]+|["'`]+$/g, '')
      .replace(/^(standalone search query|search query|query)\s*:\s*/i, '')
      .trim()

    return cleaned.length > 0 ? cleaned : query
  } catch {
    return query
  }
}
export async function* generateRAGAnswer(
  query: string,
  options: {
    projectId: string
    embeddingModelId: string
    documentId?: string
    documentIds?: string[]
    /** Prior user/assistant turns (excluding the current query). */
    conversationHistory?: RuntimeMessage[]
    abortSignal?: AbortSignal
    llmHandles: LLMRuntimeHandles
  }
): AsyncGenerator<RAGAnswerChunk, void, unknown> {
  try {
    const prefs = loadPreferences()
    const variant = getLLMVariant(prefs.llmVariantId)
    const prior = normalizePriorTurns(options.conversationHistory)

    // 1. Rewrite follow-ups into a standalone retrieval query when history exists
    const retrievalQuery = await rewriteQueryForRetrieval(
      query,
      prior,
      variant,
      options.llmHandles,
      options.abortSignal
    )

    if (options.abortSignal?.aborted) return

    yield { type: 'retrieval_query', retrievalQuery }

    // 2. Retrieve relevant chunks using the standalone query
    const { results: allCitations, debug: retrievalDebug } = await retrieveChunks(retrievalQuery, {
      embeddingModelId: options.embeddingModelId,
      projectId: options.projectId,
      documentId: options.documentId,
      documentIds: options.documentIds,
    })

    const gateResult = evaluateGate(allCitations, options.embeddingModelId)

    const debug: RagDebugInfo = {
      userQuery: query,
      retrievalQuery,
      wasRewritten: retrievalQuery.trim() !== query.trim(),
      historyTurnCount: prior.length,
      retrieval: retrievalDebug,
      grounding: gateResult,
    }

    yield { type: 'debug', debug }

    if (!gateResult.pass || allCitations.length === 0) {
      debug.outcome = 'gate_refused'
      yield { type: 'debug', debug }
      yield { type: 'text_delta', text: 'Not found in your material' }
      yield { type: 'done' }
      return
    }

    const citations = allCitations
    yield { type: 'context_chunks', contextChunks: citations }

    const effectiveTier = await getEffectiveTierAsync()
    if (effectiveTier === 0) {
      debug.outcome = 'tier0_evidence_only'
      yield { type: 'debug', debug }
      yield { type: 'text_delta', text: 'Hardware Tier 0 (Fallback): Generation disabled.\n\nHere are the most relevant excerpts from your documents:\n\n' }
      for (let i = 0; i < citations.length; i++) {
        yield { type: 'text_delta', text: `**[Source C${i + 1}]:** ${citations[i].text}\n\n` }
      }
      yield { type: 'citations', citations }
      yield { type: 'done' }
      return
    }

    const { contextText, truncatedCount, contextChars } = buildContext(citations)
    
    debug.contextChars = contextChars
    debug.contextTokens = Math.ceil(contextChars / 4)
    debug.truncatedChunks = truncatedCount
    yield { type: 'debug', debug }

    const systemPrompt = `You are a helpful assistant answering user queries based on the provided document excerpts.
Answer the query as accurately as possible using only the context provided.
Each excerpt is labeled with its source document name (e.g. [C1] [Source Document: "filename.pdf"]).
Always answer using the excerpts that specifically address the current query. Do not confuse facts across different source documents or rely on assumptions from prior turns.
You MUST output your response in valid JSON matching this schema:
${AnswerSchemaString}

For the "citations" array, use the exact labels (e.g. "C1", "C2") of the chunks that support your answer.
If the context doesn't contain enough information to answer, state that you don't know in the answer field, and return an empty citations array.
When reading markdown tables, carefully align the columns to extract the correct value.

Context Excerpts:
${contextText}`

    const messages: RuntimeMessage[] = [...prior, { role: 'user', content: query }]

    let rawOutput = ''
    let lastRendered = ''

    const stream = streamLLMWithToolLoop(
      variant,
      options.llmHandles,
      messages,
      systemPrompt,
      undefined,
      {
        maxTokens: 384,
        thinkingEnabled: false,
        toolsEnabled: false,
        temperature: 0,
        responseFormat: { type: 'json_object', schema: AnswerSchemaString }
      },
      options.abortSignal
    )

    for await (const event of stream) {
      if (options.abortSignal?.aborted) return
      
      if (event.type === 'text_delta') {
        rawOutput += event.text
        const currentAnswer = extractPartialAnswer(rawOutput)
        if (currentAnswer.length > lastRendered.length) {
          const delta = currentAnswer.slice(lastRendered.length)
          yield { type: 'text_delta', text: delta }
          lastRendered = currentAnswer
        }
      }
    }

    let success = false
    let isParseFallback = false
    let parsedAnswer = ''
    let finalCitations: typeof citations = []

    try {
      const parsed = tolerantParseJson(rawOutput)
      parsedAnswer = parsed.answer
      
      const rawCitedIds = parsed.citations || []
      debug.citedIds = rawCitedIds

      const validCitations: typeof citations = []
      const invalidIds: string[] = []
      const seenIdx = new Set<number>()

      rawCitedIds.forEach((label: string) => {
        const m = label.match(/C(\d+)/)
        if (m) {
          const idx = parseInt(m[1], 10) - 1
          if (citations[idx]) {
            if (!seenIdx.has(idx)) {
              validCitations.push(citations[idx])
              seenIdx.add(idx)
            }
            return
          }
        }
        invalidIds.push(label)
      })

      debug.invalidCitedIds = invalidIds

      if (validCitations.length > 0) {
        finalCitations = validCitations
      } else {
        finalCitations = citations
        debug.citationsInferred = true
      }
      
      success = true
    } catch {
      const partial = extractPartialAnswer(rawOutput)
      if (partial.trim()) {
        parsedAnswer = partial
        finalCitations = citations
        success = true
        isParseFallback = true
      } else if (rawOutput.trim()) {
        parsedAnswer = rawOutput.trim()
        finalCitations = citations
        success = true
        isParseFallback = true
      }
    }

    if (success) {
      const { verifiedText, removedCount } = await verifyAnswer(parsedAnswer, finalCitations, options.embeddingModelId)
      
      if (verifiedText.trim() === '') {
        debug.outcome = 'verifier_all_dropped'
        yield { type: 'verified', text: 'Not found in your material', removedCount: 0 }
        yield { type: 'citations', citations: [] }
      } else {
        debug.outcome = isParseFallback ? 'parse_fallback' : 'answered'
        yield { type: 'verified', text: verifiedText, removedCount }
        yield { type: 'citations', citations: isParseFallback || debug.citationsInferred ? [] : finalCitations }
      }
    } else {
      debug.outcome = parsedAnswer.trim() ? 'partial_fallback' : 'parse_fallback'
      yield { type: 'text_delta', text: '\n\n[Fallback: Could not parse structured answer. Here is the evidence]' }
      yield { type: 'citations', citations: [] }
    }

    yield { type: 'debug', debug }
    yield { type: 'done' }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Answer generation failed'
    // Ensure we emit debug with error outcome even if we failed early
    yield { type: 'debug', debug: { userQuery: query, retrievalQuery: query, wasRewritten: false, historyTurnCount: 0, retrieval: { query } as unknown as RetrievalDebugInfo, outcome: 'error' } }
    yield { type: 'error', error: message }
  }
}
