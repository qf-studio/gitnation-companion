# TASK-01: Scaffold + Test Infrastructure (M0)

**Status**: ✅ Complete (2026-05-22)
**Created**: 2026-05-22
**Assignee**: Main thread
**Effort**: ~30 min (actual: ~25 min + pnpm 11 allowlist debugging)
**Prereqs**: none
**Blocks**: TASK-02, TASK-04
**Supersedes**: prior version of TASK-01 (which conflated M0+M1). Data-layer scope moved to [TASK-02](./TASK-02-snapshot-pipeline-normalize.md).
**Depends on**: [`system/design-brief.md`](../system/design-brief.md)

---

## Context

**Problem**:
We have research and a design brief but no `package.json`. Every subsequent TDD task depends on a working test runner, lint guard, and Next.js app shell that does not yet exist.

**Goal**:
Create the project skeleton plus the test infrastructure (Vitest in two projects, Playwright, ESLint guard) and a minimal Tailwind-themed app shell. No production tests, no data layer, no screens — just bones that allow `pnpm build`, `pnpm test`, and `pnpm e2e --list` to succeed.

---

## Acceptance Criteria

- [x] `pnpm install` completes (lockfile committed)
- [x] `pnpm typecheck` clean
- [x] `pnpm lint` clean (note: `next lint` prints deprecation warning — fine on Next 15)
- [x] `pnpm test` reports 0 tests, exit code 0
- [x] `pnpm e2e --list` shows 0 specs, exit code 0
- [x] `pnpm build` produces static `/`
- [x] `pnpm dev` serves `/` rendering "JSNation 2026"
- [x] Dark theme default; `@theme` tokens reachable via Tailwind utilities

---

## Implementation

### Phase 1: Repo skeleton (~10 min)

**Goal**: Hand-roll a minimal Next.js + TypeScript project (do NOT use `create-next-app`).

**Tasks**:
- [ ] Create `package.json` with required deps, devDeps, and scripts
- [ ] Create `tsconfig.json` (Next.js standard, `strict: true`, `"@/*"` alias to root)
- [ ] Create minimal `next.config.ts`
- [ ] Create `postcss.config.mjs` with `{ plugins: { "@tailwindcss/postcss": {} } }`
- [ ] Extend `.gitignore` with `node_modules`, `.next`, `.env*.local`, `next-env.d.ts`, `coverage`, `playwright-report`, `test-results`

**Files**:
- `package.json` — deps: `next`, `react`, `react-dom`, `sanitize-html`, `zod`; devDeps: `typescript`, `@types/react`, `@types/node`, `@types/sanitize-html`, `tailwindcss@4`, `@tailwindcss/postcss`, `postcss`, `vitest`, `@vitest/coverage-v8`, `@testing-library/react`, `@testing-library/jest-dom`, `jsdom`, `@playwright/test`, `tsx`, `eslint`, `eslint-config-next`; scripts: `dev`, `build`, `start`, `lint`, `typecheck` (`tsc --noEmit`), `test` (`vitest run`), `test:watch` (`vitest`), `e2e` (`playwright test`), `refresh:snapshot` (`tsx scripts/refresh-snapshot.ts`)
- `tsconfig.json` — Next.js standard, `strict: true`, `"@/*"` import alias to root
- `next.config.ts` — minimal config
- `postcss.config.mjs` — Tailwind v4 PostCSS plugin
- `.gitignore` — extended ignores

### Phase 2: Test + lint configuration (~10 min)

**Goal**: Stand up Vitest (two projects), Playwright, and ESLint with the "one client folder" guardrail.

**Tasks**:
- [ ] Author `vitest.config.ts` with two `test.projects` (node + jsdom)
- [ ] Register `@testing-library/jest-dom` matchers in `vitest.setup.ts`
- [ ] Author `playwright.config.ts` with chromium-only and a `webServer` running `pnpm build && pnpm start`
- [ ] Author `.eslintrc.json` extending `next/core-web-vitals` and banning `'use client'` outside `components/client/**` via `no-restricted-syntax`

**Files**:
- `vitest.config.ts` — node project (`include: ['lib/data/**/*.test.ts', 'lib/queries/**/*.test.ts', 'lib/banner/**/*.test.ts']`) and jsdom project (`environment: 'jsdom'`, `include: ['lib/favorites/**/*.test.ts', 'components/client/**/*.test.tsx']`, `setupFiles: ['./vitest.setup.ts']`)
- `vitest.setup.ts` — registers `@testing-library/jest-dom` matchers
- `playwright.config.ts` — chromium-only, `webServer: { command: 'pnpm build && pnpm start', port: 3000, reuseExistingServer: !process.env.CI }`
- `.eslintrc.json` — extends `next/core-web-vitals` plus path-scoped `'use client'` ban

### Phase 3: App shell + Tailwind tokens (~10 min)

**Goal**: Minimal dark-themed app shell that builds, plus a placeholder snapshot so TASK-02 isn't blocking.

**Tasks**:
- [ ] Author `app/layout.tsx` with `<html lang="en" data-theme="dark">`, viewport meta, system font stack, empty `<main>` placeholder (NO bottom nav — that lands in TASK-05)
- [ ] Author `app/globals.css` with Tailwind v4 import and `@theme` brand tokens from design brief §9
- [ ] Author `app/page.tsx` placeholder: `<main>JSNation 2026</main>`
- [ ] Commit `data/schedule.snapshot.json` placeholder

