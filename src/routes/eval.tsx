import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useSystemInit } from '@/context/system-init-context'
import { getLLMOption } from '@/llm/llm-models'
import { EMBEDDING_MODELS } from '@/rag/embedding-models'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { runEval, computeMetrics, type EvalResult } from '@/eval/runEval'

export const Route = createFileRoute('/eval')({
  component: EvalPage,
})

function EvalPage() {
  const { preferences, activeProject, getLLMHandles } = useSystemInit()
  const [isRunning, setIsRunning] = useState(false)
  const [progress, setProgress] = useState({ current: 0, total: 0 })
  const [results, setResults] = useState<EvalResult[]>([])

  const llmName = getLLMOption(preferences.llmModelId)?.name || preferences.llmModelId
  const embedName = EMBEDDING_MODELS.find(m => m.id === activeProject?.embeddingModelId)?.displayName || activeProject?.embeddingModelId || 'None'

  async function handleRunEval() {
    setIsRunning(true)
    setResults([])
    
    try {
      const handles = getLLMHandles()
      const finalResults = await runEval(
        activeProject!.embeddingModelId,
        preferences.llmModelId,
        activeProject!.id,
        handles,
        (current, total, latestResult) => {
          setProgress({ current, total })
          setResults(prev => [...prev, latestResult])
        }
      )
    } finally {
      setIsRunning(false)
    }
  }

  const metrics = computeMetrics(results)

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6 page-enter">
      <h1 className="text-3xl font-heading font-bold text-foreground">TrustScore Evaluation</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Evaluation Setup</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><strong>Active Project:</strong> {activeProject?.id || 'None (Upload sample.md first!)'}</div>
            <div><strong>LLM:</strong> {llmName}</div>
            <div><strong>Embedder:</strong> {embedName}</div>
          </div>
          
          <Button onClick={handleRunEval} disabled={isRunning || !activeProject?.id}>
            {isRunning ? `Running (${progress.current}/${progress.total})...` : 'Start Evaluation'}
          </Button>
          
          {!activeProject?.id && (
            <p className="text-destructive text-sm font-medium mt-2">
              Please create a project and upload docs/sample.md before running the evaluation.
            </p>
          )}
        </CardContent>
      </Card>

      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Metrics</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-muted rounded-lg text-center">
              <div className="text-2xl font-bold">{metrics.refusalAccuracy.toFixed(1)}%</div>
              <div className="text-xs text-muted-foreground mt-1">Refusal Accuracy (Correct Rejections)</div>
            </div>
            <div className="p-4 bg-muted rounded-lg text-center">
              <div className="text-2xl font-bold">{metrics.falseRefusalRate.toFixed(1)}%</div>
              <div className="text-xs text-muted-foreground mt-1">False Refusal Rate (Wrongly Rejected)</div>
            </div>
            <div className="p-4 bg-muted rounded-lg text-center">
              <div className="text-2xl font-bold">{metrics.verifierDropRate.toFixed(1)}%</div>
              <div className="text-xs text-muted-foreground mt-1">Verifier Drop Rate (Hallucinations)</div>
            </div>
            <div className="p-4 bg-muted rounded-lg text-center">
              <div className="text-2xl font-bold">{metrics.totalCitations}</div>
              <div className="text-xs text-muted-foreground mt-1">Total Citations</div>
            </div>
          </CardContent>
        </Card>
      )}

      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Results Log</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
              {results.map(r => (
                <div key={r.id} className="p-3 border border-border/50 rounded bg-muted/20 text-sm flex flex-col gap-1">
                  <div className="font-medium">{r.question}</div>
                  <div className="text-xs text-muted-foreground flex gap-4">
                    <span>Expected: {r.answerable ? 'Answer' : 'Refusal'}</span>
                    <span>Result: {r.wasRefused ? 'Refused' : 'Answered'}</span>
                    <span>Citations: {r.citationsCount}</span>
                    {r.sentencesDropped > 0 && <span className="text-destructive font-medium">Dropped: {r.sentencesDropped}</span>}
                    {r.error && <span className="text-destructive">Error: {r.error}</span>}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
