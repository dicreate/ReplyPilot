import axios from 'axios'
import { envConfig } from './env'
import { getAuthToken, useAuthStore } from '@/features/auth/authStore'

/**
 * Единственный HTTP-клиент приложения. Сырой fetch/axios за пределами этого файла не используется.
 */
export const api = axios.create({
  baseURL: envConfig.backendUrl,
  headers: {
    'Content-Type': 'application/json',
    // Фикс окна предупреждения ngrok при туннелировании
    'ngrok-skip-browser-warning': 'true',
  },
  timeout: 30_000,
})

api.interceptors.request.use((config) => {
  const token = getAuthToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !window.location.pathname.startsWith('/auth/')) {
      useAuthStore.getState().clearAuth()
      window.location.href = '/'
    }
    return Promise.reject(error)
  },
)
