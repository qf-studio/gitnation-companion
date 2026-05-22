# TASK-02: Snapshot Pipeline + Normalize (M1, TDD)

**Status**: 🟡 Ready (TASK-01 ✅)
**Created**: 2026-05-22
**Assignee**: Worker subagent
**Effort**: ~half day
**Prereqs**: [TASK-01](./TASK-01-scaffold-and-data-layer.md)
**Blocks**: TASK-03, TASK-05

---

## Context

**Problem**:
Upstream GitNation JSON has rough edges: superjson-tagged dates, category-as-integer (`0`=talk, `2`=workshop), speakers duplicated between `users[]` (inline on content) and top-level `speakers[]` with asymmetric field sets, orphan speakers in **both directions** (referenced but missing, AND present but unreferenced), undated talks. Nothing downstream can safely render against this raw shape.

**Goal**:
Produce ONE normalization function that flattens upstream JSON into the four `Schedule` types in the brief, locked behind tests before any UI consumes it. Delivered as a pure-logic, TDD module per `CLAUDE.md` delegation rules.

---

## Acceptance Criteria

- [ ] `pnpm test lib/data` green (≥10 cases covering all 5 edge cases + dedupe + date)
- [ ] `data/__fixtures__/raw-gitnation.min.json` + `expected-normalized.json` committed
- [ ] `pnpm refresh:snapshot` runs end-to-end against live gitnation
- [ ] Real `data/schedule.snapshot.json` committed (58 sessions, 58 speakers, 10 dated)
- [ ] `pnpm build` succeeds offline (snapshot is sole data source at build time)
- [ ] No `any` types without justification comment

---

## Implementation

TDD order is strict across phases:
1. Write fixture + expected-normalized (Phase 1)
2. Write schema test → schema fails → implement schema → green (Phase 2)
3. Write normalize test → normalize fails → implement normalize → green (Phase 3)
4. Write refresh script (no test; manual run) (Phase 4)
5. Write loader — trivial, no separate test, covered by build succeeding (Phase 5)
6. Run real refresh and commit snapshot (Phase 6)

### Phase 1: Fixture (~30 min)

**Goal**: Hand-curate a minimum raw + expected-normalized pair covering all 5 edge cases.

**Tasks**:
- [ ] Curate raw fixture (~500 lines) from `/tmp/jsnation.json` covering EVERY edge case verified to exist in live data:
  - Session with `startDate: null` AND `format: null` (undated talk — 48/58 of live data)
  - Session with `startDate` + `format: "InPerson"` (3/58 live) AND `format: "Remote"` (7/58 live)
  - Session with `tags: []` (2/58 live)
  - Session with 2 speakers in `users[]` (5/58 live — joint talks)
  - Speaker with `bluesky: null` and speaker with non-null `bluesky`
  - Speaker with `Company.logo: null` and one with non-null logo
  - **Orphan direction A**: session.users[] references a speaker id NOT in top-level `speakers[]` (live: `mikkel_malmberg` id 158469 on session `no-servers-no-cloud-no-masters-make-p2p-apps`)
  - **Orphan direction B**: top-level `speakers[]` entry with no session referencing them (live: `oron_morad` id 158211)
  - Defensive (no live occurrence but tolerate): session with empty `users[]`, session with `text: null` / missing
- [ ] Hand-write golden `Schedule` output as the contract, kept in version control

**Files**:
- `data/__fixtures__/raw-gitnation.min.json` — hand-curated minimum raw input
- `data/__fixtures__/expected-normalized.json` — golden `Schedule` output contract

### Phase 2: Schema (TDD)

**Goal**: Zod schemas for `Event`, `Session`, `Speaker`, `Schedule` with types exported via `z.infer`.

**Tasks**:
- [ ] Write `lib/data/schema.test.ts` asserting Zod schemas accept `expected-normalized.json` (clean fixture)
- [ ] Assert schema rejects snapshot with missing required field (`event` absent)
- [ ] Assert schema rejects snapshot with wrong type (e.g., `sessions[].startsAt: number`)
- [ ] Implement `lib/data/schema.ts` to turn the test suite green

