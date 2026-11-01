import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { format } from 'date-fns'
import { Loader2, MessageCircle, Send, TrendingUp, Zap } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  analyticsKeywordsOptions,
  analyticsSummaryOptions,
  analyticsTimelineOptions,
} from '@/features/analytics/analyticsQueries'

const PERIODS = [7, 30, 90] as const

const fmtMetric = (n?: number) => new Intl.NumberFormat().format(n ?? 0)

export function AnalyticsPage() {
  const [days, setDays] = useState<number>(30)

  const summary = useQuery(analyticsSummaryOptions(days))
  const timeline = useQuery(analyticsTimelineOptions(days))
  const keywordStats = useQuery(analyticsKeywordsOptions())

  const chartData = (timeline.data?.timeline ?? []).map((d) => ({
    ...d,
    label: d.date ? format(new Date(d.date), 'dd.MM') : '',
  }))

  const emptyTimeline = chartData.every((d) => d.dmsSent === 0 && d.commentsProcessed === 0)

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 md:p-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
            <TrendingUp className="size-6 text-primary" aria-hidden="true" />
            Analytics
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Конверсия комментариев в ДМ, топ-правила и динамика.
          </p>
        </div>
        <div className="flex gap-1 rounded-lg border p-1" role="tablist" aria-label="Период">
          {PERIODS.map((d) => (
            <button
              key={d}
              role="tab"
              aria-selected={days === d}
              onClick={() => setDays(d)}
              className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
                days === d
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:bg-muted'
              }`}
            >
              {d} дней
            </button>
          ))}
        </div>
      </header>

      {/* Метрики */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {summary.isLoading ? (
          [...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)
        ) : summary.data ? (
          <>
            <MetricCard label="ДМ отправлено" value={fmtMetric(summary.data.totalDmsSent)} icon={Send} />
            <MetricCard
              label="Комментарии"
              value={fmtMetric(summary.data.totalCommentsProcessed)}
              icon={MessageCircle}
            />
            <MetricCard
              label="Успешность"
              value={`${summary.data.successRate}%`}
              icon={TrendingUp}
              highlight
            />
            <MetricCard
              label="Совпадений"
              value={fmtMetric(summary.data.totalKeywordMatches)}
              icon={Zap}
            />
          </>
        ) : (
          <p className="col-span-full rounded-xl border p-6 text-center text-sm text-muted-foreground">
            Не удалось загрузить метрики — проверьте соединение с бэкендом.
          </p>
        )}
      </div>

      {/* График динамики */}
      <Card className="p-0">
        <CardHeader className="border-b p-4">
          <h2 className="font-semibold">Динамика активности</h2>
        </CardHeader>
        <CardContent className="p-4">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 8, left: -12, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradDms" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradComments" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--chart-2)" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="var(--chart-2)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
                  tickLine={false}
                  axisLine={false}
                  minTickGap={24}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    background: 'var(--popover)',
                    border: '1px solid var(--border)',
                    borderRadius: 12,
                    fontSize: 12,
                    color: 'var(--popover-foreground)',
                  }}
                  labelStyle={{ fontWeight: 600 }}
                />
                <Area
                  type="monotone"
                  dataKey="commentsProcessed"
                  name="Комментариев"
                  stroke="var(--chart-2)"
                  fill="url(#gradComments)"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="dmsSent"
                  name="ДМ"
                  stroke="var(--chart-1)"
                  fill="url(#gradDms)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          {emptyTimeline && !timeline.isLoading && (
            <p className="mt-2 rounded-lg bg-muted px-3 py-2 text-center text-sm text-muted-foreground">
              Активности пока нет — запустите обработку комментариев на дашборде.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Табы */}
      <Tabs defaultValue="keywords">
        <TabsList>
          <TabsTrigger value="keywords">Топ правил</TabsTrigger>
          <TabsTrigger value="timeline">Таблица</TabsTrigger>
        </TabsList>

        <TabsContent value="keywords">
          <Card className="p-0">
            <CardContent className="p-4">
              {keywordStats.isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="size-5 animate-spin text-muted-foreground" />
                </div>
              ) : (keywordStats.data?.keywordStats.length ?? 0) === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  Правил ещё нет — создайте первое на странице Keywords.
                </p>
              ) : (
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={(keywordStats.data?.keywordStats ?? []).slice(0, 5)}
                        margin={{ top: 4, right: 8, left: -20, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                        <XAxis
                          dataKey="keyword"
                          tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
                          tickLine={false}
                          axisLine={false}
                          interval={0}
                        />
                        <YAxis
                          tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
                          tickLine={false}
                          axisLine={false}
                          allowDecimals={false}
                        />
                        <Tooltip
                          contentStyle={{
                            background: 'var(--popover)',
                            border: '1px solid var(--border)',
                            borderRadius: 12,
                            fontSize: 12,
                            color: 'var(--popover-foreground)',
                          }}
                        />
                        <Bar
                          dataKey="matchCount"
                          name="Срабатываний"
                          fill="var(--chart-1)"
                          radius={[6, 6, 0, 0]}
                          maxBarSize={40}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <ul className="space-y-2">
                    {(keywordStats.data?.keywordStats ?? []).slice(0, 5).map((k) => (
                      <li
                        key={k.keyword}
                        className="flex items-center justify-between rounded-lg border px-3 py-2"
                      >
                        <div className="min-w-0">
                          <Badge className="font-mono">{k.keyword}</Badge>
                          {k.lastUsed && (
                            <p className="mt-1 text-xs text-muted-foreground">
                              Использовано {new Date(k.lastUsed).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                        <Badge variant="secondary">{k.matchCount} совп.</Badge>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {(keywordStats.data?.recentMatches.length ?? 0) > 0 && (
                <div className="mt-6">
                  <h3 className="mb-2 text-sm font-semibold">Недавние совпадения (7 дней)</h3>
                  <div className="overflow-x-auto rounded-lg border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Слово</TableHead>
                          <TableHead>Совпадений</TableHead>
                          <TableHead>ДМ</TableHead>
                          <TableHead>Конверсия</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {keywordStats.data!.recentMatches.map((m) => (
                          <TableRow key={m._id}>
                            <TableCell>
                              <Badge className="font-mono">{m._id}</Badge>
                            </TableCell>
                            <TableCell>{m.count}</TableCell>
                            <TableCell>{m.dmsSent}</TableCell>
                            <TableCell>
                              {m.count > 0 ? `${Math.round((m.dmsSent / m.count) * 100)}%` : '—'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="timeline">
          <Card className="p-0">
            <CardContent className="p-4">
              {timeline.isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="size-5 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="overflow-x-auto rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Дата</TableHead>
                        <TableHead>ДМ</TableHead>
                        <TableHead>Комментариев</TableHead>
                        <TableHead>Совпадений</TableHead>
                        <TableHead>Ошибок</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {[...chartData]
                        .slice(-14)
                        .reverse()
                        .map((d) => (
                          <TableRow key={d.date}>
                            <TableCell className="whitespace-nowrap">{d.label}</TableCell>
                            <TableCell>
                              <Badge variant={d.dmsSent > 0 ? 'default' : 'secondary'}>
                                {d.dmsSent}
                              </Badge>
                            </TableCell>
                            <TableCell>{d.commentsProcessed}</TableCell>
                            <TableCell>{d.keywordMatches}</TableCell>
                            <TableCell>
                              {d.errors > 0 ? (
                                <Badge variant="destructive">{d.errors}</Badge>
                              ) : (
                                <Badge variant="secondary">0</Badge>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function MetricCard({
  label,
  value,
  icon: Icon,
  highlight = false,
}: {
  label: string
  value: string
  icon: typeof Send
  highlight?: boolean
}) {
  return (
    <Card
      className={`p-0 ${highlight ? 'bg-brand-gradient text-white shadow-custom' : ''}`}
    >
      <CardContent className="p-4">
        <Icon
          className={`mb-2 size-4 ${highlight ? 'text-white' : 'text-primary'}`}
          aria-hidden="true"
        />
        <p className="text-2xl font-bold leading-none">{value}</p>
        <p className={`mt-1.5 text-xs ${highlight ? 'text-white/80' : 'text-muted-foreground'}`}>
          {label}
        </p>
      </CardContent>
    </Card>
  )
}
