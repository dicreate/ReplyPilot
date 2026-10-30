---
name: a11y-implementation
description: >-
  Accessibility (a11y) implementation in React — ARIA patterns, keyboard navigation,
  focus management, screen reader support, color contrast, semantic HTML, and testing.
  Activate when building interactive components (modals, dropdowns, tabs, menus, tooltips),
  when fixing a11y lint errors, or when ensuring a UI works for all users.
---

# Accessibility Implementation — Code Patterns

Accessibility is not an add-on. These patterns must be applied during development,
not retrofitted. Every interactive element in this reference is copy-paste ready.

---

## 1. Semantic HTML First

Before reaching for ARIA, use the correct HTML element. Native elements have
built-in keyboard handling, focus management, and screen reader support.

| Need | ❌ Wrong | ✅ Right |
|:-----|:---------|:---------|
| Clickable action | `<div onClick>` | `<button onClick>` |
| Navigation link | `<div onClick={navigate}>` | `<a href="/path">` or `<Link to="/path">` |
| List of items | `<div><div>Item</div></div>` | `<ul><li>Item</li></ul>` |
| Page landmark | `<div class="header">` | `<header>` |
| Main content | `<div class="content">` | `<main>` |
| Side content | `<div class="sidebar">` | `<aside>` |
| Navigation | `<div class="nav">` | `<nav aria-label="Main">` |
| Form field | `<div contentEditable>` | `<input>` or `<textarea>` |
| Table data | `<div class="grid">` with divs | `<table>` with proper `<th>` `<td>` |

**Rule:** If you're adding `role`, `tabIndex`, `onKeyDown` to a `<div>` — you probably
need a different HTML element.

---

## 2. ARIA Patterns for Common Components

### 2.1 Modal / Dialog

```tsx
function Modal({ isOpen, onClose, title, children }: ModalProps) {
  const titleId = useId()

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return createPortal(
    <>
      {/* Overlay — click to close */}
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
        aria-hidden="true"
      />
      {/* Dialog */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
          <h2 id={titleId} className="text-xl font-semibold">{title}</h2>
          {children}
        </div>
      </div>
    </>,
    document.body
  )
}
```

**Checklist:** `role="dialog"`, `aria-modal="true"`, `aria-labelledby`, Escape closes,
focus trapped inside, focus returns to trigger on close.

### 2.2 Dropdown Menu

```tsx
function DropdownMenu({ trigger, items }: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const menuRef = useRef<HTMLDivElement>(null)
  const triggerId = useId()
  const menuId = useId()

  const onKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setActiveIndex(i => Math.min(i + 1, items.length - 1))
        break
      case 'ArrowUp':
        e.preventDefault()
        setActiveIndex(i => Math.max(i - 1, 0))
        break
      case 'Enter':
      case ' ':
        e.preventDefault()
        if (activeIndex >= 0) items[activeIndex].action()
        setIsOpen(false)
        break
      case 'Escape':
        setIsOpen(false)
        break
    }
  }

  return (
    <div className="relative">
      <button
        id={triggerId}
        aria-haspopup="true"
        aria-expanded={isOpen}
        aria-controls={menuId}
        onClick={() => setIsOpen(!isOpen)}
      >
        {trigger}
      </button>

      {isOpen && (
        <div
          id={menuId}
          role="menu"
          aria-labelledby={triggerId}
          ref={menuRef}
          onKeyDown={onKeyDown}
          tabIndex={-1}
        >
          {items.map((item, i) => (
            <button
              key={item.id}
              role="menuitem"
              tabIndex={i === activeIndex ? 0 : -1}
              className={i === activeIndex ? 'bg-gray-100' : ''}
              onClick={item.action}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
```

**Checklist:** `role="menu"` + `role="menuitem"`, `aria-haspopup`, `aria-expanded`,
arrow key navigation, Escape closes, focus management with `tabIndex`.

### 2.3 Tabs