**Files**:
- `lib/data/schema.test.ts` — Zod acceptance + rejection cases
- `lib/data/schema.ts` — Zod schemas for `Event`, `Session`, `Speaker`, `Schedule`; types via `z.infer`

### Phase 3: Normalize (TDD)

**Goal**: `normalize(raw: unknown): Schedule` that handles every edge case in the fixture.

**Tasks**:
- [ ] Write `lib/data/normalize.test.ts` as table-driven tests against the fixture
- [ ] Cover: `category: 0` → `kind: "talk"`; `category: 2` → `kind: "workshop"`
- [ ] Cover: `startDate: null` → `startsAt: null, endsAt: null`
- [ ] Cover: `format: "InPerson" | "Remote" | null` preserved verbatim
- [ ] Cover: date parsing via `new Date(c.startDate)` directly (no `superjson` dep)
- [ ] Cover: speaker enrichment — top-level `speakers[]` is source of truth (only place with `bluesky` + `Company`); enrich by `id`
- [ ] Cover: speaker back-link — IGNORE `speakers[].contents[]` (title-only, no id/slug); build `sessionIds` by scanning `sessions[].users[]` grouped by speaker id
- [ ] Cover: **orphan direction A** — speaker id in `session.users[]` not in `speakers[]` → synthesize speaker from the embedded `SessionUser` shape with `bluesky: null`, `Company: null`
- [ ] Cover: **orphan direction B** — speaker in `speakers[]` not referenced by any session → kept with `sessionIds: []`
- [ ] Cover: missing `text` → `abstractHtml: ""` (defensive — live data always populates `text`)
- [ ] Cover: `users[]` empty → `speakerIds: []`, no throw (defensive — live data has ≥1 speaker per session)
- [ ] Implement `lib/data/normalize.ts` to turn the test suite green

**Files**:
- `lib/data/normalize.test.ts` — table-driven edge-case suite
- `lib/data/normalize.ts` — `normalize(raw: unknown): Schedule`

### Phase 4: Refresh script (I/O, no unit tests)

**Goal**: Runnable script that pulls upstream, normalizes, and writes snapshot files.

**Tasks**:
- [ ] Fetch `https://gitnation.com/events` (any event-listing page)
- [ ] Extract `buildId` via regex `/"buildId":"([^"]+)"/`; throw if missing
- [ ] Fetch `https://gitnation.com/_next/data/<buildId>/events/jsnation-2026.json`; on non-200 log + exit 0 (keep snapshot)
- [ ] Validate raw with Zod (input shape), normalize, validate output with `ScheduleSchema`
- [ ] Write `data/upstream/jsnation-2026.raw.json` AND `data/schedule.snapshot.json`
- [ ] Log diff summary: `+2 sessions, +1 speaker, 0 removed`

**Files**:
- `scripts/refresh-snapshot.ts` — runnable via `tsx`
- `data/upstream/jsnation-2026.raw.json` — raw upstream output (written by script)
- `data/schedule.snapshot.json` — normalized snapshot (written by script)

### Phase 5: Loader

**Goal**: Single entry point that parses the committed snapshot at module load and dedupes across the RSC tree.

**Tasks**:
- [ ] Implement loader that imports `data/schedule.snapshot.json`, runs `ScheduleSchema.parse`, and wraps in `cache()`
- [ ] Parse-on-load ensures upstream schema drift fails the build loudly

**Files**:
- `lib/data/index.ts` — exports `getSchedule = cache(() => ScheduleSchema.parse(snapshot))`

Reference implementation:
```ts
import { cache } from 'react';
import snapshot from '@/data/schedule.snapshot.json';
import { ScheduleSchema } from './schema';

export const getSchedule = cache(() => ScheduleSchema.parse(snapshot));
```

### Phase 6: Real snapshot

**Goal**: Replace the fixture-only snapshot with a real upstream pull and commit it.

