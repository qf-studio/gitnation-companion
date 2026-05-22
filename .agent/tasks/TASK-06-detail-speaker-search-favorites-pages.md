# TASK-06: Detail / Speaker / Speakers-Index / Search / Saved Pages + Client Islands (M5)

**Status**: ⏸️ Blocked on TASK-04, TASK-05
**Created**: 2026-05-22
**Assignee**: Main thread
**Effort**: ~1 day (slight upgrade — adds Speakers index page)
**Prereqs**: [TASK-04](./TASK-04-favorites-store.md), [TASK-05](./TASK-05-schedule-page-app-shell.md)
**Blocks**: TASK-08

> **Design-handoff update (2026-05-22)**: Adds the **`/speakers` index page** (A–Z, sticky letter headers, jump bar) per the 4-tab nav. Renames the Favorites screen H1 + tab label to **"Saved"** (URL stays `/favorites`). Updates Speaker Profile to the radial-gradient hero + 88px avatar + extended social icon set per `system/design-handoff-2026-05-22.md` §5.3. Search drops type-filter chips and uses the empty-state surface from §5.5.

---

## Context

**Problem**:
Four RSC pages over the tested query layer plus two client islands that must respect the "one client folder" rule. The favorites page is the hydration-risk surface — localStorage is unavailable during SSR, so naive client filtering causes hydration mismatches or flash-of-empty content.

**Goal**:
Ship session detail, speaker profile, search, and favorites pages as RSCs. Solve the favorites hydration problem with a server-rendered grouped list + a per-card client gate (`<FavoritesGate />`) that hides non-favorited cards on mount. Provide `<FavoriteToggle />` for marking sessions.

---

## Acceptance Criteria

- [ ] `FavoriteToggle` button has `data-testid="favorite-toggle"` attribute
- [ ] `FavoriteToggle` tap uses the design-handoff press animation: `transform .15s cubic-bezier(.4,1.4,.6,1)`, scale to 0.82 on press, return to 1.0 on release
- [ ] Search empty state (no `q`) shows the 3 sections from handoff §5.5: "From your saved" (favorited SessionCards) → "Don't miss these" (keynote SessionCards) → "Browse tracks" (track-row buttons)
- [ ] `/speakers` index page renders with sticky A–Z letter headers and a right-edge jump bar
- [ ] `/favorites` H1 reads "Saved" (URL remains `/favorites`)
- [ ] Speaker Profile uses 88px avatar + radial-gradient tinted hero + extended social icon set (X / GitHub / Mastodon / Bluesky / LinkedIn / website — render only present ones)
- [ ] Search syncs `?q=<query>` to URL via `history.replaceState` from a client island (no scroll jump). Server reads `searchParams.q` for initial render. Refer to design handoff §1 (Q5/Q7 retained).
- [ ] `pnpm build` produces static HTML for all sessions + speakers + the `/speakers` index
- [ ] All 5 pages render correctly on phone profile
- [ ] `FavoriteToggle.test.tsx` green
- [ ] `FavoritesGate.test.tsx` green
- [ ] Hard-reload `/favorites` keeps favorited cards visible (manual check)
- [ ] `pnpm lint` clean (no `'use client'` leaked outside `components/client/`)
- [ ] Lighthouse mobile ≥95 on `/sessions/<slug>`, `/speakers/<nickname>`, and `/favorites`

---

## Implementation

### Phase 1: Session detail

**Goal**: Static per-session page per design handoff §5.2 — `PushHeader`, TrackChip + KindChip + optional LIVE indicator, large title, "When/Where" two-column card, SPEAKERS section, ABOUT (sanitized HTML), workshop-only block (capacity + prerequisites + Sign-up CTA), Resources block (Slides/Recording/Code/Live demo rows).

**Tasks**:
- [ ] Implement `generateStaticParams()` returning slugs from `listSessions()`.
- [ ] Render `<PushHeader>` with ← back link (`<Link href="/">`) and `<FavoriteStar sessionId={session.id} />` accessory.
- [ ] Render TrackChip + KindChip + (server-rendered) LiveDot placeholder. (Real "is currently live" recomputes on the client banner; on the detail page we can compute server-side from `now=Date.now()` build cache, or accept eventual consistency.)
- [ ] Render title (26/800, full wrap, no ellipsis).
- [ ] Render "When/Where" card per handoff §5.2: left WHEN (time range mono + day name, local TZ via `Intl.DateTimeFormat`), right WHERE (room + capacity), 0.5px vertical divider.
- [ ] Render SPEAKERS section: surface card containing `SpeakerRow`s (linked to `/speakers/<nickname>`).
- [ ] Render ABOUT section: 11/700 uppercase label + `<Abstract html={session.abstract} />`.
- [ ] If `kind === 'workshop'`: render workshop block (capacity + prerequisites text + brand-color "Sign up" CTA button, `target="_blank"` to ticketing URL when available).
- [ ] If resources present: render Resources rows for Slides / Recording / Code repo / Live demo.
- [ ] Render TagPills at the bottom — tags appear here (NOT on the Schedule card per handoff §1).

