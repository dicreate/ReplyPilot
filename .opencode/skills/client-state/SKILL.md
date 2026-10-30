---
name: client-state
description: >
  Client UI state with Zustand v5 and Immer v10. Use when managing UI state,
  stores, sidebar toggles, selected items, multi-step workflows, modal states,
  or any client-side state that is NOT fetched from a server.
  Server state stays in TanStack Query, not here.
---

# Client State (pinned: zustand@5, immer@10)

**Rule #1**: server cache (TanStack Query) ≠ client state (this skill).
Never store API response data in Zustand.

## 1. Базовый store (Zustand v5)

```ts
import { create } from 'zustand'

interface UIState {
  isSidebarOpen: boolean
  activeAccountId: string | null
  toggleSidebar: () => void
  setActiveAccount: (id: string | null) => void
  reset: () => void
}

const initialState = {
  isSidebarOpen: true,
  activeAccountId: null,
}

export const useUIStore = create<UIState>((set) => ({
  ...initialState,
  toggleSidebar: () => set(s => ({ isSidebarOpen: !s.isSidebarOpen })),
  setActiveAccount: (id) => set({ activeAccountId: id }),
  reset: () => set(initialState),
}))
```

## 2. Узкие селекторы (не подписывайся на весь стор)

```ts
// ✅ Подписывается только на нужное поле
const isSidebarOpen = useUIStore(s => s.isSidebarOpen)
const toggleSidebar = useUIStore(s => s.toggleSidebar)

// ❌ Подписывается на весь стор — ре-рендер на любое изменение
const store = useUIStore()
```

## 3. Store с Immer (вложенные состояния)

```ts
import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'

interface FlowState {
  nodes: Node[]
  edges: Edge[]
  addNode: (node: Node) => void
  removeNode: (id: string) => void
  updateNodeLabel: (id: string, label: string) => void
}

export const useFlowStore = create<FlowState>()(
  immer((set) => ({
    nodes: [],
    edges: [],
    addNode: (node) => set(s => { s.nodes.push(node) }),
    removeNode: (id) => set(s => { s.nodes = s.nodes.filter(n => n.id !== id) }),
    updateNodeLabel: (id, label) => set(s => {
      const node = s.nodes.find(n => n.id === id)
      if (node) node.data.label = label
    }),
  }))
)
```

## 4. Store с devtools (только в разработке)

```ts
import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

export const useAutomationStore = create<AutomationState>()(
  devtools(
    (set) => ({
      selectedAutomationId: null,
      selectAutomation: (id) => set({ selectedAutomationId: id }, false, 'selectAutomation'),
    }),
    { name: 'automation-store', enabled: import.meta.env.DEV }
  )
)
```

## 5. Async actions в сторе (только UI side-effects)

```ts
// Zustand async — только для UI-side-effects (loading индикаторы, не за API данные)
interface UploadState {
  isUploading: boolean
  progress: number
  startUpload: (file: File) => Promise<void>
}

export const useUploadStore = create<UploadState>((set) => ({
  isUploading: false,
  progress: 0,
  startUpload: async (file) => {
    set({ isUploading: true, progress: 0 })
    // реальный upload идёт через TanStack Query mutation
    // здесь только UI state
    set({ isUploading: false, progress: 100 })
  },
}))
```

## 6. Reset при смене роута / аккаунта

```ts
// В layout компоненте при смене accountId
const reset = useUIStore(s => s.reset)

useEffect(() => {
  return () => reset() // cleanup при unmount
}, [accountId, reset])
```

Stale selection — баг #1 с клиентским стейтом. Всегда предусматривай reset.

## 7. Когда что использовать

| Ситуация | Инструмент |
|---|---|
| Sidebar open/close, selected tab | Zustand |
| Выбранный аккаунт, активный фильтр | Zustand |
| Вложенные объекты (ноды, edges flow) | Zustand + Immer |
| Список автоматизаций с API | TanStack Query |
| Статистика, аналитика | TanStack Query |
| Multi-step form временные данные | Zustand (сбросить после submit) |

## Version traps

- **Zustand v5**: `create<T>()` — тип передаётся в дженерик, не в `create<T, ...>`.
- **Zustand v5**: `set(state, replace)` — второй аргумент `replace` переименован в `shouldReplace`.
- **Immer middleware**: не оборачивай `set()` в дополнительный `produce()` — immer уже внутри.
- **devtools**: третий аргумент `set` — action name для DevTools: `set({...}, false, 'actionName')`.
- **XState**: не используем в этом проекте — Zustand достаточно для Instagram SaaS.

## Checklist

- [ ] Нет серверных данных в Zustand.
- [ ] Узкие селекторы, не весь стор.
- [ ] `reset()` существует и вызывается при смене контекста.
- [ ] Immer только для вложенных мутаций.
- [ ] devtools только в `import.meta.env.DEV`.
