import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

export interface InstagramUser {
  id: string
  username: string
  name?: string
  profilePictureUrl?: string
  instagramId?: string
}

interface AuthState {
  token: string | null
  user: InstagramUser | null
  setAuth: (token: string, user: InstagramUser) => void
  clearAuth: () => void
}

/**
 * Единственный источник аутентификации. Персистится в localStorage.
 * Вне React-компонентов читаем через useAuthStore.getState().
 */
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      setAuth: (token, user) => set({ token, user }),
      clearAuth: () => set({ token: null, user: null }),
    }),
    {
      name: 'replypilot-auth',
      storage: createJSONStorage(() => localStorage),
    },
  ),
)

export const getAuthToken = (): string | null => useAuthStore.getState().token
export const getAuthUser = (): InstagramUser | null => useAuthStore.getState().user
