import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertCircle, Cpu, Layers, Loader2, Sparkles } from 'lucide-react'
import { EMBEDDING_MODELS } from '@/rag/embedding-models'
import { LLM_OPTIONS, engineRequiresWebGPU, getLLMOption } from '@/llm/llm-models'

interface ChatInitializationCardProps {
  loadingError: string | null
  activeProject: any
  prefs: any
  updatePreferences: (update: any) => void
  isInitializing: boolean
  webgpu: boolean | undefined | null
  embeddingReady: boolean
  embeddingProgress: number
  isLlmReady: boolean
  option: any
  llmProgress: number
  onInitialize: () => Promise<void>
  onContinueEvidenceOnly: () => Promise<void> | void
}

export function ChatInitializationCard({
  loadingError,
  activeProject,
  prefs,
  updatePreferences,
  isInitializing,
  webgpu,
  embeddingReady,
  embeddingProgress,
  isLlmReady,
  option,
  llmProgress,
  onInitialize,
  onContinueEvidenceOnly,
}: ChatInitializationCardProps) {
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
                    <span className="flex items-center gap-1">
                      <Loader2 className="h-3 w-3 animate-spin text-primary" />
                      Loading Embedding model...
                    </span>
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
                    <span className="flex items-center gap-1">
                      <Loader2 className="h-3 w-3 animate-spin text-primary" />
                      Downloading LLM weights ({option.name})...
                    </span>
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
              <Button onClick={onInitialize} className="w-full h-10 font-semibold rounded-md flex items-center justify-center gap-2 transition-all active:scale-[0.99]">
                <Sparkles className="h-4 w-4" />
                Initialize AI Engines
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={onContinueEvidenceOnly}
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
