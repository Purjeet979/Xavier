import { useState, useRef, useEffect, memo } from 'react'
import { createFileRoute, useNavigate, Link } from '@tanstack/react-router'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Loader2,
  Sparkles,
  BookOpen,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  FileText,
  Cpu,
  Layers,
  X,
  Check,
  Send,
  Copy,
  CheckCircle2,
} from 'lucide-react'
import { getDb, isDbInitialized } from '@/db/client'
import { useQuery } from '@tanstack/react-query'
import { cn } from '@/lib/utils'
import { getLLMVariant, getLLMOption, LLM_OPTIONS, engineRequiresWebGPU } from '@/llm/llm-models'
import { useWebGPU } from '@/hooks/use-webgpu'
import { EMBEDDING_MODELS } from '@/rag/embedding-models'
import { generateRAGAnswer, type RagDebugInfo } from '@/rag/orchestrator'
import { getEffectiveTier } from '@/rag/tiers'
import { RetrievalDebugPanel } from '@/components/chat/retrieval-debug-panel'
import { EvidencePanel } from '@/components/chat/evidence-panel'
import { ChunkExplorer } from '@/components/documents/chunk-explorer'
import { useSystemInit } from '@/context/system-init-context'
import type { LLMRuntimeHandles } from '@/llm/llm-runtime'
import { marked } from 'marked'
import bgSvg from '@/assets/bg.svg'
import bgLightSvg from '@/assets/bg-light.svg'

export const Route = createFileRoute('/')({
  component: ChatComponent,
  validateSearch: (search: Record<string, unknown>): { historyId?: string; clear?: string } => {
    return {
      historyId: (search.historyId as string) || undefined,
      clear: (search.clear as string) || undefined,
    }
  },
})

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  thinking?: string
  citations?: any[]
  /** Standalone query used for retrieval (when rewritten from conversation). */
  retrievalQuery?: string
  debug?: RagDebugInfo
  timestamp: Date
  isStreaming?: boolean
  removedCount?: number
  contextChunks?: any[]
}

// ── Source pill with hover tooltip ──────────────────────────────────────────
function SourcePill({ citation, index, onClick }: { citation: any; index: number; onClick?: () => void }) {
  const [hovered, setHovered] = useState(false)
  const pillRef = useRef<HTMLDivElement>(null)
  const [tooltipLeft, setTooltipLeft] = useState(true)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const matchSource =
    citation.source === 'hybrid'
      ? 'Hybrid'
      : citation.source === 'vector'
        ? 'Semantic'
        : 'Keyword'

  useEffect(() => {
    if (!hovered || !pillRef.current) return
    const rect = pillRef.current.getBoundingClientRect()
    setTooltipLeft(rect.left + 288 < window.innerWidth)
  }, [hovered])

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  const handleMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    setHovered(true)
  }

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setHovered(false)
    }, 200)
  }

  return (
    <div
      ref={pillRef}
      className="relative inline-block"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
    >
      <span className="inline-flex items-center gap-1.5 text-xs bg-secondary/80 hover:bg-accent border border-border hover:border-primary/40 text-foreground/80 hover:text-primary px-2.5 py-1 rounded-full cursor-pointer transition-colors duration-150 select-none">
        <FileText className="h-3 w-3 shrink-0 text-primary" />
        <span className="max-w-[120px] truncate font-medium">{citation.documentName}</span>
        {citation.metadata?.pageNumber && (
          <span className="text-[11px] text-muted-foreground font-mono">p.{citation.metadata.pageNumber}</span>
        )}
        <span className="font-mono font-semibold text-primary text-[11px] bg-card px-1.5 py-0.2 rounded-full border border-border/60">[C{index + 1}]</span>
      </span>

      {hovered && (
        <div
          className={cn(
            'absolute bottom-full mb-2 z-50 w-80 rounded-2xl border border-border bg-popover shadow-lg overflow-hidden',
            tooltipLeft ? 'left-0' : 'right-0'
          )}
        >
          <div className="px-3.5 py-2.5 border-b border-border bg-secondary/40 flex items-start justify-between gap-2">
            <span className="text-xs font-semibold text-foreground leading-snug break-all">
              {citation.documentName}
            </span>
            <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
              {citation.metadata?.pageNumber && (
                <span className="text-[10px] bg-secondary px-1.5 py-0.5 rounded-md text-muted-foreground whitespace-nowrap">
                  p.{citation.metadata.pageNumber}
                </span>
              )}
              <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-md font-mono whitespace-nowrap">
                {matchSource}
              </span>
              <span className="text-[10px] text-muted-foreground font-mono">
                {citation.score?.toFixed(3)}
              </span>
            </div>
          </div>
          <p className="p-3.5 text-xs text-muted-foreground leading-relaxed max-h-40 overflow-y-auto">
            {citation.text}
          </p>
        </div>
      )}
    </div>
  )
}

