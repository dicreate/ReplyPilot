import { useState } from 'react'
import { useNavigate } from 'react-router'
import { envConfig } from '@/lib/env'
import { useAuthStore } from './authStore'

/**
 * Вход — через Instagram OAuth (endpoint instagram.com).
 * ВАЖНО: client_id здесь — это ID *приложения Instagram* (Dashboard → use-case
 * Instagram → "ID приложения Instagram"), а НЕ ID Facebook-приложения.
 * Смешивание даёт Invalid platform app, а instagram_business-скоупы
 * на facebook-диалоге дают Invalid Scopes.
 */
export function buildInstagramOAuthUrl(): string {
  const scope =
    'instagram_business_basic,instagram_business_manage_messages,instagram_business_manage_comments'
  return `https://www.instagram.com/oauth/authorize?client_id=${envConfig.instagramAppId}&redirect_uri=${encodeURIComponent(envConfig.instagramRedirectUri)}&response_type=code&scope=${encodeURIComponent(scope)}`
}

export function useInstagramOAuth() {
  const navigate = useNavigate()
  const token = useAuthStore((s) => s.token)
  const [loading, setLoading] = useState(false)

  const handleLogin = () => {
    if (token) {
      navigate('/dashboard')
      return
    }
    setLoading(true)
    try {
      window.location.href = buildInstagramOAuthUrl()
    } catch (err) {
      console.error('Login error:', err)
      setLoading(false)
    }
  }

  return { handleLogin, loading, isAuthenticated: Boolean(token) }
}
