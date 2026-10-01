import type { RetrievalResult } from '../retrieval'

import { MAX_CHUNK_CHARS_HARD } from './config'

export function buildContext(citations: RetrievalResult[]): { contextText: string; truncatedCount: number; contextChars: number } {
  let truncatedCount = 0
  
  const texts = citations.map((c, idx) => {
    if (c.text.length <= MAX_CHUNK_CHARS_HARD) {
      c.truncated = false
      return `[C${idx + 1}]:\n${c.text}`
    }
    
    let text = c.text.substring(0, MAX_CHUNK_CHARS_HARD)
    
    // Check if inside a code block
    const codeBlockCount = (c.text.substring(0, MAX_CHUNK_CHARS_HARD).match(/```/g) || []).length
    const insideCode = codeBlockCount % 2 !== 0
    
    if (insideCode) {
      // Find the last newline to not cut mid-line
      const lastNewline = text.lastIndexOf('\n')
      if (lastNewline > 0) {
        text = text.substring(0, lastNewline)
      }
      text += '\n```\n […truncated]'
    } else {
      // Cut at last sentence boundary or newline
      const lastSentence = Math.max(
        text.lastIndexOf('. '), 
        text.lastIndexOf('? '), 
        text.lastIndexOf('! '),
        text.lastIndexOf('\n')
      )
      if (lastSentence > 0) {
        text = text.substring(0, lastSentence + 1)
      }
      text += ' […truncated]'
    }
    
    c.truncated = true
    truncatedCount++
    return `[C${idx + 1}]:\n${text}`
  })

  const contextText = texts.join('\n\n')
  return { contextText, truncatedCount, contextChars: contextText.length }
}
