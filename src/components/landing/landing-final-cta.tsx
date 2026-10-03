import { Link } from '@tanstack/react-router'
import { ArrowRight, BookOpen, GraduationCap } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function LandingFinalCTA() {
  return (
    <section className="py-24 md:py-32 relative bg-background subtle-paper-grain">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl border border-primary/30 bg-accent/40 p-8 sm:p-16 text-center shadow-xs">
          {/* Subtle warm center illumination */}
          <div
            className="pointer-events-none absolute inset-0 opacity-30"
            style={{
              background: 'radial-gradient(circle at center, rgba(200, 148, 46, 0.3), transparent 70%)',
            }}
            aria-hidden
          />

          <div className="relative z-10 space-y-6 max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-card px-3.5 py-1 text-xs font-semibold text-primary shadow-xs">
              <GraduationCap className="h-4 w-4" />
              <span className="font-serif italic">ज्ञानसूत्र</span>
              <span>• Sovereign Academic Study</span>
            </div>

            <h2 className="font-heading font-bold text-3xl sm:text-4xl md:text-5xl text-foreground tracking-tight leading-tight">
              Your notes already contain the knowledge. <br />
              <span className="font-serif italic font-normal text-primary">Gyansutra</span> helps you find it.
            </h2>

            <p className="text-base text-muted-foreground leading-relaxed">
              No account creation. No cloud subscriptions. Zero telemetry. Begin examining and interrogating your curriculum right now, directly on your machine.
            </p>

            <div className="pt-3 flex flex-col sm:flex-row items-center justify-center gap-3.5">
              <Link to="/chat">
                <Button
                  size="lg"
                  className="w-full sm:w-auto rounded-xl bg-primary hover:bg-primary-hover text-primary-foreground shadow-sm h-11 px-8 text-sm font-medium flex items-center justify-center gap-2"
                >
                  <span>Start Studying</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/documents">
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto rounded-xl border-border bg-card hover:bg-secondary text-foreground text-sm h-11 px-6 font-medium flex items-center justify-center gap-2"
                >
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                  <span>Upload Study Material</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
