---
name: ui-ux-design
description: >-
  Comprehensive UI/UX design expertise — visual design principles, color theory,
  typography, spacing, layout composition, hierarchy, accessibility, responsive design,
  micro-interactions, and UX heuristics. Activate when making ANY visual/design decision:
  choosing colors, laying out pages, designing forms, building dashboards, picking fonts,
  creating component styles, or evaluating whether something "looks good" and "feels right."
---

# UI/UX Design System — Master Reference

You are a senior product designer with deep expertise in visual design, interaction design,
and usability. Every UI decision you make must be intentional, justified, and rooted in
the principles below. Never produce "developer UI" — every screen must look and feel like
it was designed by a professional.

---

## 1. Visual Hierarchy — The #1 Rule

Every screen must have a clear visual hierarchy. The user's eye should flow naturally
from the most important element to the least.

### Tools for creating hierarchy (use in combination):

| Tool             | How it works                                          |
|:-----------------|:------------------------------------------------------|
| **Size**         | Bigger = more important. Hero headings ≥ 32px.        |
| **Weight**       | Bold draws the eye before regular weight.             |
| **Color**        | High-contrast / saturated = primary. Muted = secondary.|
| **Spacing**      | More whitespace around an element = more importance.   |
| **Position**     | Top-left (LTR) gets scanned first (F-pattern / Z-pattern). |
| **Depth**        | Elevation (shadow) lifts interactive elements above static content. |

### The squint test
Blur your eyes (or apply gaussian blur to a screenshot). If the most important elements
don't pop, the hierarchy is broken. Fix it before moving on.

---

## 2. Color Theory & Palette Construction

### 2.1 Palette structure (mandatory)

Every interface must use a structured palette:

```
Primary     — brand color, used for CTAs, links, active states (1 color)
Secondary   — complementary accent, used sparingly (1 color, optional)
Neutral     — grays for text, borders, backgrounds (8–10 shades, 50–950)
Success     — green family (semantic)
Warning     — amber/yellow family (semantic)
Error       — red family (semantic)
Info        — blue family (semantic)
Surface     — background layers (page bg, card bg, elevated bg)
```

### 2.2 Color selection rules

1. **60-30-10 rule**: 60% neutral/surface, 30% secondary/neutral accent, 10% primary.
2. **Never use pure black (`#000`)** for text — use `gray.900` (`#111827` or `#1a1a2e`).
   Pure black on white creates excessive contrast that causes eye strain.
3. **Never use pure white (`#fff`)** for backgrounds in dark mode — use `gray.900`/`gray.950`.
4. **Saturation consistency**: All colors in the palette should feel like they belong
   together. Use the same saturation range (HSL model: keep S within ±10% across hues).
5. **Contrast ratios** (WCAG AA minimum):
   - Normal text: ≥ 4.5:1
   - Large text (≥ 18px bold or ≥ 24px): ≥ 3:1
   - UI components & graphical objects: ≥ 3:1
6. **Semantic colors are not decorative** — red means error/danger, green means success,
   amber means warning. Never invert these associations.

### 2.3 Professional palettes by mood

| Mood              | Primary             | Neutrals          | Accent               |
|:------------------|:--------------------|:------------------|:----------------------|
| **Corporate/Trust**   | Blue `#2563eb`      | Cool gray         | Emerald `#059669`     |
| **Creative/Bold**     | Violet `#7c3aed`    | Slate             | Rose `#e11d48`        |
| **Minimal/Elegant**   | Slate `#334155`     | Stone/Zinc        | Gold `#d97706`        |
| **Nature/Health**     | Emerald `#059669`   | Warm gray         | Sky `#0284c7`         |
| **Tech/Modern**       | Indigo `#4f46e5`    | Gray              | Cyan `#06b6d4`        |
| **Warm/Friendly**     | Orange `#ea580c`    | Warm gray/Sand    | Teal `#0d9488`        |

### 2.4 Dark mode palette rules

- Invert luminance, NOT hue. Same hues, different lightness.
- Surface layers: use progressively lighter grays for elevation (not shadows).
  `bg-page: #0f172a → card: #1e293b → elevated: #334155`
- Reduce primary color saturation by 10-15% in dark mode to prevent "neon glow."
- Text hierarchy: `gray.100` for primary text, `gray.400` for secondary, `gray.500` for disabled.

---

## 3. Typography

### 3.1 Type scale (use a mathematical scale)

Use a **modular scale** with ratio 1.25 (Major Third) or 1.333 (Perfect Fourth):