**Tasks**:
- [ ] Run `pnpm refresh:snapshot` against live gitnation
- [ ] Commit resulting `data/schedule.snapshot.json` and `data/upstream/jsnation-2026.raw.json`

**Files**:
- `data/schedule.snapshot.json` — committed real snapshot
- `data/upstream/jsnation-2026.raw.json` — committed real raw upstream

---

## Out of Scope

- Query functions (`getSessionBySlug`, `groupByDay`, etc.) → TASK-03
- Banner state machine → TASK-03
- Sanitization of `abstractHtml` (deferred to render-time in TASK-06)
- Vercel cron for refresh → TASK-09 (uses GitHub Action instead)

---

## Technical Decisions

| Decision | Options Considered | Chosen | Reasoning |
|---|---|---|---|
| Validation library | Zod, Yup, io-ts, hand-rolled guards | Zod | Single dep, runtime + types, fails loud on upstream drift |
| Date parsing | Native `Date` from ISO, `superjson` decode, `date-fns` parse | Native `Date` from ISO strings | Superjson tags are decorative; values are already valid ISO |
| Refresh failure mode | Throw and fail CI, exit 0 keep snapshot, retry with backoff | Exit 0, keep snapshot | CI must never fail because upstream is flaky |
| Snapshot commit | Commit snapshot, fetch at build time only, fetch at runtime | Yes, commit snapshot | Deterministic builds, offline-friendly |
| Normalizer location | `scripts/`, `lib/data/normalize.ts`, inline in loader | `lib/data/normalize.ts` | Shared between loader and refresh script |
| `cache()` wrap | Wrap in `cache()`, plain function, module-level memo | Yes, `cache()` wrap | Avoids re-parsing across RSC tree |

---

## Verify

```bash
pnpm test lib/data
pnpm refresh:snapshot
pnpm build
```

---

## Done

- [ ] Fixture pair (`raw-gitnation.min.json` + `expected-normalized.json`) committed
- [ ] `lib/data/schema.ts` + `lib/data/schema.test.ts` committed and green
- [ ] `lib/data/normalize.ts` + `lib/data/normalize.test.ts` committed and green (≥10 cases)
- [ ] `scripts/refresh-snapshot.ts` runs end-to-end against live gitnation
- [ ] `lib/data/index.ts` exposes `getSchedule()` via `cache()`
- [ ] Real `data/schedule.snapshot.json` committed (58 sessions, 58 speakers, 10 dated)
- [ ] `pnpm build` succeeds offline against the committed snapshot
- [ ] No `any` types without justification comment

---

## Refs

- Approved plan: `/Users/aleks.petrov/.claude/plans/let-s-plan-complete-execution-velvet-stallman.md` §M1
- Marker `.agent/.context-markers/before-compact-2026-05-22-design-brief.md` (data findings)
- `/tmp/jsnation.html` + `/tmp/jsnation.json` (cached upstream from 2026-05-22 discovery)
- Upstream Data Contract section below (verified live 2026-05-22)

---

## Notes

_(execution-time observations go here)_

---

## Upstream Data Contract (verified live 2026-05-22)

### Discovery procedure

```bash
# 1. Fetch the event page; buildId rotates on every gitnation.com deploy
curl -sS -A "Mozilla/5.0" https://gitnation.com/events/jsnation-2026 \
  | grep -oE '"buildId":"[^"]+"' | head -1
# → "buildId":"zzC8XrROosHW2Ztz8U0uG"  (example; will differ)

# 2. Fetch the JSON
curl -sS -A "Mozilla/5.0" \
  "https://gitnation.com/_next/data/<buildId>/events/jsnation-2026.json"
```

Response: HTTP 200, ~205 KB. Envelope: `{ pageProps: {...}, __N_SSG: true }`.

### `pageProps` branches (live counts)

