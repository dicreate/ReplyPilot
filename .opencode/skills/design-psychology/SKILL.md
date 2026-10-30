---
name: design-psychology
description: >-
  Design psychology, Gestalt principles, cognitive biases, UX laws (Fitts, Hick, Jakob,
  Miller), emotional design, trust signals, and persuasion patterns. Activate when making
  decisions about layout structure, information grouping, interaction complexity, onboarding,
  conversion flows, trust-building, or when justifying WHY a design decision is correct.
---

# Design Psychology — The "Why" Behind Every Decision

You are a designer who understands human cognition. Every layout, interaction, and visual
choice must be grounded in how humans perceive, process, and decide. Never design on gut
feeling alone — know which principle supports your choice.

---

## 1. Gestalt Principles of Perception

The human brain automatically organizes visual elements into groups and patterns.
Use these principles intentionally — never let them work against you.

### 1.1 Proximity

**Items near each other are perceived as a group.**

- Form fields about the same topic must be physically closer than fields about different topics.
- In a card, the title must be closer to its description than to the next card's title.
- Gap between grouped items: 8–16px. Gap between groups: 24–48px. The ratio matters more
  than absolute values — group gap should be ≥ 2× item gap.

```
✅ GOOD                          ❌ BAD
┌─────────────┐                  ┌─────────────┐
│ Name         │  ← 8px gap      │ Name         │
│ Email        │                  │              │  ← same gap everywhere
│              │  ← 24px gap     │ Email        │
│ Street       │                  │              │
│ City    Zip  │  ← 8px gap      │ Street       │
└─────────────┘                  │ City    Zip  │
                                 └─────────────┘
```

### 1.2 Similarity

**Elements that look similar are perceived as related.**

- All clickable elements should share visual traits (color, underline, cursor).
- All status badges should share the same shape/size, differentiated only by color.
- Don't make non-interactive elements look clickable (blue underlined text that isn't a link).

### 1.3 Continuity

**The eye follows smooth lines and curves.**

- Align elements along invisible lines — the eye traces them naturally.
- Multi-step processes benefit from a visual line connecting steps (stepper component).
- Broken alignment breaks the reading flow and feels "off."

### 1.4 Closure

**The brain completes incomplete shapes.**

- Cards don't need full borders — a subtle shadow or background difference is enough.
- Cropped images at the edge of a carousel signal "there's more to scroll."
- Progress indicators (circle charts, progress bars) leverage closure — users mentally
  complete the shape and understand what's missing.

### 1.5 Figure/Ground

**The brain separates foreground from background.**

- Modals must have a dark overlay to push the background into "ground."
- Dropdowns and popovers need shadow/elevation to float above the page.
- If figure/ground is ambiguous, the UI feels broken. Test with squint.

### 1.6 Common Fate

**Elements that move together are perceived as a group.**

- When dragging a card, all its children must move with it.
- When a section collapses, everything inside it must animate together.
- Parallax scrolling that moves elements at different rates can break this principle —
  use sparingly.

### 1.7 Focal Point (Von Restorff Effect)

**The element that is visually different from the rest is remembered.**

- This is WHY the primary CTA button is a different color — it stands out.
- Use this to draw attention: one colored element among neutrals, one large element among small.
- If everything is emphasized, nothing is emphasized.

---

## 2. Cognitive Laws for UX

### 2.1 Fitts's Law

**The time to reach a target depends on its size and distance.**

$T = a + b \cdot \log_2\left(\frac{2D}{W}\right)$

**Practical rules:**
- Make primary buttons **large** and place them **close** to where the user's cursor/thumb is.
- Don't put destructive actions (Delete) next to constructive actions (Save) — distance them.
- Mobile: place primary actions in the **thumb zone** (bottom center of screen).
- Edge/corner targets are effectively infinite-size on desktop (cursor stops at screen edge)
  — put menu bars at screen edges.
- Dropdown items should be tall enough to click without precision (min 36px height).

### 2.2 Hick's Law (Hick-Hyman)

**Decision time increases logarithmically with the number of choices.**

$T = b \cdot \log_2(n + 1)$