```tsx
function Tabs({ tabs, activeTab, onChange }: TabsProps) {
  const onKeyDown = (e: React.KeyboardEvent, index: number) => {
    let nextIndex = index
    switch (e.key) {
      case 'ArrowRight':
        nextIndex = (index + 1) % tabs.length
        break
      case 'ArrowLeft':
        nextIndex = (index - 1 + tabs.length) % tabs.length
        break
      case 'Home':
        nextIndex = 0
        break
      case 'End':
        nextIndex = tabs.length - 1
        break
      default:
        return
    }
    e.preventDefault()
    onChange(tabs[nextIndex].id)
  }

  return (
    <div>
      <div role="tablist" aria-label="Content sections">
        {tabs.map((tab, i) => (
          <button
            key={tab.id}
            role="tab"
            id={`tab-${tab.id}`}
            aria-selected={tab.id === activeTab}
            aria-controls={`panel-${tab.id}`}
            tabIndex={tab.id === activeTab ? 0 : -1}
            onKeyDown={(e) => onKeyDown(e, i)}
            onClick={() => onChange(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {tabs.map(tab => (
        <div
          key={tab.id}
          role="tabpanel"
          id={`panel-${tab.id}`}
          aria-labelledby={`tab-${tab.id}`}
          hidden={tab.id !== activeTab}
          tabIndex={0}
        >
          {tab.content}
        </div>
      ))}
    </div>
  )
}
```

**Checklist:** `role="tablist"`, `role="tab"`, `role="tabpanel"`, `aria-selected`,
`aria-controls`/`aria-labelledby` linked, arrow keys cycle tabs, Home/End jump.

### 2.4 Accordion

```tsx
function Accordion({ items }: AccordionProps) {
  const [openItems, setOpenItems] = useState<Set<string>>(new Set())

  const toggle = (id: string) => {
    setOpenItems(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  return (
    <div>
      {items.map(item => {
        const isOpen = openItems.has(item.id)
        return (
          <div key={item.id}>
            <h3>
              <button
                aria-expanded={isOpen}
                aria-controls={`accordion-panel-${item.id}`}
                id={`accordion-header-${item.id}`}
                onClick={() => toggle(item.id)}
                className="w-full flex justify-between items-center py-3"
              >
                {item.title}
                <ChevronIcon className={isOpen ? 'rotate-180' : ''} />
              </button>
            </h3>
            <div
              id={`accordion-panel-${item.id}`}
              role="region"
              aria-labelledby={`accordion-header-${item.id}`}
              hidden={!isOpen}
            >
              {item.content}
            </div>
          </div>
        )
      })}
    </div>
  )
}
```

### 2.5 Toast / Live Region

```tsx
// Announce dynamic content changes to screen readers
function ToastContainer() {
  const toasts = useToastStore(s => s.toasts)

  return (
    <div
      aria-live="polite"
      aria-atomic="false"
      className="fixed bottom-4 right-4 z-60 space-y-2"
    >
      {toasts.map(toast => (
        <div key={toast.id} role="status">
          {toast.message}
        </div>
      ))}
    </div>
  )
}

// For urgent errors — use aria-live="assertive" (interrupts screen reader)
<div aria-live="assertive" aria-atomic="true">
  {criticalError && <p role="alert">{criticalError}</p>}
</div>
```

---

## 3. Form Accessibility

### 3.1 Labels (mandatory for every input)

```tsx
// Visible label — always preferred
<FormControl isInvalid={!!errors.email}>
  <FormLabel htmlFor="email">Email address</FormLabel>
  <Input id="email" type="email" {...register('email')} />
  <FormHelperText>We'll never share your email</FormHelperText>
  <FormErrorMessage>{errors.email?.message}</FormErrorMessage>
</FormControl>

// If you MUST hide the label visually (icon-only search):
<VisuallyHidden>
  <label htmlFor="search">Search</label>
</VisuallyHidden>
<Input id="search" placeholder="Search..." aria-label="Search" />
```

### 3.2 Error announcements

```tsx
// Errors must be programmatically associated AND announced
<FormControl isInvalid={!!errors.name}>
  <FormLabel htmlFor="name">Name</FormLabel>
  <Input
    id="name"
    aria-describedby={errors.name ? 'name-error' : undefined}
    aria-invalid={!!errors.name}
    {...register('name')}
  />
  {errors.name && (
    <FormErrorMessage id="name-error" role="alert">
      {errors.name.message}
    </FormErrorMessage>
  )}
</FormControl>
```

### 3.3 Required field indication

```tsx
// Visual + programmatic indicator
<FormLabel htmlFor="name">
// Required field with visual indicator + aria
<label htmlFor="name" className="text-sm font-medium">
  Name <span className="text-destructive" aria-hidden="true">*</span>
</label>
<input id="name" aria-required="true" {...register('name')} className="input" />
```

