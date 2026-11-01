import { Eye, Link2, Plus, Trash2, UserCheck, Workflow } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { MessagePreviewBox } from '@/features/keywords/components/MessagePreviewBox'
import { createFunnelButton } from './graph'
import type { FunnelButton, FunnelNode, GateNodeData, StepNodeData, TriggerNodeData } from './graph'
import type { MediaPost, PlaceholderMap } from '@/types/api'

const MAX_MESSAGE = 1000
const MAX_BUTTONS = 3
const BTN_TITLE_MAX = 20
const MAX_MEDIA = 50

export interface StepOption {
  id: string
  label: string
}

export interface NodeInspectorProps {
  node: FunnelNode
  stepOptions: StepOption[]
  placeholders: PlaceholderMap
  media: MediaPost[]
  busy?: boolean
  onChangeTrigger: (patch: Partial<TriggerNodeData>) => void
  onChangeStep: (patch: Partial<StepNodeData>) => void
  onChangeGate: (patch: Partial<GateNodeData>) => void
  /** Полная замена списка кнопок ноды; родитель диффит рёбра */
  onChangeButtons: (nodeId: string, buttons: FunnelButton[]) => void
  onDeleteStep: (nodeId: string) => void
  onDeleteGate: () => void
  onAddStep: () => void
}

/* ----------------------------- Утилиты ----------------------------- */

function Field({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
      {hint && <p className="text-[11px] leading-snug text-muted-foreground">{hint}</p>}
    </div>
  )
}

function CharCount({ value }: { value: string }) {
  const over = value.length > MAX_MESSAGE
  return (
    <p
      className={`text-right text-[11px] ${
        over ? 'font-semibold text-destructive' : 'text-muted-foreground'
      }`}
    >
      {value.length}/{MAX_MESSAGE}
    </p>
  )
}

function MessageField({
  value,
  placeholder,
  disabled,
  onChange,
  extra,
}: {
  value: string
  placeholder: string
  disabled?: boolean
  onChange: (v: string) => void
  extra?: React.ReactNode
}) {
  return (
    <div className="space-y-2">
      <textarea
        rows={4}
        maxLength={MAX_MESSAGE + 200}
        disabled={disabled}
        className="w-full rounded-lg border bg-transparent px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
      <CharCount value={value} />
      {extra}
    </div>
  )
}

