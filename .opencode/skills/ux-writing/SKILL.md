---
name: ux-writing
description: >-
  UX writing and microcopy — button labels, error messages, empty states, tooltips,
  onboarding text, confirmation dialogs, notifications, and tone of voice. Activate when
  writing any user-facing text: button text, labels, helper text, error messages, success
  messages, page titles, tooltips, placeholders, or any other UI copy.
---

# UX Writing — Every Word in the UI is a Design Decision

Words are interface. Bad copy breaks even beautiful designs.
Write like a friendly expert: clear, concise, helpful, human.

---

## 1. Core Principles

### 1.1 Clarity above all
- **Say what you mean.** No jargon, no ambiguity, no marketing speak in the UI.
- If a 12-year-old can't understand it, rewrite it.
- ❌ "Your session has been invalidated" → ✅ "You've been signed out"
- ❌ "Persist to datastore" → ✅ "Save"

### 1.2 Conciseness
- Every word must earn its place. Cut ruthlessly.
- ❌ "Click here in order to create a new project" → ✅ "Create project"
- ❌ "Are you sure you would like to delete this item? This action cannot be undone."
  → ✅ "Delete this item? This can't be undone."
- Headlines: ≤ 8 words. Body text: ≤ 2 sentences per paragraph in UI.

### 1.3 Helpfulness
- Don't just describe the problem — tell the user what to do.
- ❌ "Invalid format" → ✅ "Use the format: MM/DD/YYYY"
- ❌ "File too large" → ✅ "File must be under 10 MB. Try compressing the image."

### 1.4 Human tone
- Write like a knowledgeable friend, not a robot or a lawyer.
- Use contractions: "can't", "won't", "you'll" — they're warmer.
- Avoid: "shall", "hence", "therefore", "utilize", "prior to".
- Use: "can", "so", "use", "before".

---

## 2. Button & Action Labels

### 2.1 Rules

1. **Buttons are verbs.** They describe what happens when you click them.
2. **Be specific.** "Save" is okay, "Save changes" is better, "Save draft" is best.
3. **No "Submit".** It says nothing. Replace with what actually happens:
   - "Submit" → "Send message", "Create account", "Place order", "Apply filters"
4. **No "OK" or "Yes/No".** Replace with the actual action:
   - "OK" → "Got it", "Continue", "Done"
   - "Yes/No" → "Delete project" / "Keep project"
5. **Pair correctly in dialogs:** the destructive action names the consequence, the safe action is an escape.

### 2.2 Common patterns

| Action | ❌ Bad | ✅ Good |
|:-------|:-------|:--------|
| Create | Submit, OK | Create project |
| Save | Submit | Save changes |
| Delete | Yes / OK | Delete |
| Cancel | No | Cancel / Keep editing |
| Sign up | Submit | Create account |
| Log in | Submit | Sign in |
| Search | Go | Search |
| Upload | Submit | Upload file |
| Send | OK | Send message |
| Pay | Submit | Pay \$49.99 |
| Confirm | Confirm | Place order |

### 2.3 Primary/Secondary pairing

```
┌──────────────────────────────────────┐
│  Delete this project?                │
│  This will remove all files and      │
│  can't be undone.                    │
│                                      │
│         [Cancel]  [Delete project]   │  ← specific action, not "Yes"
└──────────────────────────────────────┘
```

---

## 3. Error Messages

### 3.1 The formula

**Error = What happened + Why + What to do**

```
What happened:  "Your password is too short."
Why:            "Passwords need at least 8 characters."
What to do:     "Add more characters and try again."
```

Often you can combine these: "Password must be at least 8 characters."

### 3.2 Tone rules for errors

1. **Never blame the user.** ❌ "You entered an invalid email" → ✅ "Please enter a valid email."
2. **Don't be dramatic.** ❌ "FATAL ERROR!" → ✅ "Something went wrong."
3. **Don't be vague.** ❌ "An error occurred." → ✅ "We couldn't save your changes. Try again."
4. **Don't use error codes in the UI.** Show them in details/console, not to users.
5. **Be reassuring when possible.** "Don't worry, your draft has been saved."

### 3.3 Common error messages — rewrite guide