**Files**:
- `app/sessions/[slug]/page.tsx` — session detail RSC
- `components/server/PushHeader.tsx` — frosted-glass detail header with back + accessory slot

### Phase 2: Speaker profile

**Goal**: Static per-speaker page per design handoff §5.3 — radial-gradient tinted hero, 88px avatar, name + tagline + company/location, extended social-icon row, BIO, SESSIONS list (full SessionCards with `showDay`).

**Tasks**:
- [ ] Implement `generateStaticParams()` returning nicknames from `listSpeakers()`.
- [ ] Render transparent `<PushHeader>` (no border) with ← back.
- [ ] Render hero block: `radial-gradient(circle at 50% -20%, tint22 0%, transparent 60%)` where `tint` is derived per-speaker (deterministic hash of nickname → HSL). Centered 88px `<Avatar>` (Cloudinary `<img>` with initials fallback).
- [ ] Render name (26/800), tagline (13.5/500 muted), `company · location` (13/muted).
- [ ] Render `<SocialIconRow>`: 36×36 square pills (radius 10, border 0.5px). Icons for X / GitHub / Mastodon / Bluesky / LinkedIn / website — render only those present in `speaker.social.*` (skip absent).
- [ ] Render BIO section: 11/700 label + `<Abstract html={bio} />`.
- [ ] Render SESSIONS section using `getSessionsForSpeaker()` → full SessionCards with `showDay` flag.

**Files**:
- `app/speakers/[nickname]/page.tsx` — speaker profile RSC
- `components/server/SocialIconRow.tsx` — renders 6 supported social pills, skips absent

### Phase 2.5: Speakers index (`/speakers`)

**Goal**: Top-level tab — alphabetical speaker browse with sticky letter headers and A–Z jump bar. Per design handoff §5.4.

**Tasks**:
- [ ] Build `app/speakers/page.tsx` RSC.
- [ ] Render `<ScreenHeader title="Speakers" subtitle="{N} speakers" />`.
- [ ] Compute `Map<string, Speaker[]>` keyed by first-letter of `lastName ?? name`. Sort speakers within each letter by full name. Sort letter keys A-Z; omit letters with 0 speakers.
- [ ] For each letter group:
  - Sticky letter header (frosted-glass backdrop, 11/700 upper, padding 8px 16px, `id={`letter-${letter}`}`).
  - Surface card (radius 14, border 0.5px) containing `<SpeakerRow>`s linked to `/speakers/<nickname>`.
- [ ] Render right-edge `<AZJumpBar>`: absolute right: 2px, top: 50%, translateY(-50%). 10/600 letters, each `<a href="#letter-X">`. Smooth scroll via CSS `scroll-behavior: smooth`.

**Files**:
- `app/speakers/page.tsx` — speakers index RSC
- `components/server/AZJumpBar.tsx` — fixed-position A–Z anchor list
- `components/server/SpeakerRow.tsx` — name + tagline row (also used in session detail SPEAKERS section)

### Phase 3: Search

**Goal**: Indexable, URL-shareable search page per design handoff §5.5. RSC server-renders initial state from `searchParams.q`; a small client island syncs the input value back to the URL via `replaceState` (no scroll jump) for live filtering as the user types.

**Tasks**:
- [ ] Build `app/search/page.tsx` RSC reading `searchParams.q` (string) and `searchParams.kind` (`'workshop'|'talk'|undefined` — used by the "Browse all talks" link target from TASK-05).
- [ ] Render `<SearchInput defaultValue={q}>` — client island. Input has `name="q"`, autofocus on mount. ✕ clear button when value present (24×24 circle in `--chip-bg`).
- [ ] On client `onChange`: call `history.replaceState(null, '', /search?q=...)`. RSC re-renders via Next.js streaming on navigation; alternatively, render results client-side from a serialized `Schedule` prop. Pick the simpler approach in PR: option A is `<form>`-driven server-render-per-keystroke (works no-JS, slow), option B is full client filter (no-JS broken). Recommend **hybrid**: server-render initial query, client island filters for subsequent keystrokes from a serialized schedule.
- [ ] Empty `q` state (handoff §5.5):
  - "Recent" pills section (read from `localStorage.recents`, client-only; absent on server first paint).
  - "From your saved" — favorited SessionCards (read favorites store, client island).
  - "Don't miss these" — keynote SessionCards from `schedule.sessions.filter(kind='keynote')`.
  - "Browse tracks" — full-width track-row buttons listing all tracks; tap → `/search?q=<track-name>`.
