---
name: ux-patterns
description: >-
  Proven UX patterns for complex UI scenarios — dashboards, data tables, search & filters,
  onboarding, settings, notifications, navigation, forms, e-commerce, and content pages.
  Activate when designing a specific screen type or solving a common UX problem: "how should
  the filter panel work?", "how do I design onboarding?", "what's the best dashboard layout?"
---

# UX Patterns — Proven Solutions for Common UI Problems

These patterns are battle-tested across millions of products. Don't reinvent them.
Adapt the details to your brand and content, but respect the structural patterns.

---

## 1. Dashboard Patterns

### 1.1 Layout archetypes

**KPI Dashboard (executive overview):**
```
┌──────────────────────────────────────────────────────┐
│  Header: page title + date range picker + filters    │
├──────┬──────┬──────┬──────┬──────────────────────────┤
│ KPI  │ KPI  │ KPI  │ KPI  │                          │
│ card │ card │ card │ card │     (optional sparklines) │
├──────┴──────┴──────┴──────┤                          │
│                           │                          │
│   Primary chart           │   Secondary chart        │
│   (line/area, wide)       │   (bar/donut, narrow)    │
│                           │                          │
├───────────────────────────┴──────────────────────────┤
│   Detail table (sortable, paginated)                 │
└──────────────────────────────────────────────────────┘
```

**Operational Dashboard (monitoring):**
```
┌────────────────────────────────────────┐
│  Header + real-time indicator (live ●) │
├────────────┬───────────────────────────┤
│  Sidebar   │  Grid of metric cards     │
│  - Filters │  with status colors       │
│  - Groups  │  (green/amber/red)        │
│            ├───────────────────────────┤
│            │  Alert feed / log stream  │
│            │  (newest first, auto-     │
│            │   refreshing)             │
└────────────┴───────────────────────────┘
```

### 1.2 KPI card anatomy

```
┌─────────────────────────────────┐
│  Label (sm, muted text)         │
│  Value (2xl-3xl, bold)          │
│  Trend: ↑ 12.5%  vs last month │
│  ▁▂▃▅▆▇ sparkline (optional)   │
└─────────────────────────────────┘
```

- Trend color: green for positive, red for negative (unless metric is "errors" — then invert).
- Show comparison context ("vs last month", "vs target").
- Cards are 4-column grid on desktop, 2-column on tablet, stacked on mobile.

### 1.3 Dashboard rules

1. **Most important metrics at the top** — don't bury the KPIs below charts.
2. **Date range selector affects everything** — global filters, not per-widget.
3. **Charts are not decorative** — every chart must answer a specific question.
4. **Label everything** — axes, legends, units. No unlabeled charts.
5. **Real-time dashboards** — use subtle pulse/glow on live data, not aggressive flashing.

---

## 2. Data Table Patterns

### 2.1 Table anatomy

```
┌─────────────────────────────────────────────────────────┐
│  Table toolbar: search │ filters │ column toggle │ export│
├─────┬──────────┬─────────┬──────────┬───────┬───────────┤
│ ☐   │ Name ↕   │ Status  │ Created  │ Role  │ Actions   │
├─────┼──────────┼─────────┼──────────┼───────┼───────────┤
│ ☐   │ Alice    │ ● Active│ Oct 15   │ Admin │ ⋯         │
│ ☐   │ Bob      │ ○ Pend  │ Oct 12   │ User  │ ⋯         │
│ ☐   │ Carol    │ ● Active│ Oct 10   │ User  │ ⋯         │
├─────┴──────────┴─────────┴──────────┴───────┴───────────┤
│  Showing 1-10 of 248        │◀ 1 2 3 … 25 ▶│ rows/page │
└─────────────────────────────────────────────────────────┘
```

### 2.2 Table interaction patterns

| Feature | When to use | Pattern |
|:--------|:------------|:--------|
| **Sorting** | Always | Click column header, cycle ↕→↑→↓. Show sort indicator. |
| **Filtering** | > 20 rows | Filter button opens dropdown/panel. Show active filter count badge. |
| **Search** | > 50 rows | Debounced text search across visible columns. Highlight matches. |
| **Pagination** | > 25 rows | Page-based or infinite scroll. Show total count. |
| **Selection** | Bulk actions | Checkbox column. Header checkbox = select all on page. Show bulk action bar. |
| **Column resize** | Data-heavy tables | Drag column borders. Persist widths. |
| **Column toggle** | > 6 columns | Show/hide columns via dropdown. |
| **Row expand** | Complex detail | Chevron expands inline detail panel below the row. |
| **Inline edit** | Quick updates | Click cell → input. Save on blur or Enter. |

