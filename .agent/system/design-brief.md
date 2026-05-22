# Design Brief — GitNation Conference Companion (JSNation 2026)

**Status**: v1 + 2026-05-22 design handoff applied
**Date**: 2026-05-22
**Owner**: Aleks Petrov
**Scope**: Mobile-first web app for JSNation 2026 attendees, deployed as a static-first Next.js site.

> **2026-05-22 — Design handoff applied.** A Claude Design HTML/CSS handoff has been imported and locked. **§6 (IA), §7 (Screen Specs), §9 (Visual Direction) are superseded by `system/design-handoff-2026-05-22.md`** — that document is authoritative for tokens, IA, and component specs. The remainder of this brief (§1–§5 context/JTBDs/flows, §8 principles, §10 out-of-scope, §11 open questions, §12–§13 metrics/acceptance) **remains authoritative** for product intent.
>
> §11 open questions are now all locked. See design-handoff §1 for the resolution table. Headline shifts:
> - **4 tabs**, not 3 (Speakers promoted from v2)
> - Banner: **2 active states + hidden** (not 5)
> - Banner is **app-root**, not Schedule-only
> - Card badge: **KindChip** (Talk / Keynote / Workshop), not Remote/InPerson
> - Card left edge: **3px track-color stripe**, not format dot
> - Card tags moved to Session Detail
> - Brand yellow: `#FBCB0A` (not `#FFD300`)
> - Backgrounds: `#0B0F14` / `#14181E` (cool grey-blue, not pure near-black)
> - Live indicator: **red `#FF4D4D`**, not yellow
> - Favorite icon: **★ star**, not ♥ heart
> - **Light mode is in scope** for v1 via `prefers-color-scheme`

---

## 1. Context

JSNation 2026 runs **June 11–15 in Amsterdam & online**. Ten pre-conference workshops happen between May 11 and June 10. The companion app is built during a Claude Code workshop on **May 22, 2026** (today) and ships before the conference.

**Audience**: ~10k expected attendees, mostly professional JavaScript / TypeScript developers. Technically literate, mobile-native, high tolerance for "make it work" but low tolerance for slow.

**Constraint**: No backend, no auth, no database. One JSON file, fetched at build time from `gitnation.com/_next/data/<buildId>/events/jsnation-2026.json`, with a committed snapshot fallback. Deployed to Vercel.

---

## 2. The Honest Data Constraint

A normal conference companion app helps you **navigate** — "what room, which floor, which track." The gitnation `_next/data` payload **does not give us that**:

- ❌ No room / stage / venue-coordinate data
- ❌ No track names (just opaque `scheduleTracks: [{id:228}, ...]` with no labels)
- ❌ Only **10 of 58 sessions are scheduled** — main-conference talks are still TBA
- ✅ Rich speaker bios, avatars, social handles
- ✅ Full session abstracts (HTML), tags, formats (`InPerson` / `Remote`)
- ✅ Workshop dates and durations (pre-conference + workshop day)

**Therefore this app is positioned as a *content browser*, not a *navigator*.** The primary value is discovering *who* and *what*, not *where*. We acknowledge this rather than fake fields we don't have.

---

## 3. Users & Moments of Need

A single user persona — "the attendee" — with multiple contexts of use. Each context defines a *moment of need* where they pull out their phone.

| When | Where | Mental state | What they need |
|---|---|---|---|
| Week before | Home / commute | Curious, planning | Browse who's speaking; build a list |
| Workshop day | Hotel / café | Anxious, time-pressed | "What time is my workshop, what's the join link?" |
| Conference morning | Hotel / coffee queue | Orienting | "Who's on first today?" |
| **Between sessions** | Lobby / corridor | **Decision-mode** | **"What's next? Where? Who?"** |
| During a session | Auditorium | Distracted | "Who is this person? What else do they speak about?" |
| Right after a talk | Mingling | Reflective | "I liked that — save it for later" |
| Open spotlight | Anywhere | Searching | "Wasn't there a Bun talk? What was it called?" |
| **Five minutes late** | **Running** | **Panic** | **"What's RIGHT NOW that I should be in?"** |

