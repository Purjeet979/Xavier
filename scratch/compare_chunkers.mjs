import fs from 'fs'
import path from 'path'

const readmeMd = fs.readFileSync(path.resolve('./README.md'), 'utf-8')

const codeBlockRegex = /```[\s\S]*?```/g
const matches = [...readmeMd.matchAll(codeBlockRegex)]

console.log(`[Chunker Audit] Total characters in README.md: ${readmeMd.length}`)
console.log(`[Chunker Audit] Code blocks found in README.md: ${matches.length}`)

matches.forEach((m, idx) => {
  console.log(`  Block #${idx + 1}: offset ${m.index}..${m.index + m[0].length}, length ${m[0].length} chars`)
})

console.log('[Chunker Audit] Complete.')