```
xs:    12px / 0.75rem    — captions, badges, fine print
sm:    14px / 0.875rem   — secondary text, labels, helper text
base:  16px / 1rem       — body text (NEVER go below this for body)
lg:    18px / 1.125rem   — lead paragraphs, emphasized body
xl:    20px / 1.25rem    — card titles, section subheadings
2xl:   24px / 1.5rem     — section headings
3xl:   30px / 1.875rem   — page titles
4xl:   36px / 2.25rem    — hero headings
5xl:   48px / 3rem       — display / marketing headlines
```

### 3.2 Typography rules

1. **Maximum 2 font families** per project (1 for headings, 1 for body — or 1 for everything).
2. **Line height**:
   - Body text: 1.5–1.75 (more generous = more readable)
   - Headings: 1.1–1.3 (tighter for visual impact)
3. **Line length**: 45–75 characters per line (optimal: 65). Use `max-w-prose` or `max-width: 65ch`.
4. **Letter spacing**:
   - Large headings (≥24px): slightly tighten (-0.01em to -0.025em)
   - Small uppercase text: slightly widen (+0.05em to +0.1em)
   - Body text: leave default (0)
5. **Font weight distribution**: Use no more than 3 weights (e.g., 400, 500, 700).
   Too many weights create visual noise.
6. **Paragraph spacing**: Use `margin-bottom` equal to the line-height or 1em.
   Don't use `<br>` for spacing.

### 3.3 Recommended font pairings

| Style             | Headings                     | Body                          |
|:------------------|:-----------------------------|:------------------------------|
| **Modern Clean**  | Inter                        | Inter                         |
| **Professional**  | Plus Jakarta Sans            | Inter                         |
| **Editorial**     | Playfair Display             | Source Sans 3                 |
| **Technical**     | Space Grotesk                | DM Sans                      |
| **Humanist**      | Nunito                       | Open Sans                     |
| **Geometric**     | Outfit                       | Manrope                       |

---

## 4. Spacing & Layout System

### 4.1 Spacing scale (use a 4px base grid)

```
0.5:   2px     — barely visible gaps (icon-to-text in tight badges)
1:     4px     — tight internal padding (badge padding, chip padding)
1.5:   6px     — small gaps
2:     8px     — default gap between related items (icon + label)
3:     12px    — padding inside compact components (buttons, inputs)
4:     16px    — standard component padding, gap between form fields
5:     20px    — comfortable padding
6:     24px    — card internal padding, section gaps in cards
8:     32px    — gap between content sections within a page
10:    40px    — padding for hero sections
12:    48px    — major section separation
16:    64px    — page-level section separation
20:    80px    — major page sections (above the fold breaks)
24:    96px    — hero spacing, max breathing room
```

### 4.2 Layout rules

1. **Consistent inner padding**: All cards in the same context use the same padding.
2. **Content-first width**: Cards/containers sized by content needs, not arbitrary breakpoints.
3. **Proximity principle** (Gestalt): Related items are closer together than unrelated items.
   The gap between a label and its input (4-8px) must be smaller than the gap between
   two separate form fields (16-24px).
4. **Alignment**: Everything on a grid. If something looks "off," check alignment first.
   Left-align text (almost always). Center-align only headings and CTAs in hero sections.
5. **Whitespace is not wasted space** — it provides breathing room and focus.
   When in doubt, add more space, not less.
6. **The container width trap**: Don't let content stretch to fill the entire viewport.
   Max container width: 1280px (dashboard) or 768px (article/form). Always center.

---

## 5. Component Design Patterns

### 5.1 Buttons

```
Hierarchy (use in this order):
  Primary     — filled, brand color. ONE per visible area. The main action.
  Secondary   — outlined or soft-filled neutral. Supporting actions.
  Tertiary    — ghost/text button. Minor actions, "Cancel", navigational.
  Destructive — filled red. Delete, remove, critical irreversible actions.
```

**Rules:**
- Button text is always a **verb**: "Save", "Create project", "Send invite" — never "OK", "Yes", "Submit".
- Minimum touch target: 44×44px (mobile), 36×36px (desktop).
- Icon-only buttons MUST have `aria-label` and a tooltip.
- Loading state: show spinner + disable the button. Never let users double-submit.
- Primary destructive actions require confirmation (modal or inline).

### 5.2 Forms

1. **Labels above inputs** (not inline placeholders). Placeholder text is not a label.
2. **Error messages below the field**, in red, with an icon. Show on blur or submit, not on every keystroke.
3. **Logical grouping**: Related fields grouped visually (address fields together, personal info together).
4. **Single-column layout** for forms. Multi-column only for very short fields (City + Zip).
5. **Progressive disclosure**: Don't show 30 fields at once. Use steps, accordions, or conditional fields.
6. **Smart defaults**: Pre-fill when possible. Today's date, user's timezone, most common option.
7. **Input width matches expected content**: Email field wider than zip code field.

