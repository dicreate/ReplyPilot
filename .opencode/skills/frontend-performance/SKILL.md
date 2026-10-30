---
name: frontend-performance
description: >-
  Frontend performance optimization, Core Web Vitals (LCP, CLS, INP), 120 FPS animations,
  and zero-jank rendering. Activate when building landing pages, optimizing image assets,
  preventing layout shifts, tuning animations, or diagnosing frontend slowness.
---

# Frontend Performance — 120 FPS & Core Web Vitals

A stunning design feels cheap the second it stutters, drops frames, or shifts content while loading.
This skill enforces zero-jank execution, rapid paint times, and rock-solid stability.

---

## 1. Core Web Vitals Targets

| Metric | Target | What it measures | Primary Fix |
|:---|:---|:---|:---|
| **LCP** (Largest Contentful Paint) | **< 2.5s** | When the main content/hero is visible | Preload hero image, inline critical CSS, SSR/fast TTFB |
| **CLS** (Cumulative Layout Shift) | **< 0.1** (target 0.0) | Visual stability (elements moving unexpectedly) | Explicit `aspect-ratio` on all media, reserve space for fonts & ads |
| **INP** (Interaction to Next Paint) | **< 200ms** | Visual feedback responsiveness after clicks/taps | Offload work from main thread, use `useTransition` |

---

## 2. Zero CLS (Layout Shift Prevention)

The #1 visual defect in web apps is content jumping when images, fonts, or dynamic data load.

### 2.1 Always specify dimensions or aspect ratios
Never render an `<img>`, `<video>`, or `<iframe>` without reserved dimensions.

```tsx
// ❌ BAD: causes layout jump when image downloads
<img src="/hero.webp" alt="Hero" className="w-full" />

// ✅ GOOD: aspect-ratio reserves the height before download completes
<div className="aspect-[16/9] w-full overflow-hidden rounded-xl bg-gray-100 dark:bg-gray-800">
  <img
    src="/hero.webp"
    alt="Hero"
    width={1280}
    height={720}
    fetchPriority="high"
    className="h-full w-full object-cover"
  />
</div>
```

### 2.2 Font loading without FOUT/FOIS shifts
When web fonts load, text dimensions can change slightly, triggering layout shift.
Use CSS `font-display: swap` paired with fallback metrics:

```css
@font-face {
  font-family: 'Inter';
  font-style: normal;
  font-weight: 400 700;
  font-display: swap;
  src: url('/fonts/inter.woff2') format('woff2');
}
```

---

## 3. 60 / 120 FPS Animation Doctrine

Browsers run animations on either the **Main Thread** (slow, easily blocked by JavaScript) or the **Compositor/GPU Thread** (fast, runs independently).

### 3.1 The Compositor-Only Rule
During any transition or scroll animation, you may animate **ONLY two CSS properties**:
1. `transform` (`translate`, `scale`, `rotate`)
2. `opacity`

| Property | Phase | GPU Accelerated? | Safe for Continuous Motion? |
|:---|:---|:---:|:---:|
| `transform` | Composite | ✅ YES | ✅ YES |
| `opacity` | Composite | ✅ YES | ✅ YES |
| `top` / `left` / `bottom` / `right` | Layout + Paint | ❌ NO | ❌ **FORBIDDEN** |
| `width` / `height` | Layout + Paint | ❌ NO | ❌ **FORBIDDEN** |
| `margin` / `padding` | Layout + Paint | ❌ NO | ❌ **FORBIDDEN** |
| `box-shadow` | Paint | ❌ NO | ⚠️ Micro-transitions only |
| `filter: blur()` | Paint | ❌ NO | ⚠️ Static or entrance only |

### 3.2 Proper `will-change` usage
`will-change` promotes an element to its own GPU compositing layer.
- **DO NOT** blanket-apply `will-change: transform` to dozens of elements (exhausts GPU memory).
- Apply `will-change` dynamically during hover or right before animation triggers, then remove it.

```css
/* Good: only promote when entering interaction */
.interactive-card:hover {
  will-change: transform;
}
```

---

## 4. React 19 Render Performance

### 4.1 Keeping Motion Values Outside React State
Never store high-frequency values (mouse coordinates, scroll offsets) in `useState`. It triggers a full component re-render on every pixel move!

```tsx
// ❌ BAD: Re-renders the component 60-120 times per second!
const [x, setX] = useState(0)
const onMouseMove = (e) => setX(e.clientX)

// ✅ GOOD: MotionValue updates the DOM node directly without React re-render
const x = useMotionValue(0)
const onMouseMove = (e) => x.set(e.clientX)
```

### 4.2 Non-Blocking Updates with `useTransition`
Keep typing and navigation immediate while large UI chunks update in the background:

```tsx
import { useState, useTransition } from 'react'

export function FastSearch() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [isPending, startTransition] = useTransition()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // 1. Immediate urgent feedback: update input text instantly
    setQuery(e.target.value)

    // 2. Non-urgent background update: filter heavy list without freezing UI
    startTransition(() => {
      setResults(heavyFilter(e.target.value))
    })
  }

  return (
    <div>
      <input value={query} onChange={handleChange} />
      <div className={isPending ? 'opacity-60 transition-opacity' : ''}>
        {results.map(item => <ItemCard key={item.id} {...item} />)}
      </div>
    </div>
  )
}
```

---

## 5. Asset & Image Strategy

1. **Modern formats**: Always prefer WebP or AVIF over PNG/JPEG (typically 50-80% smaller).
2. **Hero image preloading**: The single biggest LCP win.
   ```html
   <link rel="preload" as="image" href="/hero.webp" type="image/webp" fetchpriority="high" />
   ```
3. **Lazy-load everything below the fold**:
   ```tsx
   <img src="/features.webp" loading="lazy" decoding="async" alt="..." />
   ```
4. **SVG Sprites over 50 inline SVGs**: Inline SVGs increase HTML DOM size. For repetitive icons, use SVG `<use xlink:href="#icon-id" />`.

---

## Checklist — Performance Gate

- [ ] LCP hero image has `fetchPriority="high"` and explicit dimensions
- [ ] Every image/container has reserved `aspect-ratio` to prevent CLS
- [ ] No layout properties (`width`, `height`, `top`, `margin`) are animated on scroll
- [ ] High-frequency animation values use `useMotionValue` / CSS vars, not `useState`
- [ ] Heavy list updates wrapped in `useTransition`
- [ ] Web fonts use `font-display: swap`
- [ ] Unused heavyweight JS libraries deferred or code-split
