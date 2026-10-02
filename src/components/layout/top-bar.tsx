import { Menu, Compass } from 'lucide-react'
import { Link } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { ProjectSwitcher } from '@/components/layout/project-switcher'

interface TopBarProps {
  title: string
  onMenuToggle?: () => void
}

export function TopBar({ title, onMenuToggle }: TopBarProps) {
  return (
    <header className='relative z-40 h-16 border-b border-border bg-card/80 backdrop-blur-sm px-4 sm:px-6 flex items-center justify-between shrink-0'>
      <div className='flex items-center gap-3 min-w-0'>
        {onMenuToggle && (
          <Button
            variant='ghost'
            size='icon'
            onClick={onMenuToggle}
            className='md:hidden rounded-xl h-9 w-9 text-muted-foreground hover:bg-secondary hover:text-foreground'
          >
            <Menu className='h-5 w-5' />
            <span className='sr-only'>Open menu</span>
          </Button>
        )}
        <h1 className='font-heading font-semibold text-base text-foreground tracking-tight truncate max-w-[140px] sm:max-w-none'>
          {title}
        </h1>
        <span className='hidden sm:block h-4 w-px bg-border' aria-hidden />
        <ProjectSwitcher />
      </div>

      <div className="flex items-center gap-2">
        <Link to="/landing">
          <Button
            variant="ghost"
            size="sm"
            className="rounded-xl h-8 px-2.5 text-xs text-muted-foreground hover:text-foreground hover:bg-secondary hidden sm:flex items-center gap-1.5"
          >
            <Compass className="h-3.5 w-3.5 text-primary" />
            <span>Overview</span>
          </Button>
        </Link>
      </div>
    </header>
  )
}