### 2.3 Table rules

1. **Align text left, numbers right** — decimal points must line up vertically.
2. **Status badges > text** — "● Active" with green dot beats plain "Active" text.
3. **Relative dates for recent, absolute for old** — "2 hours ago" vs "Oct 15, 2024".
4. **Actions column always last** — overflow menu (⋯) for > 2 actions.
5. **Empty table** → helpful message + CTA ("No users yet. Invite your team →").
6. **Loading** → skeleton rows matching the table structure.

---

## 3. Search & Filter Patterns

### 3.1 Search patterns

| Type | When | Implementation |
|:-----|:-----|:---------------|
| **Instant search** | < 1000 items, fast filtering | Filter on keystroke, ≥ 200ms debounce |
| **Submit search** | Server-side, large datasets | Input + button/Enter. Show "Searching..." |
| **Command palette** | Power users, many actions | Ctrl/Cmd+K → modal with search + categories |
| **Autocomplete** | Known options (cities, users) | Dropdown suggestions, arrow key navigation |

### 3.2 Filter patterns

**Filter bar (horizontal):**
Best for ≤ 5 filters. Each filter is a dropdown/chip in a row above content.
```
[Status ▾] [Role ▾] [Date range ▾] [Search...]    [Clear all filters]
```

**Filter sidebar (vertical):**
Best for > 5 filters or filters with many options (e-commerce facets).
```
┌────────────────┬─────────────────────┐
│ Filters        │  Results            │
│                │                     │
│ ▼ Category     │  Product cards...   │
│   ☐ Electronics│                     │
│   ☑ Clothing   │                     │
│   ☐ Books      │                     │
│                │                     │
│ ▼ Price range  │                     │
│   [$0] - [$100]│                     │
│                │                     │
│ ▼ Rating       │                     │
│   ★★★★☆ & up  │                     │
│                │                     │
│ [Clear filters]│                     │
└────────────────┴─────────────────────┘
```

### 3.3 Filter UX rules

1. **Show active filter count** — badge on filter button showing how many are active.
2. **Show result count** — "24 results" updates live as filters change.
3. **Clear all** — single action to reset all filters. Always visible when filters active.
4. **Each filter clearable individually** — X button on each chip/filter.
5. **Persist filter state** — URL params or localStorage. Refresh shouldn't lose filters.
6. **No zero-result dead ends** — show "No results. Try removing some filters" + suggestions.

---

## 4. Onboarding Patterns

### 4.1 First-run experience

**Product tour (step-by-step):**
- Use for complex apps with many features.
- Max 5 steps (users abandon long tours).
- Each step highlights ONE feature with a tooltip/spotlight.
- Allow skip at any step. Allow replay from settings.
- Track completion — don't show again to returning users.

**Checklist onboarding:**
- Use for apps requiring setup actions.
- Show a persistent sidebar/widget with 3-7 tasks.
- Check off completed tasks with satisfying animation.
- Show progress (3/5 complete).
- Celebrate 100% completion (confetti, achievement badge).

**Empty state onboarding:**
- Use for content-creation apps (empty canvas).
- Each empty section contains its own mini-onboarding.
- "Add your first project" with a large CTA in the empty space.
- Template gallery as a starting point option.

### 4.2 Onboarding rules

1. **Time to first value < 60 seconds** — users must DO something meaningful immediately.
2. **Don't front-load setup** — ask for info when it's needed, not all upfront.
3. **Show, don't tell** — interactive tutorials > text explanations.
4. **Allow skipping everything** — never gate content behind mandatory onboarding.
5. **Contextual over sequential** — tooltips when users reach a feature > upfront tour.

---

## 5. Settings & Preferences Patterns

### 5.1 Settings layout

```
┌────────────────┬───────────────────────────────────┐
│  Settings nav  │  Section content                  │
│                │                                   │
│  • Profile     │  Profile Settings                 │
│  • Account     │  ─────────────────                │
│  • Appearance  │                                   │
│  • Notifs      │  Display name                     │
│  • Privacy     │  [John Doe______________]         │
│  • Billing     │                                   │
│  • Integrations│  Email                            │
│                │  [john@example.com______]         │
│                │                                   │
│                │  Avatar                           │
│                │  [Upload photo] (circle preview)  │
│                │                                   │
│                │  [Save changes]                   │
└────────────────┴───────────────────────────────────┘
```

### 5.2 Settings rules

