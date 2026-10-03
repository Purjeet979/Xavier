import { useRef, useEffect } from 'react'
import { BookOpen, FileText, Check, X } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface DocumentFilterItem {
  id: string
  name: string
  status?: string
}

interface ChatDocFilterProps {
  projectDocs: DocumentFilterItem[]
  selectedDocIds: Set<string>
  setSelectedDocIds: React.Dispatch<React.SetStateAction<Set<string>>>
  isOpen: boolean
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>
  disabled?: boolean
  onCloseOtherPopovers?: () => void
}

export function ChatDocFilter({
  projectDocs,
  selectedDocIds,
  setSelectedDocIds,
  isOpen,
  setIsOpen,
  disabled = false,
  onCloseOtherPopovers,
}: ChatDocFilterProps) {
  const filterRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen) return
    const handler = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [isOpen, setIsOpen])

  return (
    <div className="relative" ref={filterRef}>
      <button
        type="button"
        onClick={() => {
          setIsOpen((o) => !o)
          if (!isOpen && onCloseOtherPopovers) {
            onCloseOtherPopovers()
          }
        }}
        disabled={disabled || projectDocs.length === 0}
        className={cn(
          'flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg border transition-colors max-w-[200px]',
          selectedDocIds.size > 0
            ? 'border-primary/40 bg-accent text-accent-foreground font-medium'
            : 'border-border bg-secondary text-muted-foreground hover:border-primary/40 hover:text-foreground',
          'disabled:opacity-40'
        )}
      >
        <BookOpen className="h-3 w-3 text-primary shrink-0" />
        <span className="truncate">
          {selectedDocIds.size === 1
            ? projectDocs.find((d) => selectedDocIds.has(d.id))?.name || '1 doc'
            : selectedDocIds.size > 1
              ? `${selectedDocIds.size} docs`
              : 'All Study Material'}
        </span>
        {selectedDocIds.size > 0 && (
          <span
            role="button"
            aria-label="Clear filter"
            onClick={(e) => {
              e.stopPropagation()
              setSelectedDocIds(new Set())
            }}
            className="ml-0.5 hover:text-destructive transition-colors shrink-0"
          >
            <X className="h-3 w-3" />
          </span>
        )}
      </button>

      {isOpen && projectDocs.length > 0 && (
        <div className="absolute left-0 bottom-full mb-2 z-50 w-80 rounded-2xl border border-border bg-popover shadow-xl overflow-hidden">
          <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-border">
            <span className="text-xs font-semibold flex items-center gap-1.5 text-foreground">
              <FileText className="h-3.5 w-3.5 text-primary" />Filter by Document
            </span>
            <div className="flex items-center gap-1">
              {selectedDocIds.size > 0 && (
                <button
                  type="button"
                  onClick={() => setSelectedDocIds(new Set())}
                  className="text-[10px] text-muted-foreground hover:text-destructive px-2 py-0.5 rounded-md hover:bg-destructive/10"
                >
                  Clear all
                </button>
              )}
              <button
                type="button"
                onClick={() =>
                  selectedDocIds.size === projectDocs.length
                    ? setSelectedDocIds(new Set())
                    : setSelectedDocIds(new Set(projectDocs.map((d) => d.id)))
                }
                className="text-[10px] text-primary hover:underline px-1.5 py-0.5 rounded-sm"
              >
                {selectedDocIds.size === projectDocs.length ? 'Deselect all' : 'Select all'}
              </button>
            </div>
          </div>
          <div className="max-h-56 overflow-y-auto py-1.5">
            {projectDocs.map((doc) => {
              const checked = selectedDocIds.has(doc.id)
              const isOnly = selectedDocIds.size === 1 && checked
              return (
                <div
                  key={doc.id}
                  className={cn(
                    'w-full flex items-center justify-between gap-2 px-3 py-1.5 text-xs hover:bg-secondary/40 text-left transition-colors',
                    checked && 'bg-primary/5 text-primary'
                  )}
                >
                  <button
                    type="button"
                    onClick={() =>
                      setSelectedDocIds((prev) => {
                        const n = new Set(prev)
                        if (checked) {
                          n.delete(doc.id)
                        } else {
                          n.add(doc.id)
                        }
                        return n
                      })
                    }
                    className="flex items-center gap-2.5 flex-1 min-w-0 text-left py-0.5"
                  >
                    <span
                      className={cn(
                        'h-4 w-4 rounded-sm border flex items-center justify-center shrink-0',
                        checked ? 'bg-primary border-primary text-primary-foreground' : 'border-border'
                      )}
                    >
                      {checked && <Check className="h-2.5 w-2.5" />}
                    </span>
                    <span className="truncate">{doc.name}</span>
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      setSelectedDocIds(new Set([doc.id]))
                      setIsOpen(false)
                    }}
                    className={cn(
                      'text-[10px] px-2 py-0.5 rounded-md font-medium shrink-0 transition-colors border',
                      isOnly
                        ? 'bg-primary text-primary-foreground border-primary font-semibold'
                        : 'border-border hover:border-primary/40 hover:bg-secondary text-muted-foreground hover:text-foreground'
                    )}
                    title={`Focus exclusively on ${doc.name}`}
                  >
                    {isOnly ? 'Active' : 'Only'}
                  </button>
                </div>
              )
            })}
          </div>
          {selectedDocIds.size > 0 && (
            <div className="px-3 py-2 border-t border-border/50 text-[10px] text-muted-foreground">
              Searching {selectedDocIds.size} of {projectDocs.length} document
              {projectDocs.length !== 1 ? 's' : ''}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
