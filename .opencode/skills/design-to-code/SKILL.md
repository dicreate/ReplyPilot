---
name: design-to-code
description: >-
  Bridge between design decisions and code implementation — theme configuration,
  design token setup with Tailwind CSS v4, CSS layout patterns (Grid, Flexbox),
  responsive implementation, image optimization, and perceived performance patterns
  (skeletons, optimistic updates). Activate when implementing visual designs in code
  with React 19, Tailwind CSS v4, and shadcn/ui.
---

# Design → Code Bridge (Tailwind CSS v4 + shadcn/ui + React 19)

This skill translates design principles into concrete code. It connects design skills
(`ui-ux-design`, `design-psychology`, `ux-patterns`) with technical skills (`ui-system-shadcn`, `react-19-core`).

**Rule:** Never write CSS or styles by "feel." Every value must trace back to
a design token (`@theme`, CSS variables) or a principle from the design skills.

---

## 1. Theme Configuration — Single Source of Truth

Design tokens live in ONE place: `src/index.css` via Tailwind v4 `@theme` and CSS variables.
Never hardcode hex colors, arbitrary spacing, or raw fonts in components.

### 1.1 Tailwind v4 `@theme` & CSS Variables Setup

```css
/* src/index.css */
@import "tailwindcss";

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 240 10% 3.9%;
    --card: 0 0% 100%;
    --card-foreground: 240 10% 3.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 240 10% 3.9%;
    --primary: 262 83% 58%;
    --primary-foreground: 0 0% 98%;
    --secondary: 240 4.8% 95.9%;
    --secondary-foreground: 240 5.9% 10%;
    --muted: 240 4.8% 95.9%;
    --muted-foreground: 240 3.8% 46.1%;
    --accent: 240 4.8% 95.9%;
    --accent-foreground: 240 5.9% 10%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 0 0% 98%;
    --border: 240 5.9% 90%;
    --input: 240 5.9% 90%;
    --ring: 262 83% 58%;
    --radius: 0.625rem;
  }

  .dark {
    --background: 240 10% 3.9%;
    --foreground: 0 0% 98%;
    --card: 240 10% 3.9%;
    --card-foreground: 0 0% 98%;
    --popover: 240 10% 3.9%;
    --popover-foreground: 0 0% 98%;
    --primary: 262 83% 58%;
    --primary-foreground: 0 0% 98%;
    --secondary: 240 3.7% 15.9%;
    --secondary-foreground: 0 0% 98%;
    --muted: 240 3.7% 15.9%;
    --muted-foreground: 240 5% 64.9%;
    --accent: 240 3.7% 15.9%;
    --accent-foreground: 0 0% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 0 0% 98%;
    --border: 240 3.7% 15.9%;
    --input: 240 3.7% 15.9%;
    --ring: 262 83% 58%;
  }
}

@theme {
  --color-brand: hsl(var(--primary));
  --color-brand-foreground: hsl(var(--primary-foreground));
  --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  --font-mono: 'JetBrains Mono', monospace;
  --radius-lg: var(--radius);
  --radius-md: calc(var(--radius) - 2px);
  --radius-sm: calc(var(--radius) - 4px);
}
```

### 1.2 Spacing & Radii Scale

- **Base grid (4px)**: `gap-1` (4px), `gap-2` (8px), `gap-3` (12px), `gap-4` (16px), `gap-6` (24px), `gap-8` (32px).
- **Border radius**:
  - `rounded-sm` (4px): inputs, tags, badges
  - `rounded-md` (6px): buttons, dropdown items
  - `rounded-lg` (8-10px): cards, modals, dialogs
  - `rounded-full`: avatars, status pills

---

## 2. CSS Layout Patterns

### 2.1 Page Shell (App Layout with Sidebar)

```tsx
// Sidebar + main content — standard SaaS app layout
export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      {/* Sidebar — fixed width, scrollable */}
      <aside className="hidden md:flex w-64 shrink-0 flex-col border-r border-border bg-card">
        <div className="h-14 flex items-center px-6 border-b border-border font-semibold">
          AutoGram
        </div>
        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          {/* Navigation Links */}
        </nav>
      </aside>

      {/* Main area — fills remaining space */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top header bar */}
        <header className="h-14 shrink-0 border-b border-border flex items-center justify-between px-6 bg-card/50 backdrop-blur">
          <div className="font-medium text-sm text-muted-foreground">Automations</div>
          <div className="flex items-center gap-3">{/* Actions & Profile */}</div>
        </header>

        {/* Scrollable content area */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
```

### 2.2 Responsive Card Grid

