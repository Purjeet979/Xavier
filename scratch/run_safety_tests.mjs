import { runIngestionSafetyTests } from '../src/rag/extractors/safety.test.ts'

async function main() {
  try {
    const success = await runIngestionSafetyTests()
    if (!success) process.exit(1)
  } catch (err) {
    console.error('Test execution error:', err)
    process.exit(1)
  }
}

main()