- [ ] Active `q` state: results grouped into "Sessions · N" / "Speakers · N" / "Tracks · N" sections, each containing matching cards/rows. Use the `search()` query from TASK-03.

**Files**:
- `app/search/page.tsx` — search RSC
- `components/client/SearchInput.tsx` — autofocus input + URL `replaceState` sync + ✕ clear

### Phase 4: Saved (`/favorites`, H1 "Saved", hydration-safe)

**Goal**: Server-render full grouped session list; client gate hides non-favorited cards on mount — no hydration mismatch, no flash-of-empty. Per handoff §5.6, the screen H1 reads "Saved" (the URL remains `/favorites` for shareability/back-compat with brief).

**Tasks**:
- [ ] Build RSC that renders `<ScreenHeader title="Saved" subtitle="{N} sessions starred" />` (`N` is server-rendered as a placeholder `0`; client island updates after mount).
- [ ] Render the FULL grouped session list (same query as schedule page, but include all dated sessions), each card wrapped in `<FavoritesGate sessionId={id}>...</FavoritesGate>`.
- [ ] Render `<FavoritesSkeleton />` block above the list (server-rendered).
- [ ] `<FavoritesGate />` client island reads localStorage on mount, hides children if `sessionId` isn't favorited, AND on first effect signals readiness to remove the skeleton (via a shared `<FavoritesReady />` client component or a CSS class flip on `<body>`). Document the choice in PR.
- [ ] Empty state (handoff §5.6): centered EmptyState icon (radius 18 surface container) + title "No sessions saved yet" + body "Tap the star on any session on the Schedule to keep it here. Your list survives the conference closing the venue WiFi."
- [ ] Confirm no hydration mismatch: server renders all cards; client hides the non-favorited ones. Worst case: ~200ms flicker showing all cards before the gate clamps down.

**Files**:
- `app/favorites/page.tsx` — saved RSC (H1: "Saved")
- `components/server/FavoritesSkeleton.tsx` — server-rendered loading block
- `components/server/EmptyState.tsx` — reusable empty-state composition

### Phase 5: Client islands

**Goal**: Client components for interactive UI in `components/client/` — the only client folder allowed. Already in `components/client/` from TASK-05: `BottomNav.tsx`. Added here: `FavoriteStar.tsx` (renamed from `FavoriteToggle` to match handoff §4 naming), `FavoritesGate.tsx`, `FavoritesCount.tsx`, `SearchInput.tsx`.

**Tasks**:
- [ ] `FavoriteStar.tsx` (handoff §4 — design uses ★ star, not ♥ heart):
  - `'use client'`.
  - Props: `sessionId: number; size?: 22 | 26`.
  - State: `isFav` derived from store via `useFavorite(sessionId)` hook (TASK-04).
  - Renders an SVG star. Stroke + fill swap based on `isFav` using CSS vars `--star-on` / `--star-off`. Both `fill` and `transform` use `transition: .15s`.
  - Press animation: on `pointerdown` add class `pressed` (scale 0.82); on `pointerup`/`pointercancel`/`pointerleave` remove; `transition: transform .15s cubic-bezier(.4,1.4,.6,1)`.
  - **Add `data-testid="favorite-toggle"`** (retained ID for E2E back-compat) to the button root.
  - 6px hit-target padding (extends to ~34px touch area).
- [ ] `FavoritesGate.tsx`: unchanged behavior from prior spec. Render `children` only when `mounted && isFavorite(sessionId)`.
- [ ] `FavoritesCount.tsx`: small client island used in `<ScreenHeader>` subtitle on `/favorites` and in `BottomNav` Saved-tab badge. Reads count from store; renders `{count} sessions starred` or `{count}` digit.
- [ ] `SearchInput.tsx` (Phase 3): autofocus on mount, two-way bind to URL via `replaceState` (no scroll). ✕ clear sets `q=""` and refocuses.
- [ ] Write `components/client/FavoriteStar.test.tsx` (jsdom). 3 cases:
  1. Click flips internal state and localStorage.
  2. External `toggle()` call updates the rendered button (via subscription).
  3. Initial render reflects existing localStorage state.
