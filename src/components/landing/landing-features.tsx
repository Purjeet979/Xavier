import { BookOpen, Search, CheckCircle2, Bookmark, UploadCloud } from 'lucide-react'

export function LandingFeatures() {
  return (
    <section id="features" className="py-20 md:py-28 bg-secondary/40 border-t border-border/80 relative">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Editorial Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16 text-left">
          <div className="max-w-2xl">
            <div className="text-xs font-mono font-semibold text-primary uppercase tracking-widest mb-2 flex items-center gap-2">
              <span>विशेषताएँ</span>
              <span>•</span>
              <span>Capabilities</span>
            </div>
            <h2 className="font-heading font-bold text-3xl sm:text-4xl lg:text-5xl text-foreground tracking-tight leading-tight">
              Built for Serious <br />
              <span className="font-serif italic font-normal text-primary">Academic Focus</span>.
            </h2>
          </div>
          <p className="text-sm text-muted-foreground max-w-md leading-relaxed">
            Every feature is designed to reduce eye strain, eliminate context switching, and keep your attention firmly on your curriculum.
          </p>
        </div>

        {/* Asymmetric Feature Composition */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Card 1: Wide Primary Feature (7 cols) */}
          <div className="lg:col-span-7 rounded-2xl border border-border bg-card p-6 sm:p-8 flex flex-col justify-between shadow-xs hover:border-primary/40 transition-colors">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="h-10 w-10 rounded-xl bg-accent text-accent-foreground border border-primary/20 flex items-center justify-center">
                  <BookOpen className="h-5 w-5 text-primary" />
                </div>
                <span className="text-[11px] font-mono text-muted-foreground uppercase tracking-wider px-2 py-0.5 rounded bg-secondary">
                  Material Ingestion
                </span>
              </div>

              <h3 className="font-heading font-bold text-xl sm:text-2xl text-foreground tracking-tight mb-2.5">
                Learn From Your Authentic Material
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                Drag and drop whole textbook chapters, research monographs, syllabi, or handwritten lecture markdown files. Gyansutra parses them locally into dense semantic representations using client-side sentence tokenizers.
              </p>
            </div>

            {/* Ingestion Micro-Component */}
            <div className="rounded-xl border border-border/90 bg-secondary/40 p-4 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-mono font-medium text-foreground flex items-center gap-1.5">
                  <UploadCloud className="h-4 w-4 text-primary" />
                  Local Ingestion Pipeline
                </span>
                <span className="text-[10px] text-primary font-mono bg-accent/70 px-2 py-0.5 rounded">
                  In-Memory PGlite
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono">
                <div className="p-2 rounded-lg bg-card border border-border/80">
                  <div className="font-bold text-foreground">.PDF</div>
                  <div className="text-[10px] text-muted-foreground">Text & Tables</div>
                </div>
                <div className="p-2 rounded-lg bg-card border border-border/80">
                  <div className="font-bold text-foreground">.MD</div>
                  <div className="text-[10px] text-muted-foreground">Notes & Decks</div>
                </div>
                <div className="p-2 rounded-lg bg-card border border-border/80">
                  <div className="font-bold text-foreground">.TXT</div>
                  <div className="text-[10px] text-muted-foreground">Plain Excerpts</div>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Stacked Feature (5 cols) */}
          <div className="lg:col-span-5 rounded-2xl border border-border bg-card p-6 sm:p-8 flex flex-col justify-between shadow-xs hover:border-primary/40 transition-colors">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="h-10 w-10 rounded-xl bg-accent text-accent-foreground border border-primary/20 flex items-center justify-center">
                  <Search className="h-5 w-5 text-primary" />
                </div>
                <span className="text-[11px] font-mono text-muted-foreground uppercase tracking-wider px-2 py-0.5 rounded bg-secondary">
                  Natural Inquiry
                </span>
              </div>

              <h3 className="font-heading font-bold text-xl text-foreground tracking-tight mb-2.5">
                Ask Questions Naturally
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                Query your books like discussing with an academic mentor. No cryptic Boolean operators or keyword gymnastics.
              </p>
            </div>

            <div className="p-3 rounded-xl border border-border/90 bg-secondary/40 text-xs space-y-2">
              <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider block">
                Sample Student Query:
              </span>
              <p className="text-foreground italic font-serif leading-relaxed">
                "What empirical evidence refutes the early multi-store memory model?"
              </p>
            </div>
          </div>

          {/* Card 3: Grounded Answers (5 cols) */}
          <div className="lg:col-span-5 rounded-2xl border border-border bg-card p-6 sm:p-8 flex flex-col justify-between shadow-xs hover:border-primary/40 transition-colors">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="h-10 w-10 rounded-xl bg-accent text-accent-foreground border border-primary/20 flex items-center justify-center">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                </div>
                <span className="text-[11px] font-mono text-muted-foreground uppercase tracking-wider px-2 py-0.5 rounded bg-secondary">
                  Verification
                </span>
              </div>

              <h3 className="font-heading font-bold text-xl text-foreground tracking-tight mb-2.5">
                Grounded Answers Only
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                Answers are synthesized strictly from retrieved context passages. If your uploaded texts do not contain the answer, the model explicitly acknowledges it.
              </p>
            </div>

            <div className="p-3 rounded-xl border border-primary/25 bg-accent/30 text-xs flex items-center justify-between">
              <span className="font-medium text-foreground">Calibrated Verification Gate</span>
              <span className="font-mono text-primary font-bold text-[10px] bg-card px-2 py-0.5 rounded border border-primary/30">
                100% Grounded
              </span>
            </div>
          </div>

          {/* Card 4: Wide Citations & Provenance (7 cols) */}
          <div className="lg:col-span-7 rounded-2xl border border-border bg-card p-6 sm:p-8 flex flex-col justify-between shadow-xs hover:border-primary/40 transition-colors">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="h-10 w-10 rounded-xl bg-accent text-accent-foreground border border-primary/20 flex items-center justify-center">
                  <Bookmark className="h-5 w-5 text-primary" />
                </div>
                <span className="text-[11px] font-mono text-muted-foreground uppercase tracking-wider px-2 py-0.5 rounded bg-secondary">
                  Provenance
                </span>
              </div>

              <h3 className="font-heading font-bold text-xl sm:text-2xl text-foreground tracking-tight mb-2.5">
                Know Where Every Sentence Came From
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                Every factual claim includes a clickable source chip linking to the exact page, section, and original paragraph. Verify definitions or copy bibliography citations instantly.
              </p>
            </div>

            <div className="rounded-xl border border-border/90 bg-secondary/40 p-3.5 flex flex-wrap items-center gap-2 text-xs">
              <span className="font-mono font-bold text-primary bg-card px-2 py-1 rounded border border-border text-[11px]">
                [C1]
              </span>
              <span className="text-foreground font-medium truncate max-w-[200px]">
                Cellular_Neurobiology_Ch8.pdf
              </span>
              <span className="font-mono text-muted-foreground text-[10px]">p. 182 • Paragraph 4</span>
              <span className="ml-auto text-[10px] text-primary font-mono font-semibold bg-accent px-2 py-0.5 rounded">
                Click to inspect chunk
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
