# TASK-03: Query Layer + Banner State Machine (M2, TDD)

**Status**: ⏸️ Blocked on TASK-02
**Created**: 2026-05-22
**Assignee**: Worker subagent
**Effort**: ~half day
**Prereqs**: [TASK-02](./TASK-02-snapshot-pipeline-normalize.md)
**Blocks**: TASK-05, TASK-07
**Parallel-safe with**: [TASK-04](./TASK-04-favorites-store.md) (disjoint directories)

---

## Context

**Problem**:
Pages should not contain query logic. Without a named, pure query layer, every screen ends up re-implementing lookups and grouping over `Schedule`, and the banner's timezone math leaks into UI components.

**Goal**:
Provide a small set of named, pure queries (`getSessionBySlug`, `groupByDay`, `searchAll`, `computeBannerState`) over `Schedule` — tested once, trusted forever. Isolate the banner state machine as a `(now, schedule) → State` reducer so the eventual client component is a 30-line render of a typed union.

---

## Acceptance Criteria

- [ ] `pnpm test lib/queries lib/banner` green
- [ ] Coverage ≥95% line on `lib/queries/**` and `lib/banner/**` (`pnpm test --coverage`)
- [ ] Both banner states (`live`, `upcoming`) + `hidden` + 3 boundary cases + 1 TZ regression tested
- [ ] No `Date.now()` inside `lib/banner/state.ts`
- [ ] Diacritics folding works for search (Latin + Cyrillic fixtures). Transliteration is explicitly NOT required.

> **Design-handoff update (2026-05-22)**: Banner reduced from 5 states (LIVE/IMMINENT/TODAY/EVENT_SOON/HIDDEN) to **2 active states + hidden** per `system/design-handoff-2026-05-22.md` §4.2. Phase 5 below reflects the new spec; the older 5-state matrix is removed.

---

## Implementation

### Phase 1: Sessions

**Goal**: Pure session lookup + filtering over `Schedule`.

**Tasks**:
- [ ] Write `lib/queries/sessions.test.ts`:
  - `getSessionBySlug(schedule, slug)` returns matching `Session` or `undefined`.
  - `listSessions(schedule, { dated?: boolean, kind?: "workshop" | "talk" })` filters correctly.
  - Slug collision: two sessions with same title get distinct slugs (assert via fixture).
- [ ] Implement `lib/queries/sessions.ts`.

**Files**:
- `lib/queries/sessions.test.ts` — TDD spec for session lookup/filter
- `lib/queries/sessions.ts` — implementation

### Phase 2: Speakers

**Goal**: Pure speaker lookup + reverse session lookup.

**Tasks**:
- [ ] Write `lib/queries/speakers.test.ts`:
  - `getSpeakerByNickname(schedule, nickname)`.
  - `listSpeakers(schedule)` returns all, sorted by name.
  - `getSessionsForSpeaker(schedule, speakerId)` returns sessions where `speakerIds` includes id.
- [ ] Implement `lib/queries/speakers.ts`.

**Files**:
- `lib/queries/speakers.test.ts` — TDD spec for speaker queries
- `lib/queries/speakers.ts` — implementation

### Phase 3: Schedule grouping

**Goal**: Day-bucketed, chronologically ordered schedule view.

**Tasks**:
- [ ] Write `lib/queries/schedule.test.ts`:
  - `groupByDay(schedule)` returns `Array<{ dayKey: string; sessions: Session[] }>`.
  - Days ordered chronologically (not insertion order).
  - Undated sessions bucketed under `dayKey: "TBA"`, placed last.
  - Sessions within a day sorted by `startsAt` ascending.
- [ ] Implement `lib/queries/schedule.ts`.

**Files**:
- `lib/queries/schedule.test.ts` — TDD spec for day grouping
- `lib/queries/schedule.ts` — implementation

### Phase 4: Search

**Goal**: Weighted, diacritic-folded substring search over titles/speakers/tags.

**Tasks**:
- [ ] Write `lib/queries/search.test.ts`:
  - Case-insensitive substring matching.
  - Diacritics folded (`café` matches `cafe`).
  - Weighted: title (3x), speaker names (2x), tag labels (1x). Score determines order.
  - Cyrillic fixture (e.g., session by speaker "Алексей Петров") asserts normalization works for non-Latin.
  - Returns `SearchHit[]` with `{ session, score, matchedField }`.
- [ ] Implement `lib/queries/search.ts`. Use `String.prototype.normalize('NFD').replace(/\p{Diacritic}/gu, '')` for folding.

**Files**:
- `lib/queries/search.test.ts` — TDD spec for weighted search
- `lib/queries/search.ts` — implementation

### Phase 5: Banner state machine

**Goal**: Pure `(now, schedule) → BannerState` reducer. **2 active states + hidden** per design handoff §4.2.

