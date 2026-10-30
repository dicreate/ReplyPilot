---
name: dates
description: Dates with date-fns 4.1, date-fns-tz 3.2 and react-day-picker 8.9. Use when formatting, parsing, validating dates, handling timezones, or building calendar pickers.
---

# Dates (pinned: date-fns@4.1, date-fns-tz@3.2, react-day-picker@8.9)

Offline-first. date-fns v4 is ESM-first; old v2 timezone helpers are gone.

## 1. Formatting / parsing (date-fns v4)

```ts
import { format, parseISO, isValid, differenceInDays } from 'date-fns'

const d = parseISO(value) // API strings first
if (!isValid(d)) return '—'
format(d, 'dd.MM.yyyy') // display
format(d, "yyyy-MM-dd'T'HH:mm:ssxxx") // payloads
differenceInDays(end, start) // math, no manual ms division
```

Never `new Date(ambiguousString)`; never hand-pad with `getMonth()+1`. Parse at the boundary, pass `Date` objects inside.

## 2. Timezones (date-fns-tz v3.2)

```ts
import { formatInTimeZone } from 'date-fns-tz'

formatInTimeZone(date, 'Asia/Almaty', 'dd.MM.yyyy HH:mm')
```

v2 names (`utcToZonedTime`, `zonedTimeToUtc`) are REMOVED in v3 — use `formatInTimeZone` for display and construct zoned instants explicitly for storage (UTC ISO). Store UTC, display zoned — never store wall-clock strings without offset.

## 3. Picker (react-day-picker@8.9)

```tsx
import { DayPicker } from 'react-day-picker'
import 'react-day-picker/dist/style.css'

;<DayPicker mode="single" selected={date} onSelect={setDate} weekStartsOn={1} />
```

Modes: `single` / `multiple` / `range`. Controlled `selected` + `onSelect`; range needs explicit `required={false}` handling for partial selection. Style via CSS vars/classes, not by forking internals. For form usage wrap in RHF `Controller` (see ui-system-shadcn skill).

## 4. Validation rules

- Past-only (birth): `isFuture(d) → error`.
- Range: `isAfter(end, start)`, plus max-span check for report queries.
- DST-safe day math: use `addDays`/`differenceInCalendarDays`, never `+ 86400000`.

## Checklist

- [ ] Parse once at boundary, `isValid` guard.
- [ ] UTC stored, tz applied at display.
- [ ] No v2 tz helpers, no manual date math.
