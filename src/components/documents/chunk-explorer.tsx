import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getDb, isDbInitialized } from '@/db/client'
import { Button } from '@/components/ui/button'
import { X, Layers, FileText, ChevronDown, ChevronUp, Hash } from 'lucide-react'
import { cn } from '@/lib/utils'
import { isTableChunk } from '@/rag/grounding/tables'

interface ChunkExplorerProps {
  documentId: string
  documentName: string
  initialChunkId?: string
  onClose: () => void
}

interface ChunkRow {
  id: string
  chunk_index: number
  text: string
  token_count: number
  metadata_json: string | null
}

function parseMeta(raw: string | null) {
  if (!raw) return {} as Record<string, unknown>
  try {
    return JSON.parse(raw) as Record<string, unknown>
  } catch {
    return {}
  }
}

export function ChunkExplorer({ documentId, documentName, initialChunkId, onClose }: ChunkExplorerProps) {
  const [expandedId, setExpandedId] = useState<string | null>(initialChunkId || null)

  const { data: chunks = [], isLoading } = useQuery({
    queryKey: ['document-chunks', documentId],
    queryFn: async () => {
      if (!isDbInitialized()) return []
      const db = getDb()
      const res = await db.query<ChunkRow>(
        `SELECT id, chunk_index, text, token_count, metadata_json
         FROM chunks WHERE document_id = $1 ORDER BY chunk_index ASC`,
        [documentId]
      )
      return res.rows
    },
  })

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full sm:max-w-2xl max-h-[85vh] flex flex-col bg-card border border-border rounded-t-2xl sm:rounded-2xl shadow-xl page-enter">
        <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-border shrink-0">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-xs text-primary font-medium mb-1">
              <Layers className="h-3.5 w-3.5" />
              Document Chunks
            </div>
            <h2 className="font-heading font-semibold text-base text-foreground truncate">{documentName}</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {isLoading ? 'Loading…' : `${chunks.length} chunk${chunks.length === 1 ? '' : 's'} extracted`}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8 rounded-xl shrink-0 text-muted-foreground hover:bg-secondary hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto min-h-0 p-4 space-y-2">
          {isLoading ? (
            <p className="text-xs text-muted-foreground text-center py-8">Loading chunks…</p>
          ) : chunks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-2">
              <FileText className="h-8 w-8 opacity-40 text-primary" />
              <p className="text-xs">No chunks found for this document.</p>
            </div>
          ) : (
            chunks.map((chunk) => {
              const meta = parseMeta(chunk.metadata_json)
              const open = expandedId === chunk.id
              return (
                <div
                  key={chunk.id}
                  id={`chunk-${chunk.id}`}
                  ref={(el) => {
                    if (el && chunk.id === initialChunkId) {
                      // Scroll into view on mount if it's the target chunk
                      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
                    }
                  }}
                  className={cn(
                    'border border-border rounded-xl overflow-hidden bg-secondary/30 transition-colors',
                    open && 'border-primary/40 bg-secondary/60'
                  )}
                >
                  <button
                    type="button"
                    onClick={() => setExpandedId(open ? null : chunk.id)}
                    className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-accent/30 transition-colors"
                  >
                    <span className="inline-flex items-center gap-1 text-[10px] font-mono font-semibold text-primary bg-primary/10 px-1.5 py-0.5 rounded-sm shrink-0">
                      <Hash className="h-2.5 w-2.5" />
                      {chunk.chunk_index}
                    </span>
                    <span className="flex-1 text-xs text-muted-foreground truncate">
                      {chunk.text.slice(0, 120)}
                      {chunk.text.length > 120 ? '…' : ''}
                    </span>
                    <span className="text-[10px] text-muted-foreground/70 font-mono shrink-0">
                      {chunk.token_count} tok
                    </span>
                    {typeof meta.pageNumber === 'number' && (
                      <span className="text-[10px] bg-secondary px-1.5 py-0.5 rounded-sm text-muted-foreground shrink-0">
                        p.{meta.pageNumber}
                      </span>
                    )}
                    {open ? (
                      <ChevronUp className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    ) : (
                      <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    )}
                  </button>
                  {open && (
                    <div className="px-3 pb-3 border-t border-border/40 space-y-2">
                      {(meta.headingPath || meta.startOffset != null) && (
                        <div className="flex flex-wrap gap-1.5 pt-2">
                          {typeof meta.headingPath === 'string' && meta.headingPath && (
                            <span className="text-[10px] bg-secondary px-1.5 py-0.5 rounded-sm text-muted-foreground">
                              {meta.headingPath}
                            </span>
                          )}
                          {meta.startOffset != null && meta.endOffset != null && (
                            <span className="text-[10px] font-mono text-muted-foreground/70">
                              offset {String(meta.startOffset)}–{String(meta.endOffset)}
                            </span>
                          )}
                        </div>
                      )}
                      {isTableChunk(chunk.text) ? (
                        <pre className="text-[10px] bg-muted/50 p-2 rounded overflow-x-auto text-muted-foreground whitespace-pre pt-1 mt-2">
                          {chunk.text}
                        </pre>
                      ) : (
                        <p className="text-xs text-foreground/90 leading-relaxed whitespace-pre-wrap pt-1 mt-1">
                          {chunk.text}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