**State shape** (discriminated union):
```ts
type BannerState =
  | { kind: 'live'; session: Session; minutesRemaining: number }
  | { kind: 'upcoming'; session: Session; minutesUntil: number }
  | { kind: 'hidden' };
```

**Tasks**:
- [ ] Write `lib/banner/state.test.ts` covering the full matrix:
  - **`live`**: `now ∈ [session.startsAt, session.endsAt]` → `{ kind: 'live', session, minutesRemaining }`. If multiple overlap, pick the one that ends soonest (most-imminent-end wins).
  - **`upcoming`**: `now` is before some session's `startsAt`, and that session starts **within 6 hours** → `{ kind: 'upcoming', session, minutesUntil }`. Pick the next-to-start session.
  - **`hidden`**: no live session AND no session starts within 6h → `{ kind: 'hidden' }`.
  - **Boundary — exact start**: at `now === session.startsAt`, state is `live`, not `upcoming` (inclusive of start).
  - **Boundary — exact end**: at `now === session.endsAt`, state is `live` (inclusive of end). Second after end with no other live session → falls through to upcoming/hidden.
  - **Boundary — 6h mark**: exactly 6h before next start → `upcoming`. 6h + 1s → `hidden`.
  - **TZ regression**: `now = "2026-06-12T11:00:00Z"` (13:00 Amsterdam, conference) with a session at 13:30 Amsterdam → `upcoming` with `minutesUntil = 30`. Confirms reducer uses absolute UTC timestamps, NOT local-clock comparisons. **The prototype hardcoded `Europe/Amsterdam` formatting; the reducer must operate on UTC math and only format for display.**
  - **Injection**: `now` is always a function parameter, never `new Date()` internally. Tests do not need `vi.useFakeTimers()` for this module.
- [ ] Implement `lib/banner/state.ts` — `computeBannerState(now: Date, schedule: Schedule): BannerState`.

**Files**:
- `lib/banner/state.test.ts` — TDD spec for the 2-state machine
- `lib/banner/state.ts` — implementation of `computeBannerState`

---

## Out of Scope

- UI rendering (banner component → TASK-07)
- Page wiring (`generateStaticParams`, etc.) → TASK-05, TASK-06
- localStorage / favorites store → TASK-04
- Fuzzy search / transliteration (only diacritics folding is required)

---

## Technical Decisions

| Decision | Options Considered | Chosen | Reasoning |
|---|---|---|---|
| Diacritics folding | `String.normalize('NFD')`, third-party lib (e.g. `diacritics`), custom map | `String.normalize('NFD')` | Built-in, no library |
| Search ranking | Fuzzy (Fuse.js), weighted substring, plain substring | Weighted substring | 58 items — fuzzy is overkill, scoring keeps relevance |
| Banner TZ source | Reducer compares UTC timestamps; only display-side formatting uses a timezone (user's local TZ per brief §11.1) | UTC math in reducer | Prototype's hardcoded `Europe/Amsterdam` was display-only and confused state logic; keep concerns separate |
| Banner reducer purity | `now` as parameter, `new Date()` internal, fake timers | `now` as parameter | Trivially testable, no fake timers needed |
| Banner state count | 5 (brief §7.6), 2 (design handoff), 3 (compromise) | **2 active + hidden** | Per locked decision 2026-05-22; matches design handoff §4.2 |
| Upcoming horizon | 60 min (brief), 6h (design), event-wide | **6h** | Per design handoff §4.2 |
| Live boundary inclusivity | Inclusive at both ends, exclusive at start | Inclusive at both ends | A session exactly at its start time IS live |
| BannerState shape | Discriminated `kind` union, separate booleans, class hierarchy | Discriminated `kind` union | TypeScript exhaustiveness in render |

---

## Verify

```bash
pnpm test lib/queries lib/banner
pnpm test --coverage
```

---

## Done

- [ ] `pnpm test lib/queries lib/banner` green
- [ ] Coverage ≥95% line on `lib/queries/**` and `lib/banner/**`
- [ ] Both banner states (`live`, `upcoming`) + `hidden` + 3 boundary cases + 1 TZ regression have named test cases
- [ ] No `Date.now()` inside `lib/banner/state.ts`
- [ ] Cyrillic-fixture search test passes (diacritics folding verified for non-Latin)

---

## Refs

- Approved plan: `/Users/aleks.petrov/.claude/plans/let-s-plan-complete-execution-velvet-stallman.md` §M2
- Design brief §7.6 (superseded — see handoff below)
- **Design handoff §4.2** — `system/design-handoff-2026-05-22.md` (authoritative banner spec: 2 states, 6h horizon, app-root mount)

---

## Notes

_(execution-time observations go here)_

---

**Last Updated**: 2026-05-22 (design handoff: banner reduced to 2 states + hidden)
