import { UploadCloud, Cpu, HelpCircle, Lightbulb } from 'lucide-react'

export function LandingHowItWorks() {
  const steps = [
    {
      numeral: 'I',
      sanskrit: 'अर्पण',
      title: 'UPLOAD',
      subtitle: 'Your Study Material',
      description: 'Import textbook chapters, lecture decks, and research articles. Everything stays in your browser cache.',
      icon: UploadCloud,
    },
    {
      numeral: 'II',
      sanskrit: 'विभाजन',
      title: 'PROCESS',
      subtitle: 'Local In-Browser Parsing',
      description: 'Documents are dissected into semantic chunks, vectorized via Transformers.js, and stored in PGlite.',
      icon: Cpu,
    },
    {
      numeral: 'III',
      sanskrit: 'प्रश्नोत्तर',
      title: 'ASK',
      subtitle: 'Direct Academic Inquiry',
      description: 'Type questions, ask for comparative tables, or request explanations of complex equations.',
      icon: HelpCircle,
    },
    {
      numeral: 'IV',
      sanskrit: 'ज्ञानलाभ',
      title: 'UNDERSTAND',
      subtitle: 'Verified Grounded Answers',
      description: 'Receive explanations grounded in retrieved passages with clickable citations to exact document pages.',
      icon: Lightbulb,
    },
  ]

  return (
    <section id="how-it-works" className="py-20 md:py-28 relative bg-card border-t border-border/80 subtle-paper-grain">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-left max-w-3xl mb-16">
          <div className="text-xs font-mono font-semibold text-primary uppercase tracking-widest mb-2 flex items-center gap-2">
            <span>प्रक्रिया</span>
            <span>•</span>
            <span>The Sutra Workflow</span>
          </div>
          <h2 className="font-heading font-bold text-3xl sm:text-4xl lg:text-5xl text-foreground tracking-tight leading-tight">
            From Dense Text <br />
            To <span className="font-serif italic font-normal text-primary">Living Understanding</span>.
          </h2>
          <p className="mt-4 text-base text-muted-foreground leading-relaxed">
            A serene four-stage progression that preserves academic rigor without sending your reading material to external cloud servers.
          </p>
        </div>

        {/* Step Flow Grid with Sequential Thread */}
        <div className="relative">
          {/* Subtle golden horizontal connecting thread for desktop */}
          <div className="hidden lg:block absolute top-16 left-12 right-12 h-0.5 bg-gradient-to-r from-primary/30 via-primary to-primary/30" aria-hidden />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 relative z-10">
            {steps.map((step, idx) => {
              const Icon = step.icon
              return (
                <div
                  key={idx}
                  className="rounded-2xl border border-border bg-background p-6 shadow-xs flex flex-col justify-between hover:border-primary/50 transition-colors group"
                >
                  <div>
                    {/* Top Row: Numeral & Devanagari Subtitle */}
                    <div className="flex items-center justify-between mb-5">
                      <div className="h-11 w-11 rounded-xl bg-accent text-accent-foreground border border-primary/20 flex items-center justify-center group-hover:scale-105 transition-transform">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <div className="text-right">
                        <span className="font-serif font-bold text-primary text-base block">
                          {step.numeral}
                        </span>
                        <span className="text-[10px] font-serif text-muted-foreground">
                          {step.sanskrit}
                        </span>
                      </div>
                    </div>

                    <div className="font-mono text-xs font-bold text-primary tracking-widest uppercase mb-1">
                      {step.title}
                    </div>

                    <h3 className="font-heading font-bold text-base text-foreground mb-2.5">
                      {step.subtitle}
                    </h3>

                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {step.description}
                    </p>
                  </div>

                  <div className="pt-4 mt-4 border-t border-border/60 flex items-center justify-between text-[11px] font-mono text-muted-foreground">
                    <span>Stage 0{idx + 1}</span>
                    <span className="text-primary font-serif">सूत्र</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* The Philosophical Sutra Note */}
        <div className="mt-14 p-6 rounded-2xl border border-border bg-secondary/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="text-xs font-bold text-foreground flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-primary" />
              <span>The Meaning of Sutra (ज्ञानसूत्र)</span>
            </div>
            <p className="text-xs text-muted-foreground max-w-2xl leading-relaxed">
              In Indian tradition, a <em>sūtra</em> is a concise aphoristic thread that binds ideas together into an accessible whole. Gyansutra is the thread that keeps every AI explanation anchored to your original texts.
            </p>
          </div>
          <div className="shrink-0 text-xs font-mono font-semibold text-primary px-3 py-1.5 rounded-lg bg-card border border-border">
            100% Client-Side RAG
          </div>
        </div>
      </div>
    </section>
  )
}
