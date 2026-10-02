import { extractTextFromPdf } from './pdf'
import type { TextExtractionResult } from './pdf'

export type { TextExtractionResult, ExtractedPage } from './pdf'

export class UnsupportedFileError extends Error {
  extension: string
  fileName: string

  constructor(extension: string, fileName: string) {
    const extDisplay = extension ? `.${extension}` : 'unknown'
    super(
      `Unsupported file format (${extDisplay}) for "${fileName}". Supported formats are PDF (.pdf), Markdown (.md), TXT (.txt), JSON (.json), and HTML (.html).`
    )
    this.name = 'UnsupportedFileError'
    this.extension = extension
    this.fileName = fileName
  }
}

const SUPPORTED_EXTENSIONS = new Set(['pdf', 'md', 'markdown', 'txt', 'json', 'html', 'htm'])

export async function extractTextFromFile(
  fileBytes: Uint8Array,
  fileName: string,
  mimeType: string
): Promise<TextExtractionResult> {
  const extension = fileName.split('.').pop()?.toLowerCase() || ''

  if (!SUPPORTED_EXTENSIONS.has(extension)) {
    throw new UnsupportedFileError(extension, fileName)
  }

  if (extension === 'pdf' || mimeType === 'application/pdf') {
    return extractTextFromPdf(fileBytes, fileName)
  }

  // Handle text formats
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
  } else if (extension === 'html' || extension === 'htm' || mimeType === 'text/html') {
    text = stripHtmlTags(rawText)
  } else {
    text = rawText
  }

  text = normalizeText(text)

  if (!text || text.trim().length === 0) {
    throw new Error(`No usable text found in "${fileName}". The file appears to be empty.`)
  }

  return {
    text,
    metadata: {
      extension,
      pageCount: 1,
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

