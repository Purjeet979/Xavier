import { useEffect, useState, useRef, useCallback } from 'react'

interface LandingEntryAnimationProps {
  onComplete: () => void
}

export function LandingEntryAnimation({ onComplete }: LandingEntryAnimationProps) {
  // Stages:
  // 0: Initial closed book (0.0s - 0.7s)
  // 1: Book opens, light emerges (0.7s - 1.8s)
  // 2: Knowledge particles & Sutra thread emerge (1.8s - 2.8s)
  // 3: Brand "ज्ञानसूत्र" / "Gyansutra" reveals (2.8s - 3.8s)
  // 4: Seamless transition to landing page (3.8s - 4.4s)
  // 5: Complete & unmounted
  const [stage, setStage] = useState<0 | 1 | 2 | 3 | 4 | 5>(0)
  const [showSkip, setShowSkip] = useState(false)
  const [isFadingOut, setIsFadingOut] = useState(false)
  const timerRefs = useRef<NodeJS.Timeout[]>([])

  const finish = useCallback(() => {
    setIsFadingOut(true)
    const t = setTimeout(() => {
      onComplete()
    }, 400)
    timerRefs.current.push(t)
  }, [onComplete])

  useEffect(() => {
    // Keyboard shortcut to skip (Escape or Space)
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === ' ' || e.key === 'Enter') {
        finish()
      }
    }
    window.addEventListener('keydown', handleKeyDown)

    // Sequence schedule
    const t0 = setTimeout(() => setShowSkip(true), 500)
    const t1 = setTimeout(() => setStage(1), 600)
    const t2 = setTimeout(() => setStage(2), 1600)
    const t3 = setTimeout(() => setStage(3), 2600)
    const t4 = setTimeout(() => {
      setStage(4)
      setIsFadingOut(true)
    }, 3800)
    const t5 = setTimeout(() => {
      onComplete()
    }, 4300)

    const activeTimers = [t0, t1, t2, t3, t4, t5]
    timerRefs.current.push(...activeTimers)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      activeTimers.forEach(clearTimeout)
    }
  }, [onComplete, finish])

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden bg-background text-foreground transition-all duration-700 ease-out select-none ${
        isFadingOut ? 'opacity-0 pointer-events-none scale-105' : 'opacity-100'
      }`}
      style={{
        background: 'radial-gradient(ellipse at center, var(--card) 0%, var(--background) 75%)',
      }}
      aria-label="Gyansutra introduction animation"
      role="dialog"
      aria-modal="true"
    >
      {/* Background Subtle Paper Texture */}
      <div className="absolute inset-0 subtle-paper-grain pointer-events-none opacity-40" />

      {/* Ambient Warm Golden Illumination Core */}
      <div
        className={`absolute w-[40rem] h-[40rem] rounded-full pointer-events-none blur-3xl transition-all duration-1000 ${
          stage >= 1 ? 'opacity-40 scale-125' : 'opacity-15 scale-90'
        }`}
        style={{
          background: 'radial-gradient(circle, rgba(200, 148, 46, 0.45) 0%, rgba(200, 148, 46, 0.05) 60%, transparent 80%)',
        }}
        aria-hidden
      />

      {/* Skip Button */}
      {showSkip && !isFadingOut && (
        <button
          onClick={finish}
          className="absolute top-6 right-6 z-50 px-3.5 py-1.5 rounded-full border border-border/80 bg-card/80 backdrop-blur-md text-xs font-mono text-muted-foreground hover:text-foreground hover:border-primary/40 transition-all duration-200 cursor-pointer shadow-xs flex items-center gap-1.5"
          aria-label="Skip introduction animation"
        >
          <span>Skip</span>
          <span className="text-[10px] text-muted-foreground/60">Esc</span>
        </button>
      )}

      {/* Main Animated Stage Container */}
      <div className="relative flex flex-col items-center justify-center max-w-xl w-full px-6">
        {/* ── STAGE 3: Brand Reveal — Emerges Above the Open Book ─────────── */}
        <div
          className={`flex flex-col items-center text-center transition-all duration-700 ease-out mb-8 ${
            stage >= 3
              ? 'opacity-100 translate-y-0 scale-100'
              : 'opacity-0 translate-y-8 scale-95 pointer-events-none'
          }`}
        >
          {/* Sacred Sutra Thread Motif */}
          <div className="flex items-center gap-2 mb-2">
            <span className="h-px w-8 bg-gradient-to-r from-transparent to-primary" />
            <span className="h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_8px_rgba(200,148,46,0.8)]" />
            <span className="h-px w-8 bg-gradient-to-l from-transparent to-primary" />
          </div>

          {/* Sanskrit Devanagari Wordmark */}
          <h1 className="font-serif text-5xl sm:text-6xl font-bold tracking-tight text-foreground drop-shadow-xs">
            ज्ञान<span className="text-primary font-normal italic">सूत्र</span>
          </h1>

          {/* Latin Brand & Editorial Subtitle */}
          <div className="mt-2 flex flex-col items-center space-y-1">
            <p className="font-heading text-lg sm:text-xl font-semibold tracking-wider uppercase text-foreground/90">
              Gyansutra
            </p>
            <p className="text-xs sm:text-sm font-serif italic text-muted-foreground tracking-wide">
              Turn Your Study Material Into Grounded Knowledge
            </p>
          </div>
        </div>

        {/* ── STAGES 0 - 2: Physical Study Book ────────────────────────────── */}
        <div
          className="relative w-72 sm:w-84 h-48 sm:h-56 transition-transform duration-700 ease-out"
          style={{
            perspective: '1200px',
            transform: stage >= 3 ? 'translateY(8px) scale(0.92)' : 'translateY(0) scale(1)',
          }}
        >
          {/* Book Shadow */}
          <div
            className={`absolute -bottom-6 left-6 right-6 h-8 rounded-full bg-black/25 blur-xl transition-all duration-700 ${
              stage >= 1 ? 'scale-x-125 opacity-40' : 'scale-x-100 opacity-25'
            }`}
          />

          {/* The Physical Book Structure */}
          <div className="relative w-full h-full flex items-center justify-center">
            {/* Book Spine (Backbone) */}
            <div
              className={`absolute w-3.5 h-full rounded-sm bg-[#1E1C18] border-y border-[#3A352B] shadow-inner transition-all duration-500 z-10 ${
                stage >= 1 ? 'scale-x-75' : 'scale-x-100'
              }`}
            />

            {/* Left Page Leaf (Stationary / Base) */}
            <div
              className={`absolute left-0 w-1/2 h-full rounded-l-md border border-border bg-[#FBF9F2] dark:bg-[#1E1C18] p-4 flex flex-col justify-between shadow-md transition-all duration-700 origin-right ${
                stage >= 1 ? 'opacity-100' : 'opacity-0 scale-95'
              }`}
              style={{
                boxShadow: 'inset -8px 0 16px -6px rgba(0,0,0,0.15)',
              }}
            >
              {/* Printed Sanskrit Manuscript Lines */}
              <div className="space-y-2 pt-2">
                <div className="h-1.5 w-12 rounded-full bg-primary/40" />
                <div className="h-1 w-full rounded-full bg-border/80" />
                <div className="h-1 w-5/6 rounded-full bg-border/80" />
                <div className="h-1 w-4/5 rounded-full bg-border/80" />
                <div className="h-1 w-full rounded-full bg-border/60" />
              </div>
              <div className="text-[9px] font-mono text-muted-foreground/60 flex justify-between">
                <span>स्वाध्याय</span>
                <span>p. 01</span>
              </div>
            </div>

            {/* Right Page Leaf (Fanning Open) */}
            <div
              className={`absolute right-0 w-1/2 h-full rounded-r-md border border-border bg-[#FFFDF7] dark:bg-[#211F19] p-4 flex flex-col justify-between shadow-md transition-all duration-700 origin-left ${
                stage >= 1 ? 'opacity-100' : 'opacity-0 scale-95'
              }`}
              style={{
                boxShadow: 'inset 8px 0 16px -6px rgba(0,0,0,0.15)',
              }}
            >
              {/* Scholarly Margin & Grounding Lines */}
              <div className="space-y-2 pt-2">
                <div className="h-1.5 w-16 rounded-full bg-primary/30" />
                <div className="h-1 w-full rounded-full bg-border/80" />
                <div className="h-1 w-3/4 rounded-full bg-border/80" />
                <div className="h-1 w-5/6 rounded-full bg-border/80" />
                <div className="h-1 w-2/3 rounded-full bg-primary/20" />
              </div>
              <div className="text-[9px] font-mono text-muted-foreground/60 flex justify-between">
                <span>ज्ञानसूत्र</span>
                <span>p. 02</span>
              </div>
            </div>

            {/* Front Cover that Flips Open */}
            <div
              className="absolute right-0 w-1/2 h-full rounded-r-md bg-[#25231F] dark:bg-[#151410] border border-[#3A352B] p-4 flex flex-col justify-between shadow-xl origin-left transition-transform duration-1000 ease-[cubic-bezier(0.25,1,0.5,1)] z-20"
              style={{
                transformStyle: 'preserve-3d',
                transform: stage >= 1 ? 'rotateY(-175deg)' : 'rotateY(0deg)',
              }}
            >
              {/* Embossed Gold Foliage on Front Cover */}
              <div className="border border-primary/40 rounded-sm h-full p-3 flex flex-col items-center justify-between text-center select-none">
                <div className="h-1 w-6 bg-primary/40 rounded-full" />
                <div>
                  <div className="font-serif text-lg font-bold text-primary tracking-wide">
                    ज्ञानसूत्र
                  </div>
                  <div className="text-[8px] font-mono uppercase tracking-widest text-[#AAA497] mt-0.5">
                    Study Ground
                  </div>
                </div>
                <div className="h-1 w-6 bg-primary/40 rounded-full" />
              </div>
            </div>

            {/* Glowing Golden Gutter Light (Emerges from center crease) */}
            <div
              className={`absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-4 transition-all duration-700 pointer-events-none z-15 ${
                stage >= 1 ? 'opacity-100 scale-y-110' : 'opacity-0 scale-y-50'
              }`}
              style={{
                background: 'radial-gradient(ellipse at center, rgba(244, 232, 200, 1) 0%, rgba(200, 148, 46, 0.8) 40%, transparent 80%)',
                filter: 'blur(3px)',
              }}
            />

            {/* Golden Bookmark Ribbon Hanging Below Spine */}
            <div
              className="absolute -bottom-5 left-1/2 -translate-x-1/2 w-2.5 h-7 bg-primary rounded-b-xs shadow-xs z-25 pointer-events-none transition-transform duration-500"
              style={{
                clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 50% 80%, 0% 100%)',
              }}
            />
          </div>

          {/* ── STAGES 2 - 3: Emergent Knowledge Thread & Floating Particles ── */}
          {stage >= 2 && (
            <div className="absolute inset-0 pointer-events-none z-30">
              {/* SVG Glowing Sutra Thread Rising Upward */}
              <svg
                className="absolute -top-32 left-1/2 -translate-x-1/2 w-40 h-40 overflow-visible"
                viewBox="0 0 160 160"
                fill="none"
              >
                <path
                  d="M80 160 C70 120, 110 90, 80 50 C60 20, 95 10, 80 0"
                  stroke="url(#threadGlow)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  className="animate-pulse"
                  style={{
                    filter: 'drop-shadow(0 0 6px rgba(200, 148, 46, 0.8))',
                  }}
                />
                <defs>
                  <linearGradient id="threadGlow" x1="0" y1="1" x2="0" y2="0">
                    <stop offset="0%" stopColor="#C8942E" stopOpacity="0.3" />
                    <stop offset="50%" stopColor="#E0C37A" stopOpacity="0.9" />
                    <stop offset="100%" stopColor="#FFF" stopOpacity="1" />
                  </linearGradient>
                </defs>
              </svg>

              {/* Floating Golden Sparks / Knowledge Embers */}
              <div
                className="absolute top-2 left-1/4 h-2 w-2 rounded-full bg-primary blur-[0.5px] animate-float-stardust"
                style={{ animationDuration: '2.5s', animationDelay: '0.1s' }}
              />
              <div
                className="absolute top-6 right-1/4 h-2.5 w-2.5 rounded-full bg-amber-300 blur-[0.5px] animate-float-stardust"
                style={{ animationDuration: '3s', animationDelay: '0.4s' }}
              />
              <div
                className="absolute -top-12 left-1/3 h-1.5 w-1.5 rounded-full bg-primary blur-[0.2px] animate-float-stardust"
                style={{ animationDuration: '2.2s', animationDelay: '0.2s' }}
              />
              <div
                className="absolute -top-16 right-1/3 h-2 w-2 rounded-full bg-amber-200 blur-[0.4px] animate-float-stardust"
                style={{ animationDuration: '2.8s', animationDelay: '0.5s' }}
              />

              {/* Emergent Document Reading Chip */}
              <div
                className="absolute -top-10 left-6 px-2 py-0.5 rounded border border-primary/30 bg-card/90 shadow-md text-[9px] font-mono text-primary animate-float-slow"
                style={{ animationDuration: '3.5s' }}
              >
                [C1: Grounding]
              </div>
              <div
                className="absolute -top-14 right-6 px-2 py-0.5 rounded border border-primary/30 bg-card/90 shadow-md text-[9px] font-mono text-primary animate-float-reverse"
                style={{ animationDuration: '4s' }}
              >
                [स्वाध्याय: Verified]
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
