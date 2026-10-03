import { Link } from '@tanstack/react-router'
import { ArrowRight, BookOpen, FileText, CheckCircle2, Bookmark, ShieldCheck, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import heroStudyWorkspace from '@/assets/hero_study_workspace.png'
import bgSvg from '@/assets/bg.svg'
import bgLightSvg from '@/assets/bg-light.svg'

export function LandingHero() {
  const scrollToFlow = () => {
    const el = document.querySelector('#sutra-flow')
    if (el) el.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <section className="relative overflow-hidden pt-10 pb-16 md:pt-16 md:pb-24 subtle-paper-grain">
      {/* Light-mode Sutra threads background */}
      <div
        className="pointer-events-none absolute inset-0 opacity-40 dark:hidden bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${bgLightSvg})` }}
        aria-hidden
      />
      {/* Dark-mode Sutra threads background */}
      <div
        className="pointer-events-none absolute inset-0 opacity-35 hidden dark:block bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${bgSvg})` }}
        aria-hidden
      />

      {/* Editorial Watermark / Subtle Manuscript Accent */}
      <div 
        className="pointer-events-none absolute right-4 top-10 select-none text-[120px] md:text-[200px] font-serif font-bold text-primary/[0.04] leading-none"
        aria-hidden
      >
        ज्ञान
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Column: Editorial Headline & Copy */}
          <div className="lg:col-span-6 space-y-6 text-left">
            {/* Eyebrow Pill */}
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-accent/70 px-3.5 py-1 text-xs font-medium text-accent-foreground shadow-xs">
              <span className="font-serif italic font-semibold text-primary">ज्ञानसूत्र</span>
              <span className="h-3 w-px bg-border" />
              <span>Modern Academic Reading Space</span>
            </div>

            {/* Headline */}
            <h1 className="font-heading font-bold text-4xl sm:text-5xl lg:text-6xl text-foreground tracking-tight leading-[1.12]">
              Turn Your Study Material <br className="hidden sm:inline" />
              Into <span className="font-serif italic text-primary font-normal underline decoration-primary/40 decoration-wavy underline-offset-8">Grounded Knowledge</span>.
            </h1>

            {/* Supporting Copy */}
            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-xl font-normal">
              Upload your textbooks, lecture notes, and research papers. Ask questions, discover connections, and learn with answers verified against your own pages.
            </p>

            {/* CTAs */}
            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5">
              <Link to="/chat">
                <Button
                  size="lg"
                  className="w-full sm:w-auto rounded-xl bg-primary hover:bg-primary-hover text-primary-foreground shadow-sm h-11 px-7 font-medium text-sm flex items-center justify-center gap-2"
                >
                  <span>Start Studying</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Button
                variant="outline"
                size="lg"
                onClick={scrollToFlow}
                className="w-full sm:w-auto rounded-xl border-border bg-card hover:bg-secondary text-foreground text-sm h-11 px-6 font-medium"
              >
                Explore the Sutra Flow
              </Button>
            </div>

            {/* Micro Details: Grounding & Privacy Strip */}
            <div className="pt-4 border-t border-border/80 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5 font-medium text-foreground/80">
                <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                Grounded Citations
              </span>
              <span className="flex items-center gap-1.5 font-medium text-foreground/80">
                <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                100% Client-Side Privacy
              </span>
              <span className="flex items-center gap-1.5 font-medium text-foreground/80">
                <FileText className="h-3.5 w-3.5 text-primary" />
                PDF, MD & Notes
              </span>
            </div>
          </div>

          {/* Right Column: Layered Tactile Study Scene */}
          <div className="lg:col-span-6 relative">
            <div className="relative mx-auto max-w-lg lg:max-w-none">
              {/* Main Editorial Still-life Canvas */}
              <div className="relative rounded-2xl border border-border/90 bg-card p-2.5 shadow-md overflow-hidden group">
                <div className="relative aspect-16/10 overflow-hidden rounded-xl bg-secondary/50">
                  <img
                    src={heroStudyWorkspace}
                    alt="Study desk with open notebook on memory systems, cognitive science textbooks, and laptop screen"
                    className="w-full h-full object-cover object-center group-hover:scale-[1.01] transition-transform duration-500"
                    loading="eager"
                  />
                  {/* Subtle warm paper lighting vignette */}
                  <div className="absolute inset-0 bg-gradient-to-t from-background/70 via-transparent to-transparent pointer-events-none" />
                </div>

                {/* Caption / Provenance Tag */}
                <div className="px-2 pt-2.5 pb-1 flex items-center justify-between text-[11px] text-muted-foreground font-mono">
                  <span className="flex items-center gap-1">
                    <BookOpen className="h-3 w-3 text-primary" />
                    Curriculum: Cognitive Systems & Neural Memory
                  </span>
                  <span className="text-primary font-semibold">Indexed Locally</span>
                </div>
              </div>

              {/* Overlaid Layer 1: Tactile Annotated Note Card (Floating) */}
              <div className="absolute -bottom-6 -left-4 sm:-left-6 w-72 sm:w-80 rounded-xl border border-border bg-card/95 p-3.5 shadow-xl backdrop-blur-md animate-float-slow">
                <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-border/70">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-primary font-semibold flex items-center gap-1">
                    <Bookmark className="h-3 w-3" /> Reading Chunk #14
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-accent text-accent-foreground font-medium flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Verified Grounding
                  </span>
                </div>
                <p className="text-xs text-foreground/90 font-serif leading-relaxed italic">
                  "Synaptic consolidation converts short-term memory traces into stable long-term representations within the hippocampal-neocortical network."
                </p>
                <div className="mt-2 flex items-center justify-between text-[10px] text-muted-foreground">
                  <span>Cognitive Science: Memory Systems, p.142</span>
                  <span className="font-mono font-bold text-primary bg-secondary px-1.5 py-0.5 rounded border border-border">[C1]</span>
                </div>
              </div>

              {/* Overlaid Layer 2: Connecting Sutra Chip (Floating Reverse) */}
              <div className="absolute -top-4 -right-2 sm:-right-4 rounded-xl border border-primary/30 bg-accent/95 px-3 py-1.5 text-xs text-accent-foreground font-medium shadow-lg backdrop-blur-xs flex items-center gap-2 animate-float-reverse">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                <span className="font-serif font-bold text-primary">सूत्र</span>
                <span className="text-[11px] text-muted-foreground">→ In-browser AI Synthesis</span>
              </div>

              {/* Overlaid Layer 3: Sovereign Storage Beacon (Floating Drift) */}
              <div className="absolute top-1/2 -right-8 hidden xl:flex items-center gap-2 rounded-full border border-primary/30 bg-card/95 backdrop-blur-md px-3.5 py-1.5 shadow-lg text-[11px] text-foreground font-mono animate-float-drift z-20">
                <span className="h-2 w-2 rounded-full bg-primary animate-ping" />
                <span className="text-primary font-semibold">PGlite Vector Engine</span>
                <span className="text-muted-foreground">• In-Memory</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
