# Design Handoff — 2026-05-22

**Status**: Locked
**Source**: Claude Design bundle (`Companion app.html` + `components.jsx`, `screens.jsx`, `app.jsx`, `data.js`, `ios-frame.jsx`)
**Supersedes**: `design-brief.md` §6 (IA), §7 (Screen specs visual), §9 (Visual direction tokens)
**Carries forward**: `design-brief.md` §1–§5 (context, JTBDs, flows), §8 (principles), §10 (out of scope), §12–§13 (metrics, acceptance)

This document captures the **locked visual and IA decisions** from the Claude Design handoff. Where it disagrees with `design-brief.md`, this document wins. Where it is silent, the brief stands.

---

## 1. Locked Decisions (replacing brief §11 open questions)

| # | Brief §11 question | Decision | Source |
|---|---|---|---|
| Q1 | Time zone display | **User's local TZ with label** (brief lean confirmed). Prototype's hardcoded `Europe/Amsterdam` is NOT carried over. | brief §11.1 |
| Q2 | Undated talks | Collapse to "Browse 48 talks →" link (brief lean). Prototype data is fully dated so the collapse isn't visible there. | brief §11.2 |
| Q3 | **Tab count** | **4 tabs**: Schedule / Search / Saved / Speakers. Speakers promoted from v2 → v1 per design. | this doc §2 |
| Q4 | Abstract HTML | Sanitize-then-render (brief lean). Prototype renders plain text because its fixtures lack HTML; real data has HTML. | brief §11.4 |
| Q5 | Snapshot refresh cadence | Daily cron (brief lean). Not affected by design. | brief §11.5 |
| Q7 | Footer snapshot date | Yes, render on Schedule footer (brief lean). | brief §11.6 |

New decisions introduced by handoff (no brief equivalent):

| Topic | Decision |
|---|---|
| Banner state count | **2 active states** (`live` / `upcoming` with 6h horizon) + `hidden`. Replaces brief's 5-state spec. |
| Banner scope | **App-root** (visible on all screens). Replaces brief §7.6 "Schedule-only". |
| Card right-aligned badge | **KindChip** (Talk / Keynote / Lightning / Workshop). Replaces brief's Remote/InPerson format badge. |
| Card tags | Not rendered on the card. Tags surface only on Session Detail. |
| Card format dot | Replaced by **3px left stripe in track color**. |
| Light mode | In-scope for v1 via `prefers-color-scheme`. |
| Search URL `?q=` sync | Retained from brief (`design-brief.md` §7.4). Design omitted it but brief's deep-link rationale stands. |

---

## 2. Information Architecture

### Bottom tab nav (4 tabs)

| Order | Tab | Icon | Route | Empty-state copy |
|---|---|---|---|---|
| 1 | **Schedule** | calendar | `/` | default tab, always content |
| 2 | **Search** | magnifier | `/search` | "Type to search 58 sessions and 58 speakers" |
| 3 | **Saved** | star | `/favorites` | "Tap the star on any session on the Schedule to keep it here. Your list survives the conference closing the venue WiFi." |
| 4 | **Speakers** | users (people) | `/speakers` | n/a (always populated) |

Active state: brand color (`--brand-on-surface`) on icon + label, label weight 700.
Inactive: muted color, weight 500.
A small numeric badge on the Saved tab shows favorite count when >0.

**Implementation note**: Active state requires `usePathname()` → BottomNav is a client component, located at `components/client/BottomNav.tsx`. This is the **second permitted client component** (alongside the banner).

### Routes (5)

```
/                              → Schedule (default)
/sessions/<slug>               → Session Detail
/speakers                      → Speakers index (A–Z, sticky letter headers, jump bar)
/speakers/<nickname>           → Speaker Profile
/search?q=<query>              → Search (URL-synced)
/favorites                     → Saved
```

---

## 3. Design Tokens (canonical)

All hex values verified against `components.jsx` + `app.jsx`. These ARE the tokens.

### 3.1 Brand

| Token | Dark | Light |
|---|---|---|
| `--brand` | `#FBCB0A` | `#FBCB0A` |
| `--brand-on-brand` | `#0F141E` | `#0F141E` |
| `--brand-on-surface` | `#FBCB0A` | `#9C7A00` |
| `--brand-soft` | `rgba(251,203,10,0.18)` | `rgba(251,203,10,0.18)` |

> Brief said `#FFD300`. Designer chose `#FBCB0A` (slightly more orange). Use `#FBCB0A`.