| Key | Type | Count | Action |
|---|---|---|---|
| `event` | object | 1 | keep (subset, see below) |
| `contents` | array | **58** | sessions — primary entity |
| `speakers` | array | **58** | speakers — primary entity |
| `tags` | array | 20 | keep (id+label+slug, source of truth for tag enrichment) |
| `attendees` | `{ attendees: [34]; totalCount }` | — | **drop** |
| `partnersOnEvent` | array | 14 | **drop** |
| `lang`, `tab` | `null` | — | **drop** |
| `_superjson` | `{ values: Record<path, ['Date'\|'undefined']> }` | — | **drop** — type-revival overlay only; dates already valid ISO |

### `Session` (== `contents[i]`) — full key union across all 58

`access, category, duration, endDate, event, featured, format, id, image, isTop, localizations, promotedUntil, publishDate, slug, startDate, subcategory, summary, tags, text, title, users, videoUrl`

**Keep**: `id, slug, title, text, duration, format, startDate, endDate, tags, users, category` (the last one drives `kind: "talk" | "workshop"`).
**Drop**: `access, subcategory, featured, isTop, image, views, localizations, summary, videoUrl, publishDate, promotedUntil, event` (event nesting is redundant — we already have the parent event).

#### Verified distributions

| Field | Distribution |
|---|---|
| `category` | `0 × 48` (talk), `2 × 10` (workshop) |
| `format` | `null × 48`, `Remote × 7`, `InPerson × 3` |
| `startDate` non-null | 10/58 — **perfectly correlated** with `format !== null` |
| `users.length` | `1 × 53`, `2 × 5` |
| `tags.length` | `0 × 2`, `1 × 47`, `2 × 8`, `3 × 1` |

### `SessionUser` (inline speaker on a session) — keys

`id, nickname, name, avatar, company, location, bio, shortBio, github, twitter, twitterFollowers, superpower, mentorship`

**Missing** vs top-level `Speaker`: `bluesky`, `Company`.

### `Speaker` (== `speakers[i]`) — keys

`id, nickname, name, avatar, company, location, bio, github, twitter, bluesky, twitterFollowers, mentorship, Company, contents`

- `Company`: `{ name, logo: string | null } | null`
- `contents`: `{ title: string }[]` — **TITLE ONLY, no id/slug — useless for back-linking. Build the back-link by scanning `sessions[].users[]`.**

### `Tag` (top level) — keys

`{ id: number, label: string, slug: string }` — session-embedded tags only carry `{ label, slug }`; join by `slug` to enrich with `id`.

### `Event` — keep subset

`id, name, slug, description, startDate, endDate, location, hashtag, discordUrl, domain, tagline, logo, noExactDate, isRegistrationOpen, ticketsURL`

**Drop**: `brand, partners, scheduleTracks, ticketTypes, showLockPriceButton, cfp*, scholarship*, gmapUrl, attendeeGuideUrl, cityGuideUrl, networkingActivitiesUrl, descriptionEs, speakersExpected, attendeesExpected, sharedTextTemplate`.

### Verified invariants

| Invariant | Status |
|---|---|
| `session.slug` unique non-null | ✅ 58/58 |
| `speaker.nickname` unique non-null | ✅ 58/58 |
| `format !== null` ⇔ `startDate !== null` | ✅ 0 mismatches |
| Every `session.users[i].id` resolves in `speakers[]` | ⚠️ **1 orphan**: `mikkel_malmberg` (id 158469) referenced by `no-servers-no-cloud-no-masters-make-p2p-apps` |
| Every `speaker.id` referenced by ≥1 session | ⚠️ **1 orphan**: `oron_morad` (id 158211) — present, unreferenced |

### Type-revival note

`_superjson.values` maps paths like `event.startDate → ['Date']` and `event.ticketTypes → ['undefined']`. These are revival hints for the official `superjson.deserialize` API. **We do not deserialize.** All `Date`-tagged fields are already valid ISO strings (`"2026-06-10T12:00:00.000Z"`) and `'undefined'`-tagged fields are already missing/null in the JSON payload. Treat the overlay as cosmetic and discard at the normalize boundary.

---

**Last Updated**: 2026-05-22 (data contract verified live)