**Practical rules:**
- Navigation: max 5–7 top-level items. More than that → group into categories.
- Action menus: max 7 visible items before scrolling or categorizing.
- Option lists: if > 10 options, add search/filter.
- Multi-step forms: break into steps to reduce visible choices per screen.
- Don't present 20 card layouts on a dashboard — guide the user's attention to 1–3 key items.

### 2.3 Jakob's Law

**Users spend most of their time on OTHER sites and expect yours to work the same way.**

**Practical rules:**
- Logo top-left links to home. Always.
- Shopping cart icon top-right. Always.
- Search icon is a magnifying glass. Always.
- Underlined blue text is a link. Always.
- Don't reinvent navigation patterns — users will be confused, not impressed.
- Innovation in UI should be in **content and value**, not in basic interaction patterns.

### 2.4 Miller's Law

**Working memory holds 7 ± 2 items.**

**Practical rules:**
- Chunk phone numbers: `+1 (555) 123-4567`, not `15551234567`.
- Chunk long lists with headers/dividers.
- Tab bars: max 5 tabs visible.
- Step indicators: max 5–7 steps visible.
- If you need to show more, paginate or progressively disclose.

### 2.5 Doherty Threshold

**Productivity soars when a system responds in < 400ms.**

- Every interaction must produce **visible feedback within 100ms**.
- If the operation takes > 400ms, show a loading indicator.
- If it takes > 1s, show a progress indicator or skeleton.
- If it takes > 10s, show a progress bar with estimated time remaining.
- Optimistic updates: show the result immediately, sync in background.

### 2.6 Peak-End Rule

**People judge an experience by its peak moment and its end, not by the average.**

- Make the final step of any flow **satisfying** (success animation, confetti, summary).
- The worst moment in the flow (error, wait time) will be disproportionately remembered — fix it.
- Onboarding: end with a quick win, not a settings page.
- Checkout: end with clear confirmation + "what happens next."

### 2.7 Aesthetic-Usability Effect

**Users perceive aesthetically pleasing designs as MORE usable, even if they aren't.**

- This is why visual polish matters — it literally makes users more tolerant of minor usability issues.
- But: never use beauty to mask real usability problems. Fix the UX, then polish the UI.
- First impressions are formed in ~50ms. If it looks cheap/broken, users won't trust it.

### 2.8 Zeigarnik Effect

**People remember uncompleted tasks better than completed ones.**

- Progress bars and step indicators leverage this — users feel compelled to complete them.
- "Your profile is 70% complete" drives engagement.
- Show progress in onboarding flows to create completion motivation.

---

## 3. Cognitive Load Theory

There are three types of cognitive load. Minimize the first two to leave room for the third.

### 3.1 Intrinsic Load
The inherent complexity of the task itself. **You can't reduce this** — a tax form is complex.
But you CAN break it into smaller, manageable chunks.

### 3.2 Extraneous Load
Load caused by **bad design**. This is what you must eliminate:
- Confusing navigation that forces users to think about WHERE things are.
- Inconsistent patterns that force re-learning within the same app.
- Unnecessary choices, distractions, and visual noise.
- Information that's present but not relevant to the current task.

### 3.3 Germane Load
The "productive" effort spent understanding and learning. **This is good.**
Your design should make it easy for users to build correct mental models:
- Use familiar metaphors (folder = container, trash = delete).
- Show relationships visually (parent-child nesting, timelines).
- Provide clear feedback that confirms the user's mental model is correct.

### Reducing cognitive load — practical checklist:

1. **Remove anything that isn't helping the user right now.**
2. **Chunk complex information** into digestible sections with clear headings.
3. **Use recognition, not recall** — dropdowns over text inputs when options are known.
4. **Provide clear defaults** — users should be able to proceed without decisions when possible.
5. **One primary action per screen** — don't make users choose between competing CTAs.
6. **Progressive disclosure** — advanced options hidden behind "More options" or collapsible sections.
7. **Consistent patterns** — same action = same gesture = same place across the app.

---

## 4. Trust & Credibility Signals

Users form trust judgments in milliseconds. Design for trust:

