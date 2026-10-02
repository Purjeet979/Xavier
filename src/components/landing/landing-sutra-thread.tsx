import { Bookmark, Sparkles, FileText, CheckCircle2 } from 'lucide-react'
import annotatedBookImg from '@/assets/annotated_book.jpg'

export function LandingSutraThread() {
  return (
    <section id="sutra-flow" className="py-20 md:py-28 relative overflow-hidden subtle-paper-grain">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Large Editorial Headline */}
        <div className="mb-14 text-left max-w-3xl">
          <div className="text-xs font-mono font-semibold text-primary uppercase tracking-widest mb-2 flex items-center gap-2">
            <span>सूत्रानुक्रम</span>
            <span>•</span>
            <span>The Art of Citation</span>
          </div>
          <h2 className="font-heading font-bold text-3xl sm:text-5xl text-foreground tracking-tight leading-[1.15]">
            Knowledge, <span className="font-serif italic font-normal text-primary">Made Yours</span>.
          </h2>
          <p className="mt-4 text-base text-muted-foreground leading-relaxed">
            True studying requires knowing where every claim originates. Gyansutra builds a living suture between your printed reading material and the AI's answers.
          </p>
        </div>

        {/* Visual Sutra Line Motif */}
        <div className="relative py-4 mb-14 hidden md:block">
          <div className="flex items-center justify-between text-xs font-mono text-muted-foreground relative z-10 px-4">
            <span className="bg-card px-3 py-1 rounded-full border border-border flex items-center gap-1.5 font-medium text-foreground">
              <FileText className="h-3.5 w-3.5 text-primary" />
              1. Printed Textbook / PDF
            </span>
            <span className="bg-card px-3 py-1 rounded-full border border-border flex items-center gap-1.5 font-medium text-foreground">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              2. Semantic Chunker
            </span>
            <span className="bg-card px-3 py-1 rounded-full border border-border flex items-center gap-1.5 font-medium text-foreground">
              <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
              3. Verification Gate
            </span>
            <span className="bg-accent px-3 py-1 rounded-full border border-primary/30 flex items-center gap-1.5 font-bold text-primary">
              <Bookmark className="h-3.5 w-3.5" />
              4. Grounded Citation [C1]
            </span>
          </div>

          {/* Golden Thread Horizontal Line */}
          <div className="absolute top-1/2 left-6 right-6 h-0.5 -translate-y-1/2 bg-gradient-to-r from-primary/20 via-primary to-primary/20" aria-hidden />
        </div>

        {/* Asymmetric Content Pairing: Macro Photography + Editorial Chunk Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Column: Macro Photograph of Highlighted Study Notes */}
          <div className="lg:col-span-6 relative">
            <div className="rounded-2xl border border-border bg-card p-3 shadow-md overflow-hidden group">
              <div className="relative aspect-4/3 overflow-hidden rounded-xl bg-secondary/40">
                <img
                  src={annotatedBookImg}
                  alt="Scholarly textbook with highlighted sentence and handwritten pencil notes"
                  className="w-full h-full object-cover object-center group-hover:scale-[1.02] transition-transform duration-500"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent pointer-events-none" />
              </div>

              {/* Caption */}
              <div className="p-3 text-xs text-muted-foreground flex items-center justify-between font-mono">
                <span>Cognitive Psychology, 5th Ed., Ch. 7, p. 248</span>
                <span className="text-primary font-semibold">Highlighted Chunk</span>
              </div>
            </div>

            {/* Overlaid Floating Verification Seal */}
            <div className="absolute -bottom-4 -right-3 sm:-right-5 rounded-xl border border-primary/40 bg-card/95 px-3.5 py-2 shadow-xl backdrop-blur-md flex items-center gap-2.5 text-xs font-mono animate-float-slow z-10">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-bold text-primary">[C1]</span>
              <span className="text-foreground font-medium">Page 248 Validated</span>
            </div>
          </div>

          {/* Right Column: Editorial Breakdown of the Verification */}
          <div className="lg:col-span-6 space-y-5 text-left">
            <div className="p-5 rounded-2xl border border-border bg-card space-y-3 shadow-xs">
              <div className="flex items-center justify-between text-xs pb-2 border-b border-border/80">
                <span className="font-mono text-primary font-bold">[C1] Verbatim Chunk Ingested</span>
                <span className="text-muted-foreground text-[11px] font-mono">Cosine Similarity: 0.892</span>
              </div>
              <p className="text-sm text-foreground/90 font-serif leading-relaxed italic bg-secondary/50 p-3 rounded-xl border border-border/60">
                "Consequently, the consolidation of declarative memory is critically dependent on the integrity of the hippocampus and adjacent cortical structures (see Fig. 7.3, p. 248)."
              </p>
              <div className="text-xs text-muted-foreground">
                Matched via reciprocal rank fusion across BM25 lexical tokens and Transformers.js 384-dimensional embeddings.
              </div>
            </div>

            <div className="p-5 rounded-2xl border border-primary/30 bg-accent/40 space-y-2">
              <div className="text-xs font-mono font-semibold text-primary uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5" />
                Synthesized Student Answer
              </div>
              <p className="text-xs sm:text-sm text-foreground leading-relaxed">
                Declarative memory consolidation requires an intact hippocampus; without it, temporary representations in cortical structures fail to stabilize into persistent recall.
              </p>
              <div className="pt-1 flex items-center gap-2 text-xs">
                <span className="font-mono font-bold text-primary bg-card px-2 py-0.5 rounded-full border border-primary/20">
                  Citation: [C1] Cognitive Psychology, p. 248
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
