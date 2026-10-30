import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import {
  ArrowRight,
  Infinity as InfinityIcon,
  KeyRound,
  MessageSquare,
  MessagesSquare,
  Plus,
  Search,
  TrendingUp,
  Workflow,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { keywordsQueryOptions } from '@/features/keywords/keywordQueries'
import type { KeywordRule } from '@/types/api'

/*** Мини-превью цепочки воронки: триггер → шаги (нажимаемо). */
function FunnelChainChip({ rule }: { rule: KeywordRule }) {
  const steps = rule.steps ?? []
  if (steps.length === 0) return null
  return (
    <div className="flex flex-wrap items-center gap-1.5 text-xs">
      <span className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-1.5 py-1 font-medium text-primary">
        <KeyRound className="size-3" aria-hidden="true" />
        {rule.keyword}
      </span>
      {steps.slice(0, 4).map((s, i) => (
        <span key={s.id} className="flex items-center gap-1.5">
          <ArrowRight className="size-3 text-muted-foreground" aria-hidden="true" />
          <span className="rounded-md bg-muted px-1.5 py-1">{s.name || `Шаг ${i + 2}`}</span>
        </span>
      ))}
      {steps.length > 4 && (
        <Badge variant="outline" className="ml-1">
          +{steps.length - 4}
        </Badge>
      )}
    </div>
  )
}

export function FunnelsPage() {
  const { data: keywords = [], isLoading } = useQuery(keywordsQueryOptions())
  const navigate = useNavigate()
  // Локальный поиск: без сет-стейта строки адреса — это не лист «жанра», а каталог карточек
  const [query, setQuery] = useState<string>('')

  const funnels = useMemo(() => {
    const q = query.trim().toLowerCase()
    return q
      ? keywords.filter(
          (k) => k.keyword.includes(q) || k.message.toLowerCase().includes(q),
        )
      : keywords
  }, [keywords, query])

  const withSteps = funnels.filter((r) => (r.steps?.length ?? 0) > 0)
  const simple = funnels.filter((r) => (r.steps?.length ?? 0) === 0)

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 md:p-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
            <Workflow className="size-6 text-primary" aria-hidden="true" />
            Funnels
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Визуальные цепочки: пользователь нажимает кнопку — получает следующий шаг.
          </p>
        </div>
        <Button onClick={() => navigate('/keywords')} className="gap-2">
          <Plus className="size-4" />
          Новая воронка
        </Button>
      </header>

      <div className="relative max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Поиск по воронкам…"
          className="pl-9"
          aria-label="Поиск воронок"
        />
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-xl" />
          ))}
        </div>
      ) : funnels.length === 0 ? (
        <EmptyState onCreate={() => navigate('/keywords')} />
      ) : (
        <>
          {withSteps.length > 0 && <SectionTitle icon={MessagesSquare}>С воронками</SectionTitle>}
          <div className="grid gap-4 md:grid-cols-2">
            {withSteps.map((rule, i) => (
              <FunnelCard key={rule._id} rule={rule} index={i} onOpen={navigate} openLabel="Редактор" />
            ))}
          </div>
          {simple.length > 0 && <SectionTitle icon={MessageSquare}>Нужна воронка</SectionTitle>}
          <div className="grid gap-4 md:grid-cols-2">
            {simple.map((rule, i) => (
              <FunnelCard key={rule._id} rule={rule} index={i} onOpen={navigate} openLabel="Построить" />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function SectionTitle({ icon: Icon, children }: { icon: typeof MessageSquare; children: React.ReactNode }) {
  return (
    <h2 className="mt-2 flex items-center gap-2 text-sm font-semibold text-muted-foreground">
      <Icon className="size-4" aria-hidden="true" />
      {children}
    </h2>
  )
}

const FUNNEL_CARD_MOTION = { duration: 0.25, ease: 'easeOut' as const }

function FunnelCard({
  rule,
  index,
  onOpen,
  openLabel,
}: {
  rule: KeywordRule
  index: number
  onOpen: (path: string) => void
  openLabel: string
}) {
  const stepsCount = (rule.steps?.length ?? 0) + 1
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...FUNNEL_CARD_MOTION, delay: Math.min(index * 0.04, 0.25) }}
    >
      <Card
        role="button"
        tabIndex={0}
        aria-label={`Открыть воронку ${rule.keyword}`}
        className="group h-full cursor-pointer transition-all hover:border-primary/50 hover:shadow-md focus-visible:outline-2 focus-visible:outline-ring focus-visible:-outline-offset-2"
        onClick={() => onOpen(`/funnels/${rule._id}`)}
        onKeyDown={(e) => e.key === 'Enter' && onOpen(`/funnels/${rule._id}`)}
      >
        <CardHeader className="flex-row items-center justify-between gap-2 p-4 pb-2">
          <span className="inline-flex items-center gap-1.5">
            <Badge className="font-mono">{rule.keyword}</Badge>
            {rule.messageForNonFollowers && (
              <Badge variant="outline" title="Follow-gate активен">
                <InfinityIcon className="size-3" />
                gate
              </Badge>
            )}
          </span>
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <TrendingUp className="size-3" aria-hidden="true" />
            {rule.matchCount ?? 0}
          </span>
        </CardHeader>
        <CardContent className="space-y-3 p-4 pt-0">
          <p className="line-clamp-2 min-h-10 text-sm text-muted-foreground">{rule.message}</p>
          <FunnelChainChip rule={rule} />
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <MessagesSquare className="size-3.5" aria-hidden="true" />
              {stepsCount} сообщ.
            </span>
            <Button size="sm" variant="ghost" className="gap-1 text-primary" tabIndex={-1}>
              {openLabel}
              <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center gap-3 p-10 text-center">
        <span className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Workflow className="size-7" aria-hidden="true" />
        </span>
        <h2 className="text-lg font-semibold">Воронок нет</h2>
        <p className="max-w-md text-sm text-muted-foreground">
          Правило (ключевое слово) — это и есть воронка. Создайте правило и собирайте цепочку
          сообщений на канве.
        </p>
        <Button onClick={onCreate} className="gap-2">
          <Plus className="size-4" />
          Создать правило
        </Button>
      </CardContent>
    </Card>
  )
}
