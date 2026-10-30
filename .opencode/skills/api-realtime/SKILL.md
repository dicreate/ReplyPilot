---
name: api-realtime
description: >
  HTTP with Axios 1.x and realtime with Socket.io client 4.x or native WebSocket.
  Use when calling REST APIs, configuring interceptors, handling auth tokens and errors,
  or wiring WebSocket/Socket.io for live inbox, notifications, or automation status updates.
  Node.js backend — SignalR is NOT used.
---

# API + Realtime (pinned: axios@1.7, socket.io-client@4.x)

One Axios instance, one Socket manager — никаких raw `fetch` в компонентах.

## 1. Axios instance (`src/lib/api.ts`)

```ts
import axios, { AxiosError } from 'axios'
import { env } from './env'

export const api = axios.create({
  baseURL: env.apiUrl,
  timeout: 15_000,
  headers: { 'Content-Type': 'application/json' },
})

// Auth interceptor
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Error interceptor
api.interceptors.response.use(
  (r) => r,
  (error: AxiosError<{ message?: string }>) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(normalizeError(error))
  }
)

function normalizeError(error: AxiosError<{ message?: string }>): Error {
  const message =
    error.response?.data?.message ??
    error.message ??
    'Unknown error'
  return new Error(message)
}
```

## 2. Типизированные вызовы

```ts
// src/features/automations/automationApi.ts
import { api } from '@/lib/api'
import type { Automation, CreateAutomationDto } from '@/types'

export const automationApi = {
  getAll: () => api.get<Automation[]>('/automations').then(r => r.data),
  getById: (id: string) => api.get<Automation>(`/automations/${id}`).then(r => r.data),
  create: (dto: CreateAutomationDto) => api.post<Automation>('/automations', dto).then(r => r.data),
  update: (id: string, dto: Partial<CreateAutomationDto>) =>
    api.patch<Automation>(`/automations/${id}`, dto).then(r => r.data),
  delete: (id: string) => api.delete(`/automations/${id}`),
  toggle: (id: string, active: boolean) =>
    api.patch<Automation>(`/automations/${id}/toggle`, { active }).then(r => r.data),
}
```

## 3. Интеграция с TanStack Query

```ts
// src/features/automations/automationQueries.ts
import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query'
import { automationApi } from './automationApi'

export const automationKeys = {
  all: ['automations'] as const,
  list: () => [...automationKeys.all, 'list'] as const,
  detail: (id: string) => [...automationKeys.all, 'detail', id] as const,
}

export const automationsQueryOptions = () =>
  queryOptions({
    queryKey: automationKeys.list(),
    queryFn: automationApi.getAll,
  })

export function useCreateAutomation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: automationApi.create,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: automationKeys.all }),
  })
}

export function useToggleAutomation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      automationApi.toggle(id, active),
    // Optimistic update
    onMutate: async ({ id, active }) => {
      await queryClient.cancelQueries({ queryKey: automationKeys.list() })
      const prev = queryClient.getQueryData(automationKeys.list())
      queryClient.setQueryData(automationKeys.list(), (old: Automation[] = []) =>
        old.map(a => a.id === id ? { ...a, active } : a)
      )
      return { prev }
    },
    onError: (_err, _vars, ctx) => {
      queryClient.setQueryData(automationKeys.list(), ctx?.prev)
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: automationKeys.list() }),
  })
}
```

## 4. Socket.io client — менеджер подключения (`src/lib/socket.ts`)

```ts
import { io, Socket } from 'socket.io-client'
import { env } from './env'

let socket: Socket | null = null

export function getSocket(): Socket {
  if (!socket) {
    socket = io(env.wsUrl, {
      auth: { token: localStorage.getItem('token') },
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    })
  }
  return socket
}

export function disconnectSocket(): void {
  socket?.disconnect()
  socket = null
}
```

## 5. React хук для Socket.io событий

```tsx
// src/hooks/useSocketEvent.ts
import { useEffect } from 'react'
import { getSocket } from '@/lib/socket'

export function useSocketEvent<T>(event: string, handler: (data: T) => void) {
  useEffect(() => {
    const socket = getSocket()
    socket.on(event, handler)
    return () => { socket.off(event, handler) } // cleanup!
  }, [event, handler])
}
```

## 6. Realtime inbox — обновление кэша Query через сокет

```tsx
// src/features/inbox/InboxPage.tsx
import { useQueryClient } from '@tanstack/react-query'
import { useSocketEvent } from '@/hooks/useSocketEvent'
import { useCallback } from 'react'

export function InboxPage() {
  const queryClient = useQueryClient()

  const handleNewMessage = useCallback((msg: InboxMessage) => {
    // Добавляем в кэш без refetch
    queryClient.setQueryData<InboxMessage[]>(['inbox'], (old = []) => [msg, ...old])
    // Или инвалидируем если нужна свежая сортировка
    // queryClient.invalidateQueries({ queryKey: ['inbox'] })
  }, [queryClient])

  useSocketEvent<InboxMessage>('inbox:new_message', handleNewMessage)

  // ...рендер
}
```

## 7. Нативный WebSocket (если без Socket.io)

```ts
// src/lib/websocket.ts
let ws: WebSocket | null = null

export function connectWS(token: string): WebSocket {
  ws = new WebSocket(`${env.wsUrl}?token=${token}`)
  ws.onopen = () => console.log('[WS] Connected')
  ws.onclose = () => { ws = null }
  return ws
}

// В хуке — cleanup обязателен
useEffect(() => {
  const ws = connectWS(token)
  ws.onmessage = (e) => {
    const data = JSON.parse(e.data)
    handleMessage(data)
  }
  return () => ws.close()
}, [token])
```

## 8. Error narrowing

```ts
import { isAxiosError } from 'axios'

function getErrorMessage(e: unknown): string {
  if (isAxiosError(e)) return e.response?.data?.message ?? e.message
  if (e instanceof Error) return e.message
  return 'Unknown error'
}
```

## Checklist

- [ ] Один `api` instance с auth + 401 + timeout.
- [ ] Нет raw `fetch` или `axios.get` вне `src/lib/api.ts`.
- [ ] Socket cleanup в `useEffect` return.
- [ ] Socket события пишут в Query кэш (`setQueryData` или `invalidateQueries`).
- [ ] `useCallback` для socket handler (стабильная ссылка в dep array).
- [ ] `isAxiosError` для narrowing ошибок.
