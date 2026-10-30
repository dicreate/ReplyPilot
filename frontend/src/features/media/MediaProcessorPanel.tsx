import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  Ban,
  CheckCircle2,
  ChevronDown,
  CircleAlert,
  Eye,
  EyeOff,
  ImageOff,
  Loader2,
  MessageCircle,
  RefreshCw,
  Send,
  Timer,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { toast } from 'sonner'
import { mediaKeys, processMedia, processingHistoryOptions, recentMediaOptions } from './mediaQueries'
import type { HistoryItem, ProcessResult } from '@/types/api'

/** Пресеты периода обработки комментариев */
const PERIODS = [
  { value: '24', label: '24 часа' },
  { value: '48', label: '2 дня' },
  { value: '168', label: '7 дней' },
  { value: '720', label: '30 дней' },
  { value: 'all', label: 'За всё время' },
  { value: 'custom', label: 'Свой…' },
] as const

const EXTRACT_PATTERNS = [
  /instagram\.com\/p\/([A-Za-z0-9_-]+)/,
  /instagram\.com\/reel\/([A-Za-z0-9_-]+)/,
  /instagram\.com\/tv\/([A-Za-z0-9_-]+)/,
]

function extractMediaId(input: string): string {
  for (const re of EXTRACT_PATTERNS) {
    const m = input.match(re)
    if (m) return m[1]!
  }
  return input
}