1. **Left sidebar navigation** for settings categories (desktop). Tab bar on mobile.
2. **Immediate feedback**: toggle switches save instantly, text fields need a Save button.
3. **Group related settings** with headings and dividers.
4. **Explain consequences** — "Enabling this will share your email with team members."
5. **Dangerous settings at the bottom** — "Delete account" in its own section, red, with confirmation.
6. **Search in settings** for apps with > 20 settings.
7. **Reset to defaults** option for complex configurations.

---

## 6. Notification Patterns

### 6.1 Notification types by urgency

| Type | Urgency | Pattern | Duration |
|:-----|:--------|:--------|:---------|
| **Toast** | Low–Medium | Slides in corner | Auto-dismiss 3-5s |
| **Banner** | Medium | Full-width top bar | User dismisses |
| **Inline alert** | Medium | Within content area | Persistent |
| **Modal** | High | Blocking overlay | Requires action |
| **Badge** | Passive | Red dot / count on icon | Until viewed |

### 6.2 Toast anatomy and rules

```
┌──────────────────────────────────┐
│ ✓  Changes saved successfully    │  ← icon + message
│                          [Undo] │  ← optional action
└──────────────────────────────────┘
```

1. **Position**: top-right (desktop), top-center or bottom-center (mobile).
2. **Stack**: new toasts push old ones, max 3 visible.
3. **Auto-dismiss**: 3s for success, 5s for info, persistent for errors.
4. **Don't toast errors** for critical failures — use inline messages instead.
5. **Undo in toasts** — "Deleted 3 items. [Undo]" is better than a confirmation modal.

### 6.3 Notification center

- Bell icon with unread count badge in the header.
- Dropdown panel: newest first, grouped by date.
- Mark as read: on click or "Mark all as read" button.
- Empty state: "You're all caught up! ✨"

---

## 7. Navigation Patterns

### 7.1 Pattern selection guide

| App type | Primary nav | Secondary nav |
|:---------|:------------|:--------------|
| **SaaS dashboard** | Left sidebar (collapsible) | Top tabs within pages |
| **Content site** | Top navbar | Breadcrumbs + sidebar |
| **E-commerce** | Top navbar + mega menu | Faceted sidebar |
| **Mobile app** | Bottom tab bar (≤ 5) | Stack navigation |
| **Admin panel** | Left sidebar with groups | Top breadcrumbs |
| **Docs / wiki** | Left sidebar tree | On-page TOC right |

### 7.2 Sidebar navigation rules

1. **Collapsible** — icon-only mode for more content space. Remember user preference.
2. **Max 7 top-level items** — group the rest under expandable sections.
3. **Active item highlighted** — background color or left border indicator.
4. **Icons + labels** — icons alone are ambiguous (tooltip on collapsed).
5. **Consistent ordering** — most used items at top, settings/admin at bottom.
6. **Section dividers** — visually separate groups (Main, Analytics, Settings).

### 7.3 Breadcrumbs

- Use when depth > 2 levels.
- Format: `Home / Products / Electronics / Headphones`
- Each segment is clickable except the current page (plain text or bold).
- Truncate middle segments for deep hierarchies: `Home / ... / Subcategory / Item`.

---

## 8. Form Design Patterns

### 8.1 Multi-step forms (wizards)

```
  ①──────②──────③──────④
Account  Profile  Prefs  Review

[ Step 2 of 4: Profile Information ]

  Display name
  [________________]

  Bio
  [________________]
  [________________]

  [← Back]              [Continue →]
```

**Rules:**
1. **Show progress** — numbered steps, progress bar, or both.
2. **Allow going back** — without losing entered data.
3. **Validate per step** — don't let users advance with errors.
4. **Review step before submit** — show a summary of all entered data.
5. **Save progress** — draft state for long forms so users can return.
6. **Max 5-7 steps** — if more, reconsider the form structure.

### 8.2 Inline validation

- ✅ **Validate on blur** (when user leaves the field) — not on every keystroke.
- ✅ **Clear error on focus** — when user starts fixing the field.
- ✅ **Success indicator** — green checkmark for validated fields (email confirmed, username available).
- ❌ **Don't validate empty required fields on blur** until first submit attempt.
- ❌ **Don't use red while the user is still typing** — it's aggressive and distracting.

### 8.3 Autosave pattern

- For complex creation tools (editors, designers, settings).
- Show "Saving..." → "Saved ✓" indicator, subtle, non-blocking.
- Debounce: save 1-2 seconds after last change.
- Version history or undo for safety.

---

## 9. Content Page Patterns

### 9.1 Article / blog layout

