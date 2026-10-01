import { verifyAnswer } from './verifier'
import type { RetrievalResult } from '@/rag/retrieval'
import { localProvider } from '@/rag/embedding-runtime'
import { getDb } from '@/db/client'

// To run this test: import { runVerifierTest } from '@/rag/grounding/verifier.test' in index.tsx
// and call it after DB/Embedder are initialized.
export async function runVerifierTest() {
  console.log('--- RUNNING VERIFIER TEST ---')
  const db = getDb()
  
  // Create a fake chunk in the DB directly
  const fakeChunkId = crypto.randomUUID()
  const fakeDocId = crypto.randomUUID()
  const fakeEmbedding = Array(384).fill(0).map((_, i) => i === 0 ? 1 : 0) // Dummy vector
  
  // 1. Setup DB
  await db.query('INSERT INTO documents (id, name, project_id, status) VALUES ($1, $2, $3, $4)', 
    [fakeDocId, 'test.pdf', null, 'completed'])
  await db.query(`
    INSERT INTO chunks (id, document_id, chunk_index, text, token_count, embedding_model_id, embedding_provider_id, embedding_dimensions, embedding, metadata_json)
    VALUES ($1, $2, 0, 'The capital of France is Paris.', 10, 'Xenova/all-MiniLM-L6-v2', 'local', 384, $3, '{}')
  `, [fakeChunkId, fakeDocId, `[${fakeEmbedding.join(',')}]`])

  const citations: RetrievalResult[] = [{
    chunkId: fakeChunkId,
    documentId: fakeDocId,
    documentName: 'test.pdf',
    chunkIndex: 0,
    text: 'The capital of France is Paris.',
    score: 0.99,
    source: 'vector',
    metadata: {}
  }]

  // Case 1: Valid
  // Since we injected a dummy embedding, the actual sentence embedding will NOT match the dummy [1,0,0...] well.
  // Wait! The verifier uses the REAL embedder to embed the sentence, but we gave the chunk a FAKE embedding!
  // To make this a real test, we must use the embedder to get the real embedding for the chunk.
  const chunkText = 'The capital of France is Paris.'
  const res = await localProvider.embedTexts([chunkText])
  const realEmbedding = res[0].embedding
  
  await db.query('UPDATE chunks SET embedding = $1 WHERE id = $2', [`[${realEmbedding.join(',')}]`, fakeChunkId])

  // Test 1: Valid sentence
  const r1 = await verifyAnswer('Paris is the capital of France.', citations, 'Xenova/all-MiniLM-L6-v2')
  console.assert(r1.removedCount === 0, 'Test 1 Failed: Valid sentence was dropped')

  // Test 2: Off-topic sentence
  const r2 = await verifyAnswer('The moon is made of cheese.', citations, 'Xenova/all-MiniLM-L6-v2')
  console.assert(r2.removedCount === 1, 'Test 2 Failed: Off-topic sentence was NOT dropped')

  // Test 3: Valid sentence but wrong/missing citation (simulated by passing empty citations array or different DB state)
  const r3 = await verifyAnswer('Paris is the capital of France.', [], 'Xenova/all-MiniLM-L6-v2')
  console.assert(r3.removedCount === 0 && r3.verifiedText === 'Paris is the capital of France.', 'Test 3 Failed: Empty citations should pass-through')

  console.log('--- VERIFIER TEST COMPLETE ---')
}
