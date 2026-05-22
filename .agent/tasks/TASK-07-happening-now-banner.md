# TASK-07: Happening Now Banner Client Island (M6)

**Status**: ⏸️ Blocked on TASK-03, TASK-05
**Created**: 2026-05-22
**Assignee**: Main thread
**Effort**: ~1h
**Prereqs**: TASK-03 (state machine tested), TASK-05 (layout slot exists)
**Blocks**: TASK-08

---

## Context

**Problem**:
The state machine `computeBannerState(now, schedule)` is already test-locked in TASK-03 (now 2 active states + hidden), but there is no UI surface that renders its output. The mount point from TASK-05 lives in `app/layout.tsx` and currently holds a placeholder.

**Goal**:
Ship the render shell: a client component that ticks `now` every 30s, renders one of **two active microcopy variants** (or `null`), and is fixed-positioned at the top of the viewport above all routes. No logic here — only presentation.

> **Design-handoff update (2026-05-22)**: Banner is now **app-root** (visible on every route), **2 active states** (`live` / `upcoming`), **fixed-position** below the safe-area inset (NOT sticky in scroll), background always `#0F141E`, live indicator is **red `#FF4D4D`** (not yellow). See `system/design-handoff-2026-05-22.md` §4.2.

---

## Acceptance Criteria

- [ ] `HappeningNowBanner.test.tsx` green for 3 cases: `live`, `upcoming`, `hidden`
- [ ] Mounted at app-root in `app/layout.tsx` (visible on every route per design handoff §4.2) — NOT in `app/page.tsx`
- [ ] Position: `fixed; top: env(safe-area-inset-top, 0); left: 0; right: 0; z-index: 40`. Does NOT scroll with content.
- [ ] On state change, banner updates `--banner-pad` CSS var (50px hidden, 96px visible) on the `<main>` element to prevent content overlap
- [ ] Background `#0F141E` for both active states (token `--banner-bg`)
- [ ] LIVE state: red `#FF4D4D` LiveDot + 1.4s beacon ring + "LIVE" label in red
- [ ] UPCOMING state: "UP NEXT" label in `--brand-on-surface` color, no beacon
- [ ] Two-line layout: line 1 = title (13/600 white), line 2 = `room · "ends in Xm" / "starts in Xm"` (11.5/500 rgba(255,255,255,0.6))
- [ ] ChevronRight indicator on right edge (rgba(255,255,255,0.5))
- [ ] Tap → routes to `/sessions/<slug>` of the active/upcoming session
- [ ] `?now=ISO_STRING` query param overrides the ticking clock in dev builds; ignored in production
- [ ] Manual check during `pnpm dev`: visible banner with correct copy based on current `Date`
- [ ] Client receives serialized minimal session list `{ id, slug, title, startsAt, endsAt, room }[]`, not full Schedule (bundle minimization per design-handoff §6)
- [ ] `pnpm lint` clean

---

## Implementation

### Phase 1: Component

**Goal**: Build the client-island banner that ticks every 30s and renders 2 active state variants (or `null`). Visual spec from design handoff §4.2.

**Tasks**:
- [ ] Mark file `'use client'`.
- [ ] Accept props `sessions: MinimalSession[]` (serialized, minimal fields only) and optional `now?: Date` (dev override from `?now=ISO`).
- [ ] Initialize `now: Date` state with `props.now ?? new Date()`.
- [ ] If no `props.now`: add `useEffect` with `setInterval(() => setNow(new Date()), 30_000)` and cleanup on unmount.
- [ ] Compute `state = computeBannerState(now, { sessions })` (TASK-03 reducer; pass the minimal projection).
- [ ] In a separate `useEffect` keyed on `state.kind`, set `document.documentElement.style.setProperty('--banner-pad', state.kind === 'hidden' ? '50px' : '96px')`. This drives the `<main>` content padding without React-re-rendering the layout.
- [ ] Render layout (see handoff §4.2 — single `<button>` element):
  - Container: `position: fixed; top: env(safe-area-inset-top, 0); left:0; right:0; z-index:40; background: var(--banner-bg); padding: 8px 14px; display: flex; align-items: center; gap: 10px`.
  - Returns `null` when `state.kind === 'hidden'`.
  - **`live`**: badge slot = `<LiveDot/>` + `<span style="color:#FF4D4D; font-size:10.5px; font-weight:800; letter-spacing:0.6px; text-transform:uppercase">LIVE</span>`. Two-line text slot: title (13/600 white, ellipsis) / `{room} · ends in {minutesRemaining}m` (11.5/500 rgba(255,255,255,0.6)).
  - **`upcoming`**: badge slot = `<span style="color:var(--brand-on-surface); font-size:10.5px; font-weight:800; letter-spacing:0.6px; text-transform:uppercase">UP NEXT</span>`. Two-line text slot: title / `{room} · starts in {fmtCountdown(minutesUntil)}` (uses `{N}m` for <60min, `{H}h {M}m` for ≥60min).
  - ChevronRight icon on far right (rgba(255,255,255,0.5)).
