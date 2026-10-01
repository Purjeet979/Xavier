import type { RetrievalResult } from '../retrieval'

import { MAX_CHUNK_CHARS } from './config'

export function buildContext(citations: RetrievalResult[]): string {
  return citations
    .map((c, idx) => `[C${idx + 1}]:\n${c.text.substring(0, MAX_CHUNK_CHARS)}`)
    .join('\n\n')
}
