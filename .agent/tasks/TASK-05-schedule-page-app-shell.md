# TASK-05: Schedule Page + App Shell (M4)

**Status**: ⏸️ Blocked on TASK-02, TASK-03
**Created**: 2026-05-22
**Assignee**: Main thread
**Effort**: ~half day
**Prereqs**: [TASK-02](./TASK-02-snapshot-pipeline-normalize.md), [TASK-03](./TASK-03-query-layer-banner-state.md)
**Blocks**: TASK-06, TASK-07

---

## Context

**Problem**:
Schedule is the default tab and the demo surface — it's what the audience sees first. There is no existing UI shell, and the tested query layer from TASK-03 needs a thin RSC view to be useful.

**Goal**:
Ship a server-rendered schedule page and global app shell (layout + bottom nav + banner mount) that surfaces the snapshot data with no new logic or client state beyond the banner and nav-active-state islands. Spend the polish budget here.

> **Design-handoff update (2026-05-22)**: This task now implements the **4-tab nav** (Schedule / Search / Saved / Speakers), the **slot-grouped schedule** with sticky `DaySwitcher` and `TimeMarker` dividers, the **KindChip** badge (replacing Remote/InPerson), and the **3px track-color left stripe** on `SessionCard`. All tokens and visuals are sourced from `system/design-handoff-2026-05-22.md` — that doc is authoritative; do not paste hex values here.

---

## Acceptance Criteria

- [ ] `SessionCard` root has `data-testid="session-card"` attribute
- [ ] Session time element uses monospace family (`ui-monospace, SFMono-Regular, Menlo`) per handoff §3.6 — replaces brief's `font-variant-numeric: tabular-nums` (the monospace font itself provides tabular alignment)
- [ ] `SessionCard` renders KindChip (Talk / Keynote / Lightning / Workshop) right-aligned; no Remote/InPerson badge
- [ ] `SessionCard` renders a 3px-wide left stripe in `track.color` (or `--border-2` if track missing)
- [ ] BottomNav renders 4 tabs in order: Schedule, Search, Saved, Speakers
- [ ] BottomNav active tab uses `--brand-on-surface` color + weight 700 (verified via `usePathname()`)
- [ ] DaySwitcher renders sticky at top of Schedule (under the banner padding), 2 pills, brand-soft background on active
- [ ] Time slots grouped by exact `startsAt` ISO; parallel sessions stack under a single `TimeMarker`
- [ ] Past sessions render with `opacity: 0.5`
- [ ] All token values come from CSS variables defined in `app/globals.css` (`@theme` block) — no inline hex codes in components
- [ ] `pnpm build` static-renders `/`
- [ ] `pnpm dev` shows schedule on phone profile
- [ ] All 10 dated workshops visible, grouped by day, sorted chronologically
- [ ] Footer shows real snapshot timestamp (`fetchedAt` formatted `MMM d, yyyy HH:mm`)
- [ ] Lighthouse mobile ≥95 on `/` (run manually, document score)
- [ ] No `'use client'` outside `components/client/**` (BottomNav lives there)
- [ ] `pnpm lint` clean (ESLint client-component rule enforced)

---

## Implementation

### Phase 1: Layout shell

**Goal**: Establish the global app chrome (html, body, banner, main, bottom nav) shared by every route. Wire the design-handoff CSS tokens into `app/globals.css` via Tailwind v4 `@theme` (dark default) and `@media (prefers-color-scheme: light)` overrides.

**Tasks**:
- [ ] Set `<html lang="en" data-theme="dark">` and viewport meta `width=device-width, initial-scale=1, viewport-fit=cover, user-scalable=no` (anti-zoom for iOS)
- [ ] Apply system font stack on `<body>` (`-apple-system, system-ui, sans-serif`)
- [ ] Define design-handoff tokens in `app/globals.css` `@theme` block: `--bg, --surface, --surface-2, --border, --border-2, --text, --text-muted, --text-faint, --brand, --brand-on-brand, --brand-on-surface, --brand-soft, --live, --star-on, --star-off, --banner-bg` — see `system/design-handoff-2026-05-22.md` §3 for values. Add `@media (prefers-color-scheme: light)` block for the light-mode variants. Add `safe-area-inset-bottom` padding utility.
- [ ] Render `<HappeningNowBanner schedule={...} />` at app-root (in `app/layout.tsx`, NOT in `app/page.tsx`) — per design handoff §4.2 banner is global, not Schedule-only. Position `fixed; top: env(safe-area-inset-top, 0); z-index: 40`. Initial render is `null`-equivalent until client hydrates; reserve 50px placeholder padding via CSS to prevent layout shift.
- [ ] Render `<main>` with dynamic `padding-top` (CSS var `--banner-pad`, defaults `50px` → `96px` when banner visible). Banner client island updates the var on state change.
- [ ] Render `{children}` inside `<main>`
- [ ] Render `<BottomNav />` client component (`'use client'`, lives in `components/client/`) with 4 `<Link>`s: `/`, `/search`, `/favorites`, `/speakers`. Active state via `usePathname()`. Saved-tab badge: read favorite count from store (via TASK-04 hook); render numeric badge only when count > 0.

