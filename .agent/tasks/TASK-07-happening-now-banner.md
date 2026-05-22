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
The state machine `computeBannerState(now, schedule)` is already test-locked in TASK-03, but there is no UI surface that renders its output. The layout slot from TASK-05 currently holds a placeholder.

**Goal**:
Ship the render shell: a client component that ticks `now` every 30s and renders one of five microcopy variants. No logic here — only presentation.

---

## Acceptance Criteria

- [ ] `HappeningNowBanner.test.tsx` green for all 5 cases
- [ ] Mounted at the top of `app/page.tsx` (Schedule only, per brief §7.6) — NOT in `app/layout.tsx`
- [ ] `?now=ISO_STRING` query param overrides the ticking clock in dev builds; ignored in production
- [ ] Manual check during `pnpm dev`: visible banner with correct copy based on current `Date`
- [ ] No re-fetch / re-parse of schedule on client (passed as prop)
- [ ] `pnpm lint` clean

---

## Implementation

### Phase 1: Component

**Goal**: Build the client-island banner that ticks every 30s and renders the 5 state variants.

**Tasks**:
- [ ] Mark file `'use client'`.
- [ ] Accept prop `schedule: Schedule` (serializable from server parent).
- [ ] Initialize `now: Date` state with `new Date()`.
- [ ] Add `useEffect` with `setInterval(() => setNow(new Date()), 30_000)` and cleanup on unmount.
- [ ] Compute `state = computeBannerState(now, schedule)`.
- [ ] Render switch on `state.kind`:
  - **`LIVE`**: `🔴 Happening now: <Link>{state.session.title}</Link>` → `/sessions/<slug>`.
  - **`IMMINENT`**: `Starts in {state.minutesUntil} min: <Link>{state.session.title}</Link>` → `/sessions/<slug>`.
  - **`TODAY`**: `Today at the conference` → `<Link>` to `/`.
  - **`EVENT_SOON`**: `JSNation in {state.daysUntil} days`.
  - **`HIDDEN`**: returns `null`.
- [ ] Add 2s "breathing pulse" CSS keyframe on the red dot when `LIVE` (in `globals.css`).

**Files**:
- `components/client/HappeningNowBanner.tsx` — client island component
- `app/globals.css` — pulse keyframe

### Phase 2: Mount (Schedule route only)

**Goal**: Wire the banner into the **Schedule page** (`app/page.tsx`) — NOT the global layout — per design brief §7.6 ("lives at the top of the Schedule screen only").

**Tasks**:
- [ ] Mount `<HappeningNowBanner schedule={getSchedule()} />` at the top of `app/page.tsx` (Schedule), above the event header.
- [ ] Remove or leave unused the `<HappeningNowBannerSlot />` placeholder in `app/layout.tsx` from TASK-05 (the banner does NOT render on detail / speaker / search / favorites routes).
- [ ] Confirm the server passes the schedule down as a prop (no client re-fetch).

**Files**:
- `app/page.tsx` — mount banner at top, pass schedule prop
- `app/layout.tsx` — verify banner slot is removed/absent

### Phase 2.5: `?now=` dev override (workshop-demo enabler)

**Goal**: Allow forcing the banner state on stage via a URL query param, so the workshop demo doesn't depend on real-time alignment with session boundaries.

**Tasks**:
- [ ] Accept an optional `now` prop on `HappeningNowBanner` (typed `Date | undefined`).
- [ ] In `app/page.tsx`, read `searchParams.now` (Schedule is a server component, so this is free).
- [ ] If `process.env.NODE_ENV !== 'production'` AND `searchParams.now` is a valid ISO string, pass `new Date(searchParams.now)` to the banner; otherwise omit the prop and let the client component use its own ticking `new Date()`.
- [ ] Document in `## Notes`: example URL `http://localhost:3000/?now=2026-05-22T13:45:00Z` to demo IMMINENT during the workshop.

**Files**:
- `app/page.tsx` — read `searchParams.now`, gate by `NODE_ENV`
- `components/client/HappeningNowBanner.tsx` — accept optional `now: Date` prop

### Phase 3: Component tests

**Goal**: Lock the 5 render variants under frozen time.

**Tasks**:
- [ ] Set up jsdom with `vi.useFakeTimers()`.
- [ ] **LIVE**: assert red-dot SVG present + session title rendered.
- [ ] **IMMINENT**: assert "Starts in N min" copy.
- [ ] **TODAY**: assert "Today at the conference" copy.
- [ ] **EVENT_SOON**: assert "JSNation in N days" copy.
- [ ] **HIDDEN**: assert component renders nothing (`container.firstChild === null`).
- [ ] Use a small inline `schedule` fixture (3 sessions: one past, one in 30 min, one in 6 hours, event start in 5 days).

**Files**:
- `components/client/HappeningNowBanner.test.tsx` — 5-case render test

---

## Out of Scope

- Banner state logic (lives in `lib/banner/state.ts`, already tested in TASK-03)
- E2E coverage of banner across states → TASK-08 covers happy path; banner states are unit-tested

---

## Technical Decisions

| Decision | Options Considered | Chosen | Reasoning |
|---|---|---|---|
| Tick interval | 15s, 30s, 60s | 30s | State boundaries are at-minute granularity; 30s gives ≤30s lag |
| `now` source | Render-time `new Date()`, `useEffect`-only | `new Date()` only inside `useEffect`, never in render | Avoids hydration mismatch |
| Schedule prop | Re-fetch on client, pass from server | Passed from server parent | Avoids second `getSchedule()` call on client |
| Animation | JS-driven, CSS keyframe | Pure CSS keyframe | No client JS for the pulse |
| Microcopy | Editable post-merge, frozen at merge | Frozen at PR-merge time | Avoid back-and-forth |

---

## Verify

```bash
pnpm test components/client/HappeningNowBanner.test.tsx
pnpm lint
pnpm dev
```

---

## Done

- [ ] All 5 render-state tests pass
- [ ] Banner mounted at top of `app/page.tsx` (Schedule route only, per brief §7.6)
- [ ] Schedule passed as server-to-client prop (no client re-fetch)
- [ ] `pnpm lint` clean
- [ ] Manual dev check confirms correct copy for current `Date`

---

## Refs

- Approved plan: §M6
- Design brief §7.6 (banner spec)

---

## Notes

_(execution-time observations go here)_

---

**Last Updated**: 2026-05-22
