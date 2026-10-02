/* eslint-disable react-refresh/only-export-components */
import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { LandingNavbar } from '@/components/landing/landing-navbar'
import { LandingHero } from '@/components/landing/landing-hero'
import { LandingTrustStrip } from '@/components/landing/landing-trust-strip'
import { LandingSutraThread } from '@/components/landing/landing-sutra-thread'
import { LandingFeatures } from '@/components/landing/landing-features'
import { LandingHowItWorks } from '@/components/landing/landing-how-it-works'
import { LandingProductPreview } from '@/components/landing/landing-product-preview'
import { LandingFinalCTA } from '@/components/landing/landing-final-cta'
import { LandingFooter } from '@/components/landing/landing-footer'
import { ScrollProgress } from '@/components/ui/scroll-progress'
import { ImmersiveBackground } from '@/components/ui/immersive-background'
import { LandingEntryAnimation } from '@/components/landing/landing-entry-animation'

export const Route = createFileRoute('/landing')({
  component: LandingPage,
})

function SutraSpine({ label }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center my-0 pointer-events-none select-none z-10 relative" aria-hidden>
      <div className="w-px h-8 sm:h-12 bg-gradient-to-b from-transparent via-primary/50 to-primary" />
      <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-accent/80 border border-primary/30 backdrop-blur-xs text-[10px] font-mono font-medium text-primary shadow-xs">
        <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
        {label ? <span>{label}</span> : <span>ज्ञानसूत्र</span>}
      </div>
      <div className="w-px h-8 sm:h-12 bg-gradient-to-b from-primary via-primary/50 to-transparent" />
    </div>
  )
}

function LandingPage() {
  const [showIntro, setShowIntro] = useState(true)

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-accent selection:text-accent-foreground scroll-smooth relative overflow-x-hidden">
      {/* Premium Physical Book Opening & Knowledge Emergence Intro */}
      {showIntro && <LandingEntryAnimation onComplete={() => setShowIntro(false)} />}

      {/* Golden Sutra Reading Progress Thread */}
      <ScrollProgress />

      {/* Living Immersive Background with Parallax, Spotlight and Particles */}
      <ImmersiveBackground parallax={true} showParticles={true} />

      <div className="relative z-10 flex flex-col flex-1">
        <LandingNavbar onReplayIntro={() => setShowIntro(true)} />
        <main className="flex-1">
          <LandingHero />
          <SutraSpine label="I. स्वाध्याय • Sovereign Ingestion" />
          <LandingTrustStrip />
          <SutraSpine label="II. सूत्र • Grounded Provenance" />
          <LandingSutraThread />
          <SutraSpine label="III. विशेषताएँ • Rigorous Capabilities" />
          <LandingFeatures />
          <SutraSpine label="IV. प्रक्रिया • Academic Workflow" />
          <LandingHowItWorks />
          <SutraSpine label="V. रात्रिस्वाध्याय • Night Study Sanctuary" />
          <LandingProductPreview />
          <LandingFinalCTA />
        </main>
        <LandingFooter />
      </div>
    </div>
  )
}
