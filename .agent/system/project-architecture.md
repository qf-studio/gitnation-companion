# Project Architecture

**Project**: GitNation Conference Companion (JSNation 2026)
**Tech Stack**: Next.js 15.5 (App Router), React 19, TypeScript 5.9 (strict), Tailwind CSS v4, Vercel (Fluid Compute, Node.js 24 LTS)
**Updated**: 2026-05-22

---

## Core Principle

**Build-time data extraction, no runtime upstream calls.**
GitNation publishes no API. Schedule data is pulled from `https://gitnation.com/_next/data/<buildId>/events/<slug>.json` at build time and committed as a snapshot. Production never calls gitnation.com at request time.

---

## Directory Layout (current)

```
gitnation-companion/
├── app/                         ← Next.js App Router (RSC by default)
│   ├── layout.tsx               ← root layout: html, body, theme attrs, metadata, viewport
│   ├── page.tsx                 ← schedule placeholder (real content lands in TASK-05)
│   └── globals.css              ← Tailwind v4 import + @theme tokens
│
├── data/
│   └── schedule.snapshot.json   ← committed snapshot fallback (placeholder until TASK-02)
│
├── .agent/                      ← Navigator docs (this directory)
│   ├── DEVELOPMENT-README.md
│   ├── system/                  ← living architecture docs (this file lives here)
│   ├── tasks/                   ← TASK-01..TASK-09 implementation plans
│   └── sops/                    ← debug/dev/deploy SOPs
│
├── package.json                 ← scripts: dev / build / start / lint / typecheck / test / e2e / refresh:snapshot
├── pnpm-workspace.yaml          ← native-build allowlist (esbuild / sharp / unrs-resolver)
├── tsconfig.json                ← strict, @/* path alias
├── next.config.ts               ← minimal; defaults to Node runtime
├── postcss.config.mjs           ← @tailwindcss/postcss plugin
├── vitest.config.ts             ← two projects: node + jsdom
├── vitest.setup.ts              ← @testing-library/jest-dom matchers (jsdom only)
├── playwright.config.ts         ← chromium-only, webServer = pnpm build && pnpm start
└── .eslintrc.json               ← next/core-web-vitals + 'use client' ban outside components/client/**
```

**Will land in later tasks** (do not pre-create):
- `lib/data/`, `lib/queries/`, `lib/banner/` — pure-logic modules (TASK-02, TASK-03)
- `lib/favorites/` — localStorage-backed store (TASK-04)
- `components/client/` — exactly 3 client islands (TASK-05/06/07)
- `scripts/refresh-snapshot.ts` — fetch upstream JSON (TASK-02)
- `e2e/demo-flow.spec.ts` — single Playwright spec (TASK-08)
- `vercel.ts`, `.github/workflows/snapshot.yml` — deploy (TASK-09)

---

## Data Flow

```
Upstream                Build time                  Runtime
────────                ──────────                  ───────
gitnation.com           scripts/refresh-snapshot    Server Components read
_next/data/<id>/        ──fetches──>                from data/schedule.snapshot.json
events/<slug>.json      data/schedule.snapshot.json (via lib/data/getSchedule)
                        (committed to git)
                        ▲
                        │ GitHub Action opens PR daily
                        │ with refreshed snapshot
                        └────────────────────────────
```

- **Schema validation**: Zod parses the snapshot at module load. Bad upstream data fails the build loudly rather than rendering broken pages.
- **Snapshot refresh**: scheduled GitHub Action runs `pnpm refresh:snapshot` and opens a PR — humans review before merge. **No Vercel cron.**
- **Build-time normalization**: raw upstream shape → typed `Event` / `Session` / `Speaker` (see TASK-02 for schema).

---

## Rendering Model

- **Default**: React Server Components. Static-rendered (SSG) wherever possible.
- **Client islands**: exactly 3, all in `components/client/`:
  1. `HappeningNowBanner` — polls clock, reads banner state
  2. `FavoriteToggle` — writes localStorage favorites
  3. `FavoritesGate` — reads localStorage to gate `/favorites` page
- **Guardrail**: ESLint `no-restricted-syntax` rule bans `'use client'` outside `components/client/**`. Adding a 4th client component requires either a new directory carve-out or a deliberate ESLint exception — friction is the point.

---

## Runtime & Deployment

- **Target**: Vercel Fluid Compute, Node.js 24 LTS.
- **Edge runtime**: not used. We have no per-region latency need and our data is static.
- **Output**: standard Next.js build (not `output: 'export'`). Static pages prerender; future dynamic routes use ISR if added.
- **Promotion**: manual `vercel promote` from preview to production. `main` does **not** auto-deploy to production.
- **Domain**: `*.vercel.app` only in v1 (no custom domain).

---

## Quality Gates

A change is shippable when all of these pass:

| Gate | Command | What it covers |
|---|---|---|
| Type check | `pnpm typecheck` | `strict: true`, no `any` without justification |
| Lint | `pnpm lint` | `next/core-web-vitals` + client-component guardrail |
| Unit tests | `pnpm test` | Vitest, two projects (node + jsdom) |
| E2E | `pnpm e2e` | Playwright, chromium, single spec |
| Build | `pnpm build` | Next production build against committed snapshot |

CI runs the same gates in the same order (see TASK-09 for the GitHub Actions definition).

---

## Cross-References

- Product canon: `.agent/system/design-brief.md`
- Stack-specific patterns: `.agent/system/tech-stack-patterns.md`
- Per-task plans: `.agent/tasks/TASK-XX-*.md`
- Approved execution plan: `/Users/aleks.petrov/.claude/plans/let-s-plan-complete-execution-velvet-stallman.md`
