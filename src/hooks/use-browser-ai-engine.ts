import { useState, useRef, useCallback } from 'react'
import { webGPUReady } from '@/llm/llm-models'
import {
  streamAiSdkToEvents,
  type AiSdkProvider,
  type AiSdkStreamRequest,
} from '@/llm/ai-sdk-stream'
import type { LLMStreamEvent } from '@/llm/parsers'

export type BrowserAiEngineStatus = 'idle' | 'loading' | 'ready' | 'generating' | 'error'

interface UseBrowserAiEngineOptions<TModel> {
  engineLabel: string
  provider: AiSdkProvider
  createModel: (modelId: string, onProgress: (pct: number) => void) => TModel
  disposeModel: (model: TModel) => Promise<void>
  onModelCreated?: (model: TModel, modelId: string) => void
  onStatusChange?: (status: BrowserAiEngineStatus) => void
  onError?: (error: Error) => void
  onLoadMessage?: (message: string) => void
  getLoadMessage?: (modelId: string, progress: number) => string | undefined
  beforeSessionInit?: () => void
}

export function useBrowserAiEngine<TModel>({
  engineLabel,
  provider,
  createModel,
  disposeModel,
  onModelCreated,
  onStatusChange,
  onError,
  onLoadMessage,
  getLoadMessage,
  beforeSessionInit,
}: UseBrowserAiEngineOptions<TModel>) {
  const [status, setStatus] = useState<BrowserAiEngineStatus>('idle')
  const [loadProgress, setLoadProgress] = useState(0)
  const [currentModel, setCurrentModel] = useState<string | null>(null)

  const modelRef = useRef<TModel | null>(null)
  const currentModelRef = useRef<string | null>(null)
  const loadingRef = useRef(false)
  const abortRef = useRef<AbortController | null>(null)

  const updateStatus = useCallback(
    (newStatus: BrowserAiEngineStatus) => {
      console.debug(`[${engineLabel}] Status:`, newStatus)
      setStatus(newStatus)
      onStatusChange?.(newStatus)
    },
    [engineLabel, onStatusChange],
  )

  const reportProgress = useCallback(
    (modelId: string, pct: number) => {
      const capped = Math.min(99, pct)
      setLoadProgress(capped)
      const message = getLoadMessage?.(modelId, capped)
      if (message) onLoadMessage?.(message)
    },
    [getLoadMessage, onLoadMessage],
  )

  const loadModel = useCallback(
    async (modelId: string): Promise<boolean> => {
      if (loadingRef.current) return false
      if (modelRef.current && currentModelRef.current === modelId) {
        return true
      }

      loadingRef.current = true
      updateStatus('loading')
      setLoadProgress(0)

      const previous = modelRef.current
      if (previous) {
        await disposeModel(previous)
      }
      modelRef.current = null
      currentModelRef.current = null

      try {
        beforeSessionInit?.()
        onLoadMessage?.('Downloading model weights...')

        await webGPUReady
        let model = createModel(modelId, (pct) => reportProgress(modelId, pct))

        // createSessionWithProgress exists on TransformersJS models but not WebLLM.
        // When available, call it to eagerly download + create the ONNX session with progress.
        // When missing, the model will be initialized lazily on first inference.
        const modelAny = model as Record<string, unknown>
        if (typeof modelAny.createSessionWithProgress === 'function') {
          try {
            await (modelAny.createSessionWithProgress as (cb: (p: number) => void) => Promise<void>)(
              (progress) => {
                reportProgress(modelId, Math.round(progress * 100))
              },
            )
          } catch (sessionErr: unknown) {
            const errStr = sessionErr instanceof Error ? sessionErr.message : String(sessionErr)
            if (errStr.includes('webgpu') || errStr.includes('GPU adapter') || errStr.includes('no available backend')) {
              console.warn(`[${engineLabel}] WebGPU adapter failed, trying WASM...`, sessionErr)
              onLoadMessage?.('WebGPU unavailable on GPU adapter. Retrying in WASM CPU mode...')
              try {
                const { createTransformersModel } = await import('@/llm/browser-ai-models')
                model = createTransformersModel(modelId, (pct) => reportProgress(modelId, pct), 'wasm') as unknown as TModel
                const fallbackAny = model as Record<string, unknown>
                if (typeof fallbackAny.createSessionWithProgress === 'function') {
                  await (fallbackAny.createSessionWithProgress as (cb: (p: number) => void) => Promise<void>)(
                    (progress) => {
                      reportProgress(modelId, Math.round(progress * 100))
                    },
                  )
                }
              } catch (wasmErr: unknown) {
                const wasmStr = wasmErr instanceof Error ? wasmErr.message : String(wasmErr)
                if (wasmStr.includes('GatherBlockQuantized') || wasmStr.includes('Could not find an implementation')) {
                  throw new Error(`WebGPU is required for this model, but WebGPU is disabled or unavailable in your browser. Please enable "Use graphics acceleration when available" in Chrome Settings (chrome://settings/system) and restart your browser.`, { cause: wasmErr })
                }
                throw wasmErr
              }
            } else {
              throw sessionErr
            }
          }
        }

        onModelCreated?.(model, modelId)

        modelRef.current = model
        currentModelRef.current = modelId
        setCurrentModel(modelId)
        setLoadProgress(100)
        updateStatus('ready')
        console.log(`[${engineLabel}] Model ${modelId} loaded successfully`)
        return true
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error)
        console.error(`[${engineLabel}] Load error:`, error)
        modelRef.current = null
        currentModelRef.current = null
        setCurrentModel(null)
        updateStatus('error')
        onError?.(new Error(`[${engineLabel}] ${errorMsg}`, { cause: error }))
        return false
      } finally {
        loadingRef.current = false
      }
    },
    [
      beforeSessionInit,
      createModel,
      disposeModel,
      engineLabel,
      onError,
      onLoadMessage,
      onModelCreated,
      reportProgress,
      updateStatus,
    ],
  )

  const chatStreamEvents = useCallback(
    async function* (request: AiSdkStreamRequest): AsyncGenerator<LLMStreamEvent, void, unknown> {
      const model = modelRef.current
      if (!model) {
        throw new Error(`${engineLabel} model not loaded`)
      }

      updateStatus('generating')
      abortRef.current = new AbortController()

      try {
        yield* streamAiSdkToEvents(
          model as never,
          provider,
          request,
          abortRef.current.signal,
        )
      } catch (error) {
        if (abortRef.current.signal.aborted) {
          updateStatus('ready')
          return
        }
        console.error(`[${engineLabel}] Stream error:`, error)
        updateStatus('error')
        throw error
      } finally {
        abortRef.current = null
        updateStatus('ready')
      }
    },
    [engineLabel, provider, updateStatus],
  )

  const abort = useCallback(() => {
    abortRef.current?.abort()
  }, [])

  const resetSession = useCallback(() => {
    abortRef.current?.abort()
    abortRef.current = null
  }, [])

  const unload = useCallback(async () => {
    abortRef.current?.abort()
    abortRef.current = null
    const previous = modelRef.current
    if (previous) {
      await disposeModel(previous)
    }
    modelRef.current = null
    currentModelRef.current = null
    setCurrentModel(null)
    updateStatus('idle')
    setLoadProgress(0)
  }, [disposeModel, updateStatus])

  return {
    status,
    loadProgress,
    currentModel,
    isReady: status === 'ready',
    isLoading: status === 'loading',
    isGenerating: status === 'generating',
    loadModel,
    chatStreamEvents,
    abort,
    resetSession,
    unload,
  }
}