```
┌────────────────────────────────────────────────┐
│           max-width: 680px, centered           │
│                                                │
│  Category badge          Reading time: 5 min   │
│  ═══════════════════════════════════════════    │
│  Headline (3xl–4xl, bold)                      │
│  Subtitle (lg, muted)                          │
│                                                │
│  Author avatar + name + date                   │
│  ───────────────────────────────────────────    │
│                                                │
│  Body text (base, 1.75 line-height)            │
│  max-width: 65ch for readability               │
│                                                │
│  ## Subheading                                 │
│  More body text...                             │
│                                                │
│  ┌─────────────────────────────────────────┐   │
│  │  Pull quote or callout box              │   │
│  └─────────────────────────────────────────┘   │
│                                                │
│  Full-width image (break out of text column)   │
│                                                │
└────────────────────────────────────────────────┘
```

### 9.2 Landing page structure

```
1. Hero: Headline + subtitle + CTA + visual        ← above the fold
2. Social proof: logos, testimonials, stats         ← build trust
3. Features: 3–4 key benefits with icons/images     ← show value
4. How it works: 3-step process                     ← reduce uncertainty
5. Testimonials / case studies                       ← deeper trust
6. Pricing (if applicable)                           ← enable decision
7. FAQ                                               ← handle objections
8. Final CTA                                         ← last chance
9. Footer                                            ← navigation + legal
```

---

## 10. Modal & Dialog Patterns

### 10.1 When to use modals (and when NOT to)

**USE modals for:**
- Confirmation of destructive actions ("Delete this project?")
- Quick creation/edit forms that don't need full page context
- Critical information that requires acknowledgment
- Media preview (lightbox)

**DON'T use modals for:**
- Content that the user needs to reference while interacting with the page
- Complex multi-step flows (use a full page instead)
- Success messages (use a toast)
- Errors that don't require immediate action (use inline messages)

### 10.2 Modal anatomy

```
┌──────────────────────────────────────┐
│  Title                          [✕] │
│  ────────────────────────────────── │
│                                      │
│  Body content                        │
│  (form fields, message, preview)     │
│                                      │
│  ────────────────────────────────── │
│                [Cancel]  [Confirm]  │
└──────────────────────────────────────┘
```

**Rules:**
1. **One modal at a time** — never stack modals. If you need depth, use a full page.
2. **Close on Escape** and overlay click (unless the form has unsaved changes).
3. **Focus trap** — Tab key stays within the modal.
4. **Primary action right** — [Cancel] [Confirm]. Destructive actions in red.
5. **Size**: small for confirmations (400px), medium for forms (560px), large for complex content (720px).
6. **Scroll inside the modal** if content is long — modal itself stays fixed.

---

## 11. Error Handling Patterns

### 11.1 Error message anatomy

```
┌──────────────────────────────────────────┐
│ ⚠ Title: what went wrong                │
│                                          │
│ Description: why and how to fix it       │
│                                          │
│ [Action to fix]   [Dismiss]              │
└──────────────────────────────────────────┘
```

### 11.2 Error patterns by type

| Error type | Where | Pattern |
|:-----------|:------|:--------|
| **Field validation** | Below the field | Red text + icon, shown on blur |
| **Form submission** | Top of form | Alert banner listing all errors |
| **Network error** | Toast or banner | "Connection lost. Retrying..." with auto-retry |
| **404 page** | Full page | Friendly illustration + search + home link |
| **500 error** | Full page | Apology + "try again" + support link |
| **Permission denied** | In context | "You don't have access. Request access →" |

### 11.3 Error copy rules

- ❌ "Error 500: Internal Server Error" → ✅ "Something went wrong. Please try again."
- ❌ "Invalid input" → ✅ "Please enter a valid email address (e.g., name@example.com)"
- ❌ "Operation failed" → ✅ "We couldn't save your changes. Check your connection and try again."
- Always tell the user: **what happened**, **why**, and **what to do about it**.

---

## Checklist — Pattern Selection

- [ ] Correct pattern selected for the use case (don't use a modal for complex flows)
- [ ] Empty, loading, and error states designed for every data-dependent view
- [ ] Navigation pattern matches app type and complexity
- [ ] Filters persist state across sessions (URL or localStorage)
- [ ] Tables have sorting, pagination, and empty states
- [ ] Forms validate on blur, show errors below fields
- [ ] Modals close on Escape, have focus trap, don't stack
- [ ] Onboarding is skippable and focuses on time-to-first-value
- [ ] Toasts auto-dismiss appropriately, errors don't auto-dismiss
- [ ] Destructive actions require confirmation