```tsx
// Responsive grid: 1 col → 2 col → 3 col → 4 col
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
  {items.map(item => (
    <Card key={item.id} className="hover:shadow-md transition-shadow">
      <CardHeader>
        <CardTitle>{item.name}</CardTitle>
      </CardHeader>
      <CardContent>{item.description}</CardContent>
    </Card>
  ))}
</div>
```

### 2.3 KPI Row

```tsx
import { Card, CardContent } from '@/components/ui/card'
import { ArrowUpRight, ArrowDownRight } from 'lucide-react'

interface KpiProps {
  label: string
  value: string
  trend: string
  positive: boolean
}

function KpiCard({ label, value, trend, positive }: KpiProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <div className="mt-2 flex items-baseline justify-between">
          <span className="text-2xl font-bold tracking-tight">{value}</span>
          <span className={`inline-flex items-center text-xs font-semibold ${positive ? 'text-emerald-600 dark:text-emerald-400' : 'text-destructive'}`}>
            {positive ? <ArrowUpRight className="size-3.5 mr-0.5" /> : <ArrowDownRight className="size-3.5 mr-0.5" />}
            {trend}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}

// 4 KPI cards in a row, stacking responsively
<div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
  <KpiCard label="Total Replies" value="14,290" trend="+18.2%" positive />
  <KpiCard label="Active Bots" value="8" trend="+2" positive />
  <KpiCard label="Trigger Rate" value="94.3%" trend="+1.1%" positive />
  <KpiCard label="Avg Response" value="1.2s" trend="-0.4s" positive />
</div>
```

### 2.4 Content + Right Sidebar Layout

```tsx
// Main content with right contextual sidebar (inspector, filters, node properties)
<div className="flex gap-6 h-full">
  <div className="flex-1 min-w-0">
    {/* Canvas / Main Table */}
  </div>
  <aside className="w-80 shrink-0 hidden lg:block border border-border rounded-lg bg-card p-4 overflow-y-auto">
    {/* Inspector / Settings */}
  </aside>
</div>
```

---

## 3. Responsive Implementation

### 3.1 Mobile-First Breakpoints

| Prefix | Min-Width | Device / Use Case |
|---|---|---|
| *none* | `0px` | Mobile (default) |
| `sm:` | `640px` | Large phones, small tablets |
| `md:` | `768px` | Tablets, collapsed sidebar |
| `lg:` | `1024px` | Laptops, persistent sidebar |
| `xl:` | `1280px` | Desktops, multi-column inspectors |
| `2xl:` | `1536px` | Wide screens |

### 3.2 Responsive Navigation (Sheet on Mobile)

```tsx
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Menu } from 'lucide-react'

export function MobileNav() {
  return (
    <div className="md:hidden flex items-center justify-between p-4 border-b">
      <span className="font-bold">AutoGram</span>
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon">
            <Menu className="size-5" />
            <span className="sr-only">Toggle menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0">
          <nav className="p-4 space-y-2">
            {/* Nav items */}
          </nav>
        </SheetContent>
      </Sheet>
    </div>
  )
}
```

### 3.3 Responsive Table to Card List

```tsx
// Desktop: table. Mobile: card list.
<div className="block md:hidden space-y-3">
  {data.map(item => (
    <Card key={item.id} className="p-4">
      <div className="flex justify-between items-start">
        <span className="font-semibold">{item.name}</span>
        <Badge variant={item.active ? 'default' : 'secondary'}>
          {item.active ? 'Active' : 'Paused'}
        </Badge>
      </div>
      <p className="text-xs text-muted-foreground mt-2">{item.updatedAt}</p>
    </Card>
  ))}
</div>

<div className="hidden md:block">
  {/* TanStack Table implementation */}
</div>
```

---

## 4. Perceived Performance Patterns

### 4.1 Skeleton Screens (Matching Content Shape)

```tsx
import { Skeleton } from '@/components/ui/skeleton'

export function AutomationCardSkeleton() {
  return (
    <div className="p-6 border border-border rounded-lg bg-card space-y-4">
      <div className="flex items-center gap-4">
        <Skeleton className="size-10 rounded-full" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-3 w-1/4" />
        </div>
      </div>
      <Skeleton className="h-16 w-full rounded-md" />
      <div className="flex justify-between pt-2">
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-8 w-16" />
      </div>
    </div>
  )
}
```

### 4.2 Optimistic Updates with TanStack Query v5

