import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { KeyRound, Loader2, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { api } from '@/lib/api'
import { useAuthStore, type InstagramUser } from '@/features/auth/authStore'
import { useInstagramOAuth } from '@/features/auth/useInstagramOAuth'

interface OAuthResponse {
  token: string
  user: InstagramUser
}

export function OAuthCallbackPage() {
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(true)
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { handleLogin, loading } = useInstagramOAuth()
  const setAuth = useAuthStore((s) => s.setAuth)
  // Код авторизации одноразовый, а StrictMode монтирует эффект дважды —
  // без гарда уходят два параллельных POST и второй падает с E11000.
  const handledRef = useRef(false)

  useEffect(() => {
    if (handledRef.current) return
    handledRef.current = true

    const handleCallback = async () => {
      try {
        const code = searchParams.get('code')
        const errorParam = searchParams.get('error')

        if (errorParam) {
          setError(`Instagram authentication failed: ${errorParam}`)
          setBusy(false)
          return
        }

        if (!code) {
          setError('No authorization code received from Instagram')
          setBusy(false)
          return
        }

        // Exchange code for access token
        const response = await api.post<OAuthResponse>('/api/auth/instagram', { code })

        setAuth(response.data.token, response.data.user)
        navigate('/dashboard')
      } catch (err) {
        console.error('OAuth callback error:', err)
        setError(
          (err as { response?: { data?: { message?: string } } }).response?.data?.message ??
            'Authentication failed',
        )
        setBusy(false)
      }
    }

    handleCallback()
  }, [searchParams, navigate, setAuth])

  if (busy) {
    return (
      <main className="flex min-h-svh flex-col items-center justify-center gap-4 px-6 text-center">
        <Loader2 className="size-8 animate-spin text-primary" aria-hidden="true" />
        <p className="text-lg font-medium">Completing Instagram authentication…</p>
        <p className="text-sm text-muted-foreground">This will only take a moment</p>
      </main>
    )
  }

  if (error) {
    return (
      <main className="flex min-h-svh flex-col items-center justify-center gap-5 px-6 text-center">
        <XCircle className="size-12 text-destructive" aria-hidden="true" />
        <h1 className="text-2xl font-bold">Authentication Error</h1>
        <p className="max-w-md text-muted-foreground">{error}</p>
        <div className="flex gap-3">
          <Button onClick={() => navigate('/')}>Go Home</Button>
          <Button variant="outline" onClick={handleLogin} disabled={loading}>
            <KeyRound className="size-4" />
            Try Again
          </Button>
        </div>
      </main>
    )
  }

  return null
}
