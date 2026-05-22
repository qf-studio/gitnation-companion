# GitNation Conference Companion — Development Documentation Navigator

**Project**: Conference companion web app for GitNation events. Lightweight, fast schedule browser sourced from gitnation.com's `_next/data` JSON at build time, with a snapshot fallback for offline/CI builds.
**Tech Stack**: Next.js (App Router), TypeScript, Vercel (Fluid Compute)
**Updated**: 2026-05-22

---

## Quick Start for Development

### New to This Project?
**Read in this order:**
1. [Design Brief](./system/design-brief.md) — Product intent: users, JTBDs, flows, principles, open questions (visual/IA sections superseded — see #2)
2. [Design Handoff 2026-05-22](./system/design-handoff-2026-05-22.md) — **Authoritative for tokens, IA (4 tabs), banner states (2), component specs, screen layouts**
3. [Project Architecture](./system/project-architecture.md) — Directory layout, data flow, runtime, quality gates
4. [Tech Stack Patterns](./system/tech-stack-patterns.md) — Next 15 / React 19 / Tailwind v4 / Vitest / Playwright / pnpm 11 conventions and traps

### Starting a New Feature?
1. Check if similar task exists in [`tasks/`](./tasks/)
2. Read relevant system docs from [`system/`](./system/)
3. Check for integration SOPs in [`sops/`](./sops/)
4. Generate implementation plan in `tasks/TASK-XX-<slug>.md`

### Fixing a Bug?
1. Check [`sops/debugging/`](./sops/debugging/) for known issues
2. Review relevant system docs for context
3. After fixing, create SOP in `sops/debugging/`

---

## Current Status (2026-05-22)

**Stage**: UI critical path landed. Logic layer complete (TASK-01 ✅ scaffold, TASK-02 ✅ snapshot, TASK-03 ✅ queries + banner, TASK-04 ✅ favorites). TASK-05 ✅ Schedule + app shell shipped (4-tab BottomNav, full token system, 8 server components + 1 client island, 106 kB First Load, static build). **78 tests green.** TASK-06 and TASK-07 are now both unblocked and parallel-safe.

**Approved execution plan**: `/Users/aleks.petrov/.claude/plans/let-s-plan-complete-execution-velvet-stallman.md`

### Task list — layered (TDD-sequenced, loop-executable)

Tasks group into five layers. Arrows mark cross-layer dependencies. Within Logic, TASK-04 runs in parallel with TASK-02→TASK-03; within UI, TASK-07 can start as soon as TASK-03 and TASK-05 are both done (no strict order with TASK-06).

#### 🧱 Foundation

Enables everything below. One task, no prereqs.

| Task | Title | State | Mode | Effort |
|---|---|---|---|---|
| [TASK-01](./tasks/TASK-01-scaffold-and-data-layer.md) | Scaffold + test infra (M0) | ✅ Complete | Main | ~25 min |

#### ⚙️ Logic — pure, TDD, delegated to worker subagents

Data normalization, query functions, banner state reducer, favorites store. TASK-04 is parallel-safe with the TASK-02→TASK-03 chain (disjoint directories: `lib/queries`+`lib/banner` vs `lib/favorites`).

| Task | Title | State | Mode | Prereqs | Effort |
|---|---|---|---|---|---|
| [TASK-02](./tasks/TASK-02-snapshot-pipeline-normalize.md) | Snapshot pipeline + normalize (M1) | ✅ Done | Worker | TASK-01 ✅ | ~½ day |
| [TASK-03](./tasks/TASK-03-query-layer-banner-state.md) | Query layer + banner state (M2) | ✅ Done | Worker | TASK-02 ✅ | ~½ day |
| [TASK-04](./tasks/TASK-04-favorites-store.md) | Favorites store (M3) | ✅ Done | Worker | TASK-01 ✅ | ~1 hr |

#### 🎨 UI — RSC pages + 3 client islands

App shell, schedule, detail / speaker / search / favorites pages, Happening Now banner. Server-rendered by default; client components confined to `components/client/` (ESLint-enforced).

| Task | Title | State | Mode | Prereqs | Effort |
|---|---|---|---|---|---|
| [TASK-05](./tasks/TASK-05-schedule-page-app-shell.md) | Schedule page + app shell (M4) | ✅ Done | Main | TASK-02 ✅, TASK-03 ✅ | ~½ day |
| [TASK-06](./tasks/TASK-06-detail-speaker-search-favorites-pages.md) | Detail / Speaker / Search / Favorites (M5) | 🟡 Ready | Main | TASK-04 ✅, TASK-05 ✅ | ~1 day |
| [TASK-07](./tasks/TASK-07-happening-now-banner.md) | Happening Now banner client island (M6) | 🟡 Ready | Main | TASK-03 ✅, TASK-05 ✅ | ~1 hr |

#### ✅ Verification — single gate before deploy

| Task | Title | State | Mode | Prereqs | Effort |
|---|---|---|---|---|---|
| [TASK-08](./tasks/TASK-08-e2e-quality-gate.md) | E2E + quality gate (M7) | 🚫 Cancelled | — | — | — |

#### 🚀 Deploy — ship to `*.vercel.app` + daily refresh

| Task | Title | State | Mode | Prereqs | Effort |
|---|---|---|---|---|---|
| [TASK-09](./tasks/TASK-09-vercel-deploy-actions.md) | Vercel deploy + GitHub Actions (M8) | ⬜ Blocked | Main | TASK-06, TASK-07 | ~1 hr |

#### Wall-clock estimates

| Mode | Total |
|---|---|
| Strictly sequential (one task at a time) | ~4 days |
| Parallelized (TASK-04 ∥ TASK-02→03, TASK-07 ∥ TASK-06) | ~3 days |

### Locked decisions (from approved plan)

- Snapshot refresh: **GitHub Action → PR** (no Vercel cron).
- Deploy: **`*.vercel.app` only** (no custom domain in v1).
- §11 leans: all 7 locked (local TZ, collapsed talks, sanitize+render HTML, footer date, no share button). **Speakers tab promoted to v1** per design handoff 2026-05-22 (4-tab nav).
- Tests: Vitest (node + jsdom projects), Playwright (1 spec). Current count: **78 green**.
- Client components: 6 islands in `components/client/` — `BottomNav`, `FavoriteStar`, `FavoritesGate`, `FavoritesCount`, `SearchInput`, `HappeningNowBanner`. ESLint rule enforces folder boundary.

**Key facts to internalize**:
- No room / track / stage data exists upstream — content browser, not wayfinder.
- Only 10 of 58 sessions are dated (workshops); 48 conference talks have no `startDate`.
- One client folder; everything else server-rendered.
- **4-tab bottom nav** (per design handoff 2026-05-22): Schedule / Search / Saved / Speakers. URL `/favorites` stays for back-compat; H1 reads "Saved".
- Banner: 2 active states (`live` / `upcoming` 6h horizon) + hidden. Mounted app-root, not Schedule-only. Logic in `lib/banner/state.ts` (test-locked).

---

## Documentation Structure

```
.agent/
├── DEVELOPMENT-README.md             ← You are here (navigator index)
│
├── tasks/                            ← Implementation plans (9 tasks, TDD-sequenced)
│   ├── TASK-01-scaffold-and-data-layer.md          ← ✅ complete
│   ├── TASK-02-snapshot-pipeline-normalize.md      ← ✅ complete
│   ├── TASK-03-query-layer-banner-state.md         ← ✅ complete
│   ├── TASK-04-favorites-store.md                  ← ✅ complete
│   ├── TASK-05-schedule-page-app-shell.md          ← ✅ complete
│   ├── TASK-06-detail-speaker-search-favorites-pages.md  ← 🟡 ready
│   ├── TASK-07-happening-now-banner.md             ← 🟡 ready (parallel with 06)
│   ├── TASK-08-e2e-quality-gate.md
│   └── TASK-09-vercel-deploy-actions.md
│
├── system/                           ← Living architecture / product docs
│   ├── design-brief.md               ← canonical product doc (UX, flows, screens)
│   ├── project-architecture.md       ← directory layout, data flow, runtime, quality gates
│   └── tech-stack-patterns.md        ← Next 15 / React 19 / Tailwind v4 / Vitest / pnpm 11 conventions
│
├── sops/                             ← Standard Operating Procedures
│   ├── integrations/                 # Third-party service guides
│   ├── debugging/                    # Known issues and fixes
│   │   └── pilot-retry-loop-and-oom.md  ← Pilot worker loops on re-opened issues; OOM mitigations
│   ├── development/                  # Dev workflows
│   └── deployment/                   # Vercel deployment procedures
│
└── .context-markers/                 ← Compact restore points
    └── before-compact-2026-05-22-1952-task-05-shipped.md  ← .active
```

---

## Project-Specific Context

### Data Source
- **No GitNation API.** Data is pulled at build time from `https://gitnation.com/_next/data/<buildId>/events/<slug>.json`.
- A **snapshot fallback** (committed JSON) must keep CI/preview builds working when the upstream build ID rotates.
- See `[[project_data_source]]` in user memory for the full rationale.

### Delegation Pattern
- Pure-logic milestones (M1.2–M1.8) are delegated to a worker subagent for TDD.
- Main thread drives UI work (M1.9–M1.13) and deploy (M2.x).

### Deployment
- Target platform: **Vercel** (Fluid Compute, Node.js 24 LTS, default).
- Prefer `vercel.ts` over `vercel.json` for config.
- AI features (if any) should route through Vercel AI Gateway, not direct provider SDKs.

---

## When to Read What

### Scenario: Starting a new feature
1. Check [`tasks/`](./tasks/) for similar previous work or an open task.
2. Read [`system/design-brief.md`](./system/design-brief.md) for product intent (users, JTBDs, flows, screens).
3. Read `system/project-architecture.md` once it exists (stub on first scaffold).
4. Check [`sops/integrations/`](./sops/integrations/) for relevant integration guides.
5. Write `tasks/TASK-XX-<slug>.md` capturing your plan.

### Scenario: Picking up where the previous session left off
1. Run `nav-start` — it will detect any active marker in [`.context-markers/`](./.context-markers/) and offer to restore.
2. Skim the [Current Status](#current-status-2026-05-22) table above to see what's done.
3. Read the most recent task doc in [`tasks/`](./tasks/).

### Scenario: Debugging an issue
1. Check [`sops/debugging/`](./sops/debugging/) for a known fix.
2. Re-read relevant system doc for context.
3. Solve the issue.
4. If the pattern is novel and likely to recur → write a new SOP in `sops/debugging/`.

### Scenario: Context-window optimization
Load only what's relevant:
- **Always**: this file (~2k tokens) + `CLAUDE.md` (~1k tokens).
- **Current feature**: one task doc (~3k tokens).
- **Product canon**: `system/design-brief.md` once per session (~6k tokens).
- **SOPs**: on-demand only (~2k each).

Target session budget: ~12k tokens vs ~150k loading everything.

---

## Documentation Quality Checklist

### Task Doc
- [ ] Context explains WHY building this
- [ ] Implementation broken into phases
- [ ] Technical decisions documented
- [ ] Dependencies mapped
- [ ] Completion checklist

### SOP
- [ ] Clear context (when/why needed)
- [ ] Problem statement specific
- [ ] Step-by-step solution
- [ ] Code examples
- [ ] Prevention checklist

### System Doc
- [ ] Reflects current codebase state
- [ ] Code examples accurate
- [ ] Timestamp updated
- [ ] Breaking changes noted

---

**Last Updated**: 2026-05-22 (post-TASK-05 + Pilot smoke-test wrap; first debugging SOP filed)
**Powered By**: Navigator v6.15.4
