import { useState, useEffect } from 'react'
import { useLocation } from '@tanstack/react-router'
import { Sidebar } from '@/components/layout/sidebar'
import { TopBar } from '@/components/layout/top-bar'
import { OfflineIndicator } from '@/components/layout/offline-indicator'
import { cn } from '@/lib/utils'
import bgSvg from '@/assets/bg.svg'
import bgLightSvg from '@/assets/bg-light.svg'
import { CustomCursor } from '@/components/ui/custom-cursor'

interface AppShellProps {
  children: React.ReactNode
}

export function AppShell({ children }: AppShellProps) {
  const location = useLocation()

  const [isCollapsed, setIsCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('sidebar-collapsed') === 'true'
    }
    return false
  })

  const toggleSidebar = () => {
    setIsCollapsed((prev) => {
      const next = !prev
      localStorage.setItem('sidebar-collapsed', String(next))
      return next
    })
  }

  const [isMobileOpen, setIsMobileOpen] = useState(false)

  useEffect(() => {
    setIsMobileOpen(false)
  }, [location.pathname])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'b') {
        event.preventDefault()
        toggleSidebar()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  const getPageTitle = (pathname: string) => {
    switch (pathname) {
      case '/':
      case '/landing':
        return 'Knowledge-Grounded Study Platform'
      case '/chat':
        return 'Study Assistant'
      case '/history':
        return 'History'
      case '/projects':
        return 'Projects'
      case '/documents':
        return 'Documents'
      case '/settings':
        return 'Settings'
      default:
        return 'Local RAG'
    }
  }

  useEffect(() => {
    if (location.pathname === '/' || location.pathname === '/landing') {
      document.title = 'Gyansutra (ज्ञानसूत्र) — Turn Your Study Material Into Knowledge'
    } else {
      document.title = `${getPageTitle(location.pathname)} | Gyaanसूत्र`
    }
  }, [location.pathname])

  if (location.pathname === '/' || location.pathname === '/landing') {
    return (
      <div className="min-h-screen w-full bg-background text-foreground overflow-x-hidden">
        <CustomCursor />
        {children}
        <OfflineIndicator />
      </div>
    )
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground">
      <CustomCursor />
      <Sidebar
        isCollapsed={isCollapsed}
        onToggle={toggleSidebar}
        isMobileOpen={isMobileOpen}
        onMobileClose={() => setIsMobileOpen(false)}
      />
      <div className="flex flex-col flex-1 min-w-0 h-full overflow-hidden relative bg-background">
        {/* Visible Sutra background pattern for light theme */}
        <div
          className="pointer-events-none absolute inset-0 opacity-20 dark:hidden bg-cover bg-center bg-no-repeat transition-opacity duration-500"
          style={{ backgroundImage: `url(${bgLightSvg})` }}
          aria-hidden
        />
        {/* Visible Sutra background pattern for dark theme */}
        <div
          className="pointer-events-none absolute inset-0 opacity-30 hidden dark:block bg-cover bg-center bg-no-repeat transition-opacity duration-500"
          style={{ backgroundImage: `url(${bgSvg})` }}
          aria-hidden
        />
        <div className="relative z-10 flex flex-col flex-1 min-h-0 overflow-hidden">
          <TopBar
            title={getPageTitle(location.pathname)}
            onMenuToggle={() => setIsMobileOpen((o) => !o)}
          />
          <main className={cn(
            'flex-1 min-h-0',
            location.pathname === '/chat'
              ? 'overflow-hidden flex flex-col'
              : 'overflow-y-auto p-4 md:p-6'
          )}>
            {location.pathname === '/chat' ? (
              <div className="flex flex-col flex-1 min-h-0 h-full">
                {children}
              </div>
            ) : (
              <div className="mx-auto max-w-7xl h-full flex flex-col page-enter">
                {children}
              </div>
            )}
          </main>
        </div>
      </div>
      <OfflineIndicator />
    </div>
  )
}