// ── Individual chat bubble ───────────────────────────────────────────────────
const ChatBubble = memo(function ChatBubble({ message, onCopy, onCitationClick }: { message: ChatMessage; onCopy: (t: string) => void; onCitationClick: (docId: string, docName: string, chunkId?: string) => void }) {
  const [showThinking, setShowThinking] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    onCopy(message.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  if (message.role === 'user') {
    return (
      <div className="flex items-end justify-end gap-2.5 group page-enter">
        <div className="max-w-[85%] md:max-w-[70%] flex flex-col items-end gap-1">
          <div className="bg-primary text-primary-foreground px-4 py-2.5 rounded-2xl rounded-br-sm text-sm leading-relaxed shadow-none">
            {message.content}
          </div>
          <span className="text-[10px] text-muted-foreground/60 pr-1 font-mono">
            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
        <div className="h-7 w-7 rounded-xl bg-accent text-accent-foreground border border-primary/20 flex items-center justify-center shrink-0 mb-4 font-semibold text-xs select-none">
          <span>You</span>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-start gap-2.5 group page-enter">
      <div className="h-7 w-7 rounded-xl bg-card border border-border flex items-center justify-center shrink-0 mt-0.5 text-primary">
        <Sparkles className="h-3.5 w-3.5" />
      </div>

      <div className="max-w-[90%] md:max-w-[80%] flex flex-col gap-2 min-w-0">
        {message.thinking && (
          <div className="border border-border rounded-xl overflow-hidden bg-secondary/50 text-xs">
            <button
              type="button"
              onClick={() => setShowThinking(!showThinking)}
              className="w-full px-3 py-1.5 flex justify-between items-center hover:bg-secondary transition-colors text-muted-foreground font-medium"
            >
              <span className="flex items-center gap-1.5">
                <Loader2 className="h-3 w-3 text-primary" />
                Thinking Process
              </span>
              {showThinking ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </button>
            {showThinking && (
              <div className="px-3.5 py-2.5 font-mono text-[11px] text-muted-foreground whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto border-t border-border">
                {message.thinking}
              </div>
            )}
          </div>
        )}

        {message.contextChunks && message.contextChunks.length > 0 && (
          <EvidencePanel 
            chunks={message.contextChunks} 
            onChunkClick={(c) => onCitationClick(c.documentId, c.documentName, c.chunkId)} 
          />
        )}

        {message.isStreaming && !message.content && !message.thinking && (
          <div className="px-4 py-3 bg-card border border-border rounded-2xl rounded-tl-sm flex items-center gap-2 text-xs text-muted-foreground">
            <span className="flex gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-primary/70 animate-bounce [animation-delay:0ms]" />
              <span className="w-1.5 h-1.5 rounded-full bg-primary/70 animate-bounce [animation-delay:150ms]" />
              <span className="w-1.5 h-1.5 rounded-full bg-primary/70 animate-bounce [animation-delay:300ms]" />
            </span>
            <span className="text-xs">Thinking...</span>
          </div>
        )}

        {message.content && (
          <div className="px-5 py-4 bg-card border border-border rounded-2xl rounded-tl-sm text-foreground shadow-none">
            <div
              className="prose prose-sm dark:prose-invert max-w-none text-foreground reading-content [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:mb-1 [&_p]:mb-3 [&_strong]:font-semibold [&_h1]:font-heading [&_h1]:text-base [&_h2]:font-heading [&_h2]:text-sm [&_h3]:font-heading [&_h3]:text-xs [&_h1]:font-bold [&_h2]:font-bold [&_h3]:font-semibold [&_p:last-child]:mb-0 [&_code]:text-xs [&_code]:bg-secondary [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded-md font-sans text-[15px]"
              dangerouslySetInnerHTML={{ __html: marked.parse(message.content, { async: false }) as string }}
            />
          </div>
        )}

        {message.citations && message.citations.length > 0 && (
          <div className="flex flex-col gap-1.5 mt-0.5">
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <BookOpen className="h-3 w-3 text-primary" />
              Sources & Citations
            </span>
            <div className="flex flex-wrap gap-1.5">
              {message.citations.map((c: any, i: number) => (
                <SourcePill 
                  key={c.chunkId ?? i} 
                  citation={c} 
                  index={i} 
                  onClick={() => onCitationClick(c.documentId, c.documentName, c.chunkId)} 
                />
              ))}
            </div>
          </div>
        )}

        {message.debug && <RetrievalDebugPanel debug={message.debug} />}

        {message.content && (
          <div className="flex items-center gap-2 pl-1 flex-wrap">
            {message.removedCount !== undefined && (
              <span className="text-[10px] bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                <CheckCircle2 className="h-2.5 w-2.5" />
                Verified Grounding
                {message.removedCount > 0 && ` (${message.removedCount} unverified removed)`}
              </span>
            )}
            <span className="text-[10px] text-muted-foreground font-mono">
              {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
            <button
              type="button"
              onClick={handleCopy}
              className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-primary p-1"
              title="Copy answer"
            >
              {copied
                ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                : <Copy className="h-3.5 w-3.5" />}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}, (prev, next) => {
  return prev.message.content === next.message.content &&
         prev.message.isStreaming === next.message.isStreaming &&
         prev.message.thinking === next.message.thinking &&
         prev.message.citations?.length === next.message.citations?.length
})

// ── Main component ───────────────────────────────────────────────────────────
function ChatComponent() {
  const webgpu = useWebGPU()
  const [dbReady, setDbReady] = useState(isDbInitialized())
  const [queryText, setQueryText] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [explorerDoc, setExplorerDoc] = useState<{ id: string; name: string; chunkId?: string } | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Document filter
  const [selectedDocIds, setSelectedDocIds] = useState<Set<string>>(new Set())
  const [filterOpen, setFilterOpen] = useState(false)
  const filterRef = useRef<HTMLDivElement>(null)

  // Model picker
  const [modelOpen, setModelOpen] = useState(false)
  const [isSwitchingModel, setIsSwitchingModel] = useState(false)
  const [chatReady, setChatReady] = useState(false)
  const modelRef = useRef<HTMLDivElement>(null)

  const { historyId, clear } = Route.useSearch()
  const navigate = useNavigate()

  const handleLoadHistoryItem = (item: any) => {
    let parsedCitations: any[] = []
    try { parsedCitations = JSON.parse(item.retrieved_chunks_json || '[]') } catch (_) { }
    setMessages([
      { id: `${item.id}-u`, role: 'user', content: item.query, timestamp: new Date(item.created_at) },
      { id: `${item.id}-a`, role: 'assistant', content: item.answer || '', citations: parsedCitations, timestamp: new Date(item.created_at) },
    ])
    setErrorMessage(null)
    setIsGenerating(false)
  }

  useEffect(() => {
    if (!dbReady || !historyId) return
    const fetchHistoryItem = async () => {
      try {
        const db = getDb()
        const res = await db.query<any>('SELECT * FROM query_history WHERE id = $1', [historyId])
        if (res.rows.length > 0) {
          handleLoadHistoryItem(res.rows[0])
        }
      } catch (err) {
        console.error('Failed to load history item:', err)
      }
    }
    fetchHistoryItem()
  }, [dbReady, historyId])

  const {
    preferences: prefs,
    updatePreferences,
    activeProject,
    gemma4, webllm, lfm2, qwen35,
    isLlmReady, llmLoading, llmProgress, loadLlmModel, switchLlmModel,
    embeddingReady, embeddingLoading, embeddingProgress, loadEmbeddingModel,
    loadingError, setLoadingError,
  } = useSystemInit()

  const { data: projectDocs = [] } = useQuery({
    queryKey: ['project-docs', dbReady, activeProject?.id],
    queryFn: async () => {
      if (!dbReady || !activeProject) return []
      const db = getDb()
      const res = await db.query<any>(
        `SELECT id, name, status FROM documents WHERE project_id = $1 AND status = 'completed' ORDER BY name ASC`,
        [activeProject.id]
      )
      return res.rows
    },
    enabled: dbReady && !!activeProject,
  })

  const getLLMHandles = (): LLMRuntimeHandles => ({
    gemma4: gemma4 as unknown as LLMRuntimeHandles['gemma4'],
    webllm: webllm as unknown as LLMRuntimeHandles['webllm'],
    lfm2: lfm2 as unknown as LLMRuntimeHandles['lfm2'],
    qwen35: qwen35 as unknown as LLMRuntimeHandles['qwen35'],
  })

  useEffect(() => {
    if (dbReady) return
    const iv = setInterval(() => { if (isDbInitialized()) { setDbReady(true); clearInterval(iv) } }, 200)
    return () => clearInterval(iv)
  }, [dbReady])

  useEffect(() => {
    if (!filterOpen) return
    const handler = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) setFilterOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [filterOpen])

  useEffect(() => {
    if (!modelOpen) return
    const handler = (e: MouseEvent) => {
      if (modelRef.current && !modelRef.current.contains(e.target as Node)) setModelOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [modelOpen])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const variant = getLLMVariant(prefs.llmVariantId)
  const option = getLLMOption(prefs.llmVariantId)

  // Auto-correct: if current variant requires WebGPU but device lacks it, pick first compatible one
  useEffect(() => {
    if (webgpu === false && engineRequiresWebGPU(variant.engine)) {
      const compatible = LLM_OPTIONS.find((o) => !engineRequiresWebGPU(o.engineType))
      if (compatible && compatible.id !== prefs.llmVariantId) {
        updatePreferences({ llmVariantId: compatible.id, llmModelId: compatible.logicalModelId })
      }
    }
  }, [webgpu, prefs.llmVariantId, variant.engine, updatePreferences])

  useEffect(() => {
    if (clear) {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
      let hook: any
      if (variant.engine === 'transformers-js') hook = qwen35
      else if (variant.engine === 'webllm') hook = webllm
      else if (variant.engine === 'gemma4-kernel') hook = gemma4
      else if (variant.engine === 'lfm2-kernel') hook = lfm2
      hook?.abort()

      setMessages([])
      setErrorMessage(null)
      setIsGenerating(false)
      setStatusMessage(null)
      navigate({ to: '/', replace: true })
    }
  }, [clear, navigate, variant.engine, qwen35, webllm, gemma4, lfm2])

  const handleInitialize = async () => {
    setLoadingError(null)
    try {
      if (!embeddingReady) await loadEmbeddingModel()
      if (!isLlmReady) await loadLlmModel()
    } catch (err: any) {
      console.error('Failed to initialize models:', err)
      // The onError hooks in system-init-context already propagate a specific error via
      // setLoadingError. Only set a generic fallback when the thrown error itself is useful.
      const msg = err?.message || ''
      if (!msg.includes('Failed to load LLM model')) {
        setLoadingError(msg || 'Failed to initialize AI models. Check WebGPU or network connection.')
      }
    }
  }

  const effectiveTier = getEffectiveTier()

  const handleSearch = async (e?: React.FormEvent) => {
    e?.preventDefault()
    const q = queryText.trim()
    if (!q || isGenerating || isSwitchingModel || (!isLlmReady && effectiveTier !== 0)) return

    const uId = crypto.randomUUID()
    const aId = crypto.randomUUID()
    const now = new Date()

    setMessages((prev) => [
      ...prev,
      { id: uId, role: 'user', content: q, timestamp: now },
      { id: aId, role: 'assistant', content: '', citations: [], timestamp: now, isStreaming: true },
    ])
    setQueryText('')
    if (inputRef.current) { inputRef.current.style.height = 'auto' }
    setIsGenerating(true)
    setErrorMessage(null)
    setStatusMessage('Searching documents...')

    if (abortControllerRef.current) abortControllerRef.current.abort()
    const ctrl = new AbortController()
    abortControllerRef.current = ctrl

    try {
      // Prior completed turns only (exclude the placeholders just appended)
      const conversationHistory = messages
        .filter((m) => !m.isStreaming && m.content.trim().length > 0)
        .map((m) => ({ role: m.role, content: m.content }))

      const stream = generateRAGAnswer(q, {
        projectId: activeProject?.id ?? '',
        embeddingModelId: activeProject?.embeddingModelId ?? '',
        documentIds: selectedDocIds.size > 0 ? Array.from(selectedDocIds) : undefined,
        conversationHistory,
        abortSignal: ctrl.signal,
        llmHandles: getLLMHandles(),
      })

      setStatusMessage(conversationHistory.length > 0 ? 'Rewriting query for retrieval...' : 'Searching documents...')
      let finalAnswer = ''
      let finalCitations: any[] = []

      for await (const chunk of stream) {
        if (ctrl.signal.aborted) break
        if (chunk.type === 'retrieval_query' && chunk.retrievalQuery) {
          setStatusMessage('Searching documents...')
          setMessages((prev) => prev.map((m) => m.id === aId ? { ...m, retrievalQuery: chunk.retrievalQuery } : m))
        } else if (chunk.type === 'debug' && chunk.debug) {
          if (chunk.debug.grounding?.pass) {
            setStatusMessage('Generating answer in browser...')
          }
          setMessages((prev) => prev.map((m) => m.id === aId ? { ...m, debug: chunk.debug } : m))
        } else if (chunk.type === 'citations' && chunk.citations) {
          finalCitations = chunk.citations
          setStatusMessage('Streaming answer...')
          setMessages((prev) => prev.map((m) => m.id === aId ? { ...m, citations: chunk.citations } : m))
        } else if (chunk.type === 'thinking_delta' && chunk.text) {
          setMessages((prev) => prev.map((m) => m.id === aId ? { ...m, thinking: (m.thinking ?? '') + chunk.text } : m))
        } else if (chunk.type === 'text_delta' && chunk.text) {
          finalAnswer += chunk.text
          setMessages((prev) => prev.map((m) => m.id === aId ? { ...m, content: m.content + chunk.text } : m))
        } else if (chunk.type === 'verified' && chunk.text !== undefined) {
          finalAnswer = chunk.text
          setMessages((prev) => prev.map((m) => m.id === aId ? { ...m, content: chunk.text || '', removedCount: chunk.removedCount } : m))
        } else if (chunk.type === 'error' && chunk.error) {
          throw new Error(chunk.error)
        }
      }

      setMessages((prev) => prev.map((m) => m.id === aId ? { ...m, isStreaming: false } : m))
      setStatusMessage(null)

      if (!ctrl.signal.aborted && isDbInitialized()) {
        try {
          const db = getDb()
          await db.query(
            `INSERT INTO query_history (id, query, answer, retrieved_chunks_json, embedding_model_id, llm_model_id, project_id)
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [crypto.randomUUID(), q, finalAnswer, JSON.stringify(finalCitations),
            activeProject?.embeddingModelId ?? '', prefs.llmVariantId, activeProject?.id ?? null]
          )
        } catch (dbErr) { console.error('Failed to save to history:', dbErr) }
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setErrorMessage(err.message || 'An error occurred.')
        setMessages((prev) => prev.map((m) => m.id === aId ? { ...m, isStreaming: false } : m))
      }
      setStatusMessage(null)
    } finally {
      setIsGenerating(false)
      abortControllerRef.current = null
    }
  }

  const handleAbort = () => {
    abortControllerRef.current?.abort()
    let hook: any
    if (variant.engine === 'transformers-js') hook = qwen35
    else if (variant.engine === 'webllm') hook = webllm
    else if (variant.engine === 'gemma4-kernel') hook = gemma4
    else if (variant.engine === 'lfm2-kernel') hook = lfm2
    hook?.abort()
    setIsGenerating(false)
    setStatusMessage('Cancelled')
    setTimeout(() => setStatusMessage(null), 2000)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSearch() }
  }

  const handleCopyMessage = (text: string) => {
    navigator.clipboard.writeText(text).catch(() => { })
  }

  const handleSwitchModel = async (variantId: string) => {
    if (variantId === prefs.llmVariantId || isGenerating || isSwitchingModel || llmLoading) return
    setModelOpen(false)
    setIsSwitchingModel(true)
    setErrorMessage(null)
    setStatusMessage(`Loading ${getLLMOption(variantId).name}...`)
    try {
      await switchLlmModel(variantId)
      setStatusMessage(null)
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to switch LLM model.')
      setStatusMessage(null)
    } finally {
      setIsSwitchingModel(false)
    }
  }

  const isLoaded = isLlmReady && embeddingReady
  const isInitializing = llmLoading || embeddingLoading
  const modelPickerDisabled = isGenerating || isSwitchingModel || llmLoading

  useEffect(() => {
    if (isLoaded) {
      const timer = setTimeout(() => setChatReady(true), 0)
      return () => clearTimeout(timer)
    }
  }, [isLoaded])

  // ── Initialization screen ────────────────────────────────────────────────
  if (!chatReady) {
    return (
      <div className="flex-1 flex items-center justify-center p-6 min-h-[400px]">
        <Card className="w-full max-w-xl bg-card border border-border relative overflow-hidden rounded-2xl page-enter shadow-none">
          <CardHeader className="text-center pb-4 pt-8">
            <div className="mx-auto w-12 h-12 rounded-xl bg-accent border border-primary/20 flex items-center justify-center mb-3 text-primary">
              <Cpu className="h-6 w-6" />
            </div>
            <CardTitle className="text-xl font-heading font-semibold tracking-tight">
              Initialize Study Assistant
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground max-w-sm mx-auto page-enter-delay-1">
              Before querying your study material, load the embedding model and local LLM weights into browser memory.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 px-8 pb-8 page-enter-delay-2">
            {loadingError && (
              <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive flex items-start gap-3 text-xs">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{loadingError}</span>
              </div>
            )}
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                  <Layers className="h-3.5 w-3.5 text-primary" />
                  Embedding Model (Workspace-locked)
                </label>
                <div className="w-full bg-secondary/60 border border-border rounded-xl p-2.5 text-xs text-muted-foreground flex items-center gap-2">
                  <span className="font-semibold text-foreground">
                    {activeProject
                      ? (EMBEDDING_MODELS.find((m) => m.id === activeProject.embeddingModelId)?.displayName ?? activeProject.embeddingModelId)
                      : 'No workspace selected'}
                  </span>
                  {activeProject && (
                    <span className="text-[10px] bg-card border border-border px-2 py-0.5 rounded-md text-muted-foreground">locked</span>
                  )}
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                  <Cpu className="h-3.5 w-3.5 text-primary" />
                  Local LLM Option
                </label>
                <select
                  disabled={isInitializing}
                  value={prefs.llmVariantId}
                  onChange={(e) => updatePreferences({ llmVariantId: e.target.value, llmModelId: getLLMOption(e.target.value).logicalModelId })}
                  className="w-full bg-card border border-border rounded-xl p-2.5 text-xs text-foreground focus:ring-2 focus:ring-ring/25 outline-none disabled:opacity-50"
                >
                {LLM_OPTIONS.map((opt) => {
                    const unavailable = webgpu === false && engineRequiresWebGPU(opt.engineType)
                    return (
                      <option key={opt.id} value={opt.id} disabled={unavailable}>
                        {opt.name} ({opt.variantLabel}) • {opt.sizeLabel}{unavailable ? ' (requires WebGPU)' : ''}
                      </option>
                    )
                  })}
                </select>
              </div>
            </div>
            {isInitializing && (
              <div className="space-y-4 border-t border-border/50 pt-4">
                {!embeddingReady && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold text-muted-foreground">
                      <span className="flex items-center gap-1"><Loader2 className="h-3 w-3 animate-spin text-primary" />Loading Embedding model...</span>
                      <span className="font-mono text-primary">{embeddingProgress}%</span>
                    </div>
                    <div className="w-full bg-secondary h-1.5 rounded-full overflow-hidden">
                      <div className="bg-primary h-full transition-all duration-300" style={{ width: `${embeddingProgress}%` }} />
                    </div>
                  </div>
                )}
                {!isLlmReady && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold text-muted-foreground">
                      <span className="flex items-center gap-1"><Loader2 className="h-3 w-3 animate-spin text-primary" />Downloading LLM weights ({option.name})...</span>
                      <span className="font-mono text-primary">{llmProgress}%</span>
                    </div>
                    <div className="w-full bg-secondary h-1.5 rounded-full overflow-hidden">
                      <div className="bg-primary h-full transition-all duration-300" style={{ width: `${llmProgress}%` }} />
                    </div>
                  </div>
                )}
              </div>
            )}
            {!isInitializing && (
              <div className="space-y-2">
                <Button onClick={handleInitialize} className="w-full h-10 font-semibold rounded-md flex items-center justify-center gap-2 transition-all active:scale-[0.99]">
                  <Sparkles className="h-4 w-4" />
                  Initialize AI Engines
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={async () => {
                    if (!embeddingReady) {
                      try {
                        await loadEmbeddingModel()
                      } catch {
                        // ignore
                      }
                    }
                    setChatReady(true)
                  }}
                  className="w-full h-9 text-xs font-medium rounded-md border-border/70 hover:bg-muted/50"
                >
                  Continue in Evidence-Only Mode (Tier 0 • No GPU Required)
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  // ── Full-screen chat layout ──────────────────────────────────────────────
  return (
    <div className="flex h-full min-h-0 overflow-hidden">
      {/* ── Main chat area ─────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto min-h-0">
          <div className="w-full px-4 md:px-6 py-6 md:py-8 space-y-6 md:space-y-8">
            {messages.length === 0 && !errorMessage && (
              <div className="relative flex flex-col items-center justify-center text-center space-y-3 pt-16 md:pt-24 select-none page-enter rounded-3xl p-6 overflow-hidden">
                <div
                  className="pointer-events-none absolute inset-0 opacity-25 dark:hidden bg-cover bg-center bg-no-repeat transition-opacity"
                  style={{ backgroundImage: `url(${bgLightSvg})` }}
                  aria-hidden
                />
                <div
                  className="pointer-events-none absolute inset-0 opacity-30 hidden dark:block bg-cover bg-center bg-no-repeat transition-opacity"
                  style={{ backgroundImage: `url(${bgSvg})` }}
                  aria-hidden
                />

                {/* Floating academic status beacons */}
                <div className="animate-float-slow absolute top-6 left-6 hidden lg:flex items-center gap-1.5 px-3 py-1 rounded-full bg-card/90 border border-primary/20 text-[11px] font-mono text-muted-foreground shadow-xs pointer-events-none">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Local Vector Indexing Active</span>
                </div>
                <div className="animate-float-reverse absolute bottom-6 right-6 hidden lg:flex items-center gap-1.5 px-3 py-1 rounded-full bg-card/90 border border-primary/20 text-[11px] font-mono text-muted-foreground shadow-xs pointer-events-none">
                  <span className="font-serif italic font-semibold text-primary">सूत्र</span>
                  <span>Strict Grounded Verification</span>
                </div>

                <div className="relative z-10 flex flex-col items-center">
                  <div className="h-12 w-12 rounded-2xl bg-accent border border-primary/20 flex items-center justify-center text-primary mb-3">
                    <BookOpen className="h-6 w-6" />
                  </div>
                  <p className="font-heading text-2xl md:text-3xl font-semibold text-foreground tracking-tight max-w-md">
                    Gyaanसूत्र
                  </p>
                  <p className="text-xs text-muted-foreground leading-relaxed max-w-sm mt-2 page-enter-delay-1">
                    StudyGround Assistant — ask questions about your uploaded materials. Get grounded answers backed by verified citations.
                  </p>
                  <Link
                    to="/landing"
                    className="mt-4 inline-flex items-center gap-2 rounded-xl bg-accent/90 hover:bg-accent border border-primary/30 px-4 py-2 text-xs text-primary font-medium shadow-xs transition-all hover:scale-[1.02] page-enter-delay-2"
                  >
                    <BookOpen className="h-3.5 w-3.5 text-primary" />
                    <span>Experience Gyansutra Opening Story & Landing Page →</span>
                  </Link>
                </div>
              </div>
            )}

            {errorMessage && (
              <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive flex items-start gap-3">
                <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-sm">Error</p>
                  <p className="text-xs opacity-90 mt-0.5">{errorMessage}</p>
                </div>
              </div>
            )}

            {/* Messages */}
            {messages.map((msg) => (
              <ChatBubble 
                key={msg.id} 
                message={msg} 
                onCopy={handleCopyMessage} 
                onCitationClick={(docId, docName, chunkId) => setExplorerDoc({ id: docId, name: docName, chunkId })}
              />
            ))}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {explorerDoc && (
          <ChunkExplorer
            documentId={explorerDoc.id}
            documentName={explorerDoc.name}
            initialChunkId={explorerDoc.chunkId}
            onClose={() => setExplorerDoc(null)}
          />
        )}

        {selectedDocIds.size > 0 && (
          <div className="flex flex-wrap gap-1.5 items-center px-4 md:px-6 py-2 border-t border-border bg-card/60 shrink-0">
            <span className="text-xs text-muted-foreground font-medium">Filtering:</span>
            {projectDocs.filter((d: any) => selectedDocIds.has(d.id)).map((d: any) => (
              <span key={d.id} className="inline-flex items-center gap-1.5 text-xs bg-accent text-accent-foreground border border-primary/20 px-2.5 py-0.5 rounded-full font-medium">
                {d.name}
                <button type="button" onClick={() => setSelectedDocIds((prev) => { const n = new Set(prev); n.delete(d.id); return n })} className="hover:text-destructive">
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        )}

        <div className="shrink-0 px-4 md:px-6 pt-2 pb-3">
          <div className="w-full max-w-4xl mx-auto">
            {statusMessage && (
              <div className="text-xs text-muted-foreground flex items-center gap-1.5 bg-secondary px-3 py-1 rounded-full border border-border w-fit mb-2">
                <Loader2 className="h-3 w-3 animate-spin text-primary" />
                {statusMessage}
              </div>
            )}
            <form
              onSubmit={handleSearch}
              className="flex flex-col gap-2 bg-card border border-border rounded-2xl p-3.5 shadow-none composer-focus-wash transition-colors"
            >
              <div className="flex items-start gap-3">
                <textarea
                  ref={inputRef}
                  rows={1}
                  value={queryText}
                  onChange={(e) => {
                    setQueryText(e.target.value)
                    e.target.style.height = 'auto'
                    e.target.style.height = `${Math.min(e.target.scrollHeight, 140)}px`
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask a question about your study material... (Enter to send, Shift+Enter for newline)"
                  disabled={isGenerating || isSwitchingModel || !dbReady || (!isLlmReady && effectiveTier !== 0)}
                  className="flex-1 resize-none bg-transparent border-0 outline-none text-sm text-foreground placeholder:text-muted-foreground/60 leading-relaxed py-1 min-h-[32px] max-h-[140px] disabled:opacity-50"
                />
                {isGenerating ? (
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={handleAbort}
                    className="shrink-0 rounded-xl h-9 px-3 flex items-center gap-1.5 text-xs font-medium"
                  >
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Stop
                  </Button>
                ) : (
                  <button
                    type="submit"
                    disabled={!dbReady || (!isLlmReady && effectiveTier !== 0) || isSwitchingModel || !queryText.trim()}
                    className="shrink-0 h-9 w-9 rounded-xl bg-primary hover:bg-primary-hover text-primary-foreground flex items-center justify-center transition-colors disabled:opacity-40 disabled:cursor-not-allowed mt-0.5"
                  >
                    <Send className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
              <div className="flex items-center gap-3 pt-2 border-t border-border">
                <div className="relative" ref={modelRef}>
                  <button
                    type="button"
                    onClick={() => { setModelOpen((o) => !o); setFilterOpen(false) }}
                    disabled={modelPickerDisabled}
                    aria-haspopup="listbox"
                    aria-expanded={modelOpen}
                    className={cn(
                      'flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg border transition-colors',
                      'border-border bg-secondary text-muted-foreground hover:border-primary/40 hover:text-foreground',
                      'disabled:opacity-40 disabled:cursor-not-allowed'
                    )}
                  >
                    {isSwitchingModel || llmLoading ? (
                      <Loader2 className="h-3 w-3 animate-spin text-primary" />
                    ) : (
                      <Cpu className="h-3 w-3 text-primary" />
                    )}
                    <span className="font-medium text-foreground">{prefs.overrideHardwareTier === 0 ? 'Evidence-Only (Tier 0)' : option.name}</span>
                    <ChevronDown className={cn('h-3 w-3 transition-transform', modelOpen && 'rotate-180')} />
                  </button>

                  {modelOpen && (
                    <div className="absolute left-0 bottom-full mb-2 z-50 w-80 rounded-2xl border border-border bg-popover shadow-xl overflow-hidden">
                      <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-border">
                        <span className="text-xs font-semibold flex items-center gap-1.5">
                          <Cpu className="h-3.5 w-3.5 text-primary" />
                          Study Assistant Model
                        </span>
                        <span className="text-[10px] text-muted-foreground">In-browser local AI</span>
                      </div>
                      <div className="max-h-64 overflow-y-auto py-1.5" role="listbox">
                        <button
                          type="button"
                          role="option"
                          aria-selected={prefs.overrideHardwareTier === 0}
                          onClick={() => {
                            updatePreferences({ overrideHardwareTier: 0 })
                            setModelOpen(false)
                          }}
                          className={cn(
                            'w-full flex items-start gap-2.5 px-3 py-2 text-xs hover:bg-secondary/40 text-left border-b border-border/30',
                            prefs.overrideHardwareTier === 0 && 'bg-primary/5 text-primary'
                          )}
                        >
                          <span className={cn(
                            'mt-0.5 h-4 w-4 rounded-sm border flex items-center justify-center shrink-0',
                            prefs.overrideHardwareTier === 0 ? 'bg-primary border-primary text-primary-foreground' : 'border-border'
                          )}>
                            {prefs.overrideHardwareTier === 0 && <Check className="h-2.5 w-2.5" />}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="flex items-center justify-between gap-2">
                              <span className="font-medium truncate">Tier 0 (Evidence-Only)</span>
                              <span className="text-[9px] text-muted-foreground shrink-0 font-mono">
                                Instant
                              </span>
                            </span>
                            <span className="block text-[10px] text-muted-foreground mt-0.5">
                              Extracts answers directly from retrieved documents
                            </span>
                          </span>
                        </button>
                        {LLM_OPTIONS.map((opt) => {
                          const selected = prefs.overrideHardwareTier !== 0 && opt.id === prefs.llmVariantId
                          return (
                            <button
                              key={opt.id}
                              type="button"
                              role="option"
                              aria-selected={selected}
                              onClick={() => {
                                updatePreferences({ overrideHardwareTier: undefined })
                                handleSwitchModel(opt.id)
                              }}
                              className={cn(
                                'w-full flex items-start gap-2.5 px-3 py-2 text-xs hover:bg-secondary/40 text-left',
                                selected && 'bg-primary/5 text-primary'
                              )}
                            >
                              <span className={cn(
                                'mt-0.5 h-4 w-4 rounded-sm border flex items-center justify-center shrink-0',
                                selected ? 'bg-primary border-primary text-primary-foreground' : 'border-border'
                              )}>
                                {selected && <Check className="h-2.5 w-2.5" />}
                              </span>
                              <span className="min-w-0 flex-1">
                                <span className="flex items-center justify-between gap-2">
                                  <span className="font-medium truncate">{opt.name}</span>
                                  <span className="text-[9px] text-muted-foreground shrink-0 font-mono">
                                    {opt.sizeLabel}
                                  </span>
                                </span>
                                <span className="block text-[10px] text-muted-foreground mt-0.5">
                                  {opt.variantLabel ?? opt.engineType}
                                </span>
                              </span>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>

                <div className="relative" ref={filterRef}>
                  <button
                    type="button"
                    onClick={() => { setFilterOpen((o) => !o); setModelOpen(false) }}
                    disabled={isGenerating || isSwitchingModel || !dbReady || projectDocs.length === 0}
                    className={cn(
                      'flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg border transition-colors',
                      selectedDocIds.size > 0
                        ? 'border-primary/40 bg-accent text-accent-foreground font-medium'
                        : 'border-border bg-secondary text-muted-foreground hover:border-primary/40 hover:text-foreground',
                      'disabled:opacity-40'
                    )}
                  >
                    <BookOpen className="h-3 w-3 text-primary" />
                    {selectedDocIds.size > 0 ? `${selectedDocIds.size} doc${selectedDocIds.size > 1 ? 's' : ''}` : 'All Study Material'}
                    {selectedDocIds.size > 0 && (
                      <span
                        role="button"
                        aria-label="Clear filter"
                        onClick={(e) => { e.stopPropagation(); setSelectedDocIds(new Set()) }}
                        className="ml-0.5 hover:text-destructive transition-colors"
                      >
                        <X className="h-3 w-3" />
                      </span>
                    )}
                  </button>

                  {filterOpen && projectDocs.length > 0 && (
                    <div className="absolute left-0 bottom-full mb-2 z-50 w-72 rounded-2xl border border-border bg-popover shadow-xl overflow-hidden">
                      <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-border">
                        <span className="text-xs font-semibold flex items-center gap-1.5 text-foreground"><FileText className="h-3.5 w-3.5 text-primary" />Filter by Document</span>
                        <div className="flex items-center gap-1">
                          {selectedDocIds.size > 0 && (
                            <button type="button" onClick={() => setSelectedDocIds(new Set())} className="text-[10px] text-muted-foreground hover:text-destructive px-2 py-0.5 rounded-md hover:bg-destructive/10">
                              Clear all
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => selectedDocIds.size === projectDocs.length ? setSelectedDocIds(new Set()) : setSelectedDocIds(new Set(projectDocs.map((d: any) => d.id)))}
                            className="text-[10px] text-primary hover:underline px-1.5 py-0.5 rounded-sm"
                          >
                            {selectedDocIds.size === projectDocs.length ? 'Deselect all' : 'Select all'}
                          </button>
                        </div>
                      </div>
                      <div className="max-h-56 overflow-y-auto py-1.5">
                        {projectDocs.map((doc: any) => {
                          const checked = selectedDocIds.has(doc.id)
                          return (
                            <button
                              key={doc.id}
                              type="button"
                              onClick={() => setSelectedDocIds((prev) => { const n = new Set(prev); if (checked) { n.delete(doc.id) } else { n.add(doc.id) } return n })}
                              className={cn('w-full flex items-center gap-2.5 px-3 py-2 text-xs hover:bg-secondary/40 text-left', checked && 'bg-primary/5 text-primary')}
                            >
                              <span className={cn('h-4 w-4 rounded-sm border flex items-center justify-center shrink-0', checked ? 'bg-primary border-primary text-primary-foreground' : 'border-border')}>
                                {checked && <Check className="h-2.5 w-2.5" />}
                              </span>
                              <span className="truncate">{doc.name}</span>
                            </button>
                          )
                        })}
                      </div>
                      {selectedDocIds.size > 0 && (
                        <div className="px-3 py-2 border-t border-border/50 text-[10px] text-muted-foreground">
                          Searching {selectedDocIds.size} of {projectDocs.length} document{projectDocs.length !== 1 ? 's' : ''}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </form>
            <p className="text-center text-[9px] text-muted-foreground/45 mt-1.5 mb-0 select-none">
              Runs entirely in your browser · No data leaves your device
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
