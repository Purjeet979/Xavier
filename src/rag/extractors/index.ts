import { extractTextFromPdf } from './pdf'
import type { TextExtractionResult } from './pdf'

export type { TextExtractionResult, ExtractedPage } from './pdf'

export class UnsupportedFileError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'UnsupportedFileError'
  }
}

export async function extractTextFromFile(
  fileBytes: Uint8Array,
  fileName: string,
  mimeType: string
): Promise<TextExtractionResult> {
  const extension = fileName.split('.').pop()?.toLowerCase() || ''

  if (extension === 'pdf' || mimeType === 'application/pdf') {
    return extractTextFromPdf(fileBytes)
  }

  const isAllowed =
    ['md', 'txt', 'json', 'html'].includes(extension) ||
    ['text/markdown', 'text/plain', 'application/json', 'text/html'].includes(mimeType)

  if (!isAllowed) {
    throw new UnsupportedFileError("DOCX/images are not supported. Convert to PDF or Markdown.")
  }

  // Handle allowed text formats
  const textDecoder = new TextDecoder('utf-8')
  const rawText = textDecoder.decode(fileBytes)

  let text: string

  if (extension === 'json' || mimeType === 'application/json') {
    try {
      const obj = JSON.parse(rawText)
      text = JSON.stringify(obj, null, 2)
    } catch {
      text = rawText
    }
  } else if (extension === 'html' || mimeType === 'text/html') {
    text = stripHtmlTags(rawText)
  } else {
    text = rawText
  }

  text = normalizeText(text)

  return {
    text,
    metadata: {
      extension,
    },
  }
}

function normalizeText(text: string): string {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function stripHtmlTags(html: string): string {
  return html
    .replace(/<script[^>]*>([\s\S]*?)<\/script>/gi, '')
    .replace(/<style[^>]*>([\s\S]*?)<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/[ \t]+/g, ' ')
    .trim()
}
