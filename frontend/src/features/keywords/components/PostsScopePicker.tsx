import { useFormContext, useWatch } from 'react-hook-form'
import { useQuery } from '@tanstack/react-query'
import { ImageOff } from 'lucide-react'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Skeleton } from '@/components/ui/skeleton'
import { recentMediaQueryOptions } from '../keywordQueries'

const RADIO_OPTIONS = [
  { value: 'all', title: 'Все посты', hint: 'Срабатывает под любым постом или Reels' },
  {
    value: 'specific',
    title: 'Только выбранные',
    hint: 'Ограничьте срабатывание конкретными постами',
  },
] as const

/** Выбор скоупа постов: «все» или конкретные (до 50). Ожидает форму со scope: postScope / mediaIds. */
export function PostsScopePicker() {
  const { setValue } = useFormContext()
  const postScope = useWatch({ name: 'postScope' })
  const mediaIds = (useWatch({ name: 'mediaIds' }) ?? []) as string[]

  const { data: recentMedia, isLoading } = useQuery({
    ...recentMediaQueryOptions(24),
    enabled: postScope === 'specific',
  })

  const toggleMedia = (id: string) => {
    const next = mediaIds.includes(id) ? mediaIds.filter((x) => x !== id) : [...mediaIds, id]
    setValue('mediaIds', next, { shouldDirty: true })
  }

  const setScope = (v: string) => {
    setValue('postScope', v as 'all' | 'specific', { shouldDirty: true })
    if (v === 'all') {
      setValue('mediaIds', [], { shouldDirty: true })
    }
  }

  return (
    <div className="space-y-3">
      <RadioGroup
        value={postScope}
        onValueChange={setScope}
        className="grid gap-2 sm:grid-cols-2"
      >
        {RADIO_OPTIONS.map((opt) => (
          <label
            key={opt.value}
            className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-colors ${
              postScope === opt.value
                ? 'border-primary bg-primary/5'
                : 'hover:border-muted-foreground/30'
            }`}
          >
            <RadioGroupItem value={opt.value} className="mt-0.5" />
            <span>
              <span className="block text-sm font-medium">{opt.title}</span>
              <span className="block text-xs text-muted-foreground">{opt.hint}</span>
            </span>
          </label>
        ))}
      </RadioGroup>

      {postScope === 'specific' && (
        <div className="max-h-60 overflow-y-auto rounded-lg border p-2">
          {isLoading ? (
            <div className="grid grid-cols-2 gap-2">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-14 rounded-lg" />
              ))}
            </div>
          ) : !recentMedia || recentMedia.length === 0 ? (
            <p className="p-4 text-center text-sm text-muted-foreground">
              Публикации не найдены — опубликуйте пост в Instagram.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {recentMedia.map((media) => {
                const selected = mediaIds.includes(media.id)
                const thumb = media.thumbnail_url || media.media_url
                return (
                  <button
                    type="button"
                    key={media.id}
                    onClick={() => toggleMedia(media.id)}
                    aria-pressed={selected}
                    className={`flex items-center gap-2 rounded-lg border p-2 text-left transition-colors ${
                      selected ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                    }`}
                  >
                    {thumb ? (
                      <img
                        src={thumb}
                        alt=""
                        className="size-10 shrink-0 rounded-md object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                        <ImageOff className="size-4" aria-hidden="true" />
                      </span>
                    )}
                    <span className="min-w-0">
                      <span className="block truncate text-xs">
                        {media.caption?.slice(0, 60) ?? `Post ${media.id}`}
                      </span>
                      <span className="block text-[10px] text-muted-foreground">
                        {media.timestamp ? new Date(media.timestamp).toLocaleDateString() : ''}
                      </span>
                    </span>
                  </button>
                )
              })}
            </div>
          )}
          {mediaIds.length > 0 && (
            <p className="mt-2 px-2 text-xs text-muted-foreground">Выбрано: {mediaIds.length}</p>
          )}
        </div>
      )}
    </div>
  )
}
