export interface StorageEstimateInfo {
  usageBytes: number
  quotaBytes: number
  usageFormatted: string
  quotaFormatted: string
  percentUsed: number
  usageDetails?: {
    caches?: number
    indexedDB?: number
    serviceWorkerRegistrations?: number
    other?: number
  }
}

export interface CacheDetails {
  name: string
  type: 'transformers' | 'webllm' | 'app-shell' | 'other'
  itemCount: number
  estimatedSizeBytes: number
  estimatedSizeFormatted: string
}

export interface IndexedDbInfo {
  name: string
  version: number
}

export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
}

export async function getStorageEstimate(): Promise<StorageEstimateInfo> {
  if ('storage' in navigator && 'estimate' in navigator.storage) {
    const estimate = await navigator.storage.estimate()
    const usageBytes = estimate.usage || 0
    const quotaBytes = estimate.quota || 0
    const percentUsed = quotaBytes > 0 ? (usageBytes / quotaBytes) * 100 : 0

    const details = (estimate as any).usageDetails

    return {
      usageBytes,
      quotaBytes,
      usageFormatted: formatBytes(usageBytes),
      quotaFormatted: formatBytes(quotaBytes),
      percentUsed: parseFloat(percentUsed.toFixed(1)),
      usageDetails: details
        ? {
            caches: details.caches || 0,
            indexedDB: details.indexedDB || 0,
            serviceWorkerRegistrations: details.serviceWorkerRegistrations || 0,
          }
        : undefined,
    }
  }

  return {
    usageBytes: 0,
    quotaBytes: 0,
    usageFormatted: 'Unknown',
    quotaFormatted: 'Unknown',
    percentUsed: 0,
  }
}

export async function getCacheStorageDetails(): Promise<CacheDetails[]> {
  if (!('caches' in window)) return []

  try {
    const keys = await caches.keys()
    const result: CacheDetails[] = []

    for (const key of keys) {
      let type: CacheDetails['type'] = 'other'
      if (key.toLowerCase().includes('transformers') || key.toLowerCase().includes('onnx') || key.toLowerCase().includes('huggingface')) {
        type = 'transformers'
      } else if (key.toLowerCase().includes('webllm') || key.toLowerCase().includes('tvm') || key.toLowerCase().includes('mlc')) {
        type = 'webllm'
      } else if (key.toLowerCase().includes('browser-rag') || key.toLowerCase().includes('v1')) {
        type = 'app-shell'
      }

      const cache = await caches.open(key)
      const requests = await cache.keys()
      let estimatedSize = 0

      // Compute total content size by reading Content-Length headers or calculating blob sizes
      for (const req of requests.slice(0, 50)) {
        try {
          const res = await cache.match(req)
          if (res) {
            const contentLength = res.headers.get('content-length')
            if (contentLength) {
              estimatedSize += parseInt(contentLength, 10)
            } else {
              const blob = await res.blob()
              estimatedSize += blob.size
            }
          }
        } catch {
          // Ignore individual fetch/match errors
        }
      }

      // If requests exceeded 50, scale estimate proportionally
      if (requests.length > 50) {
        estimatedSize = Math.round((estimatedSize / 50) * requests.length)
      }

      result.push({
        name: key,
        type,
        itemCount: requests.length,
        estimatedSizeBytes: estimatedSize,
        estimatedSizeFormatted: formatBytes(estimatedSize),
      })
    }

    return result.sort((a, b) => b.estimatedSizeBytes - a.estimatedSizeBytes)
  } catch (err) {
    console.error('Failed to inspect cache storage:', err)
    return []
  }
}

export async function getIndexedDbDetails(): Promise<IndexedDbInfo[]> {
  if (!('indexedDB' in window) || !('databases' in indexedDB)) {
    return []
  }

  try {
    const dbs = await indexedDB.databases()
    return dbs.map((db) => ({
      name: db.name || 'Unnamed DB',
      version: db.version || 1,
    }))
  } catch (err) {
    console.error('Failed to list IndexedDB databases:', err)
    return []
  }
}

export async function deleteCacheByName(cacheName: string): Promise<boolean> {
  if (!('caches' in window)) return false
  try {
    return await caches.delete(cacheName)
  } catch (err) {
    console.error(`Failed to delete cache ${cacheName}:`, err)
    return false
  }
}

export async function purgeAllModelCaches(): Promise<number> {
  if (!('caches' in window)) return 0

  let clearedCount = 0
  try {
    const keys = await caches.keys()
    for (const key of keys) {
      const lower = key.toLowerCase()
      if (
        lower.includes('transformers') ||
        lower.includes('onnx') ||
        lower.includes('webllm') ||
        lower.includes('tvm') ||
        lower.includes('huggingface') ||
        lower.includes('mlc')
      ) {
        const deleted = await caches.delete(key)
        if (deleted) clearedCount++
      }
    }
  } catch (err) {
    console.error('Failed to purge model caches:', err)
  }

  return clearedCount
}
