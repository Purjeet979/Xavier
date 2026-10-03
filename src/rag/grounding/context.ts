import type { RetrievalResult } from '../retrieval'

import { MAX_CHUNK_CHARS_HARD } from './config'
import { isTableChunk, truncateTableAtRow } from './tables'

export function buildContext(citations: RetrievalResult[]): { contextText: string; truncatedCount: number; contextChars: number } {
  let truncatedCount = 0
  
  const texts = citations.map((c, idx) => {
    const pageInfo = c.metadata?.pageNumber ? `, Page ${c.metadata.pageNumber}` : ''
    const docTag = c.documentName ? ` [Source Document: "${c.documentName}"${pageInfo}]` : ''

    if (c.text.length <= MAX_CHUNK_CHARS_HARD) {
      c.truncated = false
      return `[C${idx + 1}]${docTag}:\n${c.text}`
    }
    
    let text: string
    if (isTableChunk(c.text)) {
      text = truncateTableAtRow(c.text, MAX_CHUNK_CHARS_HARD)
    } else {
      let textToCut = c.text.substring(0, MAX_CHUNK_CHARS_HARD)
      // Check if inside a code block
      const codeBlockCount = (textToCut.match(/```/g) || []).length
      const insideCode = codeBlockCount % 2 !== 0
    
      if (insideCode) {
        // Find the last newline to not cut mid-line
        const lastNewline = textToCut.lastIndexOf('\n')
        if (lastNewline > 0) {
          textToCut = textToCut.substring(0, lastNewline)
        }
        textToCut += '\n```\n […truncated]'
      } else {
        // Cut at last sentence boundary or newline
        const lastSentence = Math.max(
          textToCut.lastIndexOf('. '), 
          textToCut.lastIndexOf('? '), 
          textToCut.lastIndexOf('! '),
          textToCut.lastIndexOf('\n')
        )
        if (lastSentence > 0) {
          textToCut = textToCut.substring(0, lastSentence + 1)
        }
        textToCut += ' […truncated]'
      }
      text = textToCut
    }
    
    c.truncated = true
    truncatedCount++
    return `[C${idx + 1}]${docTag}:\n${text}`
  })

  const contextText = texts.join('\n\n')
  return { contextText, truncatedCount, contextChars: contextText.length }
}