### 3.2 Surface

| Token | Dark | Light |
|---|---|---|
| `--bg` | `#0B0F14` | `#F5F6F8` |
| `--surface` | `#14181E` | `#FFFFFF` |
| `--surface-2` | `#1B2027` | `#FAFBFC` |
| `--border` | `rgba(255,255,255,0.08)` | `rgba(15,20,30,0.07)` |
| `--border-2` | `rgba(255,255,255,0.14)` | `rgba(15,20,30,0.12)` |

### 3.3 Text

| Token | Dark | Light |
|---|---|---|
| `--text` | `#F5F7FA` | `#0F141E` |
| `--text-muted` | `#9CA6B3` | `#5A6473` |
| `--text-faint` | `#5D6573` | `#8E97A6` |

### 3.4 Accent (state colors)

| Token | Value | Use |
|---|---|---|
| `--live` | `#FF4D4D` | LiveDot, banner LIVE label, TimeMarker rule color while live |
| `--star-on` (dark) | `#F5C518` | Filled favorite star |
| `--star-on` (light) | `#E9A800` | Filled favorite star |
| `--star-off` (dark) | `rgba(255,255,255,0.3)` | Empty favorite outline |
| `--star-off` (light) | `rgba(15,20,30,0.25)` | Empty favorite outline |
| `--banner-bg` | `#0F141E` (both modes) | Banner background, always |

### 3.5 Track colors

Track colors come from upstream session metadata (`session.track.color`). Each session gets a 3px left stripe in its track color. If no track, use `--border-2`.

### 3.6 Typography

System stack: `-apple-system, system-ui, sans-serif` (set on body).
Monospace: `ui-monospace, SFMono-Regular, Menlo, monospace` (used for all time elements).

| Element | Size | Weight | Letter-spacing | Family |
|---|---|---|---|---|
| Screen H1 | 30px | 800 | −1 | sans |
| Kicker | 11px | 700 | 1.2, UPPER | sans |
| Subtitle | 13.5px | 500 | — | sans |
| Session title — card | 16px | 600 | −0.3 | sans |
| Session title — card (keynote) | 17px | 700 | −0.3 | sans |
| Session title — detail | 26px | 800 | −0.7 | sans |
| Speaker name — row | 15.5px | 600 | −0.2 | sans |
| Speaker tagline — row | 13px | 500 | — | sans |
| Section label | 11px | 700 | 1, UPPER | sans |
| KindChip | 10.5px | 700 | 0.6, UPPER | sans |
| TrackChip | 11px | 600 | 0.2 | sans |
| Time — card | 12.5px | 600 | — | mono |
| Time — detail | 14.5px | 600 | — | mono |
| Banner title | 13px | 600 | — | sans |
| Banner subtitle | 11.5px | 500 | — | sans |
| BottomNav label | 10.5px | 500 / 700 active | — | sans |
| Search input | 16px (anti-zoom) | 500 | — | sans |

Line height: 1.2 headings, 1.25 cards, 1.3 subtitle, 1.5 body.

### 3.7 Spacing & radii

- **Mobile gutter**: 12px (NOT 16px — every card uses `margin: 0 12px`).
- **Card padding**: 12px all sides.
- **Card-to-card gap**: 8px.
- **Day group gap**: 12px.
- **Screen header padding**: `8px 16px 12px`.
- **BottomNav padding**: `6px 4px 22px` (22px = safe-area-inset-bottom proxy; use `env(safe-area-inset-bottom, 22px)`).

| Radii | Value |
|---|---|
| SessionCard | 14px |
| Surface card (containers) | 14px |
| Search input | 14px |
| Workshop CTA button | 14px |
| Track-browse row | 12px |
| DaySwitcher outer | 12px |
| DaySwitcher pill | 10px |
| Social icon button | 10px |
| Empty-state icon container | 18px |
| KindChip | 4px |
| TrackChip / recent-search pill / nav badge | 999px (full pill) |

Shadow: cards in dark mode have **no shadow**. In light mode: `0 1px 2px rgba(15,20,30,0.04)`.

### 3.8 Motion

| Animation | Spec |
|---|---|
| FavoriteStar press | `transform .15s cubic-bezier(.4,1.4,.6,1)`, scale 0.82 on press → 1.0 release |
| FavoriteStar fill | `fill .15s` linear |
| LiveDot beacon | `1.4s ease-out infinite`, expanding red ring (`inset: -3px`, `opacity 0.4 → 0`) |