| Scenario | ❌ Bad | ✅ Good |
|:---------|:-------|:--------|
| Empty required field | "Field is required" | "Please enter your name" |
| Invalid email | "Invalid email format" | "That doesn't look like an email. Check for typos." |
| Password mismatch | "Passwords do not match" | "Passwords don't match. Try again." |
| Network error | "Error 500" | "Something went wrong on our end. Try again in a moment." |
| Not found | "404 Not Found" | "We can't find that page. It may have been moved or deleted." |
| Unauthorized | "403 Forbidden" | "You don't have access to this. Request access from an admin." |
| File too large | "Payload too large" | "This file is over 10 MB. Try a smaller one." |
| Rate limited | "429 Too Many Requests" | "You're doing that too often. Wait a moment and try again." |
| Timeout | "Request timeout" | "This is taking longer than expected. Try again." |
| Offline | "Network error" | "You seem to be offline. Check your connection." |

---

## 4. Empty States

### 4.1 The formula

**Empty state = Illustration + Headline + Description + CTA**

```
┌─────────────────────────────────┐
│         📋 (illustration)       │
│                                 │
│   No projects yet               │  ← what this space is for
│   Create your first project     │  ← what the user can do
│   to start tracking your work.  │
│                                 │
│   [+ Create project]            │  ← CTA to fix the emptiness
└─────────────────────────────────┘
```

### 4.2 Empty state variants

| Context | Headline | Description | CTA |
|:--------|:---------|:------------|:----|
| First-time empty | "No projects yet" | "Create your first project to get started." | "Create project" |
| Search no results | "No results found" | "Try different keywords or remove some filters." | "Clear filters" |
| Filtered empty | "No items match your filters" | "Adjust your filters or clear them to see all items." | "Clear all filters" |
| Error empty | "Couldn't load data" | "Something went wrong. Please try again." | "Retry" |
| Completed empty | "All caught up!" | "You've completed all your tasks. Nice work! ✨" | (none needed) |
| Permission empty | "Nothing to see here" | "You don't have access to this section." | "Request access" |

### 4.3 Rules

1. **Never show a blank page.** Always give context and a next step.
2. **Match the illustration style** to your brand (line art, flat color, or subtle gray).
3. **The CTA is the most important part** — it turns confusion into action.
4. **Don't over-explain.** One sentence for the description is usually enough.

---

## 5. Tooltips & Helper Text

### 5.1 Tooltips

- **When**: to explain icons, truncated text, or add context to a label.
- **When NOT**: to convey critical information (users may never hover).
- **Length**: 1 sentence max. If you need more, use a help link or info panel.
- **Trigger**: hover on desktop (show after 300ms delay), long-press on mobile.
- **Position**: above the element by default, auto-flip to stay in viewport.

```
               ┌───────────────────────────┐
               │ Export data as a CSV file  │
               └─────────────┬─────────────┘
                             ▼
                          [⬇ Export]
```

### 5.2 Helper text (under form fields)

