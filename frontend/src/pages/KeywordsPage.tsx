import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import {
  Workflow,
  KeySquare,
  Plus,
  Pencil,
  Trash2,
  ImageCheck,
  Lock,
  Search,
  TrendingUp,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { KeywordFormDialog } from '@/features/keywords/components/KeywordFormDialog'
import { useKeywordMutations } from '@/features/keywords/useKeywordMutations'
import { keywordsQueryOptions } from '@/features/keywords/keywordQueries'
import type { KeywordRule } from '@/types/api'

const fmtDate = (iso?: string) =>
  iso ? new Date(iso).toLocaleDateString() : '—'

export function KeywordsPage() {
  const { data: keywords = [], isLoading } = useQuery(keywordsQueryOptions())
  const { remove } = useKeywordMutations()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<KeywordRule | null>(null)
  const [deleting, setDeleting] = useState<KeywordRule | null>(null)

  const query = searchParams.get('q') ?? ''
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return keywords
    return keywords.filter(
      (k) => k.keyword.toLowerCase().includes(q) || k.message.toLowerCase().includes(q),
    )
  }, [keywords, query])

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 md:p-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
            <KeySquare className="size-6 text-primary" aria-hidden="true" />
            Keywords
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Правила автоответов: комментарий с триггером — Директ-сообщение и воронка.
          </p>
        </div>
        <Button
          onClick={() => {
            setEditing(null)
            setDialogOpen(true)
          }}
          className="gap-2"
        >
          <Plus className="size-4" />
          Новое правило
        </Button>
      </header>

      <div className="relative max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) =>
            setSearchParams(e.target.value ? { q: e.target.value } : {}, { replace: true })
          }
          placeholder="Поиск по слову или тексту…"
          className="pl-9"
          aria-label="Поиск правил"
        />
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState onOpenDialog={() => setDialogOpen(true)} />
      ) : (
        <ul className="space-y-3">
          {filtered.map((rule, i) => (
            <motion.li
              key={rule._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: Math.min(i * 0.04, 0.3) }}
            >
              <Card className="overflow-hidden p-0">
                <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Badge className="font-mono">{rule.keyword}</Badge>
                      {(rule.mediaIds?.length ?? 0) > 0 ? (
                        <Badge variant="outline" title={rule.mediaIds?.join(', ')}>
                          <ImageCheck className="size-3" />
                          {rule.mediaIds?.length} пост(ов)
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Все посты</Badge>
                      )}
                      {(rule.steps?.length ?? 0) > 0 && (
                        <Badge variant="outline" className="border-primary/40 text-primary">
                          <Workflow className="size-3" />
                          {rule.steps!.length + 1} сообщения в воронке
                        </Badge>
                      )}
                      {(rule.matchCount ?? 0) > 0 && (
                        <Badge variant="secondary" className="gap-1">
                          <TrendingUp className="size-3" />
                          {rule.matchCount} срабатываний
                        </Badge>
                      )}
                    </div>
                    <p className="line-clamp-2 text-sm">{rule.message}</p>
                    {rule.messageForNonFollowers && (
                      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Lock className="size-3 shrink-0" aria-hidden="true" />
                        Follow-gate активен: {rule.messageForNonFollowers.slice(0, 60)}
                        {rule.messageForNonFollowers.length > 60 ? '…' : ''}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Создано {fmtDate(rule.createdAt)}
                      {rule.lastUsed && ` • Использовано ${fmtDate(rule.lastUsed)}`}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5"
                      onClick={() => navigate(`/funnels/${rule._id}`)}
                    >
                      <Workflow className="size-3.5" />
                      Воронка
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5"
                      onClick={() => {
                        setEditing(rule)
                        setDialogOpen(true)
                      }}
                    >
                      <Pencil className="size-3.5" />
                      Изменить
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-1.5 text-destructive hover:text-destructive"
                      onClick={() => setDeleting(rule)}
                      aria-label={`Удалить правило ${rule.keyword}`}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.li>
          ))}
        </ul>
      )}

      <KeywordFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editing={editing}
        onCreated={(rule) => navigate(`/funnels/${rule._id}`)}
      />

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="Удалить правило?"
        description={
          <>
            Правило <span className="font-mono font-semibold">{deleting?.keyword}</span> и вся его
            воронка перестанут работать. Действие нельзя отменить.
          </>
        }
        pending={remove.isPending}
        onConfirm={() => {
          if (!deleting) return
          remove.mutate(deleting._id)
          setDeleting(null)
        }}
      />
    </div>
  )
}

function EmptyState({ onOpenDialog }: { onOpenDialog: () => void }) {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center gap-3 p-10 text-center">
        <span className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Workflow className="size-7" aria-hidden="true" />
        </span>
        <h2 className="text-lg font-semibold">Правил пока нет</h2>
        <p className="max-w-md text-sm text-muted-foreground">
          Создайте первое ключевое слово, постройте воронку в визуальном редакторе и получайте
          автоматические продажи прямо из комментариев.
        </p>
        <Button onClick={onOpenDialog} className="gap-2">
          <Plus className="size-4" />
          Создать правило
        </Button>
      </CardContent>
    </Card>
  )
}
