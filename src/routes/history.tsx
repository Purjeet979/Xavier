import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { getDb, isDbInitialized } from '@/db/client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent } from '@/components/ui/card'
import { History, Trash2, Search, Loader2 } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useSystemInit } from '@/context/system-init-context'
import { marked } from 'marked'

export const Route = createFileRoute('/history')({
  component: HistoryComponent,
})

function HistoryComponent() {
  const [dbReady, setDbReady] = useState(isDbInitialized())
  const navigate = useNavigate({ from: '/history' })
  const queryClient = useQueryClient()
  const { activeProject } = useSystemInit()

  useEffect(() => {
    if (dbReady) return
    const iv = setInterval(() => { if (isDbInitialized()) { setDbReady(true); clearInterval(iv) } }, 200)
    return () => clearInterval(iv)
  }, [dbReady])

  const { data: queryHistory = [], refetch, isLoading } = useQuery({
    queryKey: ['query-history-full', dbReady, activeProject?.id],
    queryFn: async () => {
      if (!dbReady || !activeProject) return []
      const db = getDb()
      const res = await db.query<any>(
        'SELECT * FROM query_history WHERE project_id = $1 ORDER BY created_at DESC LIMIT 100',
        [activeProject.id]
      )
      return res.rows
    },
    enabled: dbReady && !!activeProject,
  })

  const deleteItemMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!dbReady) throw new Error('Database not ready')
      const db = getDb()
      await db.query('DELETE FROM query_history WHERE id = $1', [id])
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['query-history-full'] })
    },
  })

  const handleClearHistory = async () => {
    if (!dbReady || !activeProject) return
    if (!confirm('Are you sure you want to clear the history for this project?')) return
    try {
      const db = getDb()
      await db.query('DELETE FROM query_history WHERE project_id = $1', [activeProject.id])
      refetch()
    } catch (err) {
      console.error('Failed to clear query history:', err)
    }
  }

  const handleDeleteItem = (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    if (!confirm('Delete this history item?')) return
    deleteItemMutation.mutate(id)
  }

  const handleOpenQuery = (id: string) => {
    navigate({ to: '/chat', search: { historyId: id } })
  }

  if (!dbReady || isLoading || !activeProject) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary/50" />
      </div>
    )
  }

  return (
    <div className="w-full space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">Study History</h1>
          <p className="text-muted-foreground text-xs mt-1">Review past questions, retrieved answers, and citations.</p>
        </div>
        {queryHistory.length > 0 && (
          <button
            type="button"
            onClick={handleClearHistory}
            className="flex items-center gap-2 px-3.5 py-2 bg-destructive/10 text-destructive hover:bg-destructive/20 rounded-xl text-xs font-medium transition-colors"
          >
            <Trash2 className="h-4 w-4" />
            Clear History
          </button>
        )}
      </div>

      {queryHistory.length === 0 ? (
        <Card className="border border-border bg-card rounded-2xl shadow-none">
          <CardContent className="flex flex-col items-center justify-center py-24 text-center page-enter">
            <div className="h-12 w-12 rounded-2xl bg-accent border border-primary/20 flex items-center justify-center text-primary mb-3">
              <History className="h-6 w-6" />
            </div>
            <p className="font-heading text-lg font-semibold text-foreground">No search history yet</p>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm">
              Your questions and study sessions will appear here as you query your materials.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="relative space-y-0 pl-0 sm:pl-6">
          <div className="hidden sm:block absolute left-[11px] top-3 bottom-3 w-px bg-border" aria-hidden />
          {queryHistory.map((item: any, index: number) => (
            <Card
              key={item.id}
              className="border border-border bg-card hover:border-primary/40 cursor-pointer transition-all group relative mb-2.5 rounded-xl page-enter shadow-none"
              style={{ animationDelay: `${Math.min(index, 8) * 40}ms` }}
              onClick={() => handleOpenQuery(item.id)}
            >
              <CardContent className="p-4 flex items-start gap-3">
                <div className="hidden sm:flex absolute -left-6 top-[15px] h-5 w-5 rounded-full bg-card border border-border items-center justify-center group-hover:border-primary/60 transition-colors">
                  <Search className="h-2.5 w-2.5 text-primary" />
                </div>
                <div className="sm:hidden h-8 w-8 rounded-xl bg-accent border border-primary/20 flex items-center justify-center shrink-0">
                  <Search className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-4">
                    <h3 className="font-heading font-medium text-foreground text-sm line-clamp-1 group-hover:text-primary transition-colors">
                      {item.query}
                    </h3>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] text-muted-foreground font-mono whitespace-nowrap">
                        {new Date(item.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })} at {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <button
                        type="button"
                        title="Delete this item"
                        onClick={(e) => handleDeleteItem(e, item.id)}
                        disabled={deleteItemMutation.isPending}
                        className="shrink-0 h-7 w-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all"
                      >
                        {deleteItemMutation.isPending && deleteItemMutation.variables === item.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                        ) : (
                          <Trash2 className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                  <div
                    className="text-xs text-muted-foreground mt-1 line-clamp-1 prose prose-sm dark:prose-invert max-w-none [&_p]:m-0"
                    dangerouslySetInnerHTML={{
                      __html: item.answer
                        ? (marked.parse(item.answer, { async: false }) as string)
                        : 'No answer generated'
                    }}
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
