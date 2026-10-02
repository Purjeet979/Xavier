import { extractTextFromFile, UnsupportedFileError } from './index'
import { extractTextFromPdf } from './pdf'

export async function runIngestionSafetyTests() {
  console.log('=== RUNNING INGESTION SAFETY TESTS ===')

  let passed = 0
  let failed = 0

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`✓ [PASS] ${testName}`)
      passed++
    } else {
      console.error(`✗ [FAIL] ${testName}`)
      failed++
    }
  }

  // 1. Unsupported DOCX Rejection
  try {
    await extractTextFromFile(new Uint8Array([1, 2, 3]), 'document.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')
    assert(false, 'Unsupported DOCX should throw UnsupportedFileError')
  } catch (err: any) {
    assert(err instanceof UnsupportedFileError, 'Unsupported DOCX throws UnsupportedFileError')
  }

  // 2. Unsupported Image Rejection (.png)
  try {
    await extractTextFromFile(new Uint8Array([137, 80, 78, 71]), 'photo.png', 'image/png')
    assert(false, 'Unsupported PNG image should throw UnsupportedFileError')
  } catch (err: any) {
    assert(err instanceof UnsupportedFileError, 'Unsupported PNG image throws UnsupportedFileError')
  }

  // 3. Unsupported XLSX Rejection
  try {
    await extractTextFromFile(new Uint8Array([80, 75, 3, 4]), 'sheet.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    assert(false, 'Unsupported XLSX should throw UnsupportedFileError')
  } catch (err: any) {
    assert(err instanceof UnsupportedFileError, 'Unsupported XLSX throws UnsupportedFileError')
  }

  // 4. Valid MD format
  try {
    const res = await extractTextFromFile(new TextEncoder().encode('# Heading\nSome markdown text.'), 'notes.md', 'text/markdown')
    assert(res.text.includes('Heading') && res.metadata?.extension === 'md', 'Valid MD format extracts text successfully')
  } catch (err: any) {
    assert(false, `Valid MD format failed: ${err.message}`)
  }

  // 5. Valid TXT format
  try {
    const res = await extractTextFromFile(new TextEncoder().encode('Hello world plain text.'), 'sample.txt', 'text/plain')
    assert(res.text === 'Hello world plain text.' && res.metadata?.extension === 'txt', 'Valid TXT format extracts text successfully')
  } catch (err: any) {
    assert(false, `Valid TXT format failed: ${err.message}`)
  }

  // 6. Valid JSON format
  try {
    const res = await extractTextFromFile(new TextEncoder().encode('{"key": "value"}'), 'data.json', 'application/json')
    assert(res.text.includes('"key": "value"') && res.metadata?.extension === 'json', 'Valid JSON format extracts text successfully')
  } catch (err: any) {
    assert(false, `Valid JSON format failed: ${err.message}`)
  }

  // 7. Valid HTML format
  try {
    const res = await extractTextFromFile(new TextEncoder().encode('<h1>Title</h1><p>Body text</p>'), 'page.html', 'text/html')
    assert(res.text.includes('Title Body text') && res.metadata?.extension === 'html', 'Valid HTML format extracts text successfully')
  } catch (err: any) {
    assert(false, `Valid HTML format failed: ${err.message}`)
  }

  // 8. Completely empty document failure
  try {
    await extractTextFromFile(new TextEncoder().encode('   \n\n  '), 'empty.txt', 'text/plain')
    assert(false, 'Completely empty text file should throw error')
  } catch (err: any) {
    assert(err.message.includes('No usable text found'), 'Completely empty text file throws clear error')
  }

  // 9. Scanned / Image-only PDF failure (simulated empty PDF parsing)
  try {
    // Pass non-PDF bytes to PDF extractor to simulate empty/unparseable PDF
    await extractTextFromPdf(new Uint8Array([37, 80, 68, 70, 45]), 'scanned_demo.pdf')
    assert(false, 'Scanned/image-only PDF should throw OCR failure error')
  } catch (err: any) {
    assert(Boolean(err?.message && err.message.includes('requires OCR (currently unsupported)')), 'Scanned/image-only PDF throws clear OCR error notice')
  }

  console.log(`\n=== INGESTION SAFETY TESTS SUMMARY: ${passed} Passed, ${failed} Failed ===\n`)
  return failed === 0
}
