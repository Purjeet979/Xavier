import { getDb } from '@/db/client'
import { getEmbeddingProvider } from '@/rag/embedding-runtime'
import { getVerifyThreshold } from './config'
import type { RetrievalResult } from '@/rag/retrieval'

function splitSentences(text: string): string[] {
  if (typeof Intl !== 'undefined' && Intl.Segmenter) {
    const segmenter = new Intl.Segmenter('en', { granularity: 'sentence' });
    return Array.from(segmenter.segment(text)).map(s => s.segment.trim()).filter(Boolean);
  }
  return text.split(/(?<=[.?!])\s+/).map(s => s.trim()).filter(Boolean);
}

function parseVector(str: string | number[]): number[] {
  if (Array.isArray(str)) return str;
  if (typeof str !== 'string') return [];
  try {
    return JSON.parse(str);
  } catch {
    return str.replace(/[\[\]]/g, '').split(',').map(n => parseFloat(n));
  }
}

function cosineSimilarity(a: number[], b: number[]): number {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

export async function verifyAnswer(
  answer: string,
  citations: RetrievalResult[],
  embeddingModelId: string
): Promise<{ verifiedText: string, removedCount: number }> {
  if (citations.length === 0 || !answer.trim()) {
    return { verifiedText: '', removedCount: splitSentences(answer).length }
  }
  
  const sentences = splitSentences(answer);
  if (sentences.length === 0) return { verifiedText: answer, removedCount: 0 }

  const provider = getEmbeddingProvider('local');
  const threshold = getVerifyThreshold(embeddingModelId);
  const results = await provider.embedTexts(sentences);
  
  const db = getDb();
  const chunkIds = citations.map(c => c.chunkId);
  const placeholders = chunkIds.map((_, i) => `$${i + 1}`).join(',');
  
  const res = await db.query<{ embedding: string }>(
    `SELECT embedding FROM chunks WHERE id IN (${placeholders})`, 
    chunkIds
  );
  
  const chunkEmbeddings = res.rows.map(r => parseVector(r.embedding));
  
  let verifiedTextParts = [];
  let removedCount = 0;

  for (let i = 0; i < sentences.length; i++) {
    const sentenceEmb = results[i].embedding;
    
    let maxCosine = -1;
    for (const chunkEmb of chunkEmbeddings) {
      const sim = cosineSimilarity(sentenceEmb, chunkEmb);
      if (sim > maxCosine) maxCosine = sim;
    }
    
    if (maxCosine >= threshold) {
      verifiedTextParts.push(sentences[i]);
    } else {
      removedCount++;
    }
  }

  return { 
    verifiedText: verifiedTextParts.join(' '), 
    removedCount 
  };
}
