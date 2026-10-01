import { Chunk, chunkText as defaultChunkText } from './chunking'

export function chunkTextCodeAware(
  text: string,
  fileName: string,
  options: {
    chunkSize?: number
    chunkOverlap?: number
    pages?: { pageNumber: number; text: string }[]
  } = {}
): Chunk[] {
  const chunks: (Chunk & { type?: string })[] = []
  
  // Find all code blocks
  const codeBlockRegex = /```[\s\S]*?```/g
  let match
  let lastIndex = 0
  
  while ((match = codeBlockRegex.exec(text)) !== null) {
    const codeStart = match.index
    const codeEnd = match.index + match[0].length
    
    // Chunk the text before the code block
    if (codeStart > lastIndex) {
      const textBefore = text.slice(lastIndex, codeStart)
      const subChunks = defaultChunkText(textBefore, fileName, options)
      
      // We must adjust the offsets of subChunks to be relative to the original text
      for (const sc of subChunks) {
        chunks.push({
          ...sc,
          startOffset: sc.startOffset + lastIndex,
          endOffset: sc.endOffset + lastIndex,
          type: 'text'
        })
      }
    }
    
    // Add the code block as a single chunk
    const codeText = match[0]
    chunks.push({
      text: codeText,
      chunkIndex: 0, // Will recalculate at the end
      tokenCount: Math.ceil(codeText.length / 4),
      startOffset: codeStart,
      endOffset: codeEnd,
      pageNumber: null, // Hard to map without more logic, but that's ok for code
      headingPath: null,
      type: 'code'
    })
    
    lastIndex = codeEnd
  }
  
  // Chunk the remaining text after the last code block
  if (lastIndex < text.length) {
    const textAfter = text.slice(lastIndex)
    const subChunks = defaultChunkText(textAfter, fileName, options)
    for (const sc of subChunks) {
      chunks.push({
        ...sc,
        startOffset: sc.startOffset + lastIndex,
        endOffset: sc.endOffset + lastIndex,
        type: 'text'
      })
    }
  }
  
  // Recalculate chunkIndex
  for (let i = 0; i < chunks.length; i++) {
    chunks[i].chunkIndex = i
  }
  
  return chunks
}
