export const AnswerSchema = {
  type: "object",
  properties: {
    answer: { type: "string", description: "The answer text" },
    citations: {
      type: "array",
      items: { type: "string", description: "Chunk labels like C1, C2" }
    }
  },
  required: ["answer", "citations"]
}

export const AnswerSchemaString = JSON.stringify(AnswerSchema)

export function tolerantParseJson(raw: string): { answer: string; citations: string[] } {
  let cleaned = raw.trim();
  if (cleaned.startsWith('```json')) cleaned = cleaned.replace(/^```json\s*/, '').replace(/\s*```$/, '');
  else if (cleaned.startsWith('```')) cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
  
  try {
    const obj = JSON.parse(cleaned)
    const ans = obj.answer || obj.response || obj.result || obj.text || obj.output || (typeof obj === 'string' ? obj : '');
    return {
      answer: typeof ans === 'string' ? ans : '',
      citations: Array.isArray(obj.citations) ? obj.citations : []
    }
  } catch (err) {
    const ansMatch = cleaned.match(/"(?:answer|response|result|text|output)"\s*:\s*"([^]*?)"\s*(?:,|\})/);
    let answer = ansMatch ? ansMatch[1] : '';
    answer = answer.replace(/\\n/g, '\n').replace(/\\"/g, '"').replace(/\\\\/g, '\\');

    const citMatch = cleaned.match(/"citations"\s*:\s*\[(.*?)\]/s);
    let citations: string[] = [];
    if (citMatch) {
      citations = citMatch[1].split(',')
        .map(s => s.replace(/["'\s]/g, ''))
        .filter(Boolean);
    }

    if (!answer && citations.length === 0) {
      if (cleaned.length > 0 && !cleaned.startsWith('{')) {
        return { answer: cleaned, citations: [] };
      }
      throw new Error('Could not parse any structured fields from output', { cause: err });
    }
    return { answer, citations };
  }
}

export function extractPartialAnswer(raw: string): string {
  let cleaned = raw.trim();
  if (cleaned.startsWith('```json')) cleaned = cleaned.replace(/^```json\s*/, '').replace(/\s*```$/, '');
  else if (cleaned.startsWith('```')) cleaned = cleaned.replace(/^```\s*/, '');

  if (!cleaned) return '';
  
  try {
    const obj = JSON.parse(cleaned);
    const ans = obj.answer || obj.response || obj.result || obj.text || obj.output;
    if (typeof ans === 'string') return ans;
  } catch {
    // ignore
  }

  const completeMatch = cleaned.match(/"(?:answer|response|result|text|output)"\s*:\s*"([^]*?)"\s*(?:,|\})/);
  if (completeMatch) return completeMatch[1].replace(/\\n/g, '\n').replace(/\\"/g, '"').replace(/\\\\/g, '\\');

  const partialMatch = cleaned.match(/"(?:answer|response|result|text|output)"\s*:\s*"([^]*)$/);
  if (partialMatch) return partialMatch[1].replace(/\\n/g, '\n').replace(/\\"/g, '"').replace(/\\\\/g, '\\');

  if (!cleaned.startsWith('{') && !cleaned.startsWith('```') && cleaned.length > 0) {
    return cleaned;
  }

  return '';
}
