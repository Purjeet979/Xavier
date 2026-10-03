import { Link } from '@tanstack/react-router'
import { FileText, Settings, ChevronLeft, ChevronRight, History, Menu, Sun, Moon, Plus, FolderOpen, Compass } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Logo } from '@/components/ui/logo'
import { useTheme } from '@/components/theme-provider'

interface SidebarProps {
  isCollapsed: boolean
  onToggle: () => void
  isMobileOpen?: boolean
  onMobileClose?: () => void
}

export function Sidebar({ isCollapsed, onToggle, isMobileOpen = false, onMobileClose }: SidebarProps) {
  const { theme, setTheme } = useTheme()
  const links = [
    { to: '/', label: 'Home', icon: Compass },
    { to: '/chat', label: 'Study Assistant', icon: Plus },
    { to: '/documents', label: 'Documents', icon: FileText },
    { to: '/history', label: 'History', icon: History },
    { to: '/projects', label: 'Workspaces', icon: FolderOpen },
    { to: '/settings', label: 'Settings', icon: Settings },
  ]

  return (
    <>
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm md:hidden"
          onClick={onMobileClose}
        />
      )}

      <aside
        className={cn(
          "border-r border-border bg-sidebar flex flex-col h-screen shrink-0 transition-all duration-300 ease-in-out",
          "fixed inset-y-0 left-0 z-50 w-64 md:relative md:z-auto md:translate-x-0",
          isMobileOpen ? "translate-x-0 shadow-xl" : "-translate-x-full",
          isCollapsed ? "md:w-16" : "md:w-56"
        )}
      >
        <div
          className={cn(
            "h-16 border-b border-border flex items-center transition-all duration-300 ease-in-out px-4",
            isCollapsed ? "md:px-2 md:justify-center" : "md:px-4 md:justify-between md:gap-2",
            "justify-between"
          )}
        >
          <Link to="/" className="flex items-center gap-2.5 overflow-hidden shrink-0 hover:opacity-90 transition-opacity">
            <Logo size={26} className="text-primary" />
            {(!isCollapsed || isMobileOpen) && (
              <div className="flex flex-col min-w-0">
                <span className="font-heading text-sm font-semibold text-foreground tracking-tight truncate leading-none">
                  Gyaanसूत्र
                </span>
                <span className="text-[10px] text-muted-foreground font-normal tracking-wide truncate mt-1">
                  StudyGround
                </span>
              </div>
            )}
          </Link>
          {isMobileOpen && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onMobileClose}
              className="h-8 w-8 rounded-xl md:hidden text-muted-foreground hover:text-foreground hover:bg-secondary"
            >
              <Menu className="h-4 w-4" />
            </Button>
          )}
        </div>

        <nav className={cn("flex-1 py-4 space-y-1 transition-all duration-300", (isCollapsed && !isMobileOpen) ? "px-2" : "px-3")}>
          {links.map((link) => {
            const Icon = link.icon
            const showLabel = !isCollapsed || isMobileOpen
            if (link.to === '/chat') {
              return (
                <Link
                  key={link.to}
                  to="/chat"
                  search={{ clear: '1' }}
                  title={(isCollapsed && !isMobileOpen) ? link.label : undefined}
                  activeProps={{
                    className: cn(
                      'text-primary font-medium bg-accent/80 border border-primary/20',
                      showLabel && 'shadow-none'
                    ),
                  }}
                  inactiveProps={{
                    className: 'text-muted-foreground hover:bg-secondary hover:text-foreground border border-transparent',
                  }}
                  className={cn(
                    "flex items-center rounded-xl transition-colors duration-150",
                    (isCollapsed && !isMobileOpen)
                      ? "justify-center h-10 w-10 mx-auto"
                      : "gap-3 px-3 py-2 text-xs font-medium"
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {showLabel && <span className="truncate">{link.label}</span>}
                </Link>
              )
            }
            return (
              <Link
                key={link.to}
                to={link.to}
                title={(isCollapsed && !isMobileOpen) ? link.label : undefined}
                activeProps={{
                  className: cn(
                    'text-primary font-medium bg-accent/80 border border-primary/20',
                    showLabel && 'shadow-none'
                  ),
                }}
                inactiveProps={{
                  className: 'text-muted-foreground hover:bg-secondary hover:text-foreground border border-transparent',
                }}
                className={cn(
                  "flex items-center rounded-xl transition-colors duration-150",
                  (isCollapsed && !isMobileOpen)
                    ? "justify-center h-10 w-10 mx-auto"
                    : "gap-3 px-3 py-2 text-xs font-medium"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {showLabel && <span className="truncate">{link.label}</span>}
              </Link>
            )
          })}
        </nav>

        <div
          className={cn(
            "p-3 border-t border-border flex items-center transition-all duration-300 gap-2 shrink-0",
            (isCollapsed && !isMobileOpen) ? "flex-col justify-center" : "flex-row justify-between"
          )}
        >
          <Button
            variant='ghost'
            size='icon'
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className='h-9 w-9 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary'
          >
            {theme === 'dark' ? (
              <Sun className='h-4 w-4 text-warning' />
            ) : (
              <Moon className='h-4 w-4' />
            )}
            <span className='sr-only'>Toggle theme</span>
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={onToggle}
            className="h-9 w-9 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary hidden md:flex"
          >
            {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>
      </aside>
    </>
  )
}