**Files**:
- `app/layout.tsx` — global shell, viewport, fonts, banner mount, main, bottom nav
- `app/globals.css` — `@theme` tokens (dark default + light prefers-color-scheme overrides), banner-pad CSS var, safe-area utilities
- `components/client/BottomNav.tsx` — 4-tab nav with active-state via `usePathname`; reads favorite count for Saved-tab badge

### Phase 2: Schedule page

**Goal**: Render the schedule with sticky `DaySwitcher`, slot-grouped `TimeMarker` dividers, parallel sessions stacked under each marker, collapsed talks link, footer with snapshot date.

**Tasks**:
- [ ] Call `getSchedule()` then `groupByDay(schedule)` in `app/page.tsx`
- [ ] Render `<ScreenHeader kicker="JSNATION 2026" title="Conference Companion" subtitle="June 11–15 · Amsterdam & Online" />`
- [ ] Render sticky `<DaySwitcher days={...} activeDay={...} />` (no client state in v1 — render both days as separate scroll anchors, the "switcher" pills are `<a href="#day-N">` jumps)
- [ ] For each day group, render `<TimeMarker time={...} isLive={...} />` above each unique-`startsAt` cluster, followed by the parallel `<SessionCard />`s sharing that timestamp
- [ ] Render "Browse all talks (48)" as a collapsed `<Link href="/search?kind=talk">` row (per §11 lean — design shows all sessions inline because its data is dated; ours has 48 undated talks so the collapse remains)
- [ ] Render footer: hashtag, Discord link, snapshot date "Snapshot: {fmtDate(fetchedAt)}"

**Files**:
- `app/page.tsx` — schedule page; consumes query layer, composes server components

### Phase 3: Server components

**Goal**: Build the presentational server components per design-handoff §4. All visual values come from CSS variables defined in Phase 1; no inline hex codes.

**Tasks**:
- [ ] `SessionCard` (handoff §4.1) — root has `data-testid="session-card"`. Structure: 3px left stripe in `track.color`, then 12px-padded column with:
  - Row 1: monospace time (12.5/600) · `LiveDot` (if live) · spacer · `KindChip` · `FavoriteStar` (TASK-06 client island, but the slot exists here as a server-rendered placeholder for hydration)
  - Row 2: title 16/600 (17/700 if `kind=keynote`), letterSpacing −0.3
  - Row 3: stacked `Avatar`s (22px, −8px overlap) · speaker names (13px muted, comma-joined, max 2 shown)
  - Row 4: `TrackChip` · room (`pin icon + name`) · capacity (workshops only)
  - Apply `opacity: 0.5` if computed `status === 'after'` (past session per `now` prop or server-default).
  - Break variant: no card chrome, dashed top+bottom border, single row.
- [ ] `KindChip` (handoff §4.3) — 10.5/700 uppercase, radius 4, padding 2/6. Solid bg for keynote/lightning, outlined for talk/workshop. Not rendered for `kind=break`.
- [ ] `TrackChip` (handoff §4.4) — pill with track-color dot, track-color background at 12% alpha, border at 40%.
- [ ] `Avatar` (handoff §4.5) — circle, accepts `url, name, size, tint`. Renders `<img>` if `url` (Cloudinary, already optimized — NOT Next `<Image>`); on error → fall back to initials gradient. Always set `alt={name}`.
- [ ] `TimeMarker` (handoff §4.9) — monospace time on left + horizontal rule + optional `LiveDot` on right.
- [ ] `LiveDot` — 7px red `#FF4D4D` circle. CSS-only beacon: 1.4s expanding ring keyframe.
- [ ] `ScreenHeader` — kicker (11/700 upper, 1.2 letterSpacing) + h1 (30/800, −1) + subtitle (13.5/500).
- [ ] `DaySwitcher` (handoff §4.8) — sticky pill with two anchor buttons (`<a href="#day-N">`); current-day active styling derived from `searchParams.day` if set, else default day 1.
- [ ] `Abstract` — accepts `html: string`, sanitizes via `sanitize-html` allowlist (`p, br, strong, em, a, ul, ol, li, code, pre`); renders with `dangerouslySetInnerHTML`. Used on Session Detail (TASK-06), not Schedule, but build here as it's reused.

