export const TOP_K_CONTEXT = 3
export const MAX_CHUNK_CHARS_HARD = 800

// TODO: calibrate in Phase 4
export const COSINE_THRESHOLDS: Record<string, number> = {
  default: 0.5,
  'Xenova/all-MiniLM-L6-v2': 0.5,
  'Xenova/bge-small-en-v1.5': 0.6,
}

export function getThreshold(modelId: string): number {
  return COSINE_THRESHOLDS[modelId] ?? COSINE_THRESHOLDS.default
}

export const VERIFY_THRESHOLDS: Record<string, number> = {
  default: 0.45,
  'Xenova/all-MiniLM-L6-v2': 0.45,
  'Xenova/bge-small-en-v1.5': 0.55,
}

export function getVerifyThreshold(modelId: string): number {
  return VERIFY_THRESHOLDS[modelId] ?? VERIFY_THRESHOLDS.default
}
