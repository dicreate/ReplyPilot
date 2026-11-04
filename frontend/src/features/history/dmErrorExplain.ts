/**
 * Перевод «сырых» ошибок Instagram Graph API (errorMessage из истории обработки)
 * на человеческий язык: что случилось + что делать. Чисто фронтенд — бэкенд
 * хранит только текст ошибки, он приходит строкой, иногда составной
 * («private reply failed ...; DM fallback skipped ...»).
 */

export type DmErrorKind =
  | 'token'
  | 'permission'
  | 'rate-limit'
  | 'privacy'
  | 'stale-comment'
  | 'config'
  | 'network'
  | 'unknown'

export interface DmErrorExplanation {
  kind: DmErrorKind
  /** Что случилось — по-человечески. */
  title: string
  /** Что делать. */
  advice: string
}

const RULES: Array<{ kind: DmErrorKind; match: RegExp; title: string; advice: string }> = [
  {
    kind: 'token',
    match: /\(#190\)|access token|unauthorized|token expired|invalid oauth/i,
    title: 'Токен Instagram недействителен или истёк',
    advice:
      'Заново войдите через Instagram (иконка выхода → «Войти через Instagram»). Правила и воронки сохранятся — после повторного входа ДМ начнут отправляться.',
  },
  {
    kind: 'permission',
    match: /\(#10\)|(\bpermission|не.*разреш)\w*/i,
    title: 'У приложения нет права отправлять это сообщение',
    advice:
      'Проверьте в Meta App Dashboard, что у приложения выданы права instagram_manage_messages и instagram_manage_comments, а также что аккаунт привязан как Business. Часто проходит после повторного входа.',
  },
  {
    kind: 'rate-limit',
    match: /rate limit|429|throttl|too many/i,
    title: 'Instagram ограничил частоту запросов (rate limit)',
    advice:
      'Слишком много ДМ за короткий период. Подождите 30–60 минут — лимит восстанавливается сам, повторная обработка постов дошлёт сообщения.',
  },
  {
    kind: 'privacy',
    match: /131030|131047|131048|131056|privacy|not allow|closed|blocked/i,
    title: 'Этому пользователю нельзя написать в ЛС',
    advice:
      'Ограничение приватности Instagram: у пользователя закрыты сообщения, он заблокировал аккаунт или достиг суточного лимита ДМ. Тогда сообщение не доставит ни одно приложение.',
  },
  {
    kind: 'stale-comment',
    match: /older than|fallback skipped|fallback window|too old/i,
    title: 'Комментарий старше окна для ответа в ЛС',
    advice:
      'Instagram разрешает отвечать на комментарий личным сообщением только в течение ~7 дней. Скорее всего, сообщение дошло не будет — сработает связка «комментарий → новый пост» в следующий раз.',
  },
  {
    kind: 'config',
    match: /undefined\/|\/undefined|iguserid|requires an igsid/i,
    title: 'Не подключён бизнес-аккаунт Instagram',
    advice:
      'В профиле нет ID бизнес-аккаунта, поэтому ДМ не уходит. Переподключите Instagram-аккаунт (Logout → Login) и убедитесь, что аккаунт конвертирован в Business.',
  },
  {
    kind: 'network',
    match: /network error|timeout|econn|fetch/i,
    title: 'Сбой сети при отправке',
    advice:
      'Разовая сетевая проблема — при следующей обработке сообщение уйдёт. Если ошибка не проходит часами, проверьте доступность Instagram API.',
  },
]

export function explainDmError(raw?: string | null): DmErrorExplanation {
  const text = raw?.trim()
  if (!text) {
    return {
      kind: 'unknown',
      title: 'Ошибка отправки сообщения',
      advice: 'Причина неизвестна. Полные детали — при поддержке.',
    }
  }
  for (const rule of RULES) {
    if (rule.match.test(text)) {
      return { kind: rule.kind, title: rule.title, advice: rule.advice }
    }
  }
  return {
    kind: 'unknown',
    title: 'Ошибка отправки сообщения',
    advice: 'Точное описание ошибки — в техническом тексте ниже. Оно пригодится при обращении в поддержку.',
  }
}