export function MediaProcessorPanel() {
  const qc = useQueryClient()
  const [query, setQuery] = useState('')
  const [periodPreset, setPeriodPreset] = useState<string>('48')
  const [customHours, setCustomHours] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [showHistory, setShowHistory] = useState(false)
  const [errorsOnly, setErrorsOnly] = useState(false)
  const [lastResult, setLastResult] = useState<ProcessResult | null>(null)

  const recentQuery = useQuery(recentMediaOptions())

  const process = useMutation({
    mutationFn: processMedia,
    onSuccess: (data) => {
      setLastResult(data)
      setSelectedId(null)
      setQuery('')
      qc.invalidateQueries({ queryKey: mediaKeys.all })
      toast.success('Комментарии обработаны', {
        description: `${data.dmsSent} ДМ отправлено, ${data.keywordMatches} совпадений`,
      })
    },
    onError: (err) => {
      const message =
        (err as { response?: { data?: { message?: string } } }).response?.data?.message ??
        'Не удалось обработать'
      toast.error(message)
    },
  })

  const historyQuery = useQuery({
    ...processingHistoryOptions(errorsOnly),
    enabled: showHistory,
  })

  const resolveMediaId = (): { id: string; error?: string } => {
    if (selectedId) return { id: selectedId }
    const raw = query.trim()
    if (!raw) return { id: '', error: 'Вставьте ссылку на пост или ID' }
    return { id: extractMediaId(raw) }
  }

  const handleProcess = async () => {
    const { id, error } = resolveMediaId()
    if (error || !id) {
      toast.error(error ?? 'Укажите пост')
      return
    }
    if (!/^\d+$/.test(id)) {
      toast.error('Некорректный ID поста (должно быть число)')
      return
    }
    let sinceHours: number | undefined
    if (periodPreset === 'custom') {
      const h = Number(customHours)
      if (!Number.isFinite(h) || h <= 0) {
        toast.error('Укажите положительное число часов')
        return
      }
      sinceHours = h
    } else if (periodPreset !== 'all') {
      sinceHours = Number(periodPreset)
    }
    await process.mutateAsync({ mediaId: id, sinceHours })
  }

  const stats = lastResult
    ? [
        { label: 'Комментариев', value: lastResult.totalComments, icon: MessageCircle, color: 'text-primary' },
        { label: 'Новых', value: lastResult.newComments, icon: RefreshCw, color: 'text-chart-2' },
        { label: 'Совпадений', value: lastResult.keywordMatches, icon: Timer, color: 'text-chart-4' },
        { label: 'ДМ отправлено', value: lastResult.dmsSent, icon: Send, color: 'text-chart-3' },
      ]
    : []

  const storage = historyQuery.data?.storage

  return (
    <Card className="p-0">
      <CardHeader className="flex-row items-center justify-between gap-2 border-b p-4">
        <h2 className="flex items-center gap-2 font-semibold">
          <MessageCircle className="size-4 text-primary" aria-hidden="true" />
          Обработка комментариев
        </h2>
        <Badge variant="secondary" className="gap-1">
          <Eye className="size-3" /> Ручной запуск
        </Badge>
      </CardHeader>
      <CardContent className="space-y-5 p-4">
        {/* Форма запуска */}
        <div className="grid gap-3 md:grid-cols-[1fr_auto]">
          <div className="space-y-1.5">
            <Label htmlFor="media-input" className="text-xs text-muted-foreground">
              Ссылка Instagram или ID поста
            </Label>
            <Input
              id="media-input"
              value={selectedId ?? query}
              placeholder="instagram.com/p/… или 3415…"
              disabled={process.isPending}
              onChange={(e) => {
                setSelectedId(null)
                setQuery(e.target.value)
              }}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="media-period" className="text-xs text-muted-foreground">
              Комментарии за
            </Label>
            <div className="flex gap-2">
              <select
                id="media-period"
                value={periodPreset}
                disabled={process.isPending}
                onChange={(e) => setPeriodPreset(e.target.value)}
                className="h-9 min-w-36 rounded-lg border bg-transparent px-3 text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40"
              >
                {PERIODS.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
              {...(periodPreset === 'custom'
                ? [
                    <Input
                      key="custom-hours"
                      type="number"
                      min="1"
                      value={customHours}
                      placeholder="Часов"
                      className="w-24"
                      disabled={process.isPending}
                      onChange={(e) => setCustomHours(e.target.value)}
                      aria-label="Часов назад"
                    />,
                  ]
                : [])}
              <Button
                onClick={handleProcess}
                disabled={process.isPending}
                className="gap-2 md:min-w-40"
              >
                {process.isPending ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Обработка…
                  </>
                ) : (
                  <>
                    <Send className="size-4" />
                    Обработать
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Недавние посты */}
        {!recentQuery.isLoading && (recentQuery.data?.length ?? 0) > 0 && (
          <section>
            <p className="mb-2 text-xs font-semibold text-muted-foreground">
              Ваши недавние посты — кликните для выбора:
            </p>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6">
              {recentQuery.data!.slice(0, 12).map((media, i) => {
                const selected = selectedId === media.id
                const thumb = media.thumbnail_url || media.media_url
                return (
                  <motion.button
                    key={media.id}
                    type="button"
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.2, delay: i * 0.02 }}
                    aria-pressed={selected}
                    title={media.caption ?? media.id}
                    onClick={() => setSelectedId(selected ? null : media.id)}
                    className={`group relative aspect-square overflow-hidden rounded-lg border transition-all ${
                      selected
                        ? 'border-2 border-primary shadow-md'
                        : 'hover:border-primary/60 hover:shadow-sm'
                    }`}
                  >
                    {thumb ? (
                      <img
                        src={thumb}
                        alt={media.caption?.slice(0, 60) ?? 'Пост'}
                        loading="lazy"
                        className="size-full object-cover transition-transform group-hover:scale-105"
                      />
                    ) : (
                      <span className="flex size-full items-center justify-center bg-muted text-muted-foreground">
                        <ImageOff className="size-5" aria-hidden="true" />
                      </span>
                    )}
                    <span className="absolute inset-x-0 bottom-0 flex items-center gap-1 bg-gradient-to-t from-black/70 to-transparent px-1.5 pb-1 pt-4 text-[10px] font-medium text-white">
                      <MessageCircle className="size-2.5" aria-hidden="true" />
                      {media.comments_count ?? 0}
                    </span>
                  </motion.button>
                )
              })}
            </div>
          </section>
        )}

        {/* Результаты последнего запуска */}
        {lastResult && (
          <motion.section
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-2"
          >
            <Separator />
            <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
              {stats.map(({ label, value, icon: Icon, color }) => (
                <div key={label} className="rounded-xl border bg-card p-3">
                  <Icon className={`mb-1.5 size-4 ${color}`} aria-hidden="true" />
                  <p className="text-xl font-bold leading-none">{value}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{label}</p>
                </div>
              ))}
            </div>
            {(lastResult.skippedByAge ?? 0) > 0 && (
              <p className="flex items-center gap-1.5 rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">
                <Timer className="size-3.5" aria-hidden="true" />
                {lastResult.skippedByAge} комментарий(ев) пропущено по фильтру возраста — расширьте
                период.
              </p>
            )}
            {(lastResult.errors ?? 0) > 0 && (
              <p className="flex items-center gap-1.5 rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">
                <CircleAlert className="size-3.5" aria-hidden="true" />
                Ошибок при обработке: {lastResult.errors}
              </p>
            )}
            {(lastResult.processedComments?.length ?? 0) > 0 && (
              <ProcessedComments comments={lastResult.processedComments!} />
            )}
          </motion.section>
        )}

        {/* История обработки */}
        <section>
          <div className="flex items-center justify-between">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="gap-1.5 text-muted-foreground"
              onClick={() => setShowHistory((v) => !v)}
              aria-expanded={showHistory}
            >
              {showHistory ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              История обработки
              <ChevronDown
                className={`size-4 transition-transform ${showHistory ? 'rotate-180' : ''}`}
              />
            </Button>
            {showHistory && (
              <div className="flex items-center gap-2">
                <Label htmlFor="errors-only" className="text-xs text-muted-foreground">
                  Только ошибки
                </Label>
                <Switch
                  id="errors-only"
                  checked={errorsOnly}
                  onCheckedChange={setErrorsOnly}
                />
              </div>
            )}
          </div>

          {storage && (
            <p className="mt-2 text-xs text-muted-foreground">
              Хранится {storage.total} комментарий(ев)
              {storage.ttlDays ? ` • авто-удаление через ${storage.ttlDays} дн.` : ''}
              {storage.totalErrorsAllTime ? ` • ошибок всего: ${storage.totalErrorsAllTime}` : ''}
            </p>
          )}

          {showHistory && <HistoryTable history={historyQuery.data?.history ?? []} loading={historyQuery.isLoading} />}
        </section>
      </CardContent>
    </Card>
  )
}

