---
name: react-19-core
description: >
  React 19 + ReactDOM 19 patterns. Use when writing React components, hooks,
  memoization, effects, context, error boundaries, optimistic updates, or
  using new React 19 APIs: use(), useActionState, useFormStatus, useOptimistic,
  ref as prop (no forwardRef), createRoot.
---

# React 19 Core (pinned: react@19, react-dom@19, react-error-boundary@5)

## 1. Root API

```tsx
// main.tsx
import { createRoot } from 'react-dom/client'
import App from './App'

createRoot(document.getElementById('root')!).render(<App />)
```

## 2. New React 19 APIs

### `use()` — читает промисы и контекст внутри рендера

```tsx
import { use, Suspense } from 'react'

// Читает промис (аналог await, но в компоненте)
function AutomationDetail({ promise }: { promise: Promise<Automation> }) {
  const automation = use(promise) // Suspense boundary ловит loading
  return <div>{automation.name}</div>
}

// Читает контекст условно (в отличие от useContext)
function Theme({ show }: { show: boolean }) {
  if (!show) return null
  const theme = use(ThemeContext) // можно внутри if
  return <div className={theme} />
}
```

### `useOptimistic` — оптимистичные обновления

```tsx
import { useOptimistic } from 'react'

function AutomationList({ automations }: { automations: Automation[] }) {
  const [optimisticList, addOptimistic] = useOptimistic(
    automations,
    (state, newItem: Automation) => [...state, newItem],
  )

  async function handleAdd(data: Automation) {
    addOptimistic(data)          // мгновенно добавляет в UI
    await api.post('/automations', data) // реальный запрос
  }

  return <ul>{optimisticList.map(a => <li key={a.id}>{a.name}</li>)}</ul>
}
```

### `useActionState` — состояние async действий (форм)

```tsx
import { useActionState } from 'react'

async function saveAutomation(_prev: State, formData: FormData) {
  const keyword = formData.get('keyword') as string
  if (!keyword) return { error: 'Keyword is required' }
  await api.post('/automations', { keyword })
  return { error: null }
}

function AutomationForm() {
  const [state, action, isPending] = useActionState(saveAutomation, { error: null })

  return (
    <form action={action}>
      <input name="keyword" />
      {state.error && <p>{state.error}</p>}
      <button disabled={isPending}>
        {isPending ? 'Saving...' : 'Save'}
      </button>
    </form>
  )
}
```

### `ref` как проп (нет больше `forwardRef`)

```tsx
// React 19 — ref передаётся как обычный проп
function Input({ ref, ...props }: React.ComponentProps<'input'>) {
  return <input ref={ref} {...props} />
}

// Использование
const inputRef = useRef<HTMLInputElement>(null)
<Input ref={inputRef} />

// ЗАПРЕЩЕНО: forwardRef в React 19 — устарел
// const Input = forwardRef<HTMLInputElement, Props>(...) // не используй
```

## 3. Актуальные хуки (работают и в 19)

```tsx
// useTransition — не блокирующие обновления
const [isPending, startTransition] = useTransition()
startTransition(() => setQuery(next))

// useDeferredValue — тяжёлые вычисления
const deferredQuery = useDeferredValue(query)

// useId — a11y id (не для ключей списков)
const id = useId()
<label htmlFor={id}>Keyword</label>
<input id={id} />

// useSyncExternalStore — внешние подписки
const count = useSyncExternalStore(store.subscribe, store.getCount)
```

## 4. Правила state

1. Derive during render — не дублируй props в state + effect.
2. Функциональные обновления: `setState(prev => [...prev, item])`.
3. Lazy init: `useState(() => buildHeavy())`.
4. `useReducer` при 3+ связанных полях или сложных переходах.
5. Разделяй контексты по частоте обновлений.

```tsx
// ❌ Плохо — состояние через effect
const [filtered, setFiltered] = useState(items)
useEffect(() => { setFiltered(items.filter(f)) }, [items, f])

// ✅ Хорошо — derive during render
const filtered = useMemo(() => items.filter(f), [items, f])
```

## 5. Effects

1. Нет эффектов для derived state.
2. Всегда cleanup: подписки, таймеры, WebSocket.
3. Не кладите свежие объекты/массивы в dep array — мемоизируй.
4. StrictMode в dev: эффекты монтируются дважды — cleanup обязателен.

```tsx
useEffect(() => {
  const socket = connectSocket()
  socket.on('message', handler)
  return () => socket.off('message', handler) // cleanup!
}, [handler])
```

## 6. Мемоизация (только по замеру)

- `React.memo` — дорогие чистые листья со стабильными пропами.
- `useMemo` — вычисления >1ms или большие списки.
- `useCallback` — только если функция dep мемоизированного ребёнка или effect.

## 7. Error Boundaries

```tsx
import { ErrorBoundary } from 'react-error-boundary'

<ErrorBoundary
  fallbackRender={({ error, resetErrorBoundary }) => (
    <div role="alert">
      <p>Ошибка: {error.message}</p>
      <button onClick={resetErrorBoundary}>Повторить</button>
    </div>
  )}
>
  <Feature />
</ErrorBoundary>
```

Ставь boundary на каждый feature-блок — ошибка в виджете не должна убивать всю страницу.

## 8. Порталы, refs, keys

- Порталы для модалок поверх canvas: `createPortal(modal, document.body)`.
- `key` для сброса state при смене сущности: `<Editor key={accountId} />`.
- Не мешай `value` и `defaultValue` на одном input.

## Version traps

- **`forwardRef`** — устарел в React 19, используй `ref` как обычный проп.
- **`use()`** — только для промисов и контекста, требует Suspense boundary для промисов.
- **`useActionState`** — заменяет `useFormState` из React DOM (переименован).
- **Automatic batching** включён везде (включая setTimeout/Promise) — не нужно оптимизировать.
- **React 18 API** — `createRoot`, `useTransition`, `useDeferredValue` всё ещё актуальны.

## Checklist

- [ ] `ref` как проп вместо `forwardRef`.
- [ ] `use()` с Suspense boundary.
- [ ] Нет derived state в effects.
- [ ] Каждая подписка/таймер имеет cleanup.
- [ ] Error boundary на уровне feature.
- [ ] Мемоизация обоснована, не бланкетная.
