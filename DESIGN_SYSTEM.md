# Sales Coach — Design System Specification

Dark-only, muted violet accent, square + thin borders. Tailwind only; reusable components in `src/components/ui`.

---

## 1. Visual System

### Palette
- **Dark-only:** `bg-neutral-950` for app background. No light theme; single dark mode.
- **Surfaces:** `bg-neutral-900` for cards/panels. Muted: `neutral-800`, `neutral-700`.
- **Text:** Primary `text-neutral-100`, secondary `text-neutral-400`, muted `text-neutral-500`.
- **Borders:** `border-neutral-800` everywhere; thin (default border width). No shadows, no gradients.
- **Brand accent:** Muted violet — use `violet-500` / `violet-600` for primary actions, links, focus rings; subtle `violet-500/20` or `violet-900/50` for accent backgrounds (badges, highlights).
- **Diagnostic accent:** Amber for leaks/diagnostics only — `amber-500`, `amber-600`, `bg-amber-500/10`, `border-amber-500/30`. Keep existing amber usage for warnings and leak UI.
- **Semantic:** Success `emerald-500/600`; Error/danger `rose-500/600` (minimal use).

### Typography
- **Font:** System stack in Tailwind (no new font required): `font-sans` with editorial feel — slightly generous line-height for body (`leading-relaxed` where appropriate).
- **Scale:** Page title `text-2xl font-semibold tracking-tight text-neutral-100`; Section title `text-base font-medium text-neutral-200`; Body `text-sm text-neutral-400`; Caption `text-xs text-neutral-500`.

### Spacing
- Page vertical rhythm: `space-y-8` between major sections.
- Section internal: `space-y-4`.
- Inline gaps: `gap-3` (tight), `gap-4` (default), `gap-6` (loose).
- Padding: cards `p-4` or `p-6`; page containers `px-4 sm:px-6 py-8`.
- Max content width: `max-w-2xl` forms/lists; `max-w-3xl` reading.

### Radius
- **Square + thin:** Cards/panels `rounded-md`. Inputs, buttons, badges `rounded-sm`. No `rounded-xl` or heavy rounding.
- **Borders:** Always `border border-neutral-800`; no `shadow-sm` or shadows.

### Consistency rules
- Headers: Page title `text-2xl font-semibold tracking-tight`; Section `text-base font-medium`.
- Section spacing: `space-y-8` between sections; `space-y-4` within.
- Max widths: forms `max-w-xl`/`max-w-2xl`; reading `max-w-2xl`/`max-w-3xl`; layout `max-w-3xl`.
- Links: `text-violet-400 hover:text-violet-300` or Button ghost.
- Alerts: Error `border border-rose-800 bg-rose-950/30 text-rose-300`; Warning/amber for leaks `border border-amber-800 bg-amber-950/20 text-amber-300`.

---

## 2. Component APIs & File List

### Files in `src/components/ui`

| File | Purpose |
|------|---------|
| `Card.tsx` | Container: `bg-neutral-900 border border-neutral-800 rounded-md`; padding variants. |
| `Badge.tsx` | Variants: default, accent (violet), warning (amber), success. All `rounded-sm`. |
| `Button.tsx` | primary (violet), secondary (outline), ghost, danger; sizes; loading; fullWidth. `rounded-sm`. |
| `Input.tsx` | label, hint, error; focus ring violet; `rounded-sm`. |
| `Textarea.tsx` | Same border/focus as Input; label, hint, error. |
| `Section.tsx` | title, description; `space-y-4` for children. |

### Badge variants
- default: `bg-neutral-800 text-neutral-300`
- accent: `bg-violet-500/20 text-violet-300 border border-violet-500/30`
- warning: `bg-amber-500/10 text-amber-300 border border-amber-500/30`
- success: `bg-emerald-500/10 text-emerald-300 border border-emerald-500/30`

### Button variants
- primary: `bg-violet-600 hover:bg-violet-500 text-white border border-violet-500/50`
- secondary: `border border-neutral-800 bg-neutral-900 hover:bg-neutral-800 text-neutral-200`
- ghost: `hover:bg-neutral-800 text-neutral-300`
- danger: `text-rose-400 hover:bg-rose-950/30 border border-rose-800`

Sizes: sm (py-1.5 px-2 text-xs), md (py-2 px-3 text-sm), lg (py-2.5 px-4). Props: loading, fullWidth.

### Input / Textarea
- Base: `bg-neutral-900 border border-neutral-800 rounded-sm px-3 py-2 text-sm text-neutral-100 placeholder-neutral-500 focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500`
- Props: label, hint, error.

---

## 3. Page-by-Page (reference)

- **Login / Register:** Card, Input, Button; page `bg-neutral-950`.
- **Layout / Header:** `border-b border-neutral-800 bg-neutral-900`; violet links; Button ghost sign out.
- **Dashboard:** Section + Card nav items; violet links.
- **Rate:** Section, Card, Badge, Button, Textarea; diagnostic block amber.
- **History:** Card list; detail with Section + Card; Copy button.
- **Insights:** Section, Card, Badge for score/leaks/weaknesses.
- **Roleplay:** Scenario Card; chat bubbles user `bg-neutral-800`, assistant `bg-violet-500/10`; insight Card.
- **Playbooks:** Card form; Badge filter; Card list; Button ghost/danger.
- **Landing:** `bg-neutral-950`; Button primary/secondary.

---

## 4. Guardrails

- No new UI libraries — Tailwind only.
- No feature changes — only replace class names and wrap in design-system components.
- Keep existing API calls and state.
- Backend and routes unchanged.