### Visual trust signals:
1. **Professional typography** — sloppy text = untrustworthy brand.
2. **Consistent, polished UI** — bugs and misalignment = "if they can't get this right..."
3. **Appropriate whitespace** — cramped layouts feel desperate/spammy.
4. **Real photography** — authentic team photos > generic stock photos.
5. **Social proof** — reviews, testimonials, client logos, user counts.
6. **Security indicators** — lock icons, "256-bit encrypted", trust badges near forms.

### Interaction trust signals:
1. **Transparency** — show pricing upfront, no hidden fees, clear terms.
2. **Reversibility** — undo, cancel, "you can change this later."
3. **Confirmation before destructive actions** — "Are you sure? This cannot be undone."
4. **Clear data handling** — tell users what happens with their data.
5. **Error recovery** — don't lose user input on errors. Auto-save drafts.

### Anti-trust patterns (NEVER do these):
- ❌ Dark patterns: trick users into subscribing, hiding unsubscribe, confusing opt-in/opt-out.
- ❌ Bait and switch: show one thing, deliver another.
- ❌ Hidden costs: showing final price only at checkout.
- ❌ Forced continuity: auto-charging without clear warning.
- ❌ Roach motel: easy to get in, impossible to get out (account deletion).

---

## 5. Emotional Design (Don Norman's Three Levels)

### 5.1 Visceral Level (Appearance)
First impression — does it **look** appealing?
- Clean, modern typography.
- Harmonious color palette.
- Quality imagery and iconography.
- Smooth animations.

### 5.2 Behavioral Level (Usability)
During use — does it **feel** good to use?
- Responsive to input (< 100ms feedback).
- Predictable behavior (no surprises).
- Error-tolerant (forgiving of mistakes).
- Efficient for repeated tasks.

### 5.3 Reflective Level (Identity)
After use — does it make the user feel **good about themselves**?
- "I'm the kind of person who uses sophisticated tools."
- Shareable — users want to show others.
- Memorable — users recall the experience positively.
- Aligned with user's values (privacy, sustainability, etc.).

---

## 6. Attention & Scanning Patterns

### F-Pattern (text-heavy pages)
Users scan in an F shape: across the top, then partway across the middle, then down the left side.
- Put the most important content in the first two paragraphs.
- Start headings and bullet points with information-carrying words (front-loading).
- Left column is always read; right column is often ignored.

### Z-Pattern (minimal / marketing pages)
Users scan in a Z: top-left → top-right → bottom-left → bottom-right.
- Logo top-left, CTA top-right.
- Key message in the diagonal.
- Final CTA bottom-right.

### Layer-Cake Pattern (well-structured content)
Users scan headings and skip body text until they find a relevant section.
- Make headings descriptive ("How to reset your password" not "Step 3").
- Use clear visual distinction between headings and body text.
- This is the ideal pattern — design for it with strong typographic hierarchy.

---

## 7. Decision Architecture (Nudge Theory in UI)

### Defaults
The default option is selected ~70-90% of the time. Choose defaults wisely:
- Pre-select the most common/beneficial option.
- "Remember me" checked by default (convenience).
- Notifications: opt-in by default for critical ones, opt-out for marketing.

### Anchoring
The first number/option users see anchors their expectations:
- Pricing pages: show the most expensive plan first (others feel like a deal).
- Show "Most popular" tag on the middle plan — social proof + anchoring.

### Choice Architecture
- Order matters: first and last options get disproportionate attention (serial position effect).
- Recommended option should be visually distinct (highlight, "Best value" badge).
- When offering 3 plans, the middle one sells most (compromise effect).

---

## Checklist — Psychology-Informed Design

- [ ] Gestalt principles used intentionally (proximity, similarity, continuity)
- [ ] Choices per screen ≤ 7 (Hick's Law)
- [ ] Primary targets are large and close (Fitts's Law)
- [ ] Familiar patterns used (Jakob's Law)
- [ ] Response time < 400ms or loading indicator shown (Doherty Threshold)
- [ ] No extraneous cognitive load — everything on screen serves the user's current goal
- [ ] Trust signals present (professional polish, transparency, reversibility)
- [ ] No dark patterns anywhere
- [ ] Flow ends with satisfaction (Peak-End Rule)
- [ ] Progressive disclosure for complexity
