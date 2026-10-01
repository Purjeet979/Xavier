import type { RetrievalResult } from '../retrieval'

export function buildContext(citations: RetrievalResult[]): string {
  return citations
    .map((c, idx) => `[C${idx + 1}]:\n${c.text}`)
    .join('\n\n')
}
