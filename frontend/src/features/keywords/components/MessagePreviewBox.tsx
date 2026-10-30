import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Sparkles } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { useFormPlaceholderPreview } from '../useKeywordMutations'
import type { PlaceholderMap } from '@/types/api'

interface MessagePreviewBoxProps {
  message: string
  placeholders?: PlaceholderMap
  /** Вставить плейсхолдер в текст по курсору */
  onInsert?: (placeholder: string) => void
}

/** Живой предпросмотр сообщения с подстановкой переменных + чипсы для вставки. */
export function MessagePreviewBox({ message, placeholders = {}, onInsert }: MessagePreviewBoxProps) {
  const [preview, setPreview] = useState<string | null>(null)
  const [invalid, setInvalid] = useState<string[]>([])
  const previewMutation = useFormPlaceholderPreview()
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      if (!message.trim()) {
        setPreview(null)
        setInvalid([])
        return
      }
      try {
        const result = await previewMutation.mutateAsync(message)
        setPreview(result?.preview ?? null)
        const validation = result?.validation as
          | { invalidPlaceholders?: string[] }
          | undefined
        setInvalid(validation?.invalidPlaceholders ?? [])
      } catch {
        setPreview(null)
      }
    }, 600)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [message])

  const placeholderEntries = Object.entries(placeholders)

  return (
    <div className="space-y-2">
      {placeholderEntries.length > 0 && onInsert && (
        <div>
          <p className="mb-1.5 text-xs font-medium text-muted-foreground">
            Переменные — кликайте, чтобы вставить:
          </p>
          <div className="flex flex-wrap gap-1">
            {placeholderEntries.map(([placeholder, description]) => (
              <Badge
                key={placeholder}
                variant="secondary"
                role="button"
                tabIndex={0}
                title={description}
                className="cursor-pointer hover:bg-secondary/70"
                onClick={() => onInsert(placeholder)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') onInsert(placeholder)
                }}
              >
                {placeholder}
              </Badge>
            ))}
          </div>
        </div>
      )}

      <AnimatePresence mode="wait">
        {preview !== null && (
          <motion.div
            key="preview"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden rounded-lg border bg-muted/40 px-3 py-2"
          >
            <p className="mb-1 flex items-center gap-1 text-xs font-medium text-muted-foreground">
              <Sparkles className="size-3" aria-hidden="true" /> Предпросмотр в Директе
            </p>
            <p className="text-sm whitespace-pre-wrap">{preview}</p>
            {invalid.length > 0 && (
              <p className="mt-1 text-xs text-destructive">
                Неизвестные переменные: {invalid.join(', ')}
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
