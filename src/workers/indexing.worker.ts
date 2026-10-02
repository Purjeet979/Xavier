import { extractTextFromFile, type ExtractedPage } from '../rag/extractors'
import { chunkTextCodeAware } from '../rag/codeAware'
import { MIN_CHARS_PER_PAGE } from '../rag/grounding/config'

self.onmessage = async (e: MessageEvent) => {
  const { docId, fileBytes, fileName, mimeType, options } = e.data

  try {
    // Extract text
    const extraction = await extractTextFromFile(fileBytes, fileName, mimeType)

    let warning: string | undefined
    if (extraction.pages && extraction.pages.length > 0) {
      const emptyPages = extraction.pages.filter((p: ExtractedPage) => p.text.trim().length < MIN_CHARS_PER_PAGE)
      if (emptyPages.length === extraction.pages.length) {
        throw new Error('No extractable text. This looks like an image-only or scanned PDF (OCR is not enabled).')
      } else if (emptyPages.length > 0) {
        warning = `Pages ${emptyPages.map((p: ExtractedPage) => p.pageNumber).join(', ')} have no extractable text and were skipped`
      }
    }

    // Chunk text (code-aware)
    const chunks = chunkTextCodeAware(extraction.text, fileName, {
      chunkSize: options?.chunkSize,
      chunkOverlap: options?.chunkOverlap,
      pages: extraction.pages,
    })

    if (chunks.length === 0) {
      throw new Error('No extractable text. This looks like an image-only or scanned PDF (OCR is not enabled).')
    }

    self.postMessage({
      status: 'success',
      docId,
      extraction,
      chunks,
      warning,
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
