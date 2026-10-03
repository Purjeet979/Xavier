import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { GraduationCap, Sun, Moon, ArrowRight, Menu, X, BookOpen } from 'lucide-react'
import { useTheme } from '@/components/theme-provider'
import { Button } from '@/components/ui/button'

interface LandingNavbarProps {
  onReplayIntro?: () => void
}

export function LandingNavbar({ onReplayIntro }: LandingNavbarProps) {
  const { theme, setTheme } = useTheme()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const navLinks = [
    { label: 'Features', href: '#features' },
    { label: 'How It Works', href: '#how-it-works' },
    { label: 'Preview', href: '#preview' },
    { label: 'About', href: '#about' },
  ]

  const scrollTo = (id: string) => {
    setMobileMenuOpen(false)
    const element = document.querySelector(id)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/80 bg-background/85 backdrop-blur-md transition-colors">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="h-9 w-9 rounded-xl bg-primary flex items-center justify-center text-primary-foreground shadow-xs group-hover:scale-105 transition-transform">
            <GraduationCap className="h-5 w-5" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-heading font-bold text-lg text-foreground tracking-tight">
              Gyansutra
            </span>
            <span className="text-xs font-serif text-muted-foreground/80 tracking-wide font-normal px-2 py-0.5 rounded-full bg-secondary/80 border border-border/70">
              ज्ञानसूत्र
            </span>
          </div>
        </Link>

        {/* Desktop Nav Items */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <button
              key={link.href}
              type="button"
              onClick={() => scrollTo(link.href)}
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              {link.label}
            </button>
          ))}
        </nav>

        {/* Action Controls */}
        <div className="hidden sm:flex items-center gap-3">
          {onReplayIntro && (
            <Button
              variant="outline"
              size="sm"
              onClick={onReplayIntro}
              className="rounded-xl border-primary/30 bg-accent/60 hover:bg-accent text-primary text-xs h-9 px-3 gap-1.5 font-medium shadow-2xs"
              title="Watch physical book opening animation"
            >
              <BookOpen className="h-3.5 w-3.5 text-primary" />
              <span>Watch Story</span>
            </Button>
          )}

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="h-9 w-9 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary"
            title="Toggle theme"
          >
            {theme === 'dark' ? (
              <Sun className="h-4 w-4 text-warning" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
            <span className="sr-only">Toggle theme</span>
          </Button>

          <Link to="/documents">
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl border-border hover:bg-secondary text-xs h-9 px-3.5 hidden lg:inline-flex"
            >
              <BookOpen className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
              Documents
            </Button>
          </Link>

          <Link to="/chat">
            <Button
              size="sm"
              className="rounded-xl bg-primary hover:bg-primary-hover text-primary-foreground shadow-xs text-xs font-medium h-9 px-4 flex items-center gap-1.5"
            >
              <span>Start Studying</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>

        {/* Mobile menu trigger */}
        <div className="flex sm:hidden items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="h-8 w-8 rounded-lg text-muted-foreground hover:bg-secondary"
          >
            {theme === 'dark' ? <Sun className="h-4 w-4 text-warning" /> : <Moon className="h-4 w-4" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="h-8 w-8 rounded-lg text-muted-foreground hover:bg-secondary"
          >
            {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="sm:hidden border-b border-border bg-card/95 backdrop-blur-md px-4 py-4 space-y-3">
          <nav className="flex flex-col space-y-2">
            {navLinks.map((link) => (
              <button
                key={link.href}
                type="button"
                onClick={() => scrollTo(link.href)}
                className="text-left text-sm font-medium text-muted-foreground hover:text-foreground py-1.5"
              >
                {link.label}
              </button>
            ))}
          </nav>
          <div className="pt-2 border-t border-border flex flex-col gap-2">
            <Link to="/chat" onClick={() => setMobileMenuOpen(false)}>
              <Button className="w-full rounded-xl bg-primary hover:bg-primary-hover text-primary-foreground text-xs h-9 justify-center gap-1.5">
                <span>Start Studying</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      )}
    </header>
  )
}