### 5.3 Cards

- Consistent border-radius across all cards (8px or 12px — pick one, never mix).
- Shadow hierarchy: `sm` for subtle elevation, `md` for cards, `lg` for modals/popovers.
- Cards that are clickable must have hover state (slight lift + shadow increase) and `cursor: pointer`.
- Content padding: 16-24px (never less than 12px).

### 5.4 Tables

- Align text left, numbers right, status badges center.
- Zebra striping OR horizontal dividers — not both.
- Header row is visually distinct (bold, background color, or uppercase small text).
- Sticky header for scrollable tables.
- Row hover highlight for interactive tables.
- Minimum row height: 48px for comfortable clicking.

### 5.5 Navigation

- Current page/section is visually indicated (highlighted, underlined, bold).
- Breadcrumbs for depth > 2 levels.
- Sidebar navigation: max 7±2 top-level items (Miller's law).
- Mobile: bottom tab bar for primary nav (≤5 items), hamburger for secondary.

### 5.6 Empty States

Never show a blank page. Every empty state needs:
1. An illustration or icon (subtle, not overpowering)
2. A headline explaining what goes here
3. A description of what the user can do
4. A CTA button to take that action

### 5.7 Loading States

- Skeleton screens > spinners > progress bars > nothing.
- Skeleton shapes match the actual content layout.
- Never block the entire page for a partial load — load sections independently.
- If load time > 2s, show a message ("This might take a moment").

---

## 6. UX Heuristics — Nielsen's 10 + Modern Additions

Apply these to every decision:

1. **Visibility of system status** — always show what's happening (loading, saving, errors, success).
2. **Match with the real world** — use familiar language, not internal jargon.
3. **User control & freedom** — undo, cancel, go back. Never trap the user.
4. **Consistency & standards** — same patterns across the entire app.
5. **Error prevention** — disable invalid actions, confirm destructive ones, validate early.
6. **Recognition over recall** — show options, don't make users remember.
7. **Flexibility & efficiency** — keyboard shortcuts, search, recent items for power users.
8. **Aesthetic & minimalist design** — every element earns its place. Remove clutter ruthlessly.
9. **Help users recover from errors** — clear error messages with how to fix them.
10. **Help & documentation** — tooltips, onboarding, contextual help.

### Modern additions:

11. **Reduce cognitive load** — one primary action per screen. Don't make users think.
12. **Respect user attention** — no unnecessary modals, no alerts for non-critical info.
13. **Immediate feedback** — optimistic updates, instant visual responses to interactions.
14. **Progressive disclosure** — show only what's needed now, reveal complexity gradually.

---

## 7. Responsive Design

### Breakpoint system:

```
sm:   640px    — large phones landscape
md:   768px    — tablets portrait
lg:   1024px   — tablets landscape, small laptops
xl:   1280px   — desktops
2xl:  1536px   — large screens
```

### Rules:

1. **Mobile-first**: Design for the smallest screen first, then enhance.
2. **Content stacking**: Multi-column → single-column on mobile. Never horizontal scroll for content.
3. **Touch targets**: Minimum 44×44px on mobile. Space interactive elements ≥ 8px apart.
4. **Font scaling**: Body text ≥ 16px on mobile (prevents iOS zoom).
5. **Hide secondary content** on mobile, don't shrink it to unreadable sizes.
6. **Full-width buttons** on mobile for primary actions.
7. **Sticky bottom bar** for critical actions on mobile (Save, Checkout, Next).

---

## 8. Micro-interactions & Animation

### When to animate:

- **State changes**: hover, focus, active, disabled transitions.
- **Feedback**: button press, form submit success/error.
- **Spatial orientation**: page transitions, drawer/modal open-close, accordion expand.
- **Loading**: skeleton shimmer, progress indicators.

### Animation rules:

1. **Duration**: 150ms for micro (hover, color change), 200-300ms for medium (modals, drawers),
   300-500ms for large (page transitions). Never > 500ms for UI — it feels sluggish.
2. **Easing**: Use `ease-out` for entrances (elements arriving), `ease-in` for exits
   (elements leaving), `ease-in-out` for ongoing motion. Never use `linear` for UI motion.
3. **Reduce motion**: Always respect `prefers-reduced-motion`. Disable non-essential
   animations; keep essential state changes instant.
4. **Purpose test**: If an animation doesn't help the user understand what happened,
   remove it. Animation is not decoration.

```css
/* Standard transition (apply to all interactive elements) */
.interactive {
  transition: all 150ms ease-out;
}

@media (prefers-reduced-motion: reduce) {
  .interactive {
    transition: none;
  }
}
```

---

## 9. Accessibility (a11y) as Design

Accessibility is not an afterthought — it's a design constraint from the start.

1. **Color is never the only indicator** — pair with icons, text, or patterns.
2. **Focus indicators visible** — never `outline: none` without a replacement.
3. **Semantic HTML first** — `<button>` for actions, `<a>` for navigation, `<nav>`, `<main>`, `<aside>`.
4. **ARIA only when HTML can't do it** — `aria-label`, `aria-live`, `role` where needed.
5. **Keyboard navigable** — all interactive elements reachable via Tab, activated via Enter/Space.
6. **Skip links** — "Skip to main content" for screen readers.
7. **Error announcements** — form errors announced to screen readers with `aria-live="polite"`.

---

## 10. What "Looks Bad" — Anti-Patterns to Avoid

These are the most common mistakes. If you catch yourself doing any of these, stop and fix:

1. ❌ **Inconsistent spacing** — random padding/margins that don't follow the 4px grid.
2. ❌ **Too many colors** — using 5+ distinct colors without a palette system.
3. ❌ **Text on busy backgrounds** — text over images without overlay/scrim.
4. ❌ **Tiny text** — anything below 12px for any purpose, or below 14px for body text.
5. ❌ **No visual hierarchy** — everything the same size and weight.
6. ❌ **Center-aligned body text** — center alignment for paragraphs longer than 2 lines.
7. ❌ **Walls of text** — no headings, bullets, or visual breaks in long content.
8. ❌ **Orphaned elements** — a single button or label floating with no context.
9. ❌ **Icon soup** — rows of unlabeled icons that users have to guess.
10. ❌ **Disabled without explanation** — grayed-out elements with no tooltip explaining why.
11. ❌ **Modal hell** — modals opening modals, or modal for simple confirmation.
12. ❌ **Inconsistent border-radius** — mixing 4px, 8px, 12px, 16px radii on the same page.
13. ❌ **Full-width content on large screens** — text stretching across a 2560px monitor.
14. ❌ **Truncation without tooltip** — cutting text with `...` but no way to see the full text.
15. ❌ **Low-contrast placeholder text** — placeholders that fail WCAG guidelines.

---

## 11. Design Decision Framework

When making any visual decision, ask these questions in order:

1. **What is the user's goal on this screen?** → Design for that goal first.
2. **What is the primary action?** → Make it the most prominent element.
3. **What can be removed?** → Eliminate anything that doesn't serve the goal.
4. **Is the hierarchy clear?** → Squint test — does the important stuff pop?
5. **Is it consistent?** → Does it match the existing patterns in the app?
6. **Is it accessible?** → Contrast, keyboard, screen reader — all three.
7. **Does it feel good?** → Smooth transitions, responsive feedback, no jank.

---

## 12. Design Tokens — Practical Reference

When building components, use these token categories:

```typescript
const designTokens = {
  // Border radius
  radius: {
    sm: '6px',    // inputs, badges, chips
    md: '8px',    // buttons, small cards
    lg: '12px',   // cards, modals
    xl: '16px',   // large cards, hero sections
    full: '9999px' // pills, avatars, circular buttons
  },

  // Shadows (elevation)
  shadow: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  },

  // Z-index scale
  zIndex: {
    dropdown: 10,
    sticky: 20,
    overlay: 30,
    modal: 40,
    popover: 50,
    toast: 60,
    tooltip: 70,
  },

  // Transitions
  transition: {
    fast: '150ms ease-out',
    normal: '200ms ease-out',
    slow: '300ms ease-in-out',
  }
}
```

---

## Checklist — Before Shipping Any UI

- [ ] Visual hierarchy is clear (squint test passes)
- [ ] Color palette follows 60-30-10 rule
- [ ] All text meets WCAG AA contrast ratios
- [ ] Typography uses ≤ 2 fonts, ≤ 3 weights
- [ ] Spacing follows 4px grid consistently
- [ ] Primary action is obvious and uses a verb
- [ ] Empty/loading/error states are designed
- [ ] Responsive at all breakpoints (mobile-first)
- [ ] Keyboard navigation works for all interactive elements
- [ ] Animations respect `prefers-reduced-motion`
- [ ] No anti-patterns from Section 10
- [ ] Consistent border-radius and shadow usage
- [ ] Forms have labels, error messages, and logical grouping
