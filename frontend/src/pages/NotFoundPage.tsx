import { Compass } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/features/auth/authStore'

export function NotFoundPage() {
  const token = useAuthStore((s) => s.token)
  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-5 px-6 text-center">
      <span className="bg-brand-gradient flex size-16 items-center justify-center rounded-2xl text-white shadow-custom">
        <Compass className="size-8" aria-hidden="true" />
      </span>
      <h1 className="text-4xl font-bold tracking-tight">404</h1>
      <p className="max-w-sm text-muted-foreground">
        Page not found. It may have been moved, or the link is out of date.
      </p>
      <Button onClick={() => window.location.assign(token ? '/dashboard' : '/')} className="gap-2">
        Back to {token ? 'dashboard' : 'home'}
      </Button>
    </main>
  )
}