**Files**:
- `app/layout.tsx` — root layout with dark theme, viewport, system fonts, empty `<main>`
- `app/globals.css` — `@import "tailwindcss";` + `@theme` block (bg `#0a0a0a`, surface `#161616`, accent `#FFD300`, InPerson `#22c55e`, type scale 32/24/18/16/14/12)
- `app/page.tsx` — minimal `<main>JSNation 2026</main>` placeholder so `pnpm build` succeeds
- `data/schedule.snapshot.json` — committed placeholder: `{ "event": null, "sessions": [], "speakers": [], "fetchedAt": "1970-01-01T00:00:00Z" }`

---

## Out of Scope

- Any data normalization, Zod schemas, or `getSchedule()` loader (→ TASK-02)
- Bottom nav, schedule layout, session card (→ TASK-05)
- Any client component (→ TASK-04, TASK-06, TASK-07)
- Refresh script implementation (→ TASK-02)
- Vercel config (→ TASK-09)
- Production tests of any kind (this task only verifies the runner itself works: 0 tests, exit 0)

---

## Technical Decisions

| Decision | Options Considered | Chosen | Reasoning |
|---|---|---|---|
| Scaffold method | `create-next-app`, hand-roll, Turborepo template | Hand-roll | `create-next-app` balks at existing `CLAUDE.md` and adds cruft we'd immediately delete |
| Test runner | Vitest (two projects), Jest, Node `--test` | Vitest (two projects) | Native ESM + TS, single config, projects API avoids per-test env switches |
| Component test environment | jsdom, happy-dom, real browser via Playwright CT | jsdom | RTL only needs DOM globals; jsdom is lighter than happy-dom for our matrix |
| E2E runner | Playwright (chromium only), Playwright (all browsers), Cypress | Playwright (chromium only) | Single spec, no cross-browser need for a demo app |
| Lint guardrail for `'use client'` | Convention (docs), ESLint `no-restricted-syntax`, custom rule | ESLint `no-restricted-syntax` | Enforces "one client folder" rule mechanically, not by convention |
| Snapshot bootstrap | Skip until TASK-02, committed empty JSON, fetch at install | Committed empty JSON | Build succeeds offline before TASK-02 lands the real loader |

---

## Verify

```bash
pnpm install
pnpm typecheck
pnpm lint
pnpm test
pnpm e2e --list
pnpm build
pnpm dev &
sleep 3 && curl -s http://localhost:3000 | grep -q "JSNation 2026"
```

---

## Done

- [x] `package.json`, `tsconfig.json`, `next.config.ts`, `postcss.config.mjs`, `.gitignore` committed
- [x] `vitest.config.ts`, `vitest.setup.ts`, `playwright.config.ts`, `.eslintrc.json` committed
- [x] `app/layout.tsx`, `app/globals.css`, `app/page.tsx` committed
- [x] `data/schedule.snapshot.json` placeholder committed
- [x] `pnpm test` reports "0 tests", exit code 0
- [x] `pnpm test:watch` starts without error
- [x] `pnpm e2e --list` lists 0 specs without error
- [x] `pnpm build` succeeds against the placeholder snapshot
- [x] Lockfile (`pnpm-lock.yaml`) committed
- [x] `pnpm-workspace.yaml` allowlist for native builds (not in original spec — required by pnpm 11)

---

## Refs

- Approved plan: `/Users/aleks.petrov/.claude/plans/let-s-plan-complete-execution-velvet-stallman.md` §M0
- Design brief §9 (visual tokens)
- `CLAUDE.md` — strict TS, Tailwind, 100-char line limit

---

## Notes

**Execution observations**:

- **pnpm 11 build-script gate**: Native postinstalls for `esbuild`, `sharp`, `unrs-resolver` are blocked by default in pnpm 11; even `pnpm typecheck` errors out until they're allowlisted. The v10 escape hatch (`pnpm.onlyBuiltDependencies` in `package.json`) is **not** honored. The fix is `pnpm-workspace.yaml` with both `allowBuilds` and `onlyBuiltDependencies` keys (yes, in a non-workspace project). Codified in `.agent/system/tech-stack-patterns.md` § "pnpm 11".
- **Next version pin**: stayed on Next 15.5 instead of Next 16. Next 16 removed `next lint`, which the task script depends on. Bumping to Next 16 means switching to `eslint .` + flat config — deferred to a future task.
- **`<main>` placement**: doc said "empty `<main>` placeholder" in `layout.tsx` AND `<main>JSNation 2026</main>` in `page.tsx`. Implementing both literally would nest invalid HTML. Resolved by putting `<main>` only in `page.tsx`.
- **`@types/node` mismatch**: installed `@22.19` but target runtime is Node 24 LTS. Low priority — types still resolve. Worth bumping to `^24` in a cleanup pass.
- **React/Next skill review**: ran `vercel:nextjs` and `vercel:react-best-practices` skills against the scaffold. Zero findings — both layout.tsx and page.tsx are too minimal to trigger any rule. Skills will earn their keep starting TASK-05.

---

**Last Updated**: 2026-05-22 (completion)
