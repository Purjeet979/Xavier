import { useState, useRef } from 'react'
import type { DragEvent, ChangeEvent } from 'react'
import { UploadCloud, AlertCircle } from 'lucide-react'

interface UploadPanelProps {
  onFilesSelected: (files: File[]) => void
  disabled?: boolean
}

export function UploadPanel({ onFilesSelected, disabled = false }: UploadPanelProps) {
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    if (disabled) return
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
    if (disabled) return

    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      onFilesSelected(files)
    }
  }

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (disabled) return
    const files = e.target.files ? Array.from(e.target.files) : []
    if (files.length > 0) {
      onFilesSelected(files)
    }
  }

  const triggerFileInput = () => {
    if (disabled) return
    fileInputRef.current?.click()
  }

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={triggerFileInput}
      className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-200 cursor-pointer flex flex-col items-center justify-center gap-3 relative ${
        isDragging
          ? 'border-primary bg-accent/60 scale-[0.99]'
          : 'border-border bg-card/60 hover:border-primary/50 hover:bg-secondary/40'
      } ${disabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}`}
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        onClick={(e) => e.stopPropagation()}
        multiple
        accept=".txt,.md,.json,.csv,.html,.pdf"
        className="hidden"
      />

      <div className={`p-3.5 rounded-xl bg-secondary border border-border ${isDragging ? 'border-primary text-primary' : 'text-primary'} transition-all duration-300`}>
        <UploadCloud className={`h-6 w-6 ${isDragging ? 'text-primary' : ''}`} />
      </div>

      <div className="space-y-1">
        <h3 className="font-heading font-semibold text-sm text-foreground">
          {isDragging ? 'Drop your files here' : 'Upload study material'}
        </h3>
        <p className="text-xs text-muted-foreground max-w-sm">
          Drag and drop files, or click to browse. Supports PDF, Markdown, Text, HTML, CSV, and JSON.
        </p>
      </div>

      {disabled && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/60 rounded-md">
          <AlertCircle className="h-5 w-5 text-muted-foreground" />
        </div>
      )}
    </div>
  )
}
