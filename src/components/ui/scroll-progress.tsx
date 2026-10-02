import { useEffect, useState } from 'react'

export function ScrollProgress() {
  const [scrollProgress, setScrollProgress] = useState(0)

  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight
      if (totalHeight <= 0) {
        setScrollProgress(0)
        return
      }
      const currentScroll = window.scrollY
      const progress = Math.min(Math.max((currentScroll / totalHeight) * 100, 0), 100)
      setScrollProgress(progress)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()

    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div
      className="fixed top-0 left-0 right-0 z-50 h-[2.5px] pointer-events-none bg-border/20 backdrop-blur-xs"
      aria-hidden
    >
      {/* Golden Sutra Thread Line */}
      <div
        className="h-full bg-gradient-to-r from-primary/50 via-primary to-amber-300 transition-all duration-150 ease-out relative"
        style={{ width: `${scrollProgress}%` }}
      >
        {/* Leading Golden Glow Bead */}
        {scrollProgress > 0 && (
          <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 h-2 w-2 rounded-full bg-amber-200 shadow-[0_0_10px_2px_rgba(200,148,46,0.8)] border border-primary animate-pulse" />
        )}
      </div>
    </div>
  )
}
