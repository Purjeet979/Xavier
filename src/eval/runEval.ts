import evalSet from './evalset.json'
import { generateRAGAnswer } from '@/rag/orchestrator'
import { type LLMRuntimeHandles } from '@/llm/llm-runtime'

export interface EvalResult {
  id: string
  question: string
  answerable: boolean
  wasRefused: boolean
  citationsCount: number
  sentencesGenerated: number
  sentencesDropped: number
  error?: string
}

export async function runEval(
  embeddingModelId: string, 
  projectId: string | null,
  llmHandles: LLMRuntimeHandles,
  onProgress: (current: number, total: number, latestResult: EvalResult) => void
): Promise<EvalResult[]> {
  const results: EvalResult[] = []
  for (let i = 0; i < evalSet.length; i++) {
    const q = evalSet[i]
    const abortController = new AbortController()
    
    let wasRefused = false
    let citationsCount = 0
    let sentencesDropped = 0
    let answerText = ''
    
    try {
      const stream = generateRAGAnswer(q.text, {
        documentIds: [],
        projectId: projectId ?? '',
        embeddingModelId,
        conversationHistory: [],
        llmHandles,
        abortSignal: abortController.signal
      })

      for await (const chunk of stream) {
        if (chunk.type === 'text_delta') {
           if (chunk.text === 'Not found in your material') {
             wasRefused = true
           }
        }
        if (chunk.type === 'citations') {
          citationsCount = chunk.citations?.length || 0
        }
        if (chunk.type === 'verified') {
           if (chunk.text === 'Not found in your material') {
             wasRefused = true
           } else {
             answerText = chunk.text || ''
             sentencesDropped += (chunk.removedCount || 0)
           }
        }
      }
      
      const sentencesGenerated = sentencesDropped + (answerText.trim() ? answerText.split(/(?<=[.?!])\s+/).length : 0);

      const res: EvalResult = {
        id: q.id,
        question: q.text,
        answerable: q.answerable,
        wasRefused,
        citationsCount,
        sentencesGenerated,
        sentencesDropped
      }
      results.push(res)
      onProgress(i + 1, evalSet.length, res)
      
    } catch (err: unknown) {
      const res: EvalResult = {
        id: q.id,
        question: q.text,
        answerable: q.answerable,
        wasRefused: false,
        citationsCount: 0,
        sentencesGenerated: 0,
        sentencesDropped: 0,
        error: err instanceof Error ? err.message : 'Unknown error'
      }
      results.push(res)
      onProgress(i + 1, evalSet.length, res)
    }
  }
  
  return results
}

export function computeMetrics(results: EvalResult[]) {
  const answerable = results.filter(r => r.answerable)
  const unanswerable = results.filter(r => !r.answerable)
  
  const correctRefusals = unanswerable.filter(r => r.wasRefused).length
  const wrongRefusals = answerable.filter(r => r.wasRefused).length
  
  const totalSentences = results.reduce((sum, r) => sum + r.sentencesGenerated, 0)
  const totalDropped = results.reduce((sum, r) => sum + r.sentencesDropped, 0)
  
  return {
    refusalAccuracy: unanswerable.length ? (correctRefusals / unanswerable.length) * 100 : 0,
    falseRefusalRate: answerable.length ? (wrongRefusals / answerable.length) * 100 : 0,
    verifierDropRate: totalSentences ? (totalDropped / totalSentences) * 100 : 0,
    totalCitations: results.reduce((sum, r) => sum + r.citationsCount, 0)
  }
}