- **When**: to clarify expectations, format, or constraints.
- **Length**: 1 short sentence.
- **Style**: smaller text, muted color (gray.500).
- **Don't repeat the label.** Label: "Password" + Helper: "Enter your password" ← useless.
- ✅ Good helper: "At least 8 characters with a number and symbol."
- Helper text disappears when error text appears (don't show both).

### 5.3 Placeholder text

- **Placeholders are NOT labels.** They disappear on focus and can't be read after typing.
- **Use for**: examples and format hints only.
- ✅ Good: placeholder="e.g., john@example.com"
- ❌ Bad: placeholder="Enter your email address" (that's a label)
- ❌ Bad: placeholder="Email" (that's also a label)

---

## 6. Success Messages & Confirmation

### 6.1 Success messages

- **Format**: what was accomplished, in past tense.
- ✅ "Project created" / "Changes saved" / "Email sent" / "File uploaded"
- **Duration**: toast auto-dismiss in 3 seconds.
- **Tone**: brief and confident. Don't over-celebrate small actions.
  - ❌ "Congratulations! Your project has been successfully created!" ← too much
  - ✅ "Project created" ← perfect

### 6.2 Confirmation dialogs

- **Only for destructive or irreversible actions.**
- **Title**: state the consequence, not the action.
  - ❌ "Are you sure?" → ✅ "Delete 3 projects?"
- **Body**: explain what will happen.
  - "This will permanently remove all files and data. This can't be undone."
- **Buttons**: [Cancel] [Delete 3 projects] — not [No] [Yes].
- **Don't confirm routine actions** — saving, closing, navigating away (unless unsaved changes).

---

## 7. Onboarding & Instructional Copy

### 7.1 Welcome messages

```
Welcome, Sarah! 👋
Let's set up your workspace. This takes about 2 minutes.

[Get started]
```

- **Use the user's name** if available.
- **Set expectations**: how long it takes, how many steps.
- **One CTA** — don't overwhelm on the first screen.

### 7.2 Feature announcements

```
┌──────────────────────────────────────┐
│ ✨ New: Dark mode                    │
│                                      │
│ Easy on your eyes, day and night.    │
│ Switch anytime in Settings.          │
│                                      │
│ [Try it now]             [Dismiss]   │
└──────────────────────────────────────┘
```

- **Lead with benefit**, not feature name.
- ❌ "We've implemented a new dark mode theming engine" ← nobody cares about the engine.
- ✅ "Easy on your eyes, day and night." ← user benefit.

### 7.3 Progress and encouragement

- "Almost there! Just one more step."
- "Great, your profile is set up. Now let's add your first project."
- "You're all set! Start exploring your dashboard."
- Don't patronize: ❌ "Good job clicking the button!" ← this is condescending.

---

## 8. Loading & Waiting Copy

| Duration | Copy | Pattern |
|:---------|:-----|:--------|
| < 1s | (no copy needed) | Spinner or skeleton |
| 1–5s | "Loading..." | Spinner + text |
| 5–15s | "This might take a moment..." | Progress indicator |
| 15–60s | "Processing your data. This usually takes about 30 seconds." | Progress bar + estimate |
| > 60s | "We'll email you when it's ready." | Background task notification |

### Rules:
1. **Be honest about wait times.** Underestimate = frustration when it's late.
2. **Show what's happening** when possible: "Uploading file 2 of 5..."
3. **Don't say "Please wait"** — it adds no information. Show progress instead.

---

## 9. Tone of Voice Spectrum

Adjust tone based on context — not every screen is the same:

| Context | Tone | Example |
|:--------|:-----|:--------|
| **Error / failure** | Neutral, helpful | "We couldn't save your changes. Try again." |
| **Success** | Warm, brief | "Changes saved ✓" |
| **Warning** | Clear, calm | "You have unsaved changes. Leave anyway?" |
| **Onboarding** | Friendly, encouraging | "Welcome! Let's get you set up." |
| **Settings** | Neutral, informative | "Controls how notifications are delivered." |
| **Empty state** | Friendly, guiding | "No projects yet. Create one to get started." |
| **Marketing** | Confident, aspirational | "Build something amazing." |
| **Legal/security** | Precise, trustworthy | "Your data is encrypted in transit and at rest." |

### Tone rules:
1. **Never be funny in error states.** Users are frustrated. Be helpful.
2. **Never be cold in onboarding.** Users are forming first impressions. Be warm.
3. **Never be verbose in repeated UI.** Users see it every day. Be brief.
4. **Emoji**: Use sparingly. ✅ in success toasts, 👋 in welcome messages. ❌ in errors, settings, forms.

---

## 10. Capitalization & Formatting

### 10.1 Capitalization standard

| Element | Style | Example |
|:--------|:------|:--------|
| **Page titles** | Title Case | "Project Settings" |
| **Section headings** | Sentence case | "General settings" |
| **Buttons** | Sentence case | "Create project" |
| **Menu items** | Sentence case | "Export as CSV" |
| **Labels** | Sentence case | "Email address" |
| **Tooltips** | Sentence case | "Click to copy link" |
| **Error messages** | Sentence case | "Please enter a valid email" |
| **Tab names** | Title Case or Sentence | "Overview" / "Activity log" |

### 10.2 Punctuation rules

1. **No periods** on headlines, labels, buttons, toasts, or single-sentence descriptions.
2. **Use periods** in multi-sentence body text and helper text (when > 1 sentence).
3. **No exclamation marks** in errors or warnings. Use sparingly elsewhere (max 1 per page).
4. **Ellipsis (...)** for truncated text only, not for "Loading..."-style text (use "Loading" or an animation).
5. **Oxford comma**: use it. "Create, edit, and delete" — not "Create, edit and delete."

---

## Checklist — UX Writing Review

- [ ] Every button is a specific verb (no "Submit", "OK", "Yes")
- [ ] Error messages explain what happened + how to fix it
- [ ] No jargon, error codes, or technical terms in user-facing text
- [ ] Empty states have headline + description + CTA
- [ ] Tone matches context (warm for onboarding, neutral for errors)
- [ ] Placeholder text is an example, not a label
- [ ] Helper text adds value (not repeating the label)
- [ ] Confirmation dialogs name the consequence in the title
- [ ] Success messages are brief and in past tense
- [ ] Consistent capitalization across the app (sentence case default)
- [ ] No periods on single-line UI text (buttons, labels, toasts)
