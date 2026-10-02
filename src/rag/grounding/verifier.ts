import { getDb } from '@/db/client'
import { getEmbeddingProvider } from '@/rag/embedding-runtime'
import { getVerifyThreshold, VERIFY_MIN_WORDS } from './config'
import type { RetrievalResult } from '@/rag/retrieval'

function splitSentences(text: string): { text: string; isCode: boolean }[] {
  const parts: { text: string; isCode: boolean }[] = [];
  const codeBlockRegex = /```[\s\S]*?```/g;
  let match;
  let lastIndex = 0;
  
  while ((match = codeBlockRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      const textBefore = text.slice(lastIndex, match.index);
      parts.push(...segmentText(textBefore).map(s => ({ text: s, isCode: false })));
    }
    parts.push({ text: match[0], isCode: true });
    lastIndex = match.index + match[0].length;
  }
  
  if (lastIndex < text.length) {
    const textAfter = text.slice(lastIndex);
    parts.push(...segmentText(textAfter).map(s => ({ text: s, isCode: false })));
  }
  
  return parts;
}

function segmentText(text: string): string[] {
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
    return str.replace(/[[\]]/g, '').split(',').map(n => parseFloat(n));
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
  
  const sentencesToVerify = sentences.filter(s => !s.isCode && s.text.split(/\s+/).length >= VERIFY_MIN_WORDS);
  const results = sentencesToVerify.length > 0 ? await provider.embedTexts(sentencesToVerify.map(s => s.text)) : [];
  
  const db = getDb();
  const chunkIds = citations.map(c => c.chunkId);
  const placeholders = chunkIds.map((_, i) => `$${i + 1}`).join(',');
  
  let chunkEmbeddings: number[][] = [];
  if (chunkIds.length > 0) {
    const res = await db.query<{ embedding: string }>(
      `SELECT embedding FROM chunks WHERE id IN (${placeholders})`, 
      chunkIds
    );
    chunkEmbeddings = res.rows.map(r => parseVector(r.embedding));
  }
  
  const verifiedTextParts = [];
  let removedCount = 0;
  let verifyIndex = 0;

  for (let i = 0; i < sentences.length; i++) {
    const s = sentences[i];
    
    // Rule: Skip code blocks and sentences under VERIFY_MIN_WORDS words. Keep them as-is.
    // Short sentences often have poor cosine similarity with large chunks due to embedding dilution.
    if (s.isCode || s.text.split(/\s+/).length < VERIFY_MIN_WORDS) {
      verifiedTextParts.push(s.text);
      continue;
    }
    
    const sentenceEmb = results[verifyIndex++].embedding;
    
    // Rule: A sentence's support = MAX cosine over its cited chunks (or all context chunks in cases A/B)
    let maxCosine = -1;
    for (const chunkEmb of chunkEmbeddings) {
      const sim = cosineSimilarity(sentenceEmb, chunkEmb);
      if (sim > maxCosine) maxCosine = sim;
    }
    
    if (maxCosine >= threshold) {
      verifiedTextParts.push(s.text);
    } else {
      removedCount++;
    }
  }

  return { 
    verifiedText: verifiedTextParts.join(' '), 
    removedCount 

  };
}
