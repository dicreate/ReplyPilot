---
name: motion-audio
description: Animation and sound with framer-motion 11.12, lottie-react 2.4 and howler 2.2. Use when adding transitions, micro-interactions, Lottie illustrations, empty states, or notification sounds.
---

# Motion + Audio (pinned: framer-motion@11.12, lottie-react@2.4, howler@2.2)

Offline-first. Motion explains state change; never decoration that blocks input.

## 1. Framer Motion basics

```tsx
import { motion, AnimatePresence } from 'framer-motion'

;<AnimatePresence>
  {open && (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      transition={{ duration: 0.18 }}
    >
      <Panel />
    </motion.div>
  )}
</AnimatePresence>
```

Rules: `AnimatePresence` for every exit (no pop-outs), durations 0.15–0.25s for UI, `layout` only on small lists (layout animations on huge tables jank). Respect `prefers-reduced-motion`:

```tsx
import { useReducedMotion } from 'framer-motion'
const reduce = useReducedMotion()
// skip/limit animations when reduce === true
```

Modals/drawers animate opacity+translate, never scale from 0 (a11y + map canvas repaint cost).

## 2. Lottie (lottie-react)

```tsx
import Lottie from 'lottie-react'
import emptyAnim from './empty.json'

;<Lottie animationData={emptyAnim} loop autoplay style={{ width: 180 }} />
```

Use for empty states / success illustrations only. Keep JSON local and small (<200KB); large animations lazy-load with route chunk. Always provide text fallback (title + action) — animation never the only signal.

## 3. Audio (howler)

```ts
import { Howl } from 'howler'

const ping = new Howl({ src: ['/sounds/ping.mp3'], volume: 0.4, preload: true })

export function notify() {
  if (soundEnabled()) void ping.play()
}
```

Singleton Howls created once (module scope), `unload()` on settings-off/unmount. Autoplay policies: first play must follow user gesture — init on first interaction, never on page load. Volume + mute toggle mandatory; default muted for ambient, opt-in for alerts.

## 4. Perf

Animate `transform`/`opacity` only (GPU); never animate `width/height/top/left` on lists. Map markers: no per-marker motion loops.

## Checklist

- [ ] Exits animated, reduced-motion respected.
- [ ] Lottie small + text fallback.
- [ ] Audio singleton, gesture-gated, mutable.
