import { useEffect, useState, useRef } from 'react'

interface TrailPoint {
  x: number
  y: number
  age: number
}

interface InkSpark {
  x: number
  y: number
  vx: number
  vy: number
  alpha: number
  size: number
}

interface InkBlossom {
  x: number
  y: number
  radius: number
  maxRadius: number
  alpha: number
}

export function CustomCursor() {
  const [enabled] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia('(hover: hover) and (pointer: fine)').matches
  })

  const [hoverLabel, setHoverLabel] = useState<string | null>(null)
  const [isClicking, setIsClicking] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  const [cursorMode, setCursorMode] = useState<'default' | 'interactive' | 'text'>('default')

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const stylusRef = useRef<HTMLDivElement>(null)

  const mousePos = useRef({ x: -100, y: -100 })
  const trail = useRef<TrailPoint[]>([])
  const sparks = useRef<InkSpark[]>([])
  const blossoms = useRef<InkBlossom[]>([])
  const lastMousePos = useRef({ x: -100, y: -100 })
  const rafId = useRef<number | null>(null)

  useEffect(() => {
    if (!enabled) return

    document.documentElement.classList.add('has-custom-cursor')

    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d', { alpha: true })
    if (!ctx) return

    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)

    const onMouseMove = (e: MouseEvent) => {
      mousePos.current = { x: e.clientX, y: e.clientY }
      if (!isVisible) setIsVisible(true)

      // Calculate movement speed for ink sparks
      const dx = e.clientX - lastMousePos.current.x
      const dy = e.clientY - lastMousePos.current.y
      const dist = Math.hypot(dx, dy)

      // Emit a tiny golden stardust ember on fast, expressive strokes
      if (dist > 18 && Math.random() < 0.6) {
        sparks.current.push({
          x: e.clientX - dx * 0.4,
          y: e.clientY - dy * 0.4,
          vx: (Math.random() - 0.5) * 1.5,
          vy: Math.random() * -1.8 - 0.4, // float softly upward
          alpha: 0.85,
          size: Math.random() * 2 + 1.2,
        })
      }
      lastMousePos.current = { x: e.clientX, y: e.clientY }

      // Update stylus DOM position immediately for 0ms lag
      if (stylusRef.current) {
        stylusRef.current.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`
      }

      // Contextual inspection of target
      const target = e.target as HTMLElement | null
      if (target) {
        const btn = target.closest('button, [role="button"]')
        const link = target.closest('a')
        const textInput = target.closest('input, textarea')
        const isReadingText = target.closest('p, blockquote, article, .reading-content')

        if (btn) {
          setCursorMode('interactive')
          setHoverLabel('सूत्र • Action')
        } else if (link) {
          setCursorMode('interactive')
          setHoverLabel('ज्ञान • Explore')
        } else if (textInput) {
          setCursorMode('text')
          setHoverLabel('लेख • Inscribe')
        } else if (isReadingText && !target.closest('button, a')) {
          setCursorMode('text')
          setHoverLabel(null)
        } else {
          setCursorMode('default')
          setHoverLabel(null)
        }
      }
    }

    const onMouseDown = (e: MouseEvent) => {
      setIsClicking(true)
      // Spawn tactile gold ink blossom
      blossoms.current.push({
        x: e.clientX,
        y: e.clientY,
        radius: 4,
        maxRadius: cursorMode === 'interactive' ? 32 : 24,
        alpha: 0.7,
      })
    }

    const onMouseUp = () => setIsClicking(false)
    const onMouseLeave = () => setIsVisible(false)
    const onMouseEnter = () => setIsVisible(true)

    // Render loop for the fluid Sutra filament ribbon & ink particles
    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      const mx = mousePos.current.x
      const my = mousePos.current.y

      // Add current mouse point to ribbon trail
      if (mx > 0 && my > 0) {
        trail.current.unshift({ x: mx, y: my, age: 0 })
      }

      // Max trail points (length of the trailing sutra cord)
      const maxTrail = cursorMode === 'interactive' ? 24 : 16
      if (trail.current.length > maxTrail) {
        trail.current.pop()
      }

      // Age points and remove dead ones
      for (let i = 0; i < trail.current.length; i++) {
        trail.current[i].age += 1
      }

      // Draw the Golden Sutra Filament Trail
      if (trail.current.length > 2) {
        for (let i = 0; i < trail.current.length - 1; i++) {
          const p1 = trail.current[i]
          const p2 = trail.current[i + 1]
          const ratio = 1 - i / trail.current.length

          ctx.beginPath()
          ctx.moveTo(p1.x, p1.y)

          // Smooth curved midpoint
          const midX = (p1.x + p2.x) / 2
          const midY = (p1.y + p2.y) / 2
          ctx.quadraticCurveTo(p1.x, p1.y, midX, midY)

          ctx.strokeStyle = `rgba(200, 148, 46, ${ratio * 0.75})`
          ctx.lineWidth = Math.max(ratio * 2.8, 0.4)
          ctx.lineCap = 'round'
          ctx.stroke()
        }

        // Draw glowing inner core line of the thread
        ctx.beginPath()
        ctx.moveTo(trail.current[0].x, trail.current[0].y)
        for (let i = 1; i < Math.min(trail.current.length - 1, 8); i++) {
          const p = trail.current[i]
          const next = trail.current[i + 1]
          ctx.quadraticCurveTo(p.x, p.y, (p.x + next.x) / 2, (p.y + next.y) / 2)
        }
        ctx.strokeStyle = 'rgba(255, 236, 179, 0.9)'
        ctx.lineWidth = 1.2
        ctx.stroke()
      }

      // Draw & Update Golden Stardust Sparks
      for (let i = sparks.current.length - 1; i >= 0; i--) {
        const s = sparks.current[i]
        s.x += s.vx
        s.y += s.vy
        s.alpha *= 0.93 // graceful fade
        s.size *= 0.97

        if (s.alpha <= 0.04) {
          sparks.current.splice(i, 1)
          continue
        }

        ctx.fillStyle = `rgba(224, 182, 84, ${s.alpha})`
        ctx.beginPath()
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2)
        ctx.fill()
      }

      // Draw & Update Tactile Ink Blossoms (on click)
      for (let i = blossoms.current.length - 1; i >= 0; i--) {
        const b = blossoms.current[i]
        b.radius += (b.maxRadius - b.radius) * 0.18
        b.alpha *= 0.88

        if (b.alpha <= 0.03) {
          blossoms.current.splice(i, 1)
          continue
        }

        const gradient = ctx.createRadialGradient(b.x, b.y, b.radius * 0.2, b.x, b.y, b.radius)
        gradient.addColorStop(0, `rgba(200, 148, 46, ${b.alpha * 0.6})`)
        gradient.addColorStop(0.6, `rgba(200, 148, 46, ${b.alpha * 0.25})`)
        gradient.addColorStop(1, 'rgba(200, 148, 46, 0)')

        ctx.fillStyle = gradient
        ctx.beginPath()
        ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2)
        ctx.fill()

        // Delicate outer ink ring
        ctx.strokeStyle = `rgba(200, 148, 46, ${b.alpha * 0.8})`
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2)
        ctx.stroke()
      }

      rafId.current = requestAnimationFrame(render)
    }

    window.addEventListener('mousemove', onMouseMove, { passive: true })
    window.addEventListener('mousedown', onMouseDown)
    window.addEventListener('mouseup', onMouseUp)
    document.addEventListener('mouseleave', onMouseLeave)
    document.addEventListener('mouseenter', onMouseEnter)
    rafId.current = requestAnimationFrame(render)

    return () => {
      document.documentElement.classList.remove('has-custom-cursor')
      window.removeEventListener('resize', resizeCanvas)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mousedown', onMouseDown)
      window.removeEventListener('mouseup', onMouseUp)
      document.removeEventListener('mouseleave', onMouseLeave)
      document.removeEventListener('mouseenter', onMouseEnter)
      if (rafId.current) cancelAnimationFrame(rafId.current)
    }
  }, [enabled, isVisible, cursorMode])

  if (!enabled) return null

  return (
    <div
      className={`pointer-events-none fixed inset-0 z-[10000] overflow-hidden transition-opacity duration-300 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
      aria-hidden
    >
      {/* ── 1. Living Sutra Filament Canvas (Behind the Stylus) ──────────────── */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none"
      />

      {/* ── 2. The Artisan Scholar's Nib Stylus (विद्वत् लेखनी) ──────────────── */}
      <div
        ref={stylusRef}
        style={{ willChange: 'transform' }}
        className="fixed top-0 left-0 pointer-events-none select-none transition-transform duration-75 ease-out"
      >
        <div
          className={`relative transition-all duration-200 ${
            isClicking ? 'scale-90 translate-x-0.5 translate-y-0.5' : 'scale-100'
          }`}
        >
          {cursorMode === 'text' ? (
            /* Scholarly Inscription Caliper for Reading / Text */
            <div className="-ml-1.5 -mt-3.5 flex flex-col items-center">
              <span className="h-1 w-2.5 rounded-full bg-primary/70 shadow-xs" />
              <span className="h-5 w-[1.5px] bg-gradient-to-b from-primary via-amber-300 to-primary shadow-[0_0_6px_rgba(200,148,46,0.8)]" />
              <span className="h-1 w-2.5 rounded-full bg-primary/70 shadow-xs" />
            </div>
          ) : (
            /* Bespoke Gilded Manuscript Fountain Nib (Stylus) */
            <div className="-ml-1 -mt-1 origin-top-left transition-transform duration-200">
              <svg
                width="28"
                height="32"
                viewBox="0 0 28 32"
                fill="none"
                className={`transition-transform duration-200 drop-shadow-[0_2px_8px_rgba(0,0,0,0.18)] ${
                  cursorMode === 'interactive' ? 'scale-115 -rotate-6' : 'scale-100'
                }`}
              >
                <defs>
                  {/* Polished Brass/Gold Metallic Gradient */}
                  <linearGradient id="nibGold" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#FFF1C2" />
                    <stop offset="35%" stopColor="#D4A64A" />
                    <stop offset="75%" stopColor="#B37D20" />
                    <stop offset="100%" stopColor="#7A5210" />
                  </linearGradient>

                  {/* Steel/Tungsten Core Collar */}
                  <linearGradient id="nibSteel" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#4A453C" />
                    <stop offset="100%" stopColor="#221F1A" />
                  </linearGradient>

                  {/* Golden Nib Glow */}
                  <filter id="goldenAura" x="-50%" y="-50%" width="200%" height="200%">
                    <feDropShadow dx="0" dy="0" stdDeviation="1.5" floodColor="#E6BF65" floodOpacity="0.8" />
                  </filter>
                </defs>

                {/* Nib Shaft Collar */}
                <path
                  d="M12 16 L22 26 L26 22 L16 12 Z"
                  fill="url(#nibSteel)"
                  stroke="#5A5243"
                  strokeWidth="0.6"
                />

                {/* Handcrafted Golden Nib Body */}
                <path
                  d="M0 0 L10 4 L14 14 L4 10 Z"
                  fill="url(#nibGold)"
                  stroke="#8A5E12"
                  strokeWidth="0.7"
                  filter="url(#goldenAura)"
                />

                {/* Calligraphy Slit (Center Ink Channel) */}
                <line
                  x1="0.5"
                  y1="0.5"
                  x2="8"
                  y2="8"
                  stroke="#3A2805"
                  strokeWidth="0.8"
                  strokeLinecap="round"
                />

                {/* Breather Hole */}
                <circle cx="8" cy="8" r="1.3" fill="#221804" stroke="#D4A64A" strokeWidth="0.4" />

                {/* Micro Liquid Gold Ink Tip Droplet at (0, 0) */}
                <circle
                  cx="0.5"
                  cy="0.5"
                  r={cursorMode === 'interactive' ? '2.4' : '1.6'}
                  fill="#FFF7D6"
                  className="animate-pulse"
                />
              </svg>
            </div>
          )}

          {/* ── 3. Academic Devanagari Context Label ────────────────────────── */}
          {hoverLabel && (
            <div className="absolute left-6 top-3 px-2 py-0.5 rounded-full border border-primary/40 bg-card/95 backdrop-blur-md shadow-lg flex items-center gap-1.5 whitespace-nowrap animate-in fade-in zoom-in-95 duration-150">
              <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
              <span className="font-mono text-[10px] text-foreground font-semibold tracking-wide">
                {hoverLabel}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
