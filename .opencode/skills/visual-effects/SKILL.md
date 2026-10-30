---
name: visual-effects
description: >-
  Cutting-edge visual polish for modern landing pages and showcase interfaces:
  Spotlight cards, Bento grids, Aurora/mesh gradients, Glassmorphism 2.0, Magnetic
  buttons, and subtle 3D hover effects.
  APPLY ONLY to: landing pages, hero sections, marketing showcase blocks, feature tours,
  or when explicitly requested by user.
  STRICTLY FORBIDDEN in: data tables, enterprise dashboards, complex forms, settings pages,
  and internal tools where speed, clarity, and zero cognitive load are paramount.
---

# Visual Effects — Modern Polish & Interactive Flourishes

High-end digital products (Linear, Stripe, Apple, Vercel) stand out because of micro-details:
lighting, depth, and tactile feedback. This skill provides production-grade, zero-dependency
implementations using **React 19 + Tailwind CSS v4 + Framer Motion 11 + CSS variables**.

---

## 1. Golden Rules of Restraint

1. **Effects serve content, not ego**: Never let an effect obscure text or slow down interaction.
2. **One hero effect per screen**: Don't combine an Aurora gradient + Spotlight cards + Particle canvas + 3D tilt on the same viewport. Pick ONE signature effect.
3. **Respect accessibility**: If `prefers-reduced-motion` is active, turn off 3D tilts, magnetic snaps, and continuous gradient animations.
4. **Mobile degradation**: Disable mouse-following spotlights and 3D tilts on touch devices (where `hover: none` or pointer is coarse).

---

## 2. Spotlight Card (Mouse-Tracking Glow)

The signature Linear / Raycast effect: cards with subtle glowing borders and radial background illumination that smoothly follow the user's cursor.

```tsx
import React, { useRef, useState, useCallback } from 'react'

interface SpotlightCardProps {
  children: React.ReactNode
  className?: string
  spotlightColor?: string // e.g. "rgba(59, 130, 246, 0.15)"
}

export function SpotlightCard({
  children,
  className = '',
  spotlightColor = 'rgba(99, 102, 241, 0.15)',
}: SpotlightCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [opacity, setOpacity] = useState(0)

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return
    const rect = cardRef.current.getBoundingClientRect()
    setPosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    })
  }, [])

  const handleMouseEnter = useCallback(() => setOpacity(1), [])
  const handleMouseLeave = useCallback(() => setOpacity(0), [])

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`relative overflow-hidden rounded-2xl border border-gray-200/80 bg-white/50 p-6 backdrop-blur-sm transition-all duration-300 dark:border-gray-800/80 dark:bg-gray-900/40 ${className}`}
    >
      {/* Spotlight glow layer */}
      <div
        className="pointer-events-none absolute -inset-px transition-opacity duration-300"
        style={{
          opacity,
          background: `radial-gradient(600px circle at ${position.x}px ${position.y}px, ${spotlightColor}, transparent 40%)`,
        }}
        aria-hidden="true"
      />
      {/* Content wrapper */}
      <div className="relative z-10">{children}</div>
    </div>
  )
}
```

---

## 3. Bento Grid System

Bento grids organize features into an asymmetric, visually balanced modular mosaic.

```tsx
export function BentoGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-7xl mx-auto p-4">
      {children}
    </div>
  )
}

interface BentoItemProps {
  title: string
  description: string
  header?: React.ReactNode // illustration / interactive widget / chart
  icon?: React.ReactNode
  className?: string
}

export function BentoItem({
  title,
  description,
  header,
  icon,
  className = '',
}: BentoItemProps) {
  return (
    <div
      className={`group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-gray-200/80 bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-md dark:border-gray-800 dark:bg-gray-900/60 dark:hover:border-gray-700 ${className}`}
    >
      {header && <div className="mb-4 overflow-hidden rounded-xl">{header}</div>}
      <div className="transition duration-200 group-hover:translate-x-1">
        {icon && <div className="mb-2 text-indigo-500">{icon}</div>}
        <h3 className="text-lg font-semibold tracking-tight text-gray-900 dark:text-gray-100">
          {title}
        </h3>
        <p className="mt-1 text-sm leading-relaxed text-gray-500 dark:text-gray-400">
          {description}
        </p>
      </div>
    </div>
  )
}
```

### Typical Bento Layout Pattern (3-Column):
```tsx
<BentoGrid>
  {/* Large Hero Card: spans 2 cols, 2 rows */}
  <BentoItem
    className="md:col-span-2 md:row-span-2 min-h-[360px]"
    title="Real-time Collaborative Canvas"
    description="Work simultaneously with 50+ team members without any latency or sync conflicts."
    header={<InteractiveCanvasPreview />}
  />

  {/* Standard Card 1 */}
  <BentoItem
    className="md:col-span-1"
    title="End-to-End Encryption"
    description="Your secrets never leave your device unencrypted."
  />

  {/* Standard Card 2 */}
  <BentoItem
    className="md:col-span-1"
    title="99.99% Uptime SLA"
    description="Multi-region redundant clusters."
  />

  {/* Wide Bottom Card: spans full 3 cols */}
  <BentoItem
    className="md:col-span-3"
    title="Global Edge Network"
    description="Instant response times from 300+ edge locations worldwide."
  />
</BentoGrid>
```

---

