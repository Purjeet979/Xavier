import { useState, useEffect } from 'react'
import { webGPUReady, getWebGPUStatus } from '@/llm/llm-models'

export function useWebGPU(): boolean | undefined {
  const [status, setStatus] = useState<boolean | undefined>(getWebGPUStatus)

  useEffect(() => {
    if (status !== undefined) return
    let cancelled = false
    webGPUReady.then((available) => {
      if (!cancelled) {
        setStatus(available)
      }
    })
    return () => {
      cancelled = true
    }
  }, [status])

  return status
}