- [ ] Wrap container in a `<Link href={`/sessions/${state.session.slug}`}>` (or use `useRouter().push()` on click; pick Link for SSR-friendliness).
- [ ] Add the LiveDot 1.4s beacon keyframe in `app/globals.css` if not already added by TASK-05.

**Files**:
- `components/client/HappeningNowBanner.tsx` — client island component
- `lib/banner/serialize.ts` — helper `toMinimalSessions(schedule): MinimalSession[]` to keep the serialized payload small
- `app/globals.css` — LiveDot beacon keyframe (if not already present)

### Phase 2: Mount (app-root, every route)

**Goal**: Wire the banner into the **global layout** (`app/layout.tsx`) — per design handoff §4.2 (banner is visible on every route, not Schedule-only).

**Tasks**:
- [ ] Replace the TASK-05 placeholder in `app/layout.tsx` with `<HappeningNowBanner sessions={toMinimalSessions(getSchedule())} />`.
- [ ] Confirm `<main>` has `padding-top: var(--banner-pad, 50px)` — banner updates this CSS var via DOM imperative call to avoid re-rendering the layout subtree.
- [ ] Confirm the server passes the serialized minimal-session list down as a prop (no client re-fetch).
- [ ] Smoke-check: open `/sessions/<slug>` in dev — banner is still present at top.

**Files**:
- `app/layout.tsx` — banner mount at app root
- `app/page.tsx` — confirm NO banner mount here (lives in layout)

### Phase 2.5: `?now=` dev override (workshop-demo enabler)

**Goal**: Allow forcing the banner state on stage via a URL query param, so the workshop demo doesn't depend on real-time alignment with session boundaries.

**Tasks**:
- [ ] Accept an optional `now` prop on `HappeningNowBanner` (typed `Date | undefined`).
- [ ] In `app/layout.tsx` (server component), read `searchParams.now` via the route's segment-level access (Next 15 layouts don't receive `searchParams` directly — use `headers()` to read `referer`, or move the read into `app/page.tsx` which passes it via a context). Recommended approach: keep `app/layout.tsx` reading the schedule, and have a server child component re-pass `searchParams.now` via React context to the client banner. **Simpler alternative**: client-side, `useSearchParams().get('now')` inside the banner client island itself, gated by `process.env.NODE_ENV`.
- [ ] If `process.env.NODE_ENV !== 'production'` AND `searchParams.now` is a valid ISO string, use `new Date(searchParams.now)` as the starting `now`; otherwise tick normally.
- [ ] Document in `## Notes`: example URL `http://localhost:3000/?now=2026-05-22T13:45:00Z` to demo `upcoming`, `http://localhost:3000/?now=2026-06-13T11:00:00Z` to demo `live`.

**Files**:
- `components/client/HappeningNowBanner.tsx` — read `useSearchParams().get('now')` (dev-only), gate by NODE_ENV

### Phase 3: Component tests

**Goal**: Lock the 3 render variants (2 active + hidden) under frozen time.

