import { Layers, FileText } from 'lucide-react'

import type { RetrievalResult } from '@/rag/retrieval'
import { isTableChunk } from '@/rag/grounding/tables'

interface EvidencePanelProps {
  chunks: RetrievalResult[]
  onChunkClick?: (chunk: RetrievalResult) => void
}

export function EvidencePanel({ chunks, onChunkClick }: EvidencePanelProps) {
  if (!chunks || chunks.length === 0) return null

  return (
    <div className="mb-3 p-3.5 bg-secondary/60 rounded-xl border border-border text-xs">
      <div className="font-medium mb-2.5 flex items-center gap-1.5 text-muted-foreground">
        <Layers className="w-3.5 h-3.5 text-primary" /> Retrieved Context
      </div>
      <div className="space-y-2">
        {chunks.map((c, i) => (
          <div 
            key={i} 
            onClick={() => onChunkClick?.(c)}
            className="bg-card p-3 rounded-lg border border-border shadow-none cursor-pointer hover:border-primary/50 hover:bg-accent/30 transition-colors"
          >
            <div className="flex items-center gap-1.5 font-medium text-foreground mb-1.5">
              <FileText className="w-3.5 h-3.5 text-primary shrink-0" />
              <span className="truncate">{c.documentName}</span>
              {c.metadata?.pageNumber && <span className="text-muted-foreground font-mono text-[10px]">p.{c.metadata.pageNumber}</span>}
              {c.truncated && <span className="text-[10px] text-warning font-semibold ml-1 px-1.5 py-0.5 rounded bg-warning/10">truncated</span>}
              <span className="ml-auto font-mono text-[10px] font-semibold text-primary bg-accent/80 px-1.5 py-0.5 rounded">[C{i + 1}]</span>
            </div>
            {isTableChunk(c.text) ? (
              <pre className="text-[11px] bg-secondary p-2 rounded-md overflow-x-auto text-muted-foreground whitespace-pre font-mono">
                {c.text}
              </pre>
            ) : (
              <div className="line-clamp-2 text-muted-foreground leading-relaxed text-xs">{c.text}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
