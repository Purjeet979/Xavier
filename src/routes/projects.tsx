import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  FolderOpen,
  Plus,
  Trash2,
  CheckCircle2,
  Layers,
  Calendar,
  FileText,
  X,
  Sparkles,
} from 'lucide-react'
import { EMBEDDING_MODELS } from '@/rag/embedding-models'
import {
  listProjects,
  createProject,
  deleteProject,
  getProjectDocumentCount,
  type Project,
} from '@/lib/projects'
import { useSystemInit } from '@/context/system-init-context'
import { isDbInitialized } from '@/db/client'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/projects')({
  component: ProjectsComponent,
})

interface CreateDialogProps {
  onClose: () => void
  onCreated: (project: Project) => void
}

function CreateProjectDialog({ onClose, onCreated }: CreateDialogProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [embeddingModelId, setEmbeddingModelId] = useState(EMBEDDING_MODELS[0].id)
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    setIsCreating(true)
    setError(null)
    try {
      const project = await createProject(name.trim(), description.trim(), embeddingModelId)
      onCreated(project)
    } catch (err: any) {
      setError(err.message || 'Failed to create project')
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4'>
      <Card className='w-full max-w-md max-h-[90vh] overflow-y-auto bg-card border border-border rounded-2xl shadow-xl page-enter'>
        <CardHeader className='pb-4 pt-6'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-2'>
              <div className='p-2 bg-accent rounded-xl text-primary border border-primary/20'>
                <FolderOpen className='h-4 w-4' />
              </div>
              <CardTitle className='text-base font-heading font-semibold'>New Workspace</CardTitle>
            </div>
            <Button
              variant='ghost'
              size='icon'
              onClick={onClose}
              className='h-8 w-8 rounded-xl text-muted-foreground hover:bg-secondary hover:text-foreground'
            >
              <X className='h-4 w-4' />
            </Button>
          </div>
          <CardDescription className='text-xs mt-1'>
            Choose an embedding model carefully — it cannot be changed after creation.
          </CardDescription>
        </CardHeader>
        <CardContent className='pb-6'>
          <form onSubmit={handleSubmit} className='space-y-4'>
            {error && (
              <div className='p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs'>
                {error}
              </div>
            )}
            <div className='space-y-1.5'>
              <label className='text-xs font-semibold text-muted-foreground'>
                Workspace Name <span className='text-destructive'>*</span>
              </label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder='e.g. Distributed Systems, Biology 101'
                className='text-sm'
                autoFocus
              />
            </div>
            <div className='space-y-1.5'>
              <label className='text-xs font-semibold text-muted-foreground'>
                Description <span className='text-muted-foreground/60'>(optional)</span>
              </label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder='Brief description of this study workspace'
                className='text-sm'
              />
            </div>
            <div className='space-y-2'>
              <label className='text-xs font-semibold text-muted-foreground flex items-center gap-1.5'>
                <Layers className='h-3.5 w-3.5 text-primary' />
                Embedding Model <span className='text-destructive'>*</span>
              </label>
              <div className='grid gap-2'>
                {EMBEDDING_MODELS.map((model) => (
                  <div
                    key={model.id}
                    onClick={() => setEmbeddingModelId(model.id)}
                    className={cn(
                      'p-3 rounded-xl border cursor-pointer transition-all duration-150',
                      embeddingModelId === model.id
                        ? 'border-primary bg-accent/60'
                        : 'border-border bg-card hover:bg-secondary/50'
                    )}
                  >
                    <div className='flex items-center justify-between'>
                      <div>
                        <p className='text-xs font-semibold text-foreground'>{model.displayName}</p>
                        <p className='text-[10px] text-muted-foreground mt-0.5'>
                          {model.modelId} · {model.dimensions} dimensions · {model.browserSupport}
                        </p>
                      </div>
                      {embeddingModelId === model.id && (
                        <CheckCircle2 className='h-4 w-4 text-primary shrink-0' />
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <p className='text-xs text-warning flex items-start gap-1.5 mt-1'>
                <span className='font-bold shrink-0'>⚠</span>
                This model is locked after creation. All documents in this workspace will be embedded with it.
              </p>
            </div>
            <div className='flex gap-2 pt-2'>
              <Button type='button' variant='outline' onClick={onClose} className='flex-1 text-xs'>
                Cancel
              </Button>
              <Button
                type='submit'
                disabled={!name.trim() || isCreating}
                className='flex-1 text-xs'
              >
                {isCreating ? (
                  <span className='flex items-center gap-2'>
                    <Sparkles className='h-3.5 w-3.5 animate-pulse' />
                    Creating...
                  </span>
                ) : (
                  <span className='flex items-center gap-2'>
                    <Plus className='h-3.5 w-3.5' />
                    Create Workspace
                  </span>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

function ProjectsComponent() {
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const queryClient = useQueryClient()
  const { activeProject, setActiveProject } = useSystemInit()
  const dbReady = isDbInitialized()

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['projects', dbReady],
    queryFn: listProjects,
    enabled: dbReady,
  })

  const { data: docCounts = {} } = useQuery({
    queryKey: ['project-doc-counts', projects.map((p) => p.id).join(',')],
    queryFn: async () => {
      const counts: Record<string, number> = {}
      await Promise.all(
        projects.map(async (p) => {
          counts[p.id] = await getProjectDocumentCount(p.id)
        })
      )
      return counts
    },
    enabled: projects.length > 0,
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await deleteProject(id)
    },
    onSuccess: (_, deletedId) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      if (activeProject?.id === deletedId) {
        // Will auto-resolve via context effect if all projects deleted
      }
    },
  })

  const handleSelectProject = (project: Project) => {
    setActiveProject(project)
  }

  const handleDelete = async (project: Project) => {
    if (!confirm(`Delete project "${project.name}"? All its documents and chunks will be permanently removed.`)) {
      return
    }
    setDeletingId(project.id)
    try {
      await deleteMutation.mutateAsync(project.id)
    } finally {
      setDeletingId(null)
    }
  }

  const handleCreated = (project: Project) => {
    setShowCreateDialog(false)
    queryClient.invalidateQueries({ queryKey: ['projects'] })
    setActiveProject(project)
  }

  const getModelLabel = (modelId: string) => {
    return EMBEDDING_MODELS.find((m) => m.id === modelId)?.displayName ?? modelId
  }

  return (
    <>
      {showCreateDialog && (
        <CreateProjectDialog
          onClose={() => setShowCreateDialog(false)}
          onCreated={handleCreated}
        />
      )}

      <div className='space-y-6 max-w-4xl mx-auto w-full'>
        <div className='flex items-center justify-between gap-4'>
          <div>
            <h1 className='font-heading text-2xl font-semibold tracking-tight'>Study Workspaces</h1>
            <p className='text-muted-foreground text-xs mt-1'>
              Each workspace isolates a subject or collection of study materials with a locked embedding model.
            </p>
          </div>
          <Button
            onClick={() => setShowCreateDialog(true)}
            className='shrink-0 flex items-center gap-2'
          >
            <Plus className='h-4 w-4' />
            New Workspace
          </Button>
        </div>

        {isLoading ? (
          <div className='h-48 flex items-center justify-center text-muted-foreground text-xs'>
            Loading workspaces...
          </div>
        ) : projects.length === 0 ? (
          <Card className='bg-card border border-border rounded-2xl overflow-hidden shadow-none'>
            <CardContent className='flex flex-col items-center justify-center py-16 gap-4 text-center page-enter'>
              <div className='p-4 bg-accent rounded-2xl text-primary border border-primary/20'>
                <FolderOpen className='h-8 w-8' />
              </div>
              <div className='space-y-1'>
                <p className='font-heading font-semibold text-lg text-foreground'>No workspaces yet</p>
                <p className='text-xs text-muted-foreground max-w-xs'>
                  Create your first study workspace to start indexing and querying your notes and textbooks.
                </p>
              </div>
              <Button
                onClick={() => setShowCreateDialog(true)}
                className='flex items-center gap-2 mt-2'
              >
                <Plus className='h-4 w-4' />
                Create First Workspace
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className='grid gap-3'>
            {projects.map((project) => {
              const isActive = activeProject?.id === project.id
              const docCount = docCounts[project.id] ?? 0
              const isDeleting = deletingId === project.id
              return (
                <Card
                  key={project.id}
                  className={cn(
                    'relative overflow-hidden rounded-2xl transition-all duration-150 cursor-pointer group shadow-none border',
                    isActive
                      ? 'border-primary/50 bg-accent/30'
                      : 'border-border bg-card hover:border-primary/40'
                  )}
                  onClick={() => handleSelectProject(project)}
                >
                  <CardContent className='p-5'>
                    <div className='flex items-start justify-between gap-4'>
                      <div className='flex items-start gap-3.5 flex-1 min-w-0'>
                        <div
                          className={cn(
                            'p-2.5 rounded-xl shrink-0 mt-0.5 transition-colors border',
                            isActive
                              ? 'bg-accent text-primary border-primary/25'
                              : 'bg-secondary text-muted-foreground border-border group-hover:text-foreground'
                          )}
                        >
                          <FolderOpen className='h-4 w-4' />
                        </div>
                        <div className='flex-1 min-w-0'>
                          <div className='flex items-center gap-2 flex-wrap'>
                            <h3 className='font-heading font-semibold text-base text-foreground truncate'>
                              {project.name}
                            </h3>
                            {isActive && (
                              <span className='inline-flex items-center gap-1.5 text-xs bg-primary/10 text-primary border border-primary/20 px-2.5 py-0.5 rounded-full font-medium shrink-0'>
                                <CheckCircle2 className='h-3 w-3' />
                                Active Workspace
                              </span>
                            )}
                          </div>
                          {project.description && (
                            <p className='text-xs text-muted-foreground mt-1 line-clamp-1'>
                              {project.description}
                            </p>
                          )}
                          <div className='flex flex-wrap items-center gap-3 mt-2.5'>
                            <span className='inline-flex items-center gap-1 text-xs font-medium bg-secondary text-muted-foreground border border-border px-2.5 py-0.5 rounded-full'>
                              <Layers className='h-3 w-3 text-primary/70' />
                              {getModelLabel(project.embeddingModelId)}
                            </span>
                            <span className='inline-flex items-center gap-1 text-xs text-muted-foreground'>
                              <FileText className='h-3.5 w-3.5' />
                              {docCount} {docCount === 1 ? 'document' : 'documents'}
                            </span>
                            <span className='inline-flex items-center gap-1 text-xs text-muted-foreground'>
                              <Calendar className='h-3.5 w-3.5' />
                              {new Date(project.createdAt).toLocaleDateString([], {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })}
                            </span>
                          </div>
                        </div>
                      </div>
                      <Button
                        variant='ghost'
                        size='icon'
                        disabled={isDeleting}
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDelete(project)
                        }}
                        className='h-8 w-8 shrink-0 hover:text-destructive text-muted-foreground hover:bg-destructive/10 rounded-xl md:opacity-0 md:group-hover:opacity-100 opacity-100 transition-opacity'
                        title='Delete workspace'
                      >
                        <Trash2 className='h-4 w-4' />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </>
  )
}
