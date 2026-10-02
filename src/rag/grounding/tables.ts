export interface TableBlock {
  startIndex: number
  endIndex: number
  text: string
  lines: string[]
}

export function findTableBlocks(text: string): TableBlock[] {
  const lines = text.split('\n')
  const blocks: TableBlock[] = []
  
  let i = 0
  while (i < lines.length) {
    const line = lines[i].trim()
    
    // Check if we are entering a fenced code block to skip it
    if (line.startsWith('```')) {
      i++
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        i++
      }
      i++
      continue
    }

    if (line.startsWith('|')) {
      let startIdx = i
      // check if previous line is a caption/heading
      if (i > 0) {
        const prev = lines[i - 1].trim()
        if (prev && !prev.startsWith('|') && !prev.startsWith('```') && prev.length > 0) {
          startIdx = i - 1
        }
      }

      let j = i
      let hasSeparator = false
      while (j < lines.length && lines[j].trim().startsWith('|')) {
        const l = lines[j].trim()
        if (/^\|\s*(:?-+:?\s*\|)+(\s*)$/.test(l)) {
          hasSeparator = true
        }
        j++
      }

      if (hasSeparator) {
        // Find character offsets
        let charStart = 0
        for (let k = 0; k < startIdx; k++) {
          charStart += lines[k].length + 1
        }
        
        let charEnd = charStart
        for (let k = startIdx; k < j; k++) {
          charEnd += lines[k].length + 1 // +1 for newline
        }
        charEnd -= 1 // remove last newline

        blocks.push({
          startIndex: charStart,
          endIndex: charEnd,
          text: lines.slice(startIdx, j).join('\n'),
          lines: lines.slice(startIdx, j)
        })
      }
      i = j
    } else {
      i++
    }
  }

  return blocks
}

export function isTableChunk(text: string): boolean {
  const blocks = findTableBlocks(text)
  if (blocks.length === 1) {
    // If the chunk is exactly the table (accounting for possible trailing/leading whitespace)
    return blocks[0].text.trim() === text.trim()
  }
  return false
}

export function truncateTableAtRow(text: string, maxChars: number): string {
  if (text.length <= maxChars) return text
  
  const blocks = findTableBlocks(text)
  if (blocks.length === 0) return text.substring(0, maxChars) + '\n[…table truncated]'
  
  const block = blocks[0]
  const lines = block.lines
  
  // Find header and separator
  let sepIdx = -1
  for (let i = 0; i < lines.length; i++) {
    if (/^\|\s*(:?-+:?\s*\|)+(\s*)$/.test(lines[i].trim())) {
      sepIdx = i
      break
    }
  }
  
  if (sepIdx === -1) return text.substring(0, maxChars) + '\n[…table truncated]'
  
  // We must keep up to sepIdx + 1 (header + separator), plus caption if any
  const mandatoryLines = lines.slice(0, sepIdx + 1)
  const optionalLines = lines.slice(sepIdx + 1)
  
  let result = mandatoryLines.join('\n')
  
  for (const row of optionalLines) {
    const nextResult = result + '\n' + row
    if (nextResult.length > maxChars) {
      break
    }
    result = nextResult
  }
  
  return result + '\n[…table truncated]'
}
