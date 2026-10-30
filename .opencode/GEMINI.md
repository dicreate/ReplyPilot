# Design-First Development Rules

## UI/UX Design Mandate

When creating, modifying, or reviewing ANY user-facing component, page, or layout:

1. **Always activate and follow the design skills** before writing UI code:
   - `ui-ux-design` — visual hierarchy, color, typography, spacing, anti-patterns
   - `design-psychology` — Gestalt, cognitive laws, attention patterns
   - `ux-patterns` — proven patterns for the specific screen type
   - `ux-writing` — every label, button, error message, empty state text
   - `design-to-code` — theme tokens, layout patterns, responsive, skeletons
   - `a11y-implementation` — ARIA, keyboard, focus, screen readers
   - `visual-effects` — Bento grids, Spotlight cards, Aurora gradients (landing/showcase only)
   - `scrollytelling-motion` — scroll-driven pinning & text scrub (marketing/promos only)
   - `frontend-performance` — 120 FPS, Zero-CLS, GPU compositor rules
   - `seo-social-share` — OpenGraph, Twitter cards, Schema.org JSON-LD

2. **Design decisions are not optional.** Every visual choice must be justified:
   - Why this color? → Palette role (primary/neutral/semantic) from ui-ux-design
   - Why this spacing? → 4px grid position from design tokens
   - Why this layout? → Named pattern from ux-patterns
   - Why this text? → UX writing principle from ux-writing

3. **Quality bar — never ship "developer UI":**
   - Visual hierarchy passes the squint test
   - Colors follow 60-30-10 rule, all WCAG AA compliant
   - Typography ≤ 2 fonts, ≤ 3 weights, body ≥ 16px
   - All values from theme tokens — zero hardcoded colors/spacing/fonts
   - Empty, loading, and error states designed (not just the happy path)
   - Responsive: works mobile → desktop
   - Keyboard navigable, screen-reader accessible

4. **When unsure about a design decision**, prefer:
   - More whitespace over less
   - Fewer elements over more
   - Established patterns over novel ones
   - Explicit over clever

## Visual Feedback & Screenshot Review Protocol

When the user provides a screenshot of the rendered application:

1. **Act as an Art Director / Lead UI Auditor**:
   - Perform an instant visual audit against the design skills before touching code.
   - Run the **Squint Test**: What draws the eye first? Is that truly the primary action/metric?
   - Check **Optical Balance**: Mathematical padding often looks misaligned in reality due to font metrics and icon shapes. Identify what feels visually off.
   - Check **Whitespace & Density**: Is content cramped? Are borders too prominent or shadows too harsh?
   - Inspect **Hierarchy & Rhythm**: Are headings differentiated enough? Do cards have consistent weight?

2. **Fix-first Workflow**:
   - Briefly state the 2-4 critical visual flaws identified from the image.
   - Immediately provide targeted code fixes (spacing, font-weight, color refinement, alignment) to elevate the result from "good" to "production-grade".
