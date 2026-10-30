import { useFormContext, useFieldArray } from 'react-hook-form'
import { ExternalLink, Plus, Trash2, Workflow, Link2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { MAX_BUTTONS } from '../schema'

export interface AvailableStep {
  id: string
  name: string
}

interface ButtonsEditorProps {
  availableSteps: AvailableStep[]
  currentStepId?: string | null
  disabled?: boolean
  addLabel: string
}

/**
 * Редактор кнопок автосообщения (до 3): URL или переход на следующий шаг воронки.
 * Живёт внутри RHF-формы (`useFormContext`), массив полей — `buttons`.
 */
export function ButtonsEditor({
  availableSteps,
  currentStepId = null,
  disabled = false,
  addLabel,
}: ButtonsEditorProps) {
  const { control, watch } = useFormContext()
  const { fields, append, remove, update } = useFieldArray({ control, name: 'buttons' })
  const buttons = watch('buttons') ?? []

  return (
    <ul className="space-y-2" aria-label="Кнопки сообщения">
      {fields.map((field, index) => {
        const btn = buttons[index] ?? { title: '', type: 'url', url: '', payload: '' }
        const targetSteps = availableSteps.filter((s) => s.id !== currentStepId)
        const knownStep = targetSteps.some((s) => s.id === btn.payload)
        const isPostback = btn.type === 'postback'

        return (
          <li key={field.id} className="rounded-lg border bg-muted/30 p-3">
            <div className="grid gap-2 sm:grid-cols-[auto_1fr]">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Тип</Label>
                <Select
                  value={btn.type}
                  disabled={disabled}
                  onValueChange={(v) =>
                    update(index, {
                      title: btn.title,
                      type: v as 'url' | 'postback',
                      url: !isPostback ? (btn.url || 'https://') : '',
                      payload: isPostback ? (btn.payload || '') : '',
                    } as never)
                  }
                >
                  <SelectTrigger className="w-44 sm:w-full sm:min-w-40" aria-label="Тип кнопки">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="url">
                      <span className="flex items-center gap-1.5">
                        <Link2 className="size-3.5" /> Ссылка
                      </span>
                    </SelectItem>
                    <SelectItem value="postback">
                      <span className="flex items-center gap-1.5">
                        <Workflow className="size-3.5" /> Следующий шаг
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground" htmlFor={`btn-title-${field.id}`}>
                  Текст на кнопке (до 20 симв.)
                </Label>
                <Input
                  id={`btn-title-${field.id}`}
                  maxLength={20}
                  disabled={disabled}
                  value={btn.title}
                  placeholder="Например: Получить чек-лист"
                  onChange={(e) =>
                    update(index, { ...btn, title: e.target.value } as never)
                  }
                />
              </div>
              <div className="space-y-1 sm:col-span-2">
                {isPostback ? (
                  targetSteps.length > 0 && knownStep ? (
                    <>
                      <Label className="text-xs text-muted-foreground">Следующий шаг воронки</Label>
                      <Select
                        value={btn.payload ?? ''}
                        disabled={disabled}
                        onValueChange={(v) =>
                          update(index, { ...btn, payload: v } as never)
                        }
                      >
                        <SelectTrigger aria-label="Следующий шаг воронки">
                          <SelectValue placeholder="-- Выберите шаг --" />
                        </SelectTrigger>
                        <SelectContent>
                          {targetSteps.map((s) => (
                            <SelectItem key={s.id} value={s.id}>
                              {s.name || s.id}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </>
                  ) : (
                    <>
                      <Label className="text-xs text-muted-foreground">Код шага</Label>
                      <Input
                        disabled={disabled}
                        value={btn.payload ?? ''}
                        placeholder={
                          targetSteps.length === 0
                            ? 'Добавьте шаги в редакторе воронки или укажите код (напр. STEP_2)'
                            : 'Код шага (напр. STEP_DETAILS)'
                        }
                        onChange={(e) =>
                          update(index, { ...btn, payload: e.target.value } as never)
                        }
                      />
                      <p className="text-xs text-muted-foreground">
                        Шаги создаются в{' '}
                        <span className="font-medium text-foreground">Канве воронки</span> — здесь их
                        можно только выбрать.
                      </p>
                    </>
                  )
                ) : (
                  <>
                    <Label className="text-xs text-muted-foreground">Ссылка (только https)</Label>
                    <div className="relative">
                      <ExternalLink className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        type="url"
                        disabled={disabled}
                        value={btn.url ?? ''}
                        placeholder="https://… сайт, Telegram-канал и т.д."
                        className="pl-8"
                        onChange={(e) =>
                          update(index, { ...btn, url: e.target.value } as never)
                        }
                      />
                    </div>
                  </>
                )}
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="xs"
              className="mt-2 gap-1 text-destructive hover:text-destructive"
              disabled={disabled}
              onClick={() => remove(index)}
            >
              <Trash2 className="size-3" />
              Удалить кнопку
            </Button>
          </li>
        )
      })}
      {buttons.length < MAX_BUTTONS && (
        <li>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled || buttons.length >= MAX_BUTTONS}
            onClick={() => append({ title: '', type: 'url', url: 'https://', payload: '' } as never)}
            className="gap-1.5"
          >
            <Plus className="size-4" />
            {addLabel}
          </Button>
        </li>
      )}
    </ul>
  )
}