No JS-driven page transitions. No parallax. No scroll-jacking.

---

## 4. Component Specs

Full source: `/tmp/design-pkg/extracted/companion-app/project/`. Below is the implementer-facing summary.

### 4.1 SessionCard

```
margin: 0 12px
borderRadius: 14
background: --surface
border: 0.5px solid --border
opacity: 0.5 when status='after' (past session)
flex row, no shadow in dark

[3px left stripe in track.color, full card height]

Inner 12px padding, column layout:

Row 1: [time mono 12.5/600] [LiveDot if status=live] [spacer] [KindChip] [★ 22px]
Row 2: title 16/600 (17/700 keynote), letterSpacing -0.3, lineHeight 1.25
Row 3: [stacked Avatars 22px, -8px overlap] [speaker names 13px muted]
Row 4: [TrackChip] [pin-icon 14 + room 12 muted] [capacity if workshop]
```

Variant — **break**:
```
No card surface, no border, no stripe.
padding: 10px 16px, margin: 0 12px
borderTop/Bottom: 0.5px dashed --border
[mono 12/500 time, minWidth 90] [BreakIcon 14] [13/500 title] [11.5 faint room]
```

### 4.2 HappeningNowBanner

**Position**: `position: fixed; top: env(safe-area-inset-top, 0); left: 0; right: 0; z-index: 40`.
Content area gets dynamic `padding-top`: `50px` when hidden, `96px` when visible. The `<main>` element owns this padding via inline style or CSS var keyed off banner state.

**Background**: always `#0F141E` (never yellow).

**Layout** (button, full width, `padding: 8px 14px`):

```
[LiveDot 7px + LIVE label 10.5/800 #FF4D4D]   ← when state=live
   OR
[UP NEXT label 10.5/800 --brand-on-surface]    ← when state=upcoming

[title 13/600 white, ellipsis]
[room · "ends in Xm" / "starts in Xm"  11.5/500 rgba(255,255,255,0.6)]

[chevR right, rgba(255,255,255,0.5)]
```

**Tap**: routes to `/sessions/<slug>` of the current/upcoming session.

**Hidden**: render `null`. The `<main>` still keeps a placeholder padding via CSS to avoid layout shift on state transition.

### 4.3 KindChip

10.5px 700 uppercase, letterSpacing 0.6, radius 4px, padding `2px 6px`.

| Kind | Dark fg | Dark bg | Light fg | Light bg |
|---|---|---|---|---|
| keynote | `#0F141E` | `#F5F7FA` | `#F5F7FA` | `#0F141E` |
| lightning | `#0F141E` | `#F5F7FA` | `#F5F7FA` | `#0F141E` |
| talk | `--text-muted` | transparent + 1px border `--border-2` | same | same |
| workshop | `--text-muted` | transparent + 1px border `--border-2` | same | same |
| break | (not rendered) | — | — | — |

### 4.4 TrackChip

Pill (radius 999), padding `3px 8px 3px 7px`, 11/600.
Background `track.color22` (12% alpha).
Border `0.5px solid track.color66` (40% alpha).
Left-anchored 6px dot in `track.color` with `box-shadow: 0 0 0 2px track.color33`.

### 4.5 Avatar

Circle. Size: 22px (cards), 40px (rows), 88px (profile).
`background: linear-gradient(135deg, tint33 0%, tint1A 100%)`.
`border: 1px solid tint55`.
Initials: `size * 0.36`px, weight 600. (For real data: render `<img>` with the Cloudinary URL; initials fallback only when `onError`.)

### 4.6 SpeakerRow

`padding: 12px 16px`, `borderBottom: 0.5px solid --border` (omit on last).
Row: `[Avatar 40px] [name 15.5/600 → tagline 13/muted] [ChevronRight faint]`.

### 4.7 BottomNav

```
position: fixed; bottom: 0; left: 0; right: 0; z-index: 30
padding: 6px 4px env(safe-area-inset-bottom, 22px)
background: rgba(11,15,20,0.85) (dark) / rgba(255,255,255,0.85) (light)
backdrop-filter: blur(20px) saturate(180%)
border-top: 0.5px solid --border

Each tab: column flex, gap 3px, padding 6px 14px 4px.
  icon 22px (24px hit-area minimum), label 10.5px
  active: --brand-on-surface, weight 700
  inactive: --text-muted, weight 500

Saved-tab badge (when count > 0):
  position: absolute; top: -4px; right: -8px
  16x16px pill, radius 999, bg --brand-on-surface, color --bg
  10px 700 number
```