/** Превью сообщения в стиле Директа. */
function DMBubble({
  message,
  buttons,
  followGate = false,
}: {
  message: string
  buttons: FunnelButton[]
  followGate?: boolean
}) {
  const text = message.trim() || 'Сообщение пока пустое…'
  return (
    <div>
      <p className="mb-1.5 flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
        <Eye className="size-3" aria-hidden="true" /> Так это увидит подписчик
      </p>
      <div className="rp-dm-preview">
        {text}
        {(buttons.length > 0 || (followGate && false)) && (
          <div className="rp-dm-preview__buttons">
            {buttons.map((b) => (
              <span key={b.id} className="rp-dm-preview__button">
                {(b.title || '(кнопка)').slice(0, BTN_TITLE_MAX)}
                <span className="sr-only">
                  {b.type === 'url' ? ` — ссылка ${b.url || ''}` : ' — переход к шагу'}
                </span>
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

/* --------------------- Редактор кнопок ноды --------------------- */

function FunnelButtonsList({
  nodeId,
  buttons,
  stepOptions,
  disabled,
  onChange,
}: {
  nodeId: string
  buttons: FunnelButton[]
  stepOptions: StepOption[]
  disabled?: boolean
  onChange: (next: FunnelButton[]) => void
}) {
  const patch = (id: string, p: Partial<FunnelButton>) =>
    onChange(buttons.map((b) => (b.id === id ? { ...b, ...p } : b)))

  const removeBtn = (id: string) => onChange(buttons.filter((x) => x.id !== id))

  const switchType = (id: string, type: 'url' | 'postback') => {
    patch(id, {
      type,
      ...(type === 'url'
        ? { url: '', targetStepId: undefined, customPayload: undefined }
        : { targetStepId: null, customPayload: undefined, url: undefined }),
    })
  }

  return (
    <div className="space-y-2" aria-label={`Кнопки ноды ${nodeId}`}>
      {buttons.length === 0 && (
        <p className="rounded-lg bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
          Кнопок нет — добавьте до 3 (ссылка или переход на шаг).
        </p>
      )}
      {buttons.map((btn) => (
        <div key={btn.id} className="rounded-lg border p-2.5">
          <div className="grid gap-2.5 sm:grid-cols-2">
            <Field label="Тип">
              <Select
                value={btn.type}
                disabled={disabled}
                onValueChange={(v) => switchType(btn.id, v as 'url' | 'postback')}
              >
                <SelectTrigger>
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
            </Field>
            <Field label="Текст (до 20)">
              <Input
                maxLength={BTN_TITLE_MAX}
                disabled={disabled}
                value={btn.title}
                placeholder="«Получить гайд»"
                onChange={(e) => patch(btn.id, { title: e.target.value })}
              />
            </Field>

            {btn.type === 'url' ? (
              <Field label="Ссылка (https://)">
                <Input
                  type="url"
                  disabled={disabled}
                  value={btn.url ?? ''}
                  placeholder="https://…"
                  onChange={(e) => patch(btn.id, { url: e.target.value })}
                />
              </Field>
            ) : (
              <Field
                label="Куда ведёт"
                hint={
                  btn.targetStepId
                    ? 'Ребро синхронизировано с канвой'
                    : btn.customPayload
                      ? 'Кастомный код — бэкенд распознаёт по названию/коду шага'
                      : 'Выберите шаг или протяните ребро на канве от стрелки у кнопки'
                }
              >
                <Select
                  value={btn.targetStepId ?? (btn.customPayload != null ? '__custom__' : '')}
                  disabled={disabled}
                  onValueChange={(v) => {
                    if (v === '__custom__') {
                      patch(btn.id, { targetStepId: null, customPayload: btn.customPayload ?? '' })
                    } else if (v === '') {
                      patch(btn.id, { targetStepId: null, customPayload: undefined })
                    } else {
                      patch(btn.id, { targetStepId: v, customPayload: undefined })
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="— не выбрано —" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">— не выбрано —</SelectItem>
                    {stepOptions.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.label}
                      </SelectItem>
                    ))}
                    <SelectItem value="__custom__">⚙️ свой код…</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            )}

            {btn.type === 'postback' && btn.targetStepId === null && (
              <Field label="Код шага">
                <Input
                  disabled={disabled}
                  value={btn.customPayload ?? ''}
                  placeholder="STEP_2 (кастомный переход)"
                  onChange={(e) => patch(btn.id, { customPayload: e.target.value })}
                />
              </Field>
            )}
          </div>
          <Button
            type="button"
            variant="ghost"
            size="xs"
            className="mt-1.5 gap-1 text-destructive hover:text-destructive"
            disabled={disabled}
            onClick={() => removeBtn(btn.id)}
          >
            <Trash2 className="size-3" /> Удалить кнопку
          </Button>
        </div>
      ))}
      {buttons.length < MAX_BUTTONS && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled}
          className="gap-1.5"
          onClick={() => onChange([...buttons, createFunnelButton('url')])}
        >
          <Plus className="size-4" /> Добавить кнопку
        </Button>
      )}
    </div>
  )
}

/* --------------- Пикер постов для триггера (скоуп) --------------- */

function TriggerMediaScope({
  mediaIds,
  media,
  disabled,
  onChange,
}: {
  mediaIds: string[]
  media: MediaPost[]
  disabled?: boolean
  onChange: (ids: string[]) => void
}) {
  const toggle = (id: string) =>
    onChange(
      mediaIds.includes(id)
        ? mediaIds.filter((x) => x !== id)
        : mediaIds.length < MAX_MEDIA
          ? [...mediaIds, id]
          : mediaIds,
    )

  const isAll = mediaIds.length === 0

  return (
    <div className="space-y-2">
      <RadioGroup
        value={isAll ? 'all' : 'specific'}
        onValueChange={(v) => {
          if (v === 'all') onChange([])
        }}
        className="grid gap-2 sm:grid-cols-2"
      >
        {[
          { value: 'all', title: 'Все посты', hint: 'Под любым постом или Reels' },
          { value: 'specific', title: 'Выбранные', hint: 'Отметьте нужные посты ниже' },
        ].map((opt) => (
          <label
            key={opt.value}
            className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-colors ${
              (isAll ? 'all' : 'specific') === opt.value
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

      {!isAll && (
        media.length === 0 ? (
          <p className="rounded-lg bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
            Список постов загружается… Если аккаунт пуст — опубликуйте пост в Instagram.
          </p>
        ) : (
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
            {media.slice(0, 15).map((m) => {
              const selected = mediaIds.includes(m.id)
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => toggle(m.id)}
                  disabled={disabled}
                  aria-pressed={selected}
                  title={m.caption?.slice(0, 80) ?? m.id}
                  className={`relative aspect-square overflow-hidden rounded-lg border-2 transition-all ${
                    selected ? 'border-primary shadow-sm' : 'border-transparent hover:border-muted-foreground/40'
                  }`}
                >
                  {m.thumbnail_url || m.media_url ? (
                    <img
                      src={m.thumbnail_url || m.media_url}
                      alt=""
                      loading="lazy"
                      className="size-full object-cover"
                    />
                  ) : (
                    <span className="flex size-full items-center justify-center bg-muted text-[9px]">
                      {m.id.slice(-6)}
                    </span>
                  )}
                  {selected && (
                    <span className="absolute inset-0 bg-primary/25" aria-hidden="true" />
                  )}
                </button>
              )
            })}
          </div>
        )
      )}
      {!isAll && mediaIds.length > 0 && (
        <p className="text-xs text-muted-foreground">Выбрано: {mediaIds.length} из {media.length}</p>
      )}
    </div>
  )
}

/* ========================= Главный инспектор ========================= */

export function NodeInspector({
  node,
  stepOptions,
  placeholders,
  media,
  busy = false,
  onChangeTrigger,
  onChangeStep,
  onChangeGate,
  onChangeButtons,
  onDeleteStep,
  onDeleteGate,
  onAddStep,
}: NodeInspectorProps) {
  if (node.type === 'trigger') {
    const d = node.data as TriggerNodeData
    return (
      <div className="space-y-5">
        <Field label="Ключевое слово" hint={'Нельзя использовать < > " \' &'}>
          <Input
            maxLength={50}
            disabled={busy}
            value={d.keyword}
            onChange={(e) => onChangeTrigger({ keyword: e.target.value })}
          />
        </Field>

        <Separator />

        <div className="space-y-2">
          <Label className="font-semibold">Первое сообщение</Label>
          <MessageField
            value={d.message}
            placeholder="Привет, {username}! Держи обещанное…"
            disabled={busy}
            onChange={(v) => onChangeTrigger({ message: v })}
            extra={
              <MessagePreviewBox message={d.message} placeholders={placeholders} />
            }
          />
        </div>

        <div className="space-y-2">
          <Label className="font-semibold">Кнопки первого сообщения</Label>
          <FunnelButtonsList
            nodeId={node.id}
            buttons={d.buttons}
            stepOptions={stepOptions}
            disabled={busy}
            onChange={(next) => onChangeButtons(node.id, next)}
          />
        </div>

        <Separator />

        <div className="space-y-2">
          <Label className="font-semibold">Под какими постами</Label>
          <TriggerMediaScope
            mediaIds={d.mediaIds}
            media={media}
            disabled={busy}
            onChange={(ids) => onChangeTrigger({ mediaIds: ids })}
          />
        </div>
      </div>
    )
  }

  if (node.type === 'step') {
    const d = node.data as StepNodeData
    const selfOption = stepOptions.filter((s) => s.id !== d.stepId)
    return (
      <div className="space-y-5">
        <div className="flex items-center justify-between gap-2">
          <Label className="font-semibold">Шаг воронки</Label>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="gap-1 text-destructive hover:text-destructive"
            disabled={busy}
            onClick={() => onDeleteStep(node.id)}
          >
            <Trash2 className="size-3.5" /> Удалить шаг
          </Button>
        </div>

        <Field label="Название шага (до 100)">
          <Input
            maxLength={100}
            disabled={busy}
            value={d.name}
            placeholder="«Что входит в консультацию»"
            onChange={(e) => onChangeStep({ name: e.target.value })}
          />
        </Field>

        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Сообщение шага</Label>
          <p className="text-[11px] text-muted-foreground">
            Отправляется, когда подписчик нажимает кнопку предыдущего шага
          </p>
          <MessageField
            value={d.message}
            placeholder="Текст следующего сообщения…"
            disabled={busy}
            onChange={(v) => onChangeStep({ message: v })}
            extra={<MessagePreviewBox message={d.message} placeholders={placeholders} />}
          />
        </div>

        <div className="space-y-2">
          <Label className="font-semibold">Кнопки шага</Label>
          <FunnelButtonsList
            nodeId={node.id}
            buttons={d.buttons}
            stepOptions={selfOption}
            disabled={busy}
            onChange={(next) => onChangeButtons(node.id, next)}
          />
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-full gap-1.5"
          disabled={busy}
          onClick={onAddStep}
        >
          <Plus className="size-4" /> Добавить следующий шаг
        </Button>
      </div>
    )
  }

  // gate
  const d = node.data as GateNodeData
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 rounded-lg bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-400">
          <UserCheck className="size-4 shrink-0" aria-hidden="true" />
          Follow-gate
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="gap-1 text-destructive hover:text-destructive"
          disabled={busy}
          onClick={onDeleteGate}
        >
          <Trash2 className="size-3.5" /> Удалить gate
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        Ветка для неподписанных. Подписчикам уходит основная воронка, неподписанным — сообщение
        ниже.
      </p>

      <Field label="Сообщение для неподписанных">
        <MessageField
          value={d.messageForNonFollowers}
          placeholder="Чтобы получить гайд, подпишитесь на профиль…"
          disabled={busy}
          onChange={(v) => onChangeGate({ messageForNonFollowers: v })}
        />
      </Field>

      <div className="flex items-center justify-between gap-3 rounded-lg border p-3">
        <div>
          <p className="text-sm font-medium">Кнопка «Я подписался»</p>
          <p className="text-xs text-muted-foreground">
            Быстрая проверка подписки прямо из Директа
          </p>
        </div>
        <Switch
          checked={d.enableFollowCheckButton}
          disabled={busy}
          onCheckedChange={(v) => onChangeGate({ enableFollowCheckButton: v })}
          aria-label="Кнопка проверки подписки"
        />
      </div>

      {d.enableFollowCheckButton && (
        <>
          <Field label="Текст кнопки (до 20)">
            <Input
              maxLength={20}
              disabled={busy}
              value={d.followButtonText}
              placeholder="✅ Я подписался"
              onChange={(e) => onChangeGate({ followButtonText: e.target.value })}
            />
          </Field>
          <Field label="Ответ, если подписка не найдена">
            <Input
              disabled={busy}
              value={d.notFollowedYetMessage}
              placeholder="Не вижу подписку 🥺 Подпишитесь и нажмите кнопку снова!"
              onChange={(e) => onChangeGate({ notFollowedYetMessage: e.target.value })}
            />
          </Field>
        </>
      )}

      <DMBubble
        message={d.messageForNonFollowers}
        buttons={
          d.enableFollowCheckButton
            ? [
                {
                  id: 'gate-cta',
                  title: d.followButtonText || '✅ Я подписался',
                  type: 'postback',
                  targetStepId: null,
                },
              ]
            : []
        }
        followGate
      />
    </div>
  )
}


