import { Link } from '@tanstack/react-router'
import { GraduationCap, Sun, Moon, Shield, Cpu } from 'lucide-react'
import { useTheme } from '@/components/theme-provider'
import { Button } from '@/components/ui/button'

export function LandingFooter() {
  const { theme, setTheme } = useTheme()

  return (
    <footer id="about" className="border-t border-border/80 bg-card/60 transition-colors">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          {/* Brand Col */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-bold">
                <GraduationCap className="h-4 w-4" />
              </div>
              <span className="font-heading font-bold text-lg text-foreground tracking-tight">
                Gyansutra
              </span>
              <span className="text-xs font-serif text-muted-foreground/90 px-2 py-0.5 rounded-full bg-secondary border border-border/60">
                ज्ञानसूत्र
              </span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-md">
              An AI-powered academic study platform engineered to help students learn from their own study material with grounded answers, clickable citations, and 100% client-side privacy.
            </p>
            <div className="flex items-center gap-2 pt-1">
              <span className="text-xs text-muted-foreground font-mono flex items-center gap-1 bg-secondary px-2 py-1 rounded-md">
                <Shield className="h-3 w-3 text-primary" /> Client-Side WebGPU
              </span>
              <span className="text-xs text-muted-foreground font-mono flex items-center gap-1 bg-secondary px-2 py-1 rounded-md">
                <Cpu className="h-3 w-3 text-primary" /> PGlite WASM
              </span>
            </div>
          </div>

          {/* Study Workspace Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider font-mono">
              Study Workspace
            </h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link to="/" className="hover:text-foreground transition-colors">
                  AI Study Assistant (Chat)
                </Link>
              </li>
              <li>
                <Link to="/documents" className="hover:text-foreground transition-colors">
                  Document Library
                </Link>
              </li>
              <li>
                <Link to="/projects" className="hover:text-foreground transition-colors">
                  Workspaces & Subjects
                </Link>
              </li>
              <li>
                <Link to="/history" className="hover:text-foreground transition-colors">
                  Study Session History
                </Link>
              </li>
              <li>
                <Link to="/settings" className="hover:text-foreground transition-colors">
                  System Settings
                </Link>
              </li>
            </ul>
          </div>

          {/* Platform Navigation */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider font-mono">
              Architecture & Features
            </h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <a href="#features" className="hover:text-foreground transition-colors">
                  Grounded Verification Gate
                </a>
              </li>
              <li>
                <a href="#how-it-works" className="hover:text-foreground transition-colors">
                  How It Works (Sutra Flow)
                </a>
              </li>
              <li>
                <a href="#preview" className="hover:text-foreground transition-colors">
                  Interactive Product Mockup
                </a>
              </li>
              <li>
                <Link to="/settings" className="hover:text-foreground transition-colors">
                  WebGPU / WASM Diagnostics
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-border/80 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground text-center sm:text-left">
            © {new Date().getFullYear()} Gyansutra (ज्ञानसूत्र). Crafted for deep academic learning. All rights reserved.
          </p>

          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground">Theme:</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="rounded-xl border-border h-8 px-2.5 text-xs text-muted-foreground hover:text-foreground hover:bg-secondary gap-1.5"
            >
              {theme === 'dark' ? (
                <>
                  <Sun className="h-3.5 w-3.5 text-warning" />
                  <span>Dark Mode</span>
                </>
              ) : (
                <>
                  <Moon className="h-3.5 w-3.5" />
                  <span>Light Mode</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </footer>
  )
}