## 4. Aurora & Mesh Background Gradients

Lightweight, pure-CSS atmospheric lighting for hero sections without heavy video or canvas assets.

```tsx
export function AuroraBackground({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-[600px] w-full overflow-hidden bg-slate-950 flex flex-col items-center justify-center text-slate-100">
      {/* Animated glow orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-40">
        <div className="absolute -top-[30%] -left-[10%] h-[500px] w-[500px] rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 blur-[120px] animate-pulse" />
        <div className="absolute top-[20%] -right-[15%] h-[600px] w-[600px] rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 blur-[140px] animate-pulse [animation-delay:2s]" />
        <div className="absolute -bottom-[20%] left-[25%] h-[450px] w-[450px] rounded-full bg-gradient-to-t from-pink-500 to-rose-600 blur-[130px] animate-pulse [animation-delay:4s]" />
      </div>

      {/* Subtle grid pattern overlay for texture */}
      <div
        className="absolute inset-0 bg-[linear-gradient(to_right,#1f293715_1px,transparent_1px),linear-gradient(to_bottom,#1f293715_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none"
        aria-hidden="true"
      />

      {/* Content */}
      <div className="relative z-10 max-w-4xl px-6 text-center">
        {children}
      </div>
    </div>
  )
}
```

---

## 5. Glassmorphism 2.0 (Tactile Frosted Glass)

Never use muddy 50% white rectangles. High-end glass features a micro-border shine and an inset shadow.

```css
/* Glassmorphism Token */
.glass-panel {
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  box-shadow: 
    0 4px 6px -1px rgba(0, 0, 0, 0.05),
    0 2px 4px -2px rgba(0, 0, 0, 0.05),
    inset 0 1px 1px 0 rgba(255, 255, 255, 0.4);
}

.dark .glass-panel {
  background: rgba(15, 23, 42, 0.65);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 
    0 10px 15px -3px rgba(0, 0, 0, 0.4),
    inset 0 1px 0 0 rgba(255, 255, 255, 0.1);
}
```

---

## 6. Magnetic Button (Subtle Cursor Pull)

A button that magnetically glides toward the cursor when hovering nearby.

```tsx
import React, { useRef } from 'react'
import { motion, useMotionValue, useSpring } from 'framer-motion'

interface MagneticButtonProps {
  children: React.ReactNode
  onClick?: () => void
  className?: string
}

export function MagneticButton({
  children,
  onClick,
  className = '',
}: MagneticButtonProps) {
  const ref = useRef<HTMLButtonElement>(null)

  const x = useMotionValue(0)
  const y = useMotionValue(0)

  // Spring physics for smooth return
  const springX = useSpring(x, { stiffness: 180, damping: 14 })
  const springY = useSpring(y, { stiffness: 180, damping: 14 })

  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!ref.current) return
    const { clientX, clientY } = e
    const { left, top, width, height } = ref.current.getBoundingClientRect()
    // Calculate distance from center (-0.5 to +0.5)
    const centerX = left + width / 2
    const centerY = top + height / 2
    const distanceX = clientX - centerX
    const distanceY = clientY - centerY

    // Dampen distance so it only moves max ~12px
    x.set(distanceX * 0.25)
    y.set(distanceY * 0.25)
  }

  const handleMouseLeave = () => {
    x.set(0)
    y.set(0)
  }

  return (
    <motion.button
      ref={ref}
      style={{ x: springX, y: springY }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      className={`relative inline-flex items-center justify-center px-6 py-3 rounded-xl font-medium transition-colors ${className}`}
    >
      {children}
    </motion.button>
  )
}
```

---

## 7. Interactive 3D Tilt Card

Subtle perspective transformation on hover giving a tactile 3D card feel.

```tsx
import React, { useRef } from 'react'
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'

export function TiltCard({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)

  const x = useMotionValue(0)
  const y = useMotionValue(0)

  const mouseXSpring = useSpring(x, { stiffness: 200, damping: 20 })
  const mouseYSpring = useSpring(y, { stiffness: 200, damping: 20 })

  // Rotate between -7deg and +7deg based on mouse position
  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ['7.5deg', '-7.5deg'])
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ['-7.5deg', '7.5deg'])

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return
    const rect = ref.current.getBoundingClientRect()
    const width = rect.width
    const height = rect.height
    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top
    x.set(mouseX / width - 0.5)
    y.set(mouseY / height - 0.5)
  }

  const handleMouseLeave = () => {
    x.set(0)
    y.set(0)
  }

  return (
    <div style={{ perspective: 1000 }}>
      <motion.div
        ref={ref}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }}
        className="w-full rounded-2xl bg-white p-6 shadow-xl transition-shadow duration-300 hover:shadow-2xl dark:bg-gray-900"
      >
        <div style={{ transform: 'translateZ(30px)' }}>{children}</div>
      </motion.div>
    </div>
  )
}
```

---

## Checklist — Visual Effects Application

- [ ] Applied ONLY to marketing/hero/showcase screens (no clutter in work dashboards)
- [ ] Only ONE primary effect per viewport (prevent visual competition)
- [ ] Disabled or simplified on touch devices (no mouse coordinates)
- [ ] Respects `prefers-reduced-motion`
- [ ] Contrast ratio between glowing backgrounds and text is strictly WCAG AA compliant
- [ ] No layout shifts (CLS) caused by tilt or magnetic transform
