import { useSettingsStore, type Lang } from '@/store/settingsStore'

/**
 * Простой i18n-словарь: плоские ключи, {vars} в тексте.
 * Покрытие пока частичное (каркас + сайдбар/навигация/ошибки);
 * непереведённые места — fallback на русский, потом за значением ключа.
 */

export type { Lang }

const ru: Record<string, string> = {
  'nav.dashboard': 'Дашборд',
  'nav.keywords': 'Ключевые слова',
  'nav.funnels': 'Воронки',
  'nav.analytics': 'Аналитика',
  'nav.aria': 'Основная навигация',

  'status.checking': 'Проверка…',
  'status.activeOne': 'правило · активна',
  'status.activeFew': 'правила · активны',
  'status.activeMany': 'правил · активны',
  'status.off': 'Автоматизация выключена',
  'status.unavailable': 'Статус недоступен',
  'status.hint': 'Активные правила: слово → отправленное ДМ. Управляйте на странице «Ключевые слова».',

  'theme.toggle': 'Переключить тему',
  'auth.logout': 'Выйти',
  'auth.logoutAria': 'Выйти из аккаунта',
  'user.default': 'Пользователь Instagram',

  'lang.label': 'Язык',
}

const en: Record<string, string> = {
  'nav.dashboard': 'Dashboard',
  'nav.keywords': 'Keywords',
  'nav.funnels': 'Funnels',
  'nav.analytics': 'Analytics',
  'nav.aria': 'Main navigation',

  'status.checking': 'Checking…',
  'status.activeOne': 'rule · active',
  'status.activeFew': 'rules · active',
  'status.activeMany': 'rules · active',
  'status.off': 'Automation paused',
  'status.unavailable': 'Status unavailable',
  'status.hint': 'Active rules: keyword → sent DM. Manage them on the Keywords page.',

  'theme.toggle': 'Toggle theme',
  'auth.logout': 'Log out',
  'auth.logoutAria': 'Log out of the account',
  'user.default': 'Instagram User',

  'lang.label': 'Language',
}

const messages: Record<Lang, Record<string, string>> = { ru, en }

export function useT() {
  const lang = useSettingsStore((s) => s.lang)
  return (key: string, vars?: Record<string, string | number>): string => {
    const dict = messages[lang] ?? ru
    let text = dict[key] ?? ru[key] ?? key
    if (vars) {
      for (const [k, v] of Object.entries(vars)) {
        text = text.replaceAll(`{${k}}`, String(v))
      }
    }
    return text
  }
}

/** Склонение «правило/правила/правил» — рифмуется с ключами status.active*. */
export function rulesPluralKey(n: number): 'status.activeOne' | 'status.activeFew' | 'status.activeMany' {
  const mod10 = n % 10
  const mod100 = n % 100
  if (mod10 === 1 && mod100 !== 11) return 'status.activeOne'
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return 'status.activeFew'
  return 'status.activeMany'
}