```tsx
import { useMutation, useQueryClient } from '@tanstack/react-query'

export function useToggleAutomation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      api.patch(`/automations/${id}`, { active }),

    onMutate: async ({ id, active }) => {
      // 1. Cancel pending refetches
      await queryClient.cancelQueries({ queryKey: ['automations'] })

      // 2. Snapshot previous value
      const previous = queryClient.getQueryData<Automation[]>(['automations'])

      // 3. Optimistically set new status in cache
      queryClient.setQueryData<Automation[]>(['automations'], (old = []) =>
        old.map(item => item.id === id ? { ...item, active } : item)
      )

      return { previous }
    },

    onError: (_err, _vars, context) => {
      // Rollback on failure
      queryClient.setQueryData(['automations'], context?.previous)
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['automations'] })
    },
  })
}
```

### 4.3 Loading States Hierarchy (Doherty Threshold < 400ms)

```tsx
export function AutomationsView() {
  const { data, isPending, error, refetch } = useQuery(...)

  // 1. Initial load — skeleton matching grid shape
  if (isPending) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <AutomationCardSkeleton key={i} />
        ))}
      </div>
    )
  }

  // 2. Error — inline alert with retry
  if (error) {
    return (
      <div className="p-8 text-center border border-destructive/20 rounded-lg bg-destructive/5">
        <p className="text-destructive font-medium">Failed to load automations</p>
        <Button onClick={() => refetch()} variant="outline" className="mt-4">
          Try Again
        </Button>
      </div>
    )
  }

  // 3. Empty state with clear CTA
  if (data.length === 0) {
    return (
      <div className="p-12 text-center border border-dashed rounded-lg">
        <Bot className="size-12 mx-auto text-muted-foreground" />
        <h3 className="mt-4 text-lg font-semibold">No automations yet</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Create your first Instagram keyword responder.
        </p>
        <Button className="mt-6">Create Automation</Button>
      </div>
    )
  }

  // 4. Data view
  return <AutomationGrid items={data} />
}
```

---

## 5. Media & Avatars

```tsx
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

// Instagram profile avatar with fallback initials
export function UserAvatar({ user }: { user: { name: string; avatarUrl?: string } }) {
  const initials = user.name
    .split(' ')
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <Avatar className="size-9">
      <AvatarImage src={user.avatarUrl} alt={user.name} />
      <AvatarFallback className="bg-primary/10 text-primary font-medium text-xs">
        {initials}
      </AvatarFallback>
    </Avatar>
  )
}
```

---

## 6. Transitions & Motion

### 6.1 Standard Tailwind Transitions

```tsx
// Interactive card with subtle lift and border glow
<div className="
  p-6 rounded-lg border border-border bg-card
  transition-all duration-200 ease-out
  hover:-translate-y-0.5 hover:shadow-md hover:border-primary/40
  cursor-pointer
">
  {/* Content */}
</div>
```

### 6.2 Reduced Motion Support

```tsx
// Framer motion with reduced motion check
import { motion, useReducedMotion } from 'framer-motion'

export function FadeIn({ children }: { children: React.ReactNode }) {
  const shouldReduce = useReducedMotion()

  return (
    <motion.div
      initial={shouldReduce ? { opacity: 1 } : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      {children}
    </motion.div>
  )
}
```

---

## 7. Focus Management & Keyboard Navigation

### 7.1 Accessible Focus Styles

```tsx
// Built into shadcn components via ring utility
// For custom focusable elements:
<button className="
  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
  rounded-md
">
  Action
</button>
```

### 7.2 Skip to Content Link

```tsx
// First focusable element on page
<a
  href="#main-content"
  className="
    sr-only focus:not-sr-only
    focus:fixed focus:top-4 focus:left-4 focus:z-50
    focus:px-4 focus:py-2 focus:bg-background focus:text-foreground
    focus:border focus:shadow-lg focus:rounded-md
  "
>
  Skip to main content
</a>
```

### 7.3 Modal Dialogs

Use shadcn `Dialog` (powered by Radix UI primitive) which automatically handles:
- Focus trapping inside dialog
- Escape key dismissal
- Background scroll locking
- Restoring focus to trigger upon close
- Screen-reader `aria-modal="true"`

---

## Checklist — Design-to-Code Implementation

- [ ] All colors and spacing come from Tailwind v4 `@theme` and CSS variables.
- [ ] No hardcoded hex colors (`#3b82f6`) in component code.
- [ ] Responsive layouts work on mobile (`375px`), tablet (`768px`), and desktop (`1280px+`).
- [ ] Skeletons match exact content shape (no spinners on initial page loads).
- [ ] Optimistic updates configured for high-frequency actions (toggle bot, archive message).
- [ ] Empty states contain an icon, clear explanation, and primary CTA.
- [ ] Avatars have fallback initials.
- [ ] Focus rings use `focus-visible:ring-2 focus-visible:ring-ring`.
- [ ] Reduced motion is respected via `useReducedMotion` or CSS `motion-reduce:`.
