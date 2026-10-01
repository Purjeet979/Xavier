import { Layers, FileText } from 'lucide-react'

import type { RetrievalResult } from '@/rag/retrieval'

interface EvidencePanelProps {
  chunks: RetrievalResult[]
  onChunkClick?: (chunk: RetrievalResult) => void
}

export function EvidencePanel({ chunks, onChunkClick }: EvidencePanelProps) {
  if (!chunks || chunks.length === 0) return null

  return (
    <div className="mb-3 p-3 bg-muted/40 rounded-lg border border-border/50 text-xs">
      <div className="font-semibold mb-2 flex items-center gap-1.5 text-muted-foreground">
        <Layers className="w-3.5 h-3.5" /> Retrieved Context
      </div>
      <div className="space-y-2">
        {chunks.map((c, i) => (
          <div 
            key={i} 
            onClick={() => onChunkClick?.(c)}
            className="bg-card p-2.5 rounded border border-border/40 shadow-sm cursor-pointer hover:border-primary/50 hover:bg-accent/20 transition-colors"
          >
            <div className="flex items-center gap-1.5 font-medium text-primary mb-1">
              <FileText className="w-3 h-3 shrink-0" />
              <span className="truncate">{c.documentName}</span>
              {c.metadata?.pageNumber && <span className="opacity-70 font-mono text-[10px]">p.{c.metadata.pageNumber}</span>}
              <span className="ml-auto font-mono text-[10px] text-muted-foreground/60">[C{i + 1}]</span>
            </div>
            <div className="line-clamp-2 text-muted-foreground leading-relaxed">{c.text}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
