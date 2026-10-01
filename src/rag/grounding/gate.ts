import type { RetrievalResult } from '../retrieval'
import { getThreshold } from './config'

export function evaluateGate(results: RetrievalResult[], embeddingModelId: string): { pass: boolean, topCosine: number, threshold: number } {
  let topCosine = 0
  for (const r of results) {
    const val = r.metadata?.vectorScore ?? 0
    if (val > topCosine) {
      topCosine = val
    }
  }

  const threshold = getThreshold(embeddingModelId)
  const pass = topCosine >= threshold

  return { pass, topCosine, threshold }
}
