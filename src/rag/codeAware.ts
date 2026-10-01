import { type Chunk, chunkText as defaultChunkText } from './chunking'

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
    const chunkSize = options.chunkSize || 1000
    
    if (codeText.length <= chunkSize) {
      chunks.push({
        text: codeText,
        chunkIndex: 0,
        tokenCount: Math.ceil(codeText.length / 4),
        startOffset: codeStart,
        endOffset: codeEnd,
        pageNumber: null,
        headingPath: null,
        type: 'code'
      })
    } else {
      const lines = codeText.split('\n')
      const fenceLine = lines[0]
      const closingFence = lines[lines.length - 1]
      
      let currentPart = fenceLine + '\n'
      let currentStartOffset = codeStart
      let currentOriginalOffset = codeStart + fenceLine.length + 1
      
      for (let i = 1; i < lines.length - 1; i++) {
        const line = lines[i]
        const lineLen = line.length + 1 // +1 for newline
        
        if (currentPart.length + lineLen + closingFence.length > chunkSize && currentPart !== fenceLine + '\n') {
          currentPart += closingFence
          chunks.push({
            text: currentPart,
            chunkIndex: 0,
            tokenCount: Math.ceil(currentPart.length / 4),
            startOffset: currentStartOffset,
            endOffset: currentOriginalOffset,
            pageNumber: null, headingPath: null, type: 'code'
          })
          currentPart = fenceLine + '\n'
          currentStartOffset = currentOriginalOffset
        }
        currentPart += line + '\n'
        currentOriginalOffset += lineLen
      }
      
      if (currentPart !== fenceLine + '\n') {
        currentPart += closingFence
        chunks.push({
          text: currentPart,
          chunkIndex: 0,
          tokenCount: Math.ceil(currentPart.length / 4),
          startOffset: currentStartOffset,
          endOffset: codeEnd,
          pageNumber: null, headingPath: null, type: 'code'
        })
      }
    }
    
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
