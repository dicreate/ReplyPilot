import { Suspense } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import { BarChart3, LogOut, Menu, MessageSquareText, Moon, Sun, Workflow } from 'lucide-react'
import { useTheme } from 'next-themes'
import { twMerge } from 'tailwind-merge'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { useAuthStore } from '@/features/auth/authStore'
import { keywordsQueryOptions } from '@/features/keywords/keywordQueries'
import { rulesPluralKey, useT } from '@/lib/i18n'
import { useSettingsStore } from '@/store/settingsStore'
import { useUIStore } from '@/store/uiStore'

const NAV_ITEMS = [
  { to: '/dashboard', key: 'nav.dashboard' as const, icon: LayoutDashboardIcon },
  { to: '/keywords', key: 'nav.keywords' as const, icon: MessageSquareText },
  { to: '/funnels', key: 'nav.funnels' as const, icon: Workflow },
  { to: '/analytics', key: 'nav.analytics' as const, icon: BarChart3 },
] as const

function LayoutDashboardIcon(props: React.ComponentProps<typeof Workflow>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <rect width="7" height="9" x="3" y="3" rx="1" />
      <rect width="7" height="12" x="14" y="3" rx="1" />
      <rect width="7" height="7" x="14" y="16" rx="1" />
      <rect width="7" height="5" x="3" y="14" rx="1" />
    </svg>
  )
}

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const t = useT()
  return (
    <nav aria-label={t('nav.aria')} className="flex flex-col gap-1 px-2">
      {NAV_ITEMS.map(({ to, key, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          onClick={onNavigate}
          className={({ isActive }) =>
            twMerge(
              'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors outline-none',
              'hover:bg-accent hover:text-accent-foreground',
              isActive && 'bg-accent text-accent-foreground hover:bg-accent',
            )
          }
        >
          <Icon className="size-4 shrink-0" aria-hidden="true" />
          {t(key)}
        </NavLink>
      ))}
    </nav>
  )
}

function Brand() {
  return (
    <NavLink to="/dashboard" className="flex items-center gap-2 px-5 py-5">
      <img
        src="/apple-touch-icon.png"
        alt="Иконка ReplyPilot"
        className="size-8 shrink-0 rounded-xl shadow-sm"
      />
      <span className="text-lg font-bold tracking-tight text-gradient">ReplyPilot</span>
    </NavLink>
  )
}

function AutomationStatusBadge() {
  const user = useAuthStore((s) => s.user)
  const t = useT()
  const rulesQuery = useQuery({ ...keywordsQueryOptions(), enabled: !!user })

  if (!user) return null

  let variant: 'secondary' | 'outline' = 'secondary'
  let dotClass = 'bg-emerald-500'
  let text = t('status.checking')
  if (rulesQuery.isError) {
    variant = 'outline'
    dotClass = 'bg-muted-foreground/40'
    text = t('status.unavailable')
  } else if (rulesQuery.data) {
    const active = rulesQuery.data.filter((r) => r.isActive !== false).length
    if (active > 0) {
      text = `${active} ${t(rulesPluralKey(active))}`
    } else {
      variant = 'outline'
      dotClass = 'bg-muted-foreground/40'
      text = t('status.off')
    }
  }

  return (
    <Badge
      variant={variant}
      title={rulesQuery.data ? t('status.hint') : undefined}
      className="mt-0.5 h-5 max-w-full gap-1.5 px-1.5 text-[10px]"
    >
      <span className={`size-1.5 shrink-0 rounded-full ${dotClass}`} aria-hidden="true" />
      <span className="truncate">{text}</span>
    </Badge>
  )
}

function SidebarFooter() {
  const user = useAuthStore((s) => s.user)
  const clearAuth = useAuthStore((s) => s.clearAuth)
  const navigate = useNavigate()
  const { resolvedTheme, setTheme } = useTheme()
  const t = useT()
  const lang = useSettingsStore((s) => s.lang)
  const setLang = useSettingsStore((s) => s.setLang)

  const handleLogout = () => {
    clearAuth()
    navigate('/')
  }

  return (
    <div className="mt-auto space-y-3 px-3 pb-4">
      <div className="flex items-center gap-2 px-2">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
          {(user?.username ?? '?')[0].toUpperCase()}
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{user?.username ?? t('user.default')}</p>
          <AutomationStatusBadge />
        </div>
      </div>
      <Separator />
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={t('theme.toggle')}
          title={t('theme.toggle')}
          onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
        >
          <Sun className="dark:hidden" />
          <Moon className="hidden dark:block" />
        </Button>
        <div
          className="ml-auto flex items-center rounded-md border p-0.5"
          role="group"
          aria-label={t('lang.label')}
        >
          {(['ru', 'en'] as const).map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => setLang(l)}
              aria-pressed={lang === l}
              className={twMerge(
                'rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase transition-colors',
                lang === l ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {l}
            </button>
          ))}
        </div>
        <Button
          variant="ghost"
          size="icon-sm"
          className="ml-1 text-muted-foreground hover:text-destructive"
          aria-label={t('auth.logoutAria')}
          title={t('auth.logout')}
          onClick={handleLogout}
        >
          <LogOut className="size-4" />
        </Button>
      </div>
    </div>
  )
}

export function AppLayout() {
  const isMobileNavOpen = useUIStore((s) => s.isMobileNavOpen)
  const setMobileNavOpen = useUIStore((s) => s.setMobileNavOpen)

  return (
    <div className="min-h-svh bg-background">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r bg-sidebar text-sidebar-foreground md:flex">
        <Brand />
        <Separator />
        <div className="flex flex-1 flex-col overflow-y-auto pt-3">
          <NavLinks />
          <SidebarFooter />
        </div>
      </aside>

      {/* Mobile top bar + drawer */}
      <header className="sticky top-0 z-40 flex h-14 items-center gap-2 border-b bg-background/95 px-4 backdrop-blur md:hidden">
        <Sheet open={isMobileNavOpen} onOpenChange={setMobileNavOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Открыть меню">
              <Menu className="size-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="flex w-72 flex-col gap-0 p-0">
            <SheetTitle className="sr-only">Navigation</SheetTitle>
            <Brand />
            <Separator />
            <div className="flex flex-1 flex-col pt-3">
              <NavLinks onNavigate={() => setMobileNavOpen(false)} />
              <SidebarFooter />
            </div>
          </SheetContent>
        </Sheet>
        <span className="text-lg font-bold text-gradient">ReplyPilot</span>
      </header>

      <main className="md:pl-64">
        <Suspense
          fallback={
            <div className="flex h-svh items-center justify-center text-muted-foreground text-sm">
              Loading…
            </div>
          }
        >
          <Outlet />
        </Suspense>
      </main>
    </div>
  )
}