The **bolded rows** are the highest-frequency, highest-stakes moments. They drive the design.

---

## 4. Jobs to Be Done

Prioritized by frequency × urgency:

1. **JTBD-1 — Now / Next**: *When I'm running between sessions, help me see what's happening right now and what's coming up so I don't miss it.* → drives **Happening Now banner + Schedule**.
2. **JTBD-2 — Lookup**: *When I hear a name or see a topic, help me find the person or talk fast.* → drives **Search**.
3. **JTBD-3 — Remember**: *When something catches my interest, help me save it for later without thinking.* → drives **Favorites**.
4. **JTBD-4 — Deep-read**: *When I'm considering a session, help me read enough to decide.* → drives **Session Detail**.
5. **JTBD-5 — Follow**: *When I like a speaker, help me follow them outside the conference.* → drives **Speaker Profile** (with social links).
6. **JTBD-6 — Plan**: *When I'm prepping for the conference, help me build a personal agenda.* → drives **Favorites + Schedule combined**.

JTBDs we are **explicitly not solving** (because the data doesn't support it):
- ❌ Navigation ("how do I get to Stage 2")
- ❌ Conflict detection ("two favorites at the same time") — partly because most sessions are undated
- ❌ Networking ("who else is here") — out of scope, no auth
- ❌ Notifications ("remind me 5 min before") — no push, no service worker in v1

---

## 5. User Flows

### Flow A — "What's happening?" (highest frequency)

The most common moment-of-need. Should be solved in **two taps or fewer**.

```
[ Open app ]
     ↓ (Schedule tab is default, loads instantly — static)
[ Schedule screen ]
     ↓ Happening Now banner at top reads:
     ↓ "▶ Up next · Building Fullstack Apps with Cursor · in 12 min"
[ Tap banner ]
     ↓
[ Session Detail ]
     ↓ Read 2 lines of abstract, see speaker name
     ↓ Tap ♥ (favorited, persisted to localStorage)
[ Close phone ]
```

**Success criteria**: from cold app open to knowing the next session and favoriting it, ≤ 4 seconds and ≤ 2 taps.

### Flow B — "Find that talk about X"

```
[ Open app ] → [ Tap Search tab ]
     ↓ (input autofocuses on tab activation)
[ Type "agent" ]
     ↓ List filters live as user types (no debounce; 58 items)
[ Tap result ]
     ↓
[ Session Detail ]
     ↓ Tap speaker avatar
[ Speaker Profile ]
     ↓ Tap Twitter handle → opens in new tab
```

**Success criteria**: result list filters at ≤ 16ms per keystroke (60fps); 3 characters typically narrows to ≤ 5 results.

### Flow C — "Build my agenda" (pre-conference, evening)

```
[ Open app ] → [ Schedule ]
     ↓ Scroll workshops list
[ Tap session ] → [ Session Detail ] → [ Tap ♥ ] → [ Back ]
     ↓ (repeat for 3-4 sessions)
[ Tap Favorites tab ]
     ↓
[ Favorites screen — sorted by time ]
     ↓ "Your plan: 4 sessions saved"
```

**Success criteria**: favoriting is one tap, no confirmation, no dialog. Favorites screen exists and groups by date.

---

## 6. Information Architecture

### Bottom tab navigation (3 tabs)

```
┌────────────────────────────────────────────┐
│                                            │
│              [ Screen content ]            │
│                                            │
│                                            │
├────────────────────────────────────────────┤
│   📅 Schedule    🔎 Search    ♥ Favorites  │
└────────────────────────────────────────────┘
```

Three tabs map exactly to the three primary JTBDs: **plan / find / remember**.

**Why not four tabs (adding "Speakers")**:
- Speakers are reachable via sessions and via search.
- A separate Speakers tab competes with Schedule for the "default tab" slot.
- It's a reasonable v2 add if usage data shows people want it.

### Screen graph

```
( Schedule tab )──────►( Session Detail )──────►( Speaker Profile )
       │                       │ ▲                      │
       ▼                       │ │                      │
( Happening Now banner ) ──────┘ └──( Session Detail )◄─┘
                                            ▲
( Search tab )─────────────────────────────►│
                                            │
( Favorites tab )───────────────────────────┘
```

Every screen except the three tabs is reached via tap from another screen — no orphan routes.

### URL structure

```
/                              → Schedule (default)
/sessions/<slug>               → Session Detail
/speakers/<nickname>           → Speaker Profile
/search?q=<query>              → Search (deep-linkable)
/favorites                     → Favorites
```

Slugs come straight from upstream (`react-query-beyond-the-basic-3339`, `wes_bos`). They're stable enough to share.

---

## 7. Screen Specs

### 7.1 Schedule (`/`)

**Purpose**: Default entry point. Answers "what's coming up?" in a single glance.

**Sections, in order**:
1. **Happening Now banner** (conditional, sticky to top while scrolling — see §7.6)
2. **Header**: JSNation 2026, dates, location
3. **Workshops — Online** (May 11 – June 4): list grouped by date
4. **Workshops — In Person** (June 10, Amsterdam): list
5. **Conference Talks** (June 11–15): heading "Schedule TBA — 48 talks announced", then list of talks without times. Or collapsed "Browse 48 talks" link → goes to Search with no query.
6. **Footer**: Discord link, hashtag, edition tag (e.g. "Snapshot: 2026-05-22")

**Session card**:
```
┌──────────────────────────────────────────────┐
│  ●●  14:00 – 17:00                  ♥        │
│  ──────────────────────────────────────────  │
│  Advanced Claude Code — Production           │
│  Workflows, Subagents and More               │
│                                              │
│  👤 Aleksei Petrov                  [Remote] │
│  #ai-tools  #productivity                    │
└──────────────────────────────────────────────┘
```
- Top-left: format dot (color-coded: yellow=Remote, green=InPerson)
- Time in tabular nums
- Title: 2 lines max, ellipsis after
- Speaker(s): avatar(s) + names, max 2 shown
- Format badge: right-aligned
- Tags: max 3 shown
- ♥ icon, top-right, tap to favorite (no detail screen needed)

**Empty state for talks**: "JSNation talks announced. Schedule drops closer to the event."

### 7.2 Session Detail (`/sessions/<slug>`)

**Purpose**: Decide. Give the user enough to commit.

**Layout** (top to bottom):
```
[ ← Back ]                              [ ♥ ]
─────────────────────────────────────────
 Advanced Claude Code — Production
 Workflows, Subagents and More
─────────────────────────────────────────
 ⏰  Today · 14:00 – 17:00 CEST
 📍  Remote · join link in email
─────────────────────────────────────────
 SPEAKERS

 ╭───╮  Aleksei Petrov                  ›
 │ A │  Engineer · Anthropic
 ╰───╯

─────────────────────────────────────────
 ABOUT

 In this workshop we'll go deep on Claude
 Code subagents, hooks, slash commands…
 [ rendered HTML, sanitized ]

─────────────────────────────────────────
 #ai-tools  #productivity  #workshops
─────────────────────────────────────────
```

- Title wraps fully (no ellipsis on detail page)
- Time displayed in **user's local timezone**, with timezone label (e.g., "CEST", "your time")
- Speakers as tappable rows, not just inline mentions
- Abstract: HTML from upstream, sanitized server-side
- Tags: tappable → Search with that tag pre-filled
- "Date TBA" state for unscheduled talks: replaces ⏰ row with "Schedule to be announced — check back closer to the event."

### 7.3 Speaker Profile (`/speakers/<nickname>`)

**Purpose**: Learn who they are, follow them.

```
[ ← Back ]

       ╭─────────╮
       │ [avatar]│
       ╰─────────╯

         Wes Bos
        @wes_bos

  Syntax.fm · Canada

 [ 𝕏 @wesbos ]  [ ◍ wesbos.com ]

─────────────────────────────────────────
 Wes Bos is a Full Stack developer
 from Canada. Constantly learning, he
 creates web development courses…
─────────────────────────────────────────
 SESSIONS

 ●●  TBA
 Agentic Interfaces: Tools, Skills…  ›

```

- Avatar: 96px circle, centered
- Name + nickname (handle-style)
- Company + location (subtitle)
- Social links: external (`target="_blank"`) — Twitter, Bluesky, GitHub if present
- Bio: full text
- Sessions: list of cards (compact variant of the schedule card)

### 7.4 Search (`/search`)

**Purpose**: Find something fast.

```
┌────────────────────────────────────────────┐
│ 🔎  [autofocused input          ]   ⓧ      │
├────────────────────────────────────────────┤
│  All ·  Workshops ·  Talks ·  Speakers     │
├────────────────────────────────────────────┤
│                                            │
│  [ filtered results list ]                 │
│                                            │
└────────────────────────────────────────────┘
```

- Input autofocuses on tab activation
- Filter chips switch between **content types**, not categories
- Live filter as user types — string-includes on title + speaker name + tag label + company. Lowercase.
- Empty query state: surface 6 most popular tags as quick-tap chips
- Empty results state: "Nothing matches '<query>'. Try a different word or browse tags."
- Sync `?q=` in URL so results are shareable

**Why no fancy fuzzy search**: 58 items, simple substring match is fast and predictable. Fuzziness ranks worse than expected here.

### 7.5 Favorites (`/favorites`)

**Purpose**: Your personal lineup.

```
[ Your favorites · 4 saved ]

─── Today, May 22 ─────────────────────────
 ●●  14:00 – 17:00
 Advanced Claude Code…              ♥ ›

─── Mon, June 10 ──────────────────────────
 ●●  09:00 – 13:00
 Building AI-Powered Apps…          ♥ ›

 ●●  14:00 – 18:00
 React Query — Beyond the Basics    ♥ ›

─── Schedule TBA ──────────────────────────
 ●●  TBA
 Agentic Interfaces…                ♥ ›
```

- Grouped by date, "TBA" group at the bottom
- Tap ♥ to remove (no confirmation)
- Empty state: "Tap ♥ on a session to save it for later."
- Storage: localStorage, key `companion:favorites:v1`, value is JSON array of session IDs

### 7.6 Happening Now banner (component, not a route)

**Purpose**: The single dynamic element. Answers "what now?" with zero friction.

Lives at the top of the **Schedule** screen (only). Not on detail/search/favorites — those have other priorities.

**States** (driven by `Date.now()` against the dated sessions):

| State | Condition | Look |
|---|---|---|
| **LIVE** | Now ∈ [startsAt, endsAt] | Yellow bar, "▶ Happening now · {title} · ends 17:00" |
| **IMMINENT** | Starts within 60 min | Yellow bar, "⏱ Up next · {title} · in 12 min" |
| **TODAY** | Another session today, but >60 min away | Subtle bar, "Today · {title} · 14:00" |
| **EVENT_SOON** | Conference within 7 days | Subtle bar, "JSNation starts in 4 days" |
| **HIDDEN** | None of the above | Nothing rendered |

Banner is the **only `'use client'` component** in the schedule tree. It re-evaluates every 30s via a single `setInterval`. Tapping it routes to the session detail.

---

## 8. Design Principles

1. **Glance, don't browse.** Default view answers the most common question in one look.
2. **Two taps to anything.** From cold open: any session, any speaker, any search, any favorite.
3. **Static over dynamic.** No loading spinners. No skeletons. No "fetching…". Everything renderable at build time is rendered at build time.
4. **Bad-wifi resilient.** Once the page loads, the app keeps working. Favorites are local. No re-fetches mid-session.
5. **Calm by default.** No notification badges, no red dots, no marketing modals, no cookie banner (we don't track anything).
6. **Thumb-first.** Bottom tab nav, primary actions in the bottom 2/3 of the screen, ≥ 44pt touch targets.
7. **Brand-respectful, not brand-loud.** JSNation accent (yellow `#FFD300`-ish) on time / live indicator / favorite-filled state only. Otherwise content first.
8. **Dark by default.** Conference rooms are dim, eye-strain matters, OLED battery matters. Respect `prefers-color-scheme` for light mode.
9. **No login, ever.** Favorites are device-local. That's a feature, not a limitation.
10. **Honest about gaps.** If we don't know the room, we don't say "TBD room" — we just don't show a room field. Don't fake structure.

---

## 9. Visual Direction

**Color**:
- Background: `#0a0a0a` (near-black), surfaces `#161616`, borders `#262626`
- Text primary: `#fafafa`, secondary `#a3a3a3`, tertiary `#525252`
- Accent (live, favorited, key time): JSNation yellow, ~`#FFD300`
- Success / InPerson dot: `#22c55e`
- Remote dot: yellow (accent)
- Light mode mirrors these with appropriate inversions

**Typography**:
- System font stack (`-apple-system, BlinkMacSystemFont, 'SF Pro Text', system-ui, sans-serif`)
- Tabular numerals (`font-variant-numeric: tabular-nums`) for times
- Sizes: 32 / 24 / 18 / 16 / 14 / 12 px
- Line height: 1.5 body, 1.2 headings

**Spacing**: 4-px grid. Mobile gutter 16 px. Card padding 16 px. Section gap 24 px.

**Components**:
- Cards: 1 px border on `#262626`, rounded 12 px, no shadow
- Avatars: circle, ratio-1, with neutral fallback for missing images
- Badges (format, tags): rounded-full, subtle border, 12 px text
- Buttons: minimum 44 × 44 px touch target

**Motion**:
- Page transitions: native (no JS-driven page transitions)
- Favorite tap: 100ms scale-bounce on ♥
- "Live" indicator pulse: ~2s breathing (`opacity 0.6 → 1.0`)
- No parallax, no scroll-jacking, no flashy entries

---

## 10. Out of Scope (Explicit)

- Push notifications / reminders
- Service worker / offline-first (works once-loaded, but no install)
- Account / login
- Sharing favorites list across devices
- Multi-event support (this build targets jsnation-2026 only)
- Conflict detection on favorites
- Calendar export (.ics) — possible v1.1
- Live Q&A / chat — Discord link covers this
- Map / venue navigation — data doesn't support it

---

## 11. Open Product Questions

These need decisions before/during build. None block scaffolding.

1. **Time zone display**: render in user's local TZ with label, or canonical CET? *(Lean: local TZ.)*
2. **Undated talks in Schedule**: collapse to "Browse 48 talks →" link, or show inline list with "TBA"? *(Lean: collapsed link to reduce noise.)*
3. **Speakers tab**: include in v1 or postpone? *(Lean: postpone. Search covers it.)*
4. **Abstract HTML**: sanitize and render, or strip to plain text? *(Lean: sanitize and render — abstracts have meaningful paragraph structure and links.)*
5. **Snapshot refresh cadence**: weekly Vercel cron, or manual `npm run refresh-snapshot` only? *(Lean: cron daily, with PR-style auto-deploy on diff.)*
6. **Share session**: include a "Copy link" button? *(Lean: skip in v1; deep links work anyway.)*
7. **Footer "Snapshot: <date>"**: show the snapshot date as honesty signal? *(Lean: yes — it's a one-liner and answers "is this up to date?".)*

---

## 12. Success Metrics (we won't measure but should pretend to)

- Time-to-next-session-info ≤ 4 seconds from cold open (instrumentable mentally during dev)
- Two-taps-to-anything from cold open: schedule, session detail, speaker profile, search result, favorite
- First Contentful Paint < 1s on slow 3G
- Static HTML size per page < 50 KB gzipped
- No layout shift after first paint (Happening Now banner reserves height even when HIDDEN)

---

## 13. Acceptance Checklist (v1 done = these are true)

- [ ] Schedule loads server-rendered with all dated workshops grouped by date
- [ ] Happening Now banner correctly switches between LIVE / IMMINENT / TODAY / EVENT_SOON / HIDDEN
- [ ] Session Detail renders sanitized HTML abstract
- [ ] Speaker Profile lists every session the speaker is in (no orphans)
- [ ] Search filters by title + speaker name + tag, ≤ 16 ms per keystroke
- [ ] Favorites persist in localStorage, survive reload, hydrate without flicker
- [ ] All times shown in user's local timezone with TZ label
- [ ] Dark mode is the default; light mode follows system preference
- [ ] Snapshot date visible somewhere on the schedule footer
- [ ] Works in airplane mode after first load (manual smoke test)
- [ ] Lighthouse mobile ≥ 95 on each route
