---
name: testing
description: >
  Tests with Vitest 2.x, @testing-library/react 16, MSW v2, Playwright 1.x.
  Use when writing unit tests, component tests, integration tests with mocked API,
  or e2e tests. MSW v2 syntax only (http, HttpResponse). Vitest 2.x only.
---

# Testing (pinned: vitest@2.x, @testing-library/react@16, msw@2.x, playwright@1.x)

Pyramid: many unit → some component/integration → few e2e.

## 1. Install

```bash
# Unit + Component
npm install -D vitest @vitest/coverage-v8 jsdom
npm install -D @testing-library/react @testing-library/user-event @testing-library/jest-dom

# API mocking
npm install -D msw

# E2E
npm install -D @playwright/test
npx playwright install
```

## 2. Vitest config (`vitest.config.ts`)

```ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
    },
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
})
```

## 3. Setup file (`src/test/setup.ts`)

```ts
import '@testing-library/jest-dom'
import { server } from './mocks/server'

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())
```

## 4. MSW v2 handlers (`src/test/mocks/handlers.ts`)

> **TRAP**: MSW v2 uses `http` + `HttpResponse` — NOT `rest` + `ctx`. v1 syntax is FORBIDDEN.

```ts
import { http, HttpResponse } from 'msw'

export const handlers = [
  http.get('/api/automations', () => {
    return HttpResponse.json([
      { id: '1', name: 'Comment → DM', active: true },
      { id: '2', name: 'Story mention', active: false },
    ])
  }),

  http.post('/api/automations', async ({ request }) => {
    const body = await request.json()
    return HttpResponse.json({ id: '3', ...body }, { status: 201 })
  }),

  http.get('/api/automations/:id', ({ params }) => {
    return HttpResponse.json({ id: params.id, name: 'Test automation' })
  }),
]
```

## 5. MSW server setup (`src/test/mocks/server.ts`)

```ts
import { setupServer } from 'msw/node'
import { handlers } from './handlers'

export const server = setupServer(...handlers)
```

## 6. Unit tests (pure logic)

```ts
import { describe, it, expect } from 'vitest'
import { buildTriggerLabel } from '@/features/automations/utils'

describe('buildTriggerLabel', () => {
  it.each([
    ['comment', 'Comment trigger'],
    ['story_mention', 'Story mention trigger'],
  ])('returns correct label for %s', (type, expected) => {
    expect(buildTriggerLabel(type)).toBe(expected)
  })
})
```

## 7. Component tests (RTL + user-event)

```tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AutomationForm } from '@/features/automations/AutomationForm'

// Custom render with providers
import { renderWithProviders } from '@/test/utils'

it('shows validation error when keyword is empty', async () => {
  const user = userEvent.setup()
  renderWithProviders(<AutomationForm onSubmit={vi.fn()} />)

  await user.click(screen.getByRole('button', { name: /save/i }))

  expect(await screen.findByText(/required/i)).toBeInTheDocument()
})

it('submits with valid data', async () => {
  const user = userEvent.setup()
  const onSubmit = vi.fn()
  renderWithProviders(<AutomationForm onSubmit={onSubmit} />)

  await user.type(screen.getByLabelText(/keyword/i), 'price')
  await user.click(screen.getByRole('button', { name: /save/i }))

  expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ keyword: 'price' }))
})
```

## 8. Custom `renderWithProviders` (`src/test/utils.tsx`)

```tsx
import { render, RenderOptions } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router'
import { ReactNode } from 'react'

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
    },
  })
}

function AllProviders({ children }: { children: ReactNode }) {
  return (
    <MemoryRouter>
      <QueryClientProvider client={createTestQueryClient()}>
        {children}
      </QueryClientProvider>
    </MemoryRouter>
  )
}

export function renderWithProviders(ui: React.ReactElement, options?: RenderOptions) {
  return render(ui, { wrapper: AllProviders, ...options })
}
```

## 9. Integration test with MSW

```tsx
import { renderWithProviders } from '@/test/utils'
import { server } from '@/test/mocks/server'
import { http, HttpResponse } from 'msw'
import { AutomationList } from '@/features/automations/AutomationList'

it('renders automations from API', async () => {
  renderWithProviders(<AutomationList />)

  expect(await screen.findByText('Comment → DM')).toBeInTheDocument()
  expect(screen.getByText('Story mention')).toBeInTheDocument()
})

it('shows error state on API failure', async () => {
  // Per-test override
  server.use(
    http.get('/api/automations', () => HttpResponse.error()),
  )

  renderWithProviders(<AutomationList />)

  expect(await screen.findByText(/something went wrong/i)).toBeInTheDocument()
})
```

## 10. E2E with Playwright (`playwright.config.ts`)

```ts
import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
  },
})
```

```ts
// e2e/automations.spec.ts
import { test, expect } from '@playwright/test'

test('create automation flow', async ({ page }) => {
  await page.goto('/automations')

  await page.getByRole('button', { name: /new automation/i }).click()
  await page.getByLabel(/keyword/i).fill('price')
  await page.getByLabel(/reply/i).fill('Here is our pricing...')
  await page.getByRole('button', { name: /save/i }).click()

  await expect(page.getByText('price')).toBeVisible()
})
```

## 11. Scripts (`package.json`)

```json
{
  "scripts": {
    "test":        "vitest",
    "test:run":    "vitest run",
    "test:ci":     "vitest run --reporter=junit",
    "test:cover":  "vitest run --coverage",
    "e2e":         "playwright test",
    "e2e:ui":      "playwright test --ui"
  }
}
```

## Version traps

- **MSW v2**: `http` + `HttpResponse` — NOT `rest` + `ctx`. v1 API is completely removed.
- **MSW v2**: `HttpResponse.error()` for network errors (not `res.networkError()`).
- **MSW v2**: `server.use(http.get(...))` for per-test overrides (same API).
- **Vitest 2**: `globals: true` in config required to use `describe/it/expect` without imports.
- **@testing-library/user-event**: Always `userEvent.setup()` before render — NOT `userEvent` directly.
- **TanStack Query in tests**: `retry: false, gcTime: 0` to avoid hanging async tests.
- **React Router in tests**: Wrap with `MemoryRouter` — never `BrowserRouter` in tests.

## Checklist

- [ ] MSW v2 syntax (`http`, `HttpResponse`) only.
- [ ] `onUnhandledRequest: 'error'` — catches forgotten mocks.
- [ ] `server.resetHandlers()` in `afterEach`.
- [ ] Queries by role/label (a11y-correct) — never by class or tag.
- [ ] `userEvent.setup()` called before render.
- [ ] `renderWithProviders` wraps all component tests.
- [ ] E2E: critical paths only, `data-testid` or ARIA selectors.
- [ ] Test query client: `retry: false`, `gcTime: 0`.
