import { useFormContext, useWatch } from 'react-hook-form'
import { motion } from 'framer-motion'
import { UserCheck } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { FOLLOW_BTN_MAX } from '../schema'

/** Поля follow-gate: отдельное сообщение для неподписанных + кнопка «Я подписался». */
export function FollowGateFields() {
  const { setValue } = useFormContext()
  const messageForNonFollowers = (useWatch({ name: 'messageForNonFollowers' }) ?? '') as string
  const enableCheck = (useWatch({ name: 'enableFollowCheckButton' }) ?? true) as boolean
  const followButtonText = (useWatch({ name: 'followButtonText' }) ?? '') as string
  const notFollowedYetMessage = (useWatch({ name: 'notFollowedYetMessage' }) ?? '') as string

  const isActive = messageForNonFollowers.trim().length > 0

  return (
    <div className="rounded-xl border p-4">
      <Label htmlFor="messageForNonFollowers" className="font-medium">
        Сообщение для неподписанных{' '}
        <span className="text-xs font-normal text-muted-foreground">(follow-gate, опционально)</span>
      </Label>
      <p className="mt-1 mb-2 text-xs text-muted-foreground">
        Если заполнено — бот сначала проверит подписку. Подписчикам уходит основная воронка,
        неподписанным — это сообщение.
      </p>
      <textarea
        id="messageForNonFollowers"
        rows={2}
        maxLength={1000}
        className="w-full rounded-lg border bg-transparent px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40"
        placeholder="Оставьте пустым, если проверка подписки не нужна…"
        value={messageForNonFollowers}
        onChange={(e) => setValue('messageForNonFollowers', e.target.value, { shouldDirty: true })}
      />

      {isActive && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mt-3 space-y-3 overflow-hidden border-t pt-3"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <UserCheck className="size-4 text-primary" aria-hidden="true" />
              <span className="text-sm font-medium">Кнопка «Я подписался» (быстрая проверка)</span>
            </div>
            <Switch
              checked={enableCheck}
              onCheckedChange={(v) => setValue('enableFollowCheckButton', v, { shouldDirty: true })}
              aria-label="Включить кнопку проверки подписки"
            />
          </div>
          {enableCheck && (
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground" htmlFor="followButtonText">
                  Текст кнопки (макс. 20)
                </Label>
                <Input
                  id="followButtonText"
                  maxLength={FOLLOW_BTN_MAX}
                  value={followButtonText}
                  placeholder="✅ Я подписался"
                  onChange={(e) =>
                    setValue('followButtonText', e.target.value, { shouldDirty: true })
                  }
                />
              </div>
              <div className="space-y-1 sm:col-span-2">
                <Label className="text-xs text-muted-foreground" htmlFor="notFollowedYetMessage">
                  Ответ, если подписка так и не найдена
                </Label>
                <Input
                  id="notFollowedYetMessage"
                  value={notFollowedYetMessage}
                  placeholder="Подписка пока не найдена 🥺 Подпишитесь и нажмите кнопку снова!"
                  onChange={(e) =>
                    setValue('notFollowedYetMessage', e.target.value, { shouldDirty: true })
                  }
                />
              </div>
            </div>
          )}
        </motion.div>
      )}
    </div>
  )
}
