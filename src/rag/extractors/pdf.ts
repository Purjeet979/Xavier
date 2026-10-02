import init, { LiteParse } from '@llamaindex/liteparse-wasm'

export interface ExtractedPage {
  pageNumber: number
  text: string
}

export interface TextExtractionResult {
  text: string
  pages?: ExtractedPage[]
  metadata?: Record<string, unknown>
}

let wasmInitialized = false

async function ensureWasmInitialized() {
  if (wasmInitialized) return
  await init()
  wasmInitialized = true
}

export async function extractTextFromPdf(
  pdfBytes: Uint8Array,
  fileName = 'document.pdf'
): Promise<TextExtractionResult> {
  try {
    await ensureWasmInitialized()
  } catch {
    throw new Error(
      `Failed to extract text from "${fileName}". This document appears to be corrupt, scanned, or image-only, which requires OCR (currently unsupported).`
    )
  }

  const parser = new LiteParse({
    ocrEnabled: false,
    outputFormat: 'json',
  })

  let result: unknown = null
  try {
    result = await parser.parse(pdfBytes)
  } catch {
    throw new Error(
      `Failed to extract text from "${fileName}". This document appears to be corrupt, scanned, or image-only, which requires OCR (currently unsupported).`
    )
  }
  
  let text = ''
  let pages: ExtractedPage[] = []

  if (typeof result === 'string') {
    text = result
  } else if (result && typeof result === 'object') {
    const rawResult = result as any
    text = rawResult.text || ''
    if (Array.isArray(rawResult.pages)) {
      pages = rawResult.pages.map((p: any) => ({
        pageNumber: p.page_number || p.pageNumber || 1,
        text: p.text || '',
      }))
    }
  }

  // Check per-page usable text
  const unusablePageNumbers: number[] = []
  if (pages.length > 0) {
    for (const page of pages) {
      if (!page.text || page.text.trim().length < 5) {
        unusablePageNumbers.push(page.pageNumber)
      }
    }
  }

  const totalPages = pages.length || 1
  const allPagesUnusable = pages.length > 0 && unusablePageNumbers.length === pages.length
  const totalTextLen = text.trim().length

  // Case A: Entire PDF has no usable text -> FAIL with OCR notice
  if (totalTextLen === 0 || allPagesUnusable) {
    throw new Error(
      `Failed to extract text from "${fileName}". This document appears to be scanned or image-only, which requires OCR (currently unsupported).`
    )
  }

  // Case B: Partial empty pages -> Warn user
  let warning: string | undefined = undefined
  if (unusablePageNumbers.length > 0 && unusablePageNumbers.length < pages.length) {
    warning = `Some pages could not be extracted: ${unusablePageNumbers.join(', ')}. Scanned/image content is not currently supported.`
  }

  const isSparse = totalTextLen < 50 && pdfBytes.length > 50000

  return {
    text,
    pages,
    metadata: {
      ocrRequired: isSparse || unusablePageNumbers.length > 0,
      pageCount: totalPages,
      extension: 'pdf',
      warning,
      unusablePages: unusablePageNumbers.length > 0 ? unusablePageNumbers : undefined,
    },
  }
}

