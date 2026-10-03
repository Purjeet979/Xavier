export const MAX_CHUNK_CHARS_HARD = 3200
export const MIN_CHARS_PER_PAGE = 30
export const VERIFY_MIN_WORDS = 4

export const REWRITE_FOLLOWUPS = true
export const REWRITE_SKIP_WORDS = 12
export const REWRITE_TIMEOUT_MS = 8000
// Calibrated for various models' baseline similarities
export const COSINE_THRESHOLDS: Record<string, number> = {
  default: 0.5,
  'xenova-all-minilm-l6-v2': 0.5,
  'onnx-bge-small-en-v1.5': 0.6,
  'onnx-bge-base-en-v1.5': 0.6,
  'xenova-gte-base': 0.82,
  'supabase-gte-small': 0.82,
  'onnx-multilingual-e5-small': 0.82,
}

export function getThreshold(modelId: string): number {
  return COSINE_THRESHOLDS[modelId] ?? COSINE_THRESHOLDS.default
}

export const VERIFY_THRESHOLDS: Record<string, number> = {
  default: 0.45,
  'xenova-all-minilm-l6-v2': 0.45,
  'onnx-bge-small-en-v1.5': 0.55,
  'onnx-bge-base-en-v1.5': 0.55,
  'xenova-gte-base': 0.82,
  'supabase-gte-small': 0.82,
  'onnx-multilingual-e5-small': 0.82,
}

export function getVerifyThreshold(modelId: string): number {
  return VERIFY_THRESHOLDS[modelId] ?? VERIFY_THRESHOLDS.default
}
