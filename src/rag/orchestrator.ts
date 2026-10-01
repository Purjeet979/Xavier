import { retrieveChunks, type RetrievalResult, type RetrievalDebugInfo } from './retrieval'
import { loadPreferences } from '@/lib/preferences'
import { getLLMVariant } from '@/llm/llm-models'
import { streamLLMWithToolLoop, type RuntimeMessage, type LLMRuntimeHandles } from '@/llm/llm-runtime'
import { evaluateGate } from './grounding/gate'
import { TOP_K_CONTEXT } from './grounding/config'
import { buildContext } from './grounding/context'
import { AnswerSchemaString, tolerantParseJson, extractPartialAnswer } from './grounding/schema'
import { verifyAnswer } from './grounding/verifier'
import { getEffectiveTier } from './tiers'

export interface RagDebugInfo {
  userQuery: string
  retrievalQuery: string
  wasRewritten: boolean
  historyTurnCount: number
  retrieval: RetrievalDebugInfo
  grounding?: { pass: boolean; topCosine: number; threshold: number }
}

export interface RAGAnswerChunk {
  type: 'text_delta' | 'thinking_delta' | 'citations' | 'retrieval_query' | 'debug' | 'done' | 'error' | 'verified'
  text?: string
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
  if (prior.length === 0) return query

  const rewritePrompt = `Given the conversation history and the latest user message, write a single standalone search query that captures what the user is asking for now.
Resolve pronouns and references (e.g. "it", "that", "the second one") using the history.
Output ONLY the search query text — no quotes, labels, or explanation.
If the latest message is already a complete standalone question, return it unchanged.`

  const rewriteUser = `Conversation history:
${formatHistoryForRewrite(prior)}

Latest user message:
${query}

Standalone search query:`

  try {
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
      abortSignal
    )

    for await (const event of stream) {
      if (abortSignal?.aborted) return query
      if (event.type === 'text_delta' && event.text) {
        rewritten += event.text
      }
    }

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
      yield { type: 'text_delta', text: 'Not found in your material' }
      yield { type: 'done' }
      return
    }

    const citations = allCitations.slice(0, TOP_K_CONTEXT)

    const effectiveTier = getEffectiveTier()
    if (effectiveTier === 0) {
      yield { type: 'text_delta', text: 'Hardware Tier 0 (Fallback): Generation disabled.\n\nHere are the most relevant excerpts from your documents:\n\n' }
      for (let i = 0; i < citations.length; i++) {
        yield { type: 'text_delta', text: `**[Source C${i + 1}]:** ${citations[i].text}\n\n` }
      }
      yield { type: 'citations', citations }
      yield { type: 'done' }
      return
    }

    const contextText = buildContext(citations)

    const systemPrompt = `You are a helpful assistant answering user queries based on the provided document excerpts.
Answer the query as accurately as possible using only the context provided.
You MUST output your response in valid JSON matching this schema:
${AnswerSchemaString}

For the "citations" array, use the exact labels (e.g. "C1", "C2") of the chunks that support your answer.
If the context doesn't contain enough information to answer, state that you don't know in the answer field, and return an empty citations array.

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
        maxTokens: 1024,
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
    let finalCitations = citations
    let parsedAnswer = ''

    try {
      const parsed = tolerantParseJson(rawOutput)
      parsedAnswer = parsed.answer
      
      finalCitations = parsed.citations.map(label => {
        const m = label.match(/C(\d+)/)
        if (!m) return null
        const idx = parseInt(m[1], 10) - 1
        return citations[idx]
      }).filter(Boolean) as typeof citations

      if (finalCitations.length === 0) {
        finalCitations = citations // Verify against ALL context chunks
      }

      success = true
    } catch {
      const partial = extractPartialAnswer(rawOutput)
      if (partial.trim()) {
        parsedAnswer = partial
        finalCitations = citations // NO reliable citations, verify against ALL
        success = true
      }
    }

    if (success) {
      const { verifiedText, removedCount } = await verifyAnswer(parsedAnswer, finalCitations, options.embeddingModelId)
      
      if (verifiedText.trim() === '') {
        yield { type: 'verified', text: 'Not found in your material', removedCount: 0 }
        yield { type: 'citations', citations: [] }
      } else {
        yield { type: 'verified', text: verifiedText, removedCount }
        yield { type: 'citations', citations: finalCitations }
      }
    } else {
      yield { type: 'text_delta', text: '\n\n[Fallback: Could not parse structured answer. Here is the evidence]' }
      yield { type: 'citations', citations }
    }

    yield { type: 'done' }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Answer generation failed'
    yield { type: 'error', error: message }
  }
}
