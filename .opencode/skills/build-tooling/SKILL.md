---
name: build-tooling
description: >
  Build with Vite 6, @vitejs/plugin-react, @tailwindcss/vite, TypeScript 5.
  Use when configuring vite.config.ts, env vars, path aliases, proxies,
  code splitting, or fixing tsc/vite build errors. Tailwind v4 config only.
---

# Build Tooling (pinned: vite@6, @vitejs/plugin-react@4, tailwindcss@4, typescript@5.7)

## 1. `vite.config.ts` baseline

```ts
import path from 'path'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [
      react(),
      tailwindcss(), // Tailwind v4 — НЕ postcss плагин, а Vite плагин
    ],
    resolve: {
      alias: { '@': path.resolve(__dirname, './src') },
    },
    server: {
      port: 5173,
      proxy: {
        '/api': { target: env.VITE_API_URL, changeOrigin: true },
        '/socket.io': { target: env.VITE_WS_URL, ws: true, changeOrigin: true },
      },
    },
    build: {
      target: 'esnext',
      outDir: 'dist',
      sourcemap: mode !== 'production',
      rollupOptions: {
        output: {
          manualChunks: {
            'react-vendor': ['react', 'react-dom', 'react-router'],
            'query-vendor': ['@tanstack/react-query'],
            'flow-vendor': ['@xyflow/react'],
            'chart-vendor': ['recharts'],
          },
        },
      },
    },
  }
})
```

## 2. Tailwind v4 — CSS конфигурация (НЕ tailwind.config.js)

```css
/* src/index.css */
@import "tailwindcss";

/* Кастомные токены через @theme */
@theme {
  --color-brand: hsl(262 83% 58%);
  --color-brand-foreground: hsl(0 0% 100%);
  --radius: 0.625rem;
  --font-sans: 'Inter', sans-serif;
}
```

> **TRAP**: Tailwind v4 — конфиг только в CSS через `@theme {}`.
> `tailwind.config.js` / `tailwind.config.ts` — НЕ используются.
> `@tailwind base/components/utilities` — ЗАПРЕЩЕНЫ (v3 синтаксис).

## 3. Алиасы (single source of truth)

```json
// tsconfig.app.json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": { "@/*": ["./src/*"] }
  }
}
```

`@/*` в tsconfig И `resolve.alias` в vite.config.ts — должны совпадать.
Кросс-feature импорты только через `@/` (никаких `../../../`).

## 4. Env переменные

```ts
// src/vite-env.d.ts
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string       // URL бэкенда
  readonly VITE_WS_URL: string        // URL WebSocket сервера
  readonly VITE_APP_VERSION?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
```

```ts
// src/lib/env.ts — валидация при старте
function requireEnv(key: keyof ImportMetaEnv): string {
  const value = import.meta.env[key]
  if (!value) throw new Error(`Missing env variable: ${key}`)
  return value
}

export const env = {
  apiUrl: requireEnv('VITE_API_URL'),
  wsUrl:  requireEnv('VITE_WS_URL'),
}
```

Доступ только через `import.meta.env.VITE_*`. Секреты — никогда в `VITE_*`.

## 5. Code splitting

```tsx
// Тяжёлые роуты — всегда lazy
// react-router v7 lazy
{ path: 'flow', lazy: () => import('@/pages/FlowBuilderPage').then(m => ({ Component: m.FlowBuilderPage })) }

// или React.lazy + Suspense
const FlowBuilderPage = lazy(() => import('@/pages/FlowBuilderPage'))
<Suspense fallback={<PageSkeleton />}><FlowBuilderPage /></Suspense>
```

`@xyflow/react`, `recharts` — тяжёлые, всегда за lazy route.
Цель main bundle: < 300KB gzip.

## 6. TypeScript gate

```json
// tsconfig.app.json — обязательные флаги
{
  "compilerOptions": {
    "strict": true,
    "skipLibCheck": true,
    "isolatedModules": true,
    "moduleResolution": "bundler",
    "jsx": "react-jsx"
  }
}
```

`npm run build` = `tsc -b && vite build`. Ошибки типов = ошибки билда.

## 7. Scripts

```json
{
  "scripts": {
    "dev":     "vite",
    "build":   "tsc -b && vite build",
    "preview": "vite preview",
    "lint":    "eslint .",
    "test":    "vitest",
    "e2e":     "playwright test"
  }
}
```

## Version traps

- **Tailwind v4**: `@tailwindcss/vite` — Vite плагин, НЕ PostCSS плагин.
- **Tailwind v4**: `tailwind.config.js` не существует — вся конфигурация в CSS.
- **Vite 6**: `resolve.alias` принимает объект `{ '@': path }` — строковые пути требуют `path.resolve`.
- **WebSocket proxy**: `ws: true` в proxy конфиге для Socket.io.
- **manualChunks**: только после измерения — не добавляй вслепую.

## Checklist

- [ ] `tailwindcss()` Vite плагин, не PostCSS.
- [ ] `@theme {}` в CSS вместо `tailwind.config.js`.
- [ ] Алиасы совпадают в tsconfig и vite.config.ts.
- [ ] Env типизированы и валидируются при старте.
- [ ] Тяжёлые deps за lazy routes.
- [ ] `tsc -b` чистый перед `vite build`.