- [ ] Write `components/client/FavoritesGate.test.tsx` — 1 case: renders `null` pre-mount, renders `children` only when subscribed and favorited.

**Files**:
- `components/client/FavoriteStar.tsx` — star toggle client island (★ SVG)
- `components/client/FavoritesGate.tsx` — per-card visibility gate
- `components/client/FavoritesCount.tsx` — count badge / subtitle
- `components/client/SearchInput.tsx` — search input with URL sync
- `components/client/FavoriteStar.test.tsx` — jsdom unit tests
- `components/client/FavoritesGate.test.tsx` — jsdom unit test

---

## Out of Scope

- Happening Now banner client island → TASK-07
- E2E + quality gate → TASK-08

---

## Technical Decisions

| Decision | Options Considered | Chosen | Reasoning |
|---|---|---|---|
| Search input pattern | Server `<form>` only, client island with URL sync, full client filter | **Client island + URL sync** | Per-keystroke server round-trip is too slow for 58 items; client filter on serialized schedule is instant; URL sync preserves shareability |
| Search filter chips | Type-switch chips (brief), no chips (design), tag chips | **No chips** (per design handoff §1) | Design surfaces tracks + saved + keynotes in the empty state instead — richer than a 4-button toggle |
| Favorite icon | ♥ heart (brief), ★ star (design) | **★ star** | Per design handoff §4 (`FavoriteStar`, `--star-on` token). Brief used ♥; design uses ★ throughout |
| Favorites pattern | Client-only render vs. server-list + client-gate | Server-list + client-gate | Avoids flash-of-empty; hydration-safe |
| Static params | On-demand vs. pre-render all detail pages | Yes for sessions + speakers (and speakers index is a single route) | Build-time render of all detail pages |
| Sanitize-html allowlist | Permissive vs. minimal | `p, br, strong, em, a, ul, ol, li, code, pre` | Matches upstream content shape |
| `/favorites` H1 | "Favorites" (brief), "Saved" (design) | **"Saved"** | Per design handoff §2. URL stays `/favorites` (brief locked it; back-compat). Same with the BottomNav label |
| Speaker socials | Twitter/Bluesky/GitHub (brief), +Mastodon/LinkedIn/website (design) | **6 supported** | Per design handoff §4.12. Render only present ones; absent links omitted |
| Avatar size on profile | 96px (brief), 88px (design) | **88px** | Per design handoff §4.5 |

---

## Verify

```bash
pnpm build
pnpm lint
pnpm test components/client/FavoriteStar.test.tsx
pnpm test components/client/FavoritesGate.test.tsx
```

---

## Done

- [ ] `pnpm build` produces static HTML for all sessions + speakers + `/speakers` index
- [ ] All 5 pages (session detail / speaker profile / speakers index / search / saved) render correctly on phone profile
- [ ] `FavoriteStar.test.tsx` green (3 cases)
- [ ] `FavoritesGate.test.tsx` green (1 case)
- [ ] `/favorites` H1 reads "Saved"
- [ ] `/speakers` shows A–Z grouped speakers with sticky letter headers and right-edge jump bar
- [ ] Speaker Profile uses 88px avatar, radial-gradient hero, 6-social icon row (only present ones)
- [ ] Search URL sync works: typing updates `?q=`; back/forward navigation restores query
- [ ] Hard-reload `/favorites` keeps favorited cards visible (manual check)
- [ ] `pnpm lint` clean (no `'use client'` leaked outside `components/client/`)
- [ ] Lighthouse mobile ≥95 on `/sessions/<slug>`, `/speakers/<nickname>`, `/speakers`, `/favorites`

---

## Refs

- Approved plan: `/Users/aleks.petrov/.claude/plans/let-s-plan-complete-execution-velvet-stallman.md` §M5
- Design brief §7.2, §7.3, §7.4, §7.5 — **superseded by** `system/design-handoff-2026-05-22.md` §5
- **Design handoff** — authoritative for screen layouts, component specs, and IA decisions in this task

---

## Notes

_(execution-time observations go here)_

---

**Last Updated**: 2026-05-22 (design handoff: +Speakers index page, "Saved" H1, ★ star icon, 88px avatar, 6 social icons, search URL sync)
