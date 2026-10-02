import { type Chunk, chunkText as defaultChunkText, buildPageOffsets, getPageNumberForOffset } from './chunking'
import { findTableBlocks } from './grounding/tables'

export function chunkTextCodeAware(
  text: string,
  fileName: string,
  options: {
    chunkSize?: number
    chunkOverlap?: number
    pages?: { pageNumber: number; text: string }[]
  } = {}
): Chunk[] {
  const maxChars = (options.chunkSize || 500) * 4
  const pageOffsets = buildPageOffsets(text, options.pages)

  const chunks: Chunk[] = []
  
  // Find code blocks
  const codeBlockRegex = /```[\s\S]*?```/g
  const specialBlocks: { startIndex: number, endIndex: number, text: string, type: 'code' | 'table', lines?: string[] }[] = []
  
  let match
  while ((match = codeBlockRegex.exec(text)) !== null) {
    specialBlocks.push({
      startIndex: match.index,
      endIndex: match.index + match[0].length,
      text: match[0],
      type: 'code'
    })
  }

  // Find table blocks
  const tableBlocks = findTableBlocks(text)
  for (const tb of tableBlocks) {
    specialBlocks.push({
      ...tb,
      type: 'table'
    })
  }

  // Sort blocks by start index
  specialBlocks.sort((a, b) => a.startIndex - b.startIndex)

  // Filter overlapping blocks (e.g. table inside code block)
  const filteredBlocks = []
  let lastEnd = -1
  for (const b of specialBlocks) {
    if (b.startIndex >= lastEnd) {
      filteredBlocks.push(b)
      lastEnd = b.endIndex
    }
  }

  // Helper to build heading path up to an offset
  const getHeadingPath = (offset: number) => {
    const textBefore = text.slice(0, offset)
    const lines = textBefore.split('\n')
    let currentPath: string[] = []
    for (const line of lines) {
      const trimmed = line.trim()
      const m = trimmed.match(/^(#+)\s*(.*)$/)
      if (m) {
        currentPath = currentPath.slice(0, m[1].length - 1)
        currentPath.push(m[2].trim())
      }
    }
    return currentPath.length > 0 ? currentPath.join(' > ') : null
  }

  let lastIndex = 0

  for (const block of filteredBlocks) {
    const blockStart = block.startIndex
    const blockEnd = block.endIndex
    
    // Chunk the prose before the special block
    if (blockStart > lastIndex) {
      const textBefore = text.slice(lastIndex, blockStart)
      const subChunks = defaultChunkText(textBefore, fileName, options)
      
      for (const sc of subChunks) {
        chunks.push({
          ...sc,
          startOffset: sc.startOffset + lastIndex,
          endOffset: sc.endOffset + lastIndex,
          type: 'text'
        })
      }
    }
    
    const headingPath = getHeadingPath(blockStart)
    const pageNum = getPageNumberForOffset(blockStart, pageOffsets)
    
    if (block.type === 'code') {
      if (block.text.length <= maxChars) {
        chunks.push({
          text: block.text,
          chunkIndex: 0,
          tokenCount: Math.ceil(block.text.length / 4),
          startOffset: blockStart,
          endOffset: blockEnd,
          pageNumber: pageNum,
          headingPath: headingPath,
          type: 'code'
        })
      } else {
        const lines = block.text.split('\n')
        const fenceLine = lines[0]
        const closingFence = lines[lines.length - 1]
        
        let currentPart = fenceLine + '\n'
        let currentStartOffset = blockStart
        let currentOriginalOffset = blockStart + fenceLine.length + 1
        
        for (let i = 1; i < lines.length - 1; i++) {
          const line = lines[i]
          const lineLen = line.length + 1
          
          if (currentPart.length + lineLen + closingFence.length > maxChars && currentPart !== fenceLine + '\n') {
            currentPart += closingFence
            chunks.push({
              text: currentPart,
              chunkIndex: 0,
              tokenCount: Math.ceil(currentPart.length / 4),
              startOffset: currentStartOffset,
              endOffset: currentOriginalOffset,
              pageNumber: getPageNumberForOffset(currentStartOffset, pageOffsets),
              headingPath: getHeadingPath(currentStartOffset),
              type: 'code'
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
            endOffset: blockEnd,
            pageNumber: getPageNumberForOffset(currentStartOffset, pageOffsets),
            headingPath: getHeadingPath(currentStartOffset),
            type: 'code'
          })
        }
      }
    } else if (block.type === 'table') {
      const lines = block.lines!
      let sepIdx = -1
      for (let i = 0; i < lines.length; i++) {
        if (/^\|\s*(:?-+:?\s*\|)+(\s*)$/.test(lines[i].trim())) {
          sepIdx = i
          break
        }
      }

      if (block.text.length <= maxChars || sepIdx === -1) {
        chunks.push({
          text: block.text,
          chunkIndex: 0,
          tokenCount: Math.ceil(block.text.length / 4),
          startOffset: blockStart,
          endOffset: blockEnd,
          pageNumber: pageNum,
          headingPath: headingPath,
          type: 'table'
        })
      } else {
        // Larger table splits at row boundaries only, repeating heading/caption, header row, and separator row.
        const mandatoryLines = lines.slice(0, sepIdx + 1)
        const mandatoryText = mandatoryLines.join('\n')
        
        let currentPart = mandatoryText
        let currentStartOffset = blockStart
        let currentOriginalOffset = blockStart + mandatoryText.length + 1
        
        for (let i = sepIdx + 1; i < lines.length; i++) {
          const row = lines[i]
          const rowLen = row.length + 1 // +1 for newline
          
          if (currentPart.length + rowLen > maxChars && currentPart !== mandatoryText) {
            chunks.push({
              text: currentPart,
              chunkIndex: 0,
              tokenCount: Math.ceil(currentPart.length / 4),
              startOffset: currentStartOffset,
              endOffset: currentOriginalOffset,
              pageNumber: getPageNumberForOffset(currentStartOffset, pageOffsets),
              headingPath: getHeadingPath(currentStartOffset),
              type: 'table'
            })
            currentPart = mandatoryText
            currentStartOffset = currentOriginalOffset
          }
          currentPart += (currentPart === mandatoryText ? '\n' : '\n') + row
          currentOriginalOffset += rowLen
        }
        
        if (currentPart !== mandatoryText) {
          chunks.push({
            text: currentPart,
            chunkIndex: 0,
            tokenCount: Math.ceil(currentPart.length / 4),
            startOffset: currentStartOffset,
            endOffset: blockEnd,
            pageNumber: getPageNumberForOffset(currentStartOffset, pageOffsets),
            headingPath: getHeadingPath(currentStartOffset),
            type: 'table'
          })
        }
      }
    }
    
    lastIndex = blockEnd
  }
  
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
  
  for (let i = 0; i < chunks.length; i++) {
    chunks[i].chunkIndex = i
  }
  
  return chunks
}
