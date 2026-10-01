import { useState, useEffect } from 'react'
import { WifiOff, Wifi } from 'lucide-react'

export function OfflineIndicator() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine)
  const [showRestored, setShowRestored] = useState(false)

  useEffect(() => {
    const handleOffline = () => {
      setIsOffline(true)
      setShowRestored(false)
    }

    const handleOnline = () => {
      setIsOffline(false)
      setShowRestored(true)
      const timer = setTimeout(() => {
        setShowRestored(false)
      }, 3000)
      return () => clearTimeout(timer)
    }

    window.addEventListener('offline', handleOffline)
    window.addEventListener('online', handleOnline)

    return () => {
      window.removeEventListener('offline', handleOffline)
      window.removeEventListener('online', handleOnline)
    }
  }, [])

  if (!isOffline && !showRestored) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-lg border bg-background/95 px-3 py-2 text-xs font-medium shadow-lg backdrop-blur backdrop-saturate-150 transition-all animate-in fade-in slide-in-from-bottom-2">
      {isOffline ? (
        <>
          <WifiOff className="h-4 w-4 text-amber-500 animate-pulse" />
          <span className="text-muted-foreground">
            Offline Mode Active — Running 100% locally
          </span>
        </>
      ) : (
        <>
          <Wifi className="h-4 w-4 text-emerald-500" />
          <span className="text-emerald-500">
            Connection Restored
          </span>
        </>
      )}
    </div>
  )
}
