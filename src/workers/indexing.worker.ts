import { extractTextFromFile } from '../rag/extractors'
import { chunkTextCodeAware } from '../rag/codeAware'

self.onmessage = async (e: MessageEvent) => {
  const { docId, fileBytes, fileName, mimeType, options } = e.data

  try {
    // Extract text
    const extraction = await extractTextFromFile(fileBytes, fileName, mimeType)

    // Chunk text (code-aware)
    const chunks = chunkTextCodeAware(extraction.text, fileName, {
      chunkSize: options?.chunkSize,
      chunkOverlap: options?.chunkOverlap,
      pages: extraction.pages,
    })

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