### 4.8 DaySwitcher (Schedule only)

```
position: sticky; top: 0 (under banner padding); z-index: 20
padding: 8px 12px
background: same frosted-glass recipe as BottomNav
border-bottom: 0.5px solid --border

Outer pill: radius 12, border 0.5px --border, padding 4px
Two inner buttons: radius 10, padding 8px 12px
  active button: bg --brand-soft, color --brand-on-surface
  inactive: transparent, color --text-muted

Each button two-line:
  Line 1: 11/700 "Day 1" / "Day 2"
  Line 2: 12.5/600 mono "Sat 13" / "Conference Day"
```

### 4.9 TimeMarker (between time slots on Schedule)

Above each group of parallel sessions sharing a `startsAt`:

```
padding: 14px 16px 2px
Row: [mono 12.5/600 time] [horizontal rule, flex-1, --border] [LiveDot if live]
LiveDot when slot is "now": red, with 1.4s beacon ring.
```

### 4.10 PushHeader (used on detail screens)

```
position: sticky; top: 0; z-index: 30
padding: 8px 12px env(safe-area-inset-bottom, 0)
background: rgba(11,15,20,0.85)
backdrop-filter: blur(20px) saturate(180%)
border-bottom: 0.5px solid --border

Row: [Back button 36x36 chip] [spacer / breadcrumb optional] [★ accessory 36x36]
```

### 4.11 Search input

```
Container padding: 12px 16px
Input: full-width, fontSize 16 (anti-iOS-zoom), weight 500
padding: 12px 40px 12px 42px
background: --surface, border 0.5px --border, borderRadius 14

Left absolute icon at left: 12 (search glyph 18px, --text-muted)
Right ✕ clear: absolute right: 12; 24x24 circle bg --chip-bg, radius 999. Visible only when q.length > 0.
```

### 4.12 SocialIconButton (Speaker Profile)

36×36px square, radius 10px, border `0.5px --border`, bg `--surface`.
Inner icon 16px, color `--text`.
Hover (desktop) / press (mobile): bg `--surface-2`.

Supported handles, in this order: X / Twitter, GitHub, Mastodon, Bluesky, LinkedIn, website. Render only those present in `speaker.social.*`.

### 4.13 Workshop CTA button (Session Detail, workshop kind only)

```
full-width, padding: 14px 16px, radius 14
background: --brand, color: --brand-on-brand
text: 15/700 "Sign up for this workshop"
:active { transform: scale(0.98); opacity: 0.92 }
```

---

## 5. Screen Layouts

### 5.1 Schedule (`/`)

```
[ ScreenHeader: kicker "JSNATION 2026" / h1 "Conference Companion" / subtitle "June 11–15 · Amsterdam & Online" ]
[ Footer-bottom: "Snapshot: <fmtDate(fetchedAt)>" — small, --text-faint ]

[ DaySwitcher sticky pill ]

[ TimeMarker 09:00 ]
   SessionCard (parallel session A)
   SessionCard (parallel session B)

[ TimeMarker 10:30 ]
   SessionCard (break — dashed divider variant)

[ TimeMarker 11:00 ]
   SessionCard ...

[ Talks section header: "Schedule TBA — 48 talks announced" ]
[ Link button: "Browse all talks →" → /search?kind=talk ]

[ Footer: hashtag, Discord, snapshot date ]
```

Auto-scroll on mount: if any session is "live" (state from TASK-03 query layer), `scrollIntoView({ block: 'start' })` with 80px offset.

### 5.2 Session Detail (`/sessions/<slug>`)

```
[ PushHeader: ← back, ★ accessory ]

[ TrackChip ] [ KindChip ] [ LiveDot+LIVE if currently live ]

[ Title — 26/800, full wrap (no ellipsis) ]

[ "When / Where" card: 2 columns
   left: WHEN label / 14.5 mono time range / 13.5 day name
   right: WHERE label / 14.5 room name / 13 muted capacity
]

[ SPEAKERS section — surface card with SpeakerRows ]

[ ABOUT section — title 11/700 label + sanitized HTML body ]

[ if kind=workshop:
    WORKSHOP block: capacity, prerequisites text, [Sign up] CTA button ]

[ if has resources:
    RESOURCES section: rows for Slides / Recording / Code repo / Live demo ]
```

### 5.3 Speaker Profile (`/speakers/<nickname>`)

