import { useEffect, useRef } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery } from '@tanstack/react-query'
import { KeyRound, Loader2, MessageSquareText, Plus, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { placeholdersQueryOptions } from '../keywordQueries'
import { emptyKeywordForm, keywordFormSchema } from '../schema'
import { useKeywordMutations } from '../useKeywordMutations'
import { ButtonsEditor, type AvailableStep } from './ButtonsEditor'
import { FollowGateFields } from './FollowGateFields'
import { MessagePreviewBox } from './MessagePreviewBox'
import { PostsScopePicker } from './PostsScopePicker'
import type { KeywordFormValues } from '../schema'
import type { KeywordRule } from '@/types/api'

interface KeywordFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Редактируемое правило; null/undefined — создание */
  editing?: KeywordRule | null
  /** Вызов после успешного создания (напр. открыть редактор воронки) */
  onCreated?: (rule: KeywordRule) => void
  onSaved?: () => void
}

const ruleToFormValues = (rule: KeywordRule): KeywordFormValues => ({
  keyword: rule.keyword,
  message: rule.message,
  buttons: (rule.buttons ?? []).map((b) => ({
    title: b.title ?? '',
    type: b.type === 'postback' ? 'postback' : 'url',
    url: b.url ?? '',
    payload: b.payload ?? '',
  })),
  postScope: (rule.mediaIds?.length ?? 0) > 0 ? 'specific' : 'all',
  mediaIds: rule.mediaIds ?? [],
  messageForNonFollowers: rule.messageForNonFollowers ?? '',
  enableFollowCheckButton: rule.enableFollowCheckButton !== false,
  followButtonText: rule.followButtonText ?? '✅ Я подписался',
  notFollowedYetMessage: rule.notFollowedYetMessage ?? '',
})

export function KeywordFormDialog({
  open,
  onOpenChange,
  editing = null,
  onCreated,
  onSaved,
}: KeywordFormDialogProps) {
  const { create, update } = useKeywordMutations()
  const messageRef = useRef<HTMLTextAreaElement | null>(null)
  const busy = create.isPending || update.isPending

  const form = useForm<KeywordFormValues>({
    resolver: zodResolver(keywordFormSchema),
    defaultValues: editing ? ruleToFormValues(editing) : emptyKeywordForm,
    mode: 'onSubmit',
  })

  const { data: placeholders = {} } = useQuery({
    ...placeholdersQueryOptions(),
    enabled: open,
  })

  useEffect(() => {
    if (open) {
      form.reset(editing ? ruleToFormValues(editing) : emptyKeywordForm)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editing])

  const insertAtCursor = (placeholder: string) => {
    const el = messageRef.current
    const current = form.getValues('message')
    if (!el) {
      form.setValue('message', current + placeholder, { shouldDirty: true })
      return
    }
    const start = el.selectionStart ?? current.length
    const end = el.selectionEnd ?? current.length
    const next = current.slice(0, start) + placeholder + current.slice(end)
    form.setValue('message', next, { shouldDirty: true })
    requestAnimationFrame(() => {
      el.focus()
      const pos = start + placeholder.length
      el.setSelectionRange(pos, pos)
    })
  }

  const onSubmit = async (values: KeywordFormValues) => {
    const availableSteps: AvailableStep[] =
      editing?.steps?.map((s) => ({ id: s.id, name: s.name })) ?? []
    const normalizedButtons = values.buttons.map((b) => ({
      title: b.title,
      type: b.type,
      url: b.type === 'url' ? b.url : '',
      payload:
        b.type === 'postback'
          ? availableSteps.some((s) => s.id === b.payload)
            ? b.payload
            : b.payload
          : '',
    }))

    const payload = {
      keyword: values.keyword,
      message: values.message,
      buttons: normalizedButtons,
      mediaIds: values.postScope === 'specific' ? values.mediaIds : [],
      messageForNonFollowers: values.messageForNonFollowers ?? '',
      enableFollowCheckButton: values.enableFollowCheckButton !== false,
      followButtonText: values.followButtonText || '✅ Я подписался',
      notFollowedYetMessage: values.notFollowedYetMessage ?? '',
    }

    if (editing) {
      await update.mutateAsync({ id: editing._id, input: payload })
      onOpenChange(false)
      onSaved?.()
    } else {
      const rule = await create.mutateAsync(payload)
      form.reset(emptyKeywordForm)
      onOpenChange(false)
      onCreated?.(rule)
    }
  }

  const availableSteps: AvailableStep[] = (editing?.steps ?? []).map((s) => ({
    id: s.id,
    name: s.name,
  }))

  const messageValue = useWatch({ control: form.control, name: 'message' })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <KeyRound className="size-5 text-primary" aria-hidden="true" />
            {editing ? 'Редактировать правило' : 'Новое правило автоответа'}
          </DialogTitle>
          <DialogDescription>
            Комментарий под постом совпадает с ключевым словом → бот отправляет ДМ и запускает
            воронку.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form noValidate onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            {/* Триггер */}
            <FormField
              control={form.control}
              name="keyword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-1.5">
                    <KeyRound className="size-3.5 text-primary" />
                    Ключевое слово (триггер в комментариях)
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      maxLength={50}
                      placeholder="Например: чек-лист, консультация, цена"
                      autoFocus={!editing}
                    />
                  </FormControl>
                  <p className="text-xs text-muted-foreground">
                    Безопасные символы, до 50. Слово сработает как подстрока в комментарии.
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Separator />

            {/* Первое сообщение */}
            <section className="space-y-3">
              <FormField
                control={form.control}
                name="message"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-1.5">
                      <MessageSquareText className="size-3.5 text-primary" />
                      Первое сообщение в Директ
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        rows={3}
                        maxLength={1000}
                        ref={(node) => {
                          messageRef.current = node
                          field.ref(node)
                        }}
                        placeholder="Привет, {username}! Держи то, что обещал…"
                      />
                    </FormControl>
                    <p className="text-xs text-muted-foreground">
                      {field.value.length}/1000 символов
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <MessagePreviewBox
                message={messageValue}
                placeholders={placeholders}
                onInsert={insertAtCursor}
              />

              <div>
                <p className="mb-2 text-xs font-semibold text-muted-foreground">
                  Кнопки под первым сообщением (до 3)
                </p>
                <ButtonsEditor
                  availableSteps={availableSteps}
                  disabled={busy}
                  addLabel="Добавить кнопку"
                />
                <p className="mt-1.5 text-xs text-muted-foreground">
                  Полная цепочка шагов собирается в{' '}
                  <span className="font-medium text-primary">Канве воронок</span> после сохранения
                  правила.
                </p>
              </div>
            </section>

            <Separator />

            {/* Скоуп постов */}
            <div>
              <p className="mb-2 text-sm font-semibold">Под какими постами отслеживать</p>
              <PostsScopePicker />
            </div>

            <Separator />

            {/* follow-gate */}
            <FollowGateFields />

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-2">
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                Отмена
              </Button>
              <Button type="submit" disabled={busy} className="min-w-44">
                {busy ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Сохранение…
                  </>
                ) : editing ? (
                  <>
                    <Save className="size-4" />
                    Сохранить изменения
                  </>
                ) : (
                  <>
                    <Plus className="size-4" />
                    Создать правило
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
