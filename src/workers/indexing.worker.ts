import { extractTextFromFile } from '../rag/extractors'
import { chunkTextCodeAware } from '../rag/codeAware'

self.onmessage = async (e: MessageEvent) => {
  const { docId, fileBytes, fileName, mimeType, options } = e.data

  try {
    // Extract text
    const extraction = await extractTextFromFile(fileBytes, fileName, mimeType)

    if (!extraction.text || extraction.text.trim().length === 0) {
      throw new Error(`No usable text found in "${fileName}".`)
    }

    // Chunk text (code-aware)
    const chunks = chunkTextCodeAware(extraction.text, fileName, {
      chunkSize: options?.chunkSize,
      chunkOverlap: options?.chunkOverlap,
      pages: extraction.pages,
    })

    if (!chunks || chunks.length === 0) {
      throw new Error(`Document "${fileName}" produced 0 usable chunks and cannot be indexed.`)
    }

    self.postMessage({
      status: 'success',
      docId,
      extraction,
      chunks,
    })
  } catch (error: any) {
    self.postMessage({
      status: 'error',
      docId,
      error: error?.message || 'Indexing failed',
    })
  }
}
export {}

