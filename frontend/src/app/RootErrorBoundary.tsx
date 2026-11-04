import { isRouteErrorResponse, useRouteError } from 'react-router'
import { RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useT } from '@/lib/i18n'

/**
 * Корневой errorElement роутера. Ловит падения ленивых чанков (например,
 * «'text/html' is not a valid JavaScript MIME type» после деплоя — когда у
 * пользователя остался закешированный index.html, ссылающийся на удалённые
 * чанки прошлого билда) и прочие ошибки маршрутов вместо дефолтного сплэша
 * «Unexpected Application Error!».
 *
 * Компонент намеренно автономен: зависит только от i18n-стора и CSS из
 * основного бандла — app-лейаут мог не отрендериться вовсе.
 */

/** Признаки «протухшего» приложения: старый HTML тянет несуществующий чанк. */
const STALE_ERROR_RE =
  /text\/html|mIME type|dynamically imported module|Failed to fetch dynamically|error loading dynamically|Loading chunk|ChunkLoadError/i

function extractErrorText(error: unknown): string {
  if (error instanceof Error) return error.message
  if (typeof error === 'string') return error
  if (isRouteErrorResponse(error)) return `${error.status} ${error.statusText}`
  try {
    return JSON.stringify(error) ?? String(error)
  } catch {
    return String(error)
  }
}

export function RootErrorBoundary() {
  const t = useT()
  const error = useRouteError()
  const text = extractErrorText(error)
  const stale = STALE_ERROR_RE.test(text)

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-5 px-6 py-16 text-center">
      <div
        className="flex size-12 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-700 dark:text-amber-400"
        aria-hidden="true"
      >
        <RefreshCw className="size-6" />
      </div>

      <div className="space-y-2">
        <h1 className="text-lg font-semibold">{t('error.title')}</h1>
        <p className="max-w-[44ch] text-sm text-muted-foreground">
          {stale ? t('error.staleHint') : t('error.genericHint')}
        </p>
      </div>

      <div className="flex items-center gap-2">
        <Button onClick={() => window.location.reload()} className="gap-2">
          <RefreshCw className="size-4" /> {t('error.reload')}
        </Button>
        <Button variant="outline" onClick={() => window.location.assign('/')}>
          {t('error.home')}
        </Button>
      </div>

      <details className="max-w-md rounded-lg border bg-muted/40 px-3 py-2 text-left text-[11px] text-muted-foreground">
        <summary className="cursor-pointer select-none text-xs">{t('error.details')}</summary>
        <p className="mt-2 break-words font-mono leading-relaxed">{text}</p>
      </details>
    </div>
  )
}