**Tasks**:
- [ ] Set up jsdom with `vi.useFakeTimers()`.
- [ ] **`live`**: assert LIVE label (red), title rendered, room rendered, "ends in Nm" copy present.
- [ ] **`upcoming`**: assert "UP NEXT" label (brand color), title rendered, "starts in Nm" or "starts in Hh Mm" copy.
- [ ] **`hidden`**: assert component renders nothing (`container.firstChild === null`).
- [ ] Use a small inline `sessions` fixture (3 minimal-session entries: one past, one currently live, one starting in 90 min).
- [ ] Bonus: assert `document.documentElement.style.getPropertyValue('--banner-pad')` flips correctly across the three states (50px → 96px → 50px).

**Files**:
- `components/client/HappeningNowBanner.test.tsx` — 3-case render test

---

## Out of Scope

- Banner state logic (lives in `lib/banner/state.ts`, already tested in TASK-03)
- E2E coverage of banner across states → TASK-08 covers happy path; banner states are unit-tested

---

## Technical Decisions

| Decision | Options Considered | Chosen | Reasoning |
|---|---|---|---|
| Mount location | Schedule only (`app/page.tsx`, brief), app-root (`app/layout.tsx`, design) | **app-root** | Per design handoff §1; live indicator follows the user across screens |
| State count | 5 (brief), 2 (design), 3 (compromise) | **2 active + hidden** | Per locked decision 2026-05-22 |
| Banner positioning | Sticky in scroll (brief), fixed below safe-area (design) | **Fixed** | Per design handoff §4.2; banner must not scroll away |
| Content padding | Static reservation, dynamic via CSS var | **Dynamic via `--banner-pad`** | 50px reserved when hidden (no layout shift); 96px when visible. Banner updates the var imperatively to avoid re-rendering layout |
| Live indicator color | Yellow (brief accent), red (design) | **Red `#FF4D4D`** | Per design handoff §3.4. Red signals urgency better than the brand yellow |
| Banner background | Yellow accent bar (brief), near-black `#0F141E` (design) | **`#0F141E`** | Per design handoff §3.4. Yellow on the dot, not the whole bar — keeps the chrome calm |
| Tick interval | 15s, 30s, 60s | 30s | State boundaries are at-minute granularity; 30s gives ≤30s lag |
| `now` source | Render-time `new Date()`, `useEffect`-only | `new Date()` only inside `useEffect`, never in render | Avoids hydration mismatch |
| Schedule prop | Full Schedule, minimal projection | **Minimal projection** | Reduces serialized payload + client bundle per handoff §6 |
| Animation | JS-driven, CSS keyframe | Pure CSS keyframe (1.4s beacon) | No client JS for the pulse |
| Microcopy | Editable post-merge, frozen at merge | Frozen at PR-merge time | Avoid back-and-forth |
| Countdown rollover | Always minutes, hours+minutes ≥60min | **Hours+minutes ≥60min** | Per design handoff §7 — "342m" is technically correct but ugly; "5h 42m" reads better |

---

## Verify

```bash
pnpm test components/client/HappeningNowBanner.test.tsx
pnpm lint
pnpm dev
```

---

## Done

- [ ] All 3 render-state tests pass (`live`, `upcoming`, `hidden`)
- [ ] Banner mounted in `app/layout.tsx` at app root, visible on every route
- [ ] Position is `fixed`, NOT sticky — confirmed by scrolling on `/sessions/<slug>`
- [ ] `--banner-pad` CSS var on `<main>` flips correctly across states
- [ ] Background is `#0F141E` for both active states; red dot for `live`, brand-yellow "UP NEXT" label for `upcoming`
- [ ] Minimal serialized session list passed as prop (no full Schedule, no client re-fetch)
- [ ] `?now=2026-06-13T11:00:00Z` dev override produces `live` state on a built-in fixture (manual check)
- [ ] `pnpm lint` clean

---

## Refs

- Approved plan: §M6
- Design brief §7.6 (banner spec) — **superseded by** `system/design-handoff-2026-05-22.md` §4.2 and §5
- **Design handoff §4.2** — authoritative banner visual spec

---

## Notes

_(execution-time observations go here)_

---

**Last Updated**: 2026-05-22 (design handoff: app-root mount, 2 active states, fixed positioning, red live dot, `--banner-pad` CSS var)
