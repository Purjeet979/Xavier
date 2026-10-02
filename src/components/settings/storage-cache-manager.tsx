import { useState, useEffect, useCallback } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { HardDrive, Trash2, RefreshCw, Layers, Database, CheckCircle2, ShieldAlert, Box } from 'lucide-react'
import {
  getStorageEstimate,
  getCacheStorageDetails,
  getIndexedDbDetails,
  deleteCacheByName,
  purgeAllModelCaches,
  formatBytes,
  type StorageEstimateInfo,
  type CacheDetails,
  type IndexedDbInfo,
} from '@/lib/storage-inspector'

export function StorageCacheManager() {
  const [estimate, setEstimate] = useState<StorageEstimateInfo | null>(null)
  const [cachesList, setCachesList] = useState<CacheDetails[]>([])
  const [dbsList, setDbsList] = useState<IndexedDbInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [actionSuccess, setActionSuccess] = useState<string | null>(null)
  const [clearingKey, setClearingKey] = useState<string | null>(null)
  const [purgingAll, setPurgingAll] = useState(false)

  const refreshStorageInfo = useCallback(async () => {
    setLoading(true)
    try {
      const [est, cachesInfo, dbsInfo] = await Promise.all([
        getStorageEstimate(),
        getCacheStorageDetails(),
        getIndexedDbDetails(),
      ])
      setEstimate(est)
      setCachesList(cachesInfo)
      setDbsList(dbsInfo)
    } catch (err) {
      console.error('Failed to load storage info:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refreshStorageInfo()
  }, [refreshStorageInfo])

  const handleClearSingleCache = async (cacheName: string) => {
    setClearingKey(cacheName)
    try {
      const success = await deleteCacheByName(cacheName)
      if (success) {
        setActionSuccess(`Cleared cache "${cacheName}"`)
        setTimeout(() => setActionSuccess(null), 3000)
        await refreshStorageInfo()
      }
    } finally {
      setClearingKey(null)
    }
  }

  const handlePurgeAllModels = async () => {
    if (!window.confirm('Are you sure you want to clear all cached model weights? Local models will need to be downloaded again on next use.')) {
      return
    }
    setPurgingAll(true)
    try {
      const count = await purgeAllModelCaches()
      setActionSuccess(`Successfully purged ${count} model weight cache(s)`)
      setTimeout(() => setActionSuccess(null), 4000)
      await refreshStorageInfo()
    } finally {
      setPurgingAll(false)
    }
  }

  const getTypeBadge = (type: CacheDetails['type']) => {
    switch (type) {
      case 'transformers':
        return <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">Embedding Model</span>
      case 'webllm':
        return <span className="inline-flex items-center rounded-md bg-accent text-accent-foreground border border-primary/20 px-2 py-0.5 text-xs font-medium">WebLLM Weights</span>
      case 'app-shell':
        return <span className="inline-flex items-center rounded-md bg-secondary text-secondary-foreground border border-border px-2 py-0.5 text-xs font-medium">App Offline Shell</span>
      default:
        return <span className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">Cache</span>
    }
  }

  return (
    <Card className="border-border shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <HardDrive className="h-5 w-5 text-primary" />
            Storage & Model Weight Cache Manager
          </CardTitle>
          <CardDescription className="mt-1">
            Monitor browser storage quota, inspect cached local AI models, and safely clear weights to free up disk space.
          </CardDescription>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={refreshStorageInfo}
          disabled={loading}
          className="gap-1.5"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </CardHeader>

      <CardContent className="space-y-6">
        {actionSuccess && (
          <div className="flex items-center gap-2 rounded-md bg-emerald-500/10 border border-emerald-500/20 p-3 text-xs font-medium text-emerald-600 dark:text-emerald-400 animate-in fade-in">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            {actionSuccess}
          </div>
        )}

        {/* Quota Progress */}
        {estimate && (
          <div className="space-y-3 rounded-lg border bg-muted/30 p-4">
            <div className="flex items-center justify-between text-xs font-medium">
              <span className="flex items-center gap-1.5 text-foreground font-semibold">
                <Box className="h-4 w-4 text-primary" />
                Browser Origin Storage Quota
              </span>
              <span className="text-muted-foreground font-mono">
                {estimate.usageFormatted} used of {estimate.quotaFormatted} max quota ({estimate.percentUsed}%)
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full bg-primary transition-all duration-500"
                style={{ width: `${Math.max(1, Math.min(100, estimate.percentUsed))}%` }}
              />
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[11px] text-muted-foreground border-t border-border/40">
              <span>
                <strong>13.2 GB Quota</strong> is the maximum disk space your browser dynamically allocates to this site based on available computer storage.
              </span>
              {estimate.usageDetails && (
                <div className="flex items-center gap-2 font-mono text-[10px]">
                  {estimate.usageDetails.caches !== undefined && (
                    <span className="bg-background px-2 py-0.5 rounded border">
                      Caches: {formatBytes(estimate.usageDetails.caches)}
                    </span>
                  )}
                  {estimate.usageDetails.indexedDB !== undefined && (
                    <span className="bg-background px-2 py-0.5 rounded border">
                      IndexedDB: {formatBytes(estimate.usageDetails.indexedDB)}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Cache Storage Breakdown */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium flex items-center gap-1.5">
              <Layers className="h-4 w-4 text-muted-foreground" />
              CacheStorage Breakdown ({cachesList.length})
            </h4>
            {cachesList.some((c) => c.type === 'transformers' || c.type === 'webllm') && (
              <Button
                variant="destructive"
                size="sm"
                onClick={handlePurgeAllModels}
                disabled={purgingAll || loading}
                className="gap-1.5 text-xs h-8"
              >
                <Trash2 className="h-3.5 w-3.5" />
                {purgingAll ? 'Purging Models...' : 'Purge All Model Weights'}
              </Button>
            )}
          </div>

          {cachesList.length === 0 ? (
            <div className="rounded-md border border-dashed p-6 text-center text-xs text-muted-foreground">
              No active CacheStorage entries detected. Local models will download on first usage.
            </div>
          ) : (
            <div className="divide-y rounded-md border text-xs">
              {cachesList.map((item) => (
                <div key={item.name} className="flex items-center justify-between p-3 hover:bg-muted/40 transition-colors">
                  <div className="space-y-1 min-w-0 pr-4">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-medium truncate max-w-xs md:max-w-md">{item.name}</span>
                      {getTypeBadge(item.type)}
                    </div>
                    <div className="flex items-center gap-3 text-muted-foreground text-[11px]">
                      <span>{item.itemCount} file(s)</span>
                      <span>•</span>
                      <span>Approx. {item.estimatedSizeFormatted}</span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleClearSingleCache(item.name)}
                    disabled={clearingKey === item.name || purgingAll}
                    className="h-8 text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0"
                  >
                    {clearingKey === item.name ? (
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="h-3.5 w-3.5" />
                    )}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* IndexedDB Database Overview */}
        <div className="space-y-3 pt-2">
          <h4 className="text-sm font-medium flex items-center gap-1.5">
            <Database className="h-4 w-4 text-muted-foreground" />
            IndexedDB Local Databases ({dbsList.length})
          </h4>
          <div className="grid gap-2 grid-cols-1 sm:grid-cols-2">
            {dbsList.map((db) => (
              <div key={db.name} className="flex items-center justify-between rounded-md border p-3 text-xs bg-card">
                <div className="flex items-center gap-2 min-w-0">
                  <Database className="h-4 w-4 text-emerald-500 shrink-0" />
                  <span className="font-mono truncate">{db.name}</span>
                </div>
                <span className="text-[11px] text-muted-foreground shrink-0 pl-2">v{db.version}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Privacy Note */}
        <div className="flex items-start gap-2.5 rounded-lg border bg-amber-500/5 p-3 text-xs text-amber-600 dark:text-amber-400">
          <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
          <span>
            Clearing model weight caches frees up browser storage. Your vector database, project documents, and chat history remain safe in IndexedDB.
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
