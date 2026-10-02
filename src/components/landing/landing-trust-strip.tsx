import { FileText, ShieldCheck, CheckCircle2, Lock, ArrowUpRight } from 'lucide-react'

export function LandingTrustStrip() {
  const principles = [
    {
      symbol: '§ 1',
      title: 'Your Authentic Material',
      description: 'You study your own syllabus, chapters, and lecture decks—never synthetic, unvetted web scrapings.',
      icon: FileText,
    },
    {
      symbol: '§ 2',
      title: 'Grounded Answer Gate',
      description: 'Every generated explanation passes an internal verification gate against retrieved chunks before display.',
      icon: CheckCircle2,
    },
    {
      symbol: '§ 3',
      title: 'Verifiable Provenance',
      description: 'Every statement carries exact page numbers and chunk excerpts, making fact-checking effortless.',
      icon: ShieldCheck,
    },
    {
      symbol: '§ 4',
      title: 'Sovereign Device Privacy',
      description: '100% client-side computation via WebGPU and PGlite. No document text or queries ever leave your laptop.',
      icon: Lock,
    },
  ]

  return (
    <section className="py-16 md:py-24 border-y border-border/80 bg-secondary/50 relative">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          {/* Left Column: Editorial Statement */}
          <div className="lg:col-span-5 space-y-4">
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-primary font-semibold">
              <span>प्रस्थानत्रयी</span>
              <span>•</span>
              <span>Foundational Principles</span>
            </div>

            <h2 className="font-heading font-bold text-3xl sm:text-4xl text-foreground tracking-tight leading-tight">
              Study Without <br />
              <span className="font-serif italic font-normal text-primary">Hallucinations</span>.
            </h2>

            <p className="text-sm text-muted-foreground leading-relaxed">
              Standard chatbots search the vast web and synthesize plausible guesses. Gyansutra anchors every response strictly to your personal syllabus, lecture notes, and textbook chapters through an unbroken thread of verified citations.
            </p>

            <div className="pt-2 text-xs text-muted-foreground font-mono flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              <span>Calm, academically rigorous retrieval architecture</span>
            </div>
          </div>

          {/* Right Column: Asymmetric Principles Grid */}
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-6">
            {principles.map((item, idx) => {
              const Icon = item.icon
              return (
                <div
                  key={idx}
                  className="rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-xs hover:border-primary/40 transition-colors flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3 text-xs">
                      <span className="font-serif text-sm font-bold text-primary">
                        {item.symbol}
                      </span>
                      <Icon className="h-4 w-4 text-muted-foreground" />
                    </div>

                    <h3 className="font-heading font-semibold text-base text-foreground mb-2 tracking-tight">
                      {item.title}
                    </h3>

                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {item.description}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-border/60 flex items-center justify-between text-[11px] text-muted-foreground font-mono">
                    <span>Zero Hallucinations</span>
                    <ArrowUpRight className="h-3 w-3 text-primary/70" />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
