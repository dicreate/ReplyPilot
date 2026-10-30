/**
 * Все переменные окружения собираются здесь. Vite-переменные — только с префиксом VITE_.
 */
const viteEnv = import.meta.env

export const envConfig = {
  backendUrl: viteEnv.VITE_BACKEND_URL ?? 'http://localhost:5000',
  // ID *приложения Instagram* (не Facebook!). Значение-дефолт — проверенный ID из .env.
  instagramAppId: viteEnv.VITE_INSTAGRAM_APP_ID ?? '1627491405694611',
  instagramRedirectUri:
    viteEnv.VITE_INSTAGRAM_REDIRECT_URI ??
    `${typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173'}/auth/instagram/callback`,
} as const