### 3.4 Fieldsets for related fields

```tsx
// Group related fields with fieldset + legend
<fieldset className="border-0 p-0 m-0">
  <legend className="font-semibold mb-3">
    Shipping Address
  </legend>
  {/* address fields */}
</fieldset>
```

---

## 4. Color & Contrast

### 4.1 Contrast checking in code

```ts
// Utility to check WCAG contrast ratio
function luminance(hex: string): number {
  const rgb = hex.match(/\w{2}/g)!.map(x => {
    const c = parseInt(x, 16) / 255
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  })
  return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2]
}

function contrastRatio(hex1: string, hex2: string): number {
  const l1 = luminance(hex1)
  const l2 = luminance(hex2)
  const lighter = Math.max(l1, l2)
  const darker = Math.min(l1, l2)
  return (lighter + 0.05) / (darker + 0.05)
}

// WCAG AA: normal text ≥ 4.5, large text ≥ 3.0, UI elements ≥ 3.0
```

### 4.2 Never color alone

```tsx
// ❌ Color is the only indicator
<span className={status === 'error' ? 'text-destructive' : 'text-emerald-500'}>
  {status}
</span>

// ✅ Color + icon + text (Lucide React + Tailwind)
import { AlertCircle, CheckCircle2 } from 'lucide-react'

<div className="flex items-center gap-2">
  {status === 'error' ? (
    <AlertCircle className="size-4 text-destructive" aria-hidden="true" />
  ) : (
    <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
  )}
  <span className={status === 'error' ? 'text-destructive font-medium' : 'text-emerald-700 dark:text-emerald-300 font-medium'}>
    {status === 'error' ? 'Failed' : 'Completed'}
  </span>
</div>
```

---

## 5. Visually Hidden Content

```tsx
// Screen-reader-only text — Tailwind `sr-only` class
import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

// Icon-only button with sr-only text
<Button variant="ghost" size="icon" className="text-destructive">
  <Trash2 className="size-4" aria-hidden="true" />
  <span className="sr-only">Delete item</span>
</Button>

// Table with visual-only context
<th>
  Actions
  <span className="sr-only"> for each user</span>
</th>

// Link with more context
<a href={`/users/${id}`} className="underline">
  View profile
  <span className="sr-only"> of {userName}</span>
</a>
```

---

## 6. Testing Accessibility

### 6.1 Automated checks

```ts
// In test files — axe-core integration
import { axe, toHaveNoViolations } from 'jest-axe'

expect.extend(toHaveNoViolations)

it('should have no a11y violations', async () => {
  const { container } = render(<MyComponent />)
  const results = await axe(container)
  expect(results).toHaveNoViolations()
})
```

### 6.2 Manual testing checklist

1. **Tab through the entire page** — is the order logical? Can you reach everything?
2. **Activate everything with keyboard** — Enter/Space for buttons, Enter for links.
3. **Check focus visibility** — can you always see where focus is?
4. **Test with screen reader** — NVDA (Windows), VoiceOver (Mac), TalkBack (Android).
5. **Zoom to 200%** — does everything remain usable?
6. **Check with high-contrast mode** — are borders/focus rings still visible?

### 6.3 ESLint a11y rules (already enforced via code-quality skill)

These rules from `eslint-plugin-jsx-a11y` are active:
- `alt-text` — all `<img>` must have `alt`
- `anchor-has-content` — links must have text
- `click-events-have-key-events` — onClick needs onKeyDown
- `interactive-supports-focus` — interactive elements must be focusable
- `label-has-associated-control` — labels must reference inputs
- `no-noninteractive-element-interactions` — don't add handlers to non-interactive elements
- `role-has-required-aria-props` — ARIA roles must have required props

---

## Checklist — Accessibility Implementation

- [ ] All interactive elements use semantic HTML (button, a, input)
- [ ] Every form input has a visible label (or aria-label if visually hidden)
- [ ] Errors are associated with fields via aria-describedby
- [ ] Modals have role="dialog", aria-modal, focus trap, Escape to close
- [ ] Menus and tabs have correct ARIA roles and keyboard navigation
- [ ] Color is never the only way to convey information
- [ ] All images have descriptive alt text (or alt="" for decorative)
- [ ] Focus indicators are visible on all interactive elements
- [ ] Live regions announce dynamic content changes
- [ ] Skip link is the first focusable element
- [ ] axe-core tests pass in test suite