**Files**:
- `components/server/SessionCard.tsx`
- `components/server/KindChip.tsx`
- `components/server/TrackChip.tsx`
- `components/server/Avatar.tsx`
- `components/server/TimeMarker.tsx`
- `components/server/LiveDot.tsx`
- `components/server/ScreenHeader.tsx`
- `components/server/DaySwitcher.tsx`
- `components/server/Abstract.tsx`

---

## Out of Scope

- Session detail / speaker / search / favorites / speakers-index pages → TASK-06
- Banner render + state subscription → TASK-07 (banner mount point lives in `app/layout.tsx` from this task; rendering logic comes later)
- `FavoriteStar` interactive behaviour → TASK-06 (server card renders a placeholder slot)
- New unit tests — relies on TASK-03 query coverage; render correctness verified manually

---

## Technical Decisions

| Decision | Options Considered | Chosen | Reasoning |
|---|---|---|---|
| Tab count | 3 (brief), 4 (design) | **4** (Schedule / Search / Saved / Speakers) | Per locked decision 2026-05-22; matches design handoff §2 |
| Active-tab state in nav | Skip in v1 (server-only nav), `usePathname` client island | **`usePathname` client island** | Design shows brand-color active state; 1-file client cost is trivial; nav lives in `components/client/` |
| Card right-aligned badge | Remote/InPerson (brief), KindChip (design) | **KindChip** | Per locked decision 2026-05-22; matches design handoff §4.3 |
| Card left edge | Format dot (brief), 3px track-color stripe (design) | **3px track stripe** | Per design handoff §4.1 |
| Card tags | Up to 3 pills (brief), none (design) | **None** | Tags move to Session Detail. Card already information-dense |
| Avatar element | Next `<Image>`; plain `<img>` | Plain `<img>` | Cloudinary URLs already optimized; avoid Vercel transform cost; `onError` falls back to initials gradient |
| Abstract sanitization | At normalize-time; at render-time | At render-time | Normalizer stays pure; raw HTML lives in storage |
| Time format | UTC; local TZ via `Intl.DateTimeFormat` | Local TZ via `Intl.DateTimeFormat` | Per brief §11.1 + design-handoff §1 (Q1) |
| Talks section | Inline list (design), collapsed link (brief) | **Collapsed `Link`** to `/search?kind=talk` | Per brief §11.2 + design-handoff §1 (Q2); our data has 48 undated talks, design fixtures didn't |
| Token source | Inline hex in components, CSS variables in `app/globals.css` | **CSS variables** | Single source of truth; light-mode swap via `@media (prefers-color-scheme: light)` |
| Light mode | Defer to v1.1, ship in v1 via `prefers-color-scheme` | **Ship in v1** | Per design handoff §1; light-mode tokens defined in §3 |
| Day switcher | Client state, server-rendered with `<a href="#day-N">` jumps | **Server-rendered anchor jumps** | No client state needed; both days rendered, smooth-scroll via CSS `scroll-behavior: smooth` |

---

## Verify

```bash
pnpm build
pnpm dev
pnpm lint
```

Manual checks: open `/` on phone or DevTools mobile profile; confirm all 10 dated workshops visible, grouped by day, sorted chronologically; confirm footer shows real snapshot timestamp; run Lighthouse mobile and document score.

---

## Done

- [ ] `pnpm build` static-renders `/` with no errors
- [ ] `pnpm dev` renders schedule on mobile profile
- [ ] All 10 dated workshops visible, grouped by day, chronologically sorted, with `TimeMarker` dividers and parallel sessions stacked
- [ ] BottomNav has 4 tabs with active styling derived from `usePathname()`
- [ ] `SessionCard` shows KindChip + 3px track stripe; no Remote/InPerson badge; no tags pill row
- [ ] Tokens in `app/globals.css` `@theme` block match handoff §3; light mode swap via `prefers-color-scheme` works
- [ ] Footer displays formatted `fetchedAt` snapshot timestamp
- [ ] Lighthouse mobile ≥95 on `/` (score documented in Notes)
- [ ] Only TWO `'use client'` files introduced: `BottomNav.tsx` and the banner mount placeholder (full banner lives in TASK-07)
- [ ] `pnpm lint` clean

---

## Refs

- Approved plan: `/Users/aleks.petrov/.claude/plans/let-s-plan-complete-execution-velvet-stallman.md` §M4
- Design brief §7.1 (Schedule), §9 (visual) — **superseded by** `system/design-handoff-2026-05-22.md` §3 and §5.1
- **Design handoff** — authoritative for all visual values, IA, and component specs in this task

---

## Notes

_(execution-time observations go here)_

---

**Last Updated**: 2026-05-22 (design handoff: 4-tab nav, KindChip, track stripe, DaySwitcher, app-root banner mount, token CSS-var system)
