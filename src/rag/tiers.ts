export type HardwareTier = 0 | 1 | 2

export interface HardwareCapabilities {
  hasWebGPU: boolean
  deviceMemory: number // in GB
  isMobile: boolean
}

import { getWebGPUStatus, webGPUReady } from '@/llm/llm-models'

export function detectHardware(): HardwareCapabilities {
  const hasWebGPU = getWebGPUStatus() ?? false
  
  // navigator.deviceMemory is available in Chromium-based browsers
  // Defaults to 4 if not available (conservative estimate)
  const deviceMemory = typeof navigator !== 'undefined' && 'deviceMemory' in navigator
    ? (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 4
    : 4
    
  // Simple mobile detection via user agent
  const isMobile = typeof navigator !== 'undefined' && 
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    
  return { hasWebGPU, deviceMemory, isMobile }
}

export function determineTier(caps: HardwareCapabilities): HardwareTier {
  if (!caps.hasWebGPU || caps.isMobile) {
    return 0 // Fallback: No WebGPU or Mobile -> Vector search only
  }
  if (caps.deviceMemory >= 8) {
    return 2 // Pro: WebGPU + >=8GB RAM -> local Llama 3 8B (or equivalent)
  }
  return 1 // Base: WebGPU + <8GB RAM -> local Phi-3 Mini (or equivalent)
}

import { loadPreferences } from '@/lib/preferences'

export function getEffectiveTier(override?: HardwareTier): HardwareTier {
  if (override !== undefined) {
    return override
  }
  const prefs = loadPreferences()
  if (prefs.overrideHardwareTier !== undefined) {
    return prefs.overrideHardwareTier
  }
  const caps = detectHardware()
  return determineTier(caps)
}

export async function getEffectiveTierAsync(override?: HardwareTier): Promise<HardwareTier> {
  await webGPUReady
  return getEffectiveTier(override)
}