```
[ PushHeader (transparent, no border): ← back ]

[ Hero: radial-gradient(circle at 50% -20%, tint22 0%, transparent 60%)
  centered Avatar 88px
  name 26/800
  tagline 13.5/500 muted
  company · location 13/muted ]

[ Social icon row: X, GitHub, Mastodon, Bluesky, LinkedIn, website (only present ones) ]

[ BIO section ]

[ SESSIONS section: SessionCards with showDay=true ]
```

### 5.4 Speakers Index (`/speakers`)

```
[ ScreenHeader: "Speakers" / "58 speakers" subtitle ]

[ "A" sticky letter header (frosted glass) ]
[ Surface card containing SpeakerRows for letter A ]

[ "B" sticky letter header ]
[ Surface card ... ]

...

[ A–Z jump bar: absolute right: 2px, top: 50%, translateY(-50%); 10/600 letters; tap → smooth scroll ]
```

### 5.5 Search (`/search`)

Empty `q`:
```
[ Search input ]

[ if recents.length:
    "Recent" section, pills layout ]

[ "From your saved" section — SessionCards (favorites) ]
[ "Don't miss these" section — pinned/keynote SessionCards ]

[ "Browse tracks" section — track-row buttons (full-width) ]
```

Active `q`:
```
[ Search input with ✕ clear ]

[ "Sessions · N" section — matching SessionCards ]
[ "Speakers · N" section — SpeakerRows ]
[ "Tracks · N" section — track-row buttons ]
```

URL sync: keep `?q=<query>` in URL via `replaceState` (no scroll jump). Server reads `searchParams.q` for initial render.

### 5.6 Saved (`/favorites`)

```
[ ScreenHeader: "Saved" / "{N} sessions starred" subtitle ]

[ Day 1 — Sat 13 ]
   SessionCard (favorited)
   SessionCard
[ Day 2 — Sun 14 ]
   SessionCard

[ if no favorites:
    centered EmptyState icon + title + body:
    "No sessions saved yet"
    "Tap the star on any session on the Schedule to keep it here.
     Your list survives the conference closing the venue WiFi." ]
```

---

## 6. Implementation Carry-Over

### Do carry over from prototype

- **Slot grouping by exact `startsAt` ISO string** for parallel sessions.
- **`opacity: 0.5` for `status='after'` sessions** (past).
- **3px left track-color stripe** on SessionCard. Track color from upstream.
- **Backdrop-blur frosted glass** on BottomNav, PushHeader, DaySwitcher sticky.
- **Auto-scroll to live session** on Schedule mount.
- **Hide banner = render `null`**, but content area keeps a 50px placeholder padding to avoid layout shift.

### Do NOT carry over from prototype

- **Hardcoded `Europe/Amsterdam` timezone**. We use the user's local TZ with TZ label (per brief §11.1). Set `timeZone: undefined` (default) on `Intl.DateTimeFormat`.
- **`TIME_STATES` / `TWEAK_DEFAULTS.timeState` / Tweaks panel** — prototype-only simulation. Production uses `new Date()` with a `?now=<ISO>` dev-only override (per TASK-07).
- **`themeVars(dark)` JS function** — replace with Tailwind v4 `@theme` block in `app/globals.css`. The JS is prototype convenience.
- **Initials-only avatars** — prototype lacks images. Production renders the real Cloudinary `<img>`; initials become the `onError` fallback only.
- **Multi-brand `BRANDS` switching** — out of scope, JSNation only.
- **Full schedule serialized to client** — banner client island receives only `{ id, slug, title, startsAt, endsAt, room }` for each session, not full Schedule.

---

## 7. Open Questions / Future Polish

1. **Real avatar `onError` fallback**: render initials gradient (per §4.5) or a neutral silhouette? Recommend initials, matches prototype aesthetic.
2. **Banner copy localization**: "ends in Xm" / "starts in Xm" uses minutes. After 60min should it say "in 1h 12m"? The 6h cap keeps numbers ≤ 360, so "342m" is technically correct but ugly. Recommend hour-rollover at ≥ 60min: "in 1h 12m".
3. **Workshop "Sign up" CTA destination**: brief has no decision. Default: `target="_blank"` → ticketing URL from upstream (TBA).
4. **Speakers index**: 58 speakers in alphabetical sections. If a letter has 0 speakers, hide the header.

---

**Last Updated**: 2026-05-22
**Authoritative for**: tokens, IA, component spec, banner state machine
**Defer to brief for**: product intent, JTBDs, flows, principles, out-of-scope
