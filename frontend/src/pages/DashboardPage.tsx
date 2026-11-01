import { useNavigate, Link } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import {
  ArrowRight,
  KeyRound,
  MessageCircle,
  Plus,
  Send,
  Sparkles,
  TrendingUp,
  Workflow,
  Zap,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuthStore } from '@/features/auth/authStore'
import { analyticsSummaryOptions, analyticsTimelineOptions } from '@/features/analytics/analyticsQueries'
import { keywordsQueryOptions } from '@/features/keywords/keywordQueries'
import { MediaProcessorPanel } from '@/features/media/MediaProcessorPanel'

export function DashboardPage() {
  const user = useAuthStore((s) => s.user)
  const navigate = useNavigate()

  const summary = useQuery(analyticsSummaryOptions(30))
  const timeline = useQuery(analyticsTimelineOptions(14))
  const keywords = useQuery(keywordsQueryOptions())

  const activeRules = keywords.data?.length ?? 0
  const funnelsCount = keywords.data?.filter((r) => (r.steps?.length ?? 0) > 0).length ?? 0
  const last7 = timeline.data?.timeline.slice(-7) ?? []
  const weekDms = last7.reduce((acc, d) => acc + (d.dmsSent || 0), 0)

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 md:p-6">
      {/* Hero */}
      <section className="bg-brand-gradient relative overflow-hidden rounded-3xl p-6 text-white shadow-custom md:p-8">
        <div aria-hidden="true" className="absolute -top-20 -right-20 size-64 rounded-full bg-white/10 blur-3xl" />
        <div className="relative flex flex-wrap items-start justify-between gap-6">
          <div>
            <p className="flex items-center gap-2 text-sm text-white/80">
              <Sparkles className="size-4" aria-hidden="true" />
              Автоматизация активна
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">
              С возвращением, {user?.username || 'Instagram User'}!
            </h1>
            <p className="mt-2 max-w-xl text-white/85">
              Управляйте автоответами, стройте воронки и следите за вовлечённостью — всё в одном
              месте.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-4 md:gap-6">
            {[
              { label: 'Правил', value: activeRules, icon: KeyRound, to: '/keywords' },
              { label: 'Воронок', value: funnelsCount, icon: Workflow, to: '/funnels' },
              { label: 'ДМ за 7 дн.', value: weekDms, icon: Send, to: '/analytics' },
            ].map(({ label, value, icon: Icon, to }) => (
              <Link
                key={label}
                to={to}
                className="rounded-2xl bg-white/15 px-4 py-3 text-center backdrop-blur transition-colors hover:bg-white/25 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-white"
              >
                <Icon className="mx-auto mb-1.5 size-4" aria-hidden="true" />
                <p className="text-2xl font-bold">{value}</p>
                <p className="text-[11px] text-white/80">{label}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Quick actions */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <ActionCard
          title="Создать правило"
          desc="Ключевое слово → автоответ"
          icon={Plus}
          onClick={() => navigate('/keywords')}
        />
        <ActionCard
          title="Собрать воронку"
          desc="Визуальный редактор цепочек"
          icon={Workflow}
          onClick={() => navigate('/funnels')}
        />
        <ActionCard
          title="Аналитика"
          desc="Графики и конверсия"
          icon={TrendingUp}
          onClick={() => navigate('/analytics')}
        />
        <ActionCard
          title="Обработать комментарии"
          desc="Ручной запуск по посту"
          icon={Zap}
          onClick={() => document.getElementById('media-panel')?.scrollIntoView({ behavior: 'smooth' })}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <div id="media-panel" className="scroll-mt-20">
          <MediaProcessorPanel />
        </div>

        {/* Right rail */}
        <div className="space-y-6">
          <Card className="p-0">
            <CardHeader className="border-b p-4">
              <h2 className="font-semibold">Метрики 30 дней</h2>
            </CardHeader>
            <CardContent className="space-y-3 p-4">
              {summary.isLoading ? (
                <Skeleton className="h-24 rounded-xl" />
              ) : summary.data ? (
                <>
                  <MetricRow icon={Send} label="ДМ отправлено" value={summary.data.totalDmsSent} />
                  <MetricRow
                    icon={MessageCircle}
                    label="Комментариев обработано"
                    value={summary.data.totalCommentsProcessed}
                  />
                  <MetricRow
                    icon={TrendingUp}
                    label="Успешность"
                    value={`${summary.data.successRate}%`}
                  />
                  {(summary.data.totalErrors ?? 0) > 0 && (
                    <Badge variant="secondary" className="gap-1">
                      <Zap className="size-3" /> Ошибок за период: {summary.data.totalErrors}
                    </Badge>
                  )}
                  <Button variant="ghost" size="sm" className="w-full gap-1 text-primary" onClick={() => navigate('/analytics')}>
                    Открыть аналитику
                    <ArrowRight className="size-3.5" />
                  </Button>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Метрики появятся после первых обработок.
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="p-0">
            <CardHeader className="border-b p-4">
              <h2 className="font-semibold">Активность за неделю</h2>
            </CardHeader>
            <CardContent className="p-4">
              {last7.length === 0 ? (
                <p className="text-sm text-muted-foreground">Пока нет данных за неделю.</p>
              ) : (
                <ul className="space-y-2">
                  {last7.map((day) => (
                    <li key={day.date} className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        {new Date(day.date).toLocaleDateString(undefined, {
                          day: 'numeric',
                          month: 'short',
                        })}
                      </span>
                      <span className="flex items-center gap-2">
                        <Badge variant={day.dmsSent > 0 ? 'default' : 'secondary'}>
                          {day.dmsSent} ДМ
                        </Badge>
                        <Badge variant="outline">{day.commentsProcessed} комм.</Badge>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

function MetricRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Send
  label: string
  value: number | string
}) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2">
      <span className="flex items-center gap-2 text-sm text-muted-foreground">
        <Icon className="size-4" aria-hidden="true" />
        {label}
      </span>
      <span className="font-bold">{value}</span>
    </div>
  )
}

function ActionCard({
  title,
  desc,
  icon: Icon,
  onClick,
}: {
  title: string
  desc: string
  icon: typeof Plus
  onClick: () => void
}) {
  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}
      className="cursor-pointer transition-all hover:border-primary/50 hover:shadow-md focus-visible:outline-2 focus-visible:outline-ring focus-visible:-outline-offset-2"
    >
      <CardContent className="flex items-center gap-3 p-4">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Icon className="size-5" aria-hidden="true" />
        </span>
        <span>
          <span className="block text-sm font-semibold">{title}</span>
          <span className="block text-xs text-muted-foreground">{desc}</span>
        </span>
      </CardContent>
    </Card>
  )
}
