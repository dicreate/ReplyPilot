import { createBrowserRouter, Navigate, redirect } from 'react-router'
import { AppLayout } from './AppLayout'
import { RootErrorBoundary } from './RootErrorBoundary'
import { getAuthToken } from '@/features/auth/authStore'

/** Гард: только для авторизованных разделов под AppLayout. */
function requireAuth() {
  if (!getAuthToken()) {
    throw redirect('/')
  }
  return null
}

/** Лендинг для авторизованных бесполезен — ведём в дашборд. */
function redirectIfAuthenticated() {
  if (getAuthToken()) {
    throw redirect('/dashboard')
  }
  return null
}

export const router = createBrowserRouter([
  {
    // Путьless-обёртка: единый errorElement для всех маршрутов — вместо
    // дефолтного сплэша react-router («Unexpected Application Error!»).
    errorElement: <RootErrorBoundary />,
    children: [
      {
        path: '/',
        loader: redirectIfAuthenticated,
        lazy: () =>
          import('@/pages/LandingPage').then((m) => ({ Component: m.LandingPage })),
      },
      {
        path: '/auth/instagram/callback',
        lazy: () =>
          import('@/pages/OAuthCallbackPage').then((m) => ({ Component: m.OAuthCallbackPage })),
      },
      {
        path: '/privacy',
        lazy: () => import('@/pages/PrivacyPage').then((m) => ({ Component: m.PrivacyPage })),
      },
      {
        path: '/terms',
        lazy: () => import('@/pages/TermsPage').then((m) => ({ Component: m.TermsPage })),
      },
      {
        element: <AppLayout />,
        loader: requireAuth,
        children: [
          {
            path: 'dashboard',
            lazy: () => import('@/pages/DashboardPage').then((m) => ({ Component: m.DashboardPage })),
          },
          {
            path: 'keywords',
            lazy: () => import('@/pages/KeywordsPage').then((m) => ({ Component: m.KeywordsPage })),
          },
          {
            path: 'funnels',
            lazy: () => import('@/pages/FunnelsPage').then((m) => ({ Component: m.FunnelsPage })),
          },
          {
            path: 'funnels/:id',
            lazy: () =>
              import('@/pages/FunnelEditorPage').then((m) => ({ Component: m.FunnelEditorPage })),
          },
          {
            path: 'analytics',
            lazy: () => import('@/pages/AnalyticsPage').then((m) => ({ Component: m.AnalyticsPage })),
          },
          { path: '', element: <Navigate to="/dashboard" replace /> },
        ],
      },
      {
        path: '*',
        lazy: () => import('@/pages/NotFoundPage').then((m) => ({ Component: m.NotFoundPage })),
      },
    ],
  },
])
