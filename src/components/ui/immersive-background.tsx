import { useEffect, useState, useRef } from 'react'
import bgSvg from '@/assets/bg.svg'
import bgLightSvg from '@/assets/bg-light.svg'

interface ImmersiveBackgroundProps {
  parallax?: boolean
  showParticles?: boolean
  className?: string
}

export function ImmersiveBackground({
  parallax = true,
  showParticles = true,
  className = '',
}: ImmersiveBackgroundProps) {
  const [mousePos, setMousePos] = useState({ x: -500, y: -500 })
  const [scrollY, setScrollY] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let targetX = -500
    let targetY = -500
    let currentX = -500
    let currentY = -500
    let animId: number

    const handleMouseMove = (e: MouseEvent) => {
      targetX = e.clientX
      targetY = e.clientY
    }

    const handleScroll = () => {
      if (parallax) {
        setScrollY(window.scrollY)
      }
    }

    const updatePosition = () => {
      currentX += (targetX - currentX) * 0.08
      currentY += (targetY - currentY) * 0.08
      setMousePos({ x: Math.round(currentX), y: Math.round(currentY) })
      animId = requestAnimationFrame(updatePosition)
    }

    window.addEventListener('mousemove', handleMouseMove, { passive: true })
    if (parallax) {
      window.addEventListener('scroll', handleScroll, { passive: true })
    }
    animId = requestAnimationFrame(updatePosition)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      if (parallax) {
        window.removeEventListener('scroll', handleScroll)
      }
      cancelAnimationFrame(animId)
    }
  }, [parallax])

  // Deterministic floating particles
  const particles = [
    { top: '12%', left: '15%', size: 3, delay: '0s', duration: '7s' },
    { top: '24%', left: '82%', size: 4, delay: '1.2s', duration: '9s' },
    { top: '38%', left: '28%', size: 2.5, delay: '2.5s', duration: '8s' },
    { top: '52%', left: '74%', size: 3.5, delay: '0.8s', duration: '10s' },
    { top: '65%', left: '18%', size: 2, delay: '3.1s', duration: '6.5s' },
    { top: '78%', left: '88%', size: 3, delay: '1.7s', duration: '8.5s' },
    { top: '88%', left: '42%', size: 2.5, delay: '2.0s', duration: '7.5s' },
    { top: '18%', left: '60%', size: 3, delay: '4s', duration: '11s' },
    { top: '45%', left: '10%', size: 2, delay: '1.5s', duration: '9.5s' },
    { top: '70%', left: '55%', size: 3.5, delay: '3.5s', duration: '8s' },
    { top: '30%', left: '92%', size: 2.5, delay: '0.4s', duration: '7.8s' },
    { top: '85%', left: '78%', size: 2, delay: '2.8s', duration: '6.8s' },
  ]

  const parallaxOffset = parallax ? scrollY * 0.12 : 0

  return (
    <div
      ref={containerRef}
      className={`pointer-events-none fixed inset-0 overflow-hidden select-none z-0 ${className}`}
      aria-hidden
    >
      {/* Light-theme Sutra vector layer with parallax drift */}
      <div
        className="absolute inset-0 opacity-25 dark:hidden bg-cover bg-center bg-no-repeat transition-transform duration-100 ease-out will-change-transform"
        style={{
          backgroundImage: `url(${bgLightSvg})`,
          transform: `translate3d(0, -${parallaxOffset}px, 0)`,
        }}
      />

      {/* Dark-theme Sutra vector layer with parallax drift */}
      <div
        className="absolute inset-0 opacity-30 hidden dark:block bg-cover bg-center bg-no-repeat transition-transform duration-100 ease-out will-change-transform"
        style={{
          backgroundImage: `url(${bgSvg})`,
          transform: `translate3d(0, -${parallaxOffset}px, 0)`,
        }}
      />

      {/* Dynamic Cursor Spotlight Illumination */}
      {mousePos.x > 0 && (
        <div
          className="absolute inset-0 transition-opacity duration-300"
          style={{
            background: `radial-gradient(650px circle at ${mousePos.x}px ${mousePos.y}px, rgba(200, 148, 46, 0.08), transparent 70%)`,
          }}
        />
      )}

      {/* Soft Breathing Corner Aurora Orbs */}
      <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-primary/10 blur-3xl animate-pulse" />
      <div
        className="absolute -bottom-32 -right-32 w-[32rem] h-[32rem] rounded-full bg-primary/8 blur-3xl animate-pulse"
        style={{ animationDuration: '6s' }}
      />

      {/* Floating Stardust Embers */}
      {showParticles && (
        <div className="absolute inset-0">
          {particles.map((p, idx) => (
            <div
              key={idx}
              className="absolute rounded-full bg-primary/60 blur-[0.4px] animate-float-stardust"
              style={{
                top: p.top,
                left: p.left,
                width: `${p.size}px`,
                height: `${p.size}px`,
                animationDelay: p.delay,
                animationDuration: p.duration,
                boxShadow: `0 0 ${p.size * 2}px rgba(200, 148, 46, 0.4)`,
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}
