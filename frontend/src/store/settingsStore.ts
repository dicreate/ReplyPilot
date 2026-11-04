import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type Lang = 'ru' | 'en'

interface SettingsState {
  lang: Lang
  setLang: (lang: Lang) => void
}

/** Пользовательские настройки интерфейса (не серверные данные). */
export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      lang: 'ru',
      setLang: (lang) => set({ lang }),
    }),
    { name: 'replypilot-settings' },
  ),
)
