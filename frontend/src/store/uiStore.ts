import { create } from 'zustand'

interface UIState {
  isMobileNavOpen: boolean
  setMobileNavOpen: (open: boolean) => void
}

/** Чисто UI-состояние (не серверные данные). */
export const useUIStore = create<UIState>()((set) => ({
  isMobileNavOpen: false,
  setMobileNavOpen: (open) => set({ isMobileNavOpen: open }),
}))