function ProcessedComments({ comments }: { comments: NonNullable<ProcessResult['processedComments']> }) {
  return (
    <div className="overflow-x-auto rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Автор</TableHead>
            <TableHead>Комментарий</TableHead>
            <TableHead>Ключевое слово</TableHead>
            <TableHead>ДМ</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {comments.map((comment: { author: string; text: string; keywordMatched?: string | null; dmSent?: boolean }, i: number) => (
            <TableRow key={i}>
              <TableCell className="whitespace-nowrap text-xs">@{comment.author}</TableCell>
              <TableCell className="max-w-56 truncate text-xs">{comment.text}</TableCell>
              <TableCell className="text-xs">
                {comment.keywordMatched ? (
                  <Badge className="font-mono">{comment.keywordMatched}</Badge>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </TableCell>
              <TableCell>
                {comment.dmSent ? (
                  <CheckCircle2 className="size-4 text-chart-2" aria-hidden="true" />
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

function HistoryTable({ history, loading }: { history: HistoryItem[]; loading: boolean }) {
  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" /> Загрузка истории…
      </div>
    )
  }
  if (history.length === 0) {
    return <p className="py-6 text-center text-sm text-muted-foreground">История пока пуста</p>
  }
  return (
    <div className="mt-2 overflow-x-auto rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Дата</TableHead>
            <TableHead>Автор</TableHead>
            <TableHead>Комментарий</TableHead>
            <TableHead>Ключевое слово</TableHead>
            <TableHead>ДМ</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {history.map((item) => (
            <TableRow key={item._id}>
              <TableCell className="whitespace-nowrap text-xs">
                {new Date(item.processedAt).toLocaleString()}
              </TableCell>
              <TableCell className="whitespace-nowrap text-xs">@{item.commentAuthor}</TableCell>
              <TableCell className="max-w-56 truncate text-xs">{item.commentText}</TableCell>
              <TableCell className="text-xs">
                {item.keywordMatched ? (
                  <Badge className="font-mono">{item.keywordMatched}</Badge>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </TableCell>
              <TableCell>
                {item.dmSent ? (
                  <CheckCircle2 className="size-4 text-chart-2" aria-label="Отправлено" />
                ) : item.errorMessage ? (
                  <Badge variant="destructive" title={item.errorMessage} className="gap-1">
                    <Ban className="size-3" /> ошибка
                  </Badge>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

/* utils */
