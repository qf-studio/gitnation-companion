# Tech Stack Patterns

How we use Next.js App Router, React 19, Tailwind v4, Vitest, Playwright, and pnpm 11 in this project. Concrete patterns and gotchas, not framework tutorials.

**Updated**: 2026-05-22 (after TASK-01 scaffold)

---

## Next.js 15 App Router

### File conventions in use

- `app/layout.tsx` — root layout. Exports `metadata` and `viewport` (not the deprecated `metadata.viewport` field). Renders `<html>` + `<body>`. **Does NOT render `<main>`** — that lives in `app/page.tsx` to avoid `<main>` nesting when pages provide their own.
- `app/page.tsx` — schedule route. Server Component by default.
- `app/globals.css` — imported once in `layout.tsx`. Tailwind + design tokens.

### RSC by default

Every component is a Server Component unless it is in `components/client/`. The `'use client'` directive is banned outside that folder by ESLint (`no-restricted-syntax` selector: `ExpressionStatement[directive='use client']`).

Three client islands, total:
1. `HappeningNowBanner` — needs `useEffect` for clock polling.
2. `FavoriteToggle` — writes `localStorage`.
3. `FavoritesGate` — reads `localStorage` to gate `/favorites` rendering.

Anything else is server-rendered.

### Async APIs (Next 15+)

In Next 15, `params`, `searchParams`, `cookies()`, `headers()` are async. Pattern:

```ts
export default async function DetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  // ...
}
```

This will land in TASK-06's `/sessions/[slug]` and `/speakers/[id]` routes.

### Runtime

No `export const runtime = 'edge'` anywhere. We default to Node.js / Fluid Compute. Required because:
- `sanitize-html` uses Node APIs.
- Build-time Zod validation against the committed snapshot.
- No per-region latency need (static content).

### Why we use `next lint` (not `eslint .`)

Next 15's `lint` script wraps ESLint 8 with `next/core-web-vitals` preset and the right TSX parser. Next 16 removes `next lint`; when we upgrade, the script must migrate to `eslint .` with `eslint.config.mjs` flat config. Tracked as future work.

---

## React 19

### What we actually use from React 19

- Server Components everywhere (Next App Router default).
- New `metadata` / `viewport` exports from layouts (Next, not React, but tied to React 19 RSC support).
- No `use()` hook usage yet. May appear in TASK-06 if a page needs to read a promise client-side; unlikely.

### Client component review checklist

When adding to `components/client/`, run through these (from `vercel:react-best-practices`):
- Pass primitive props where possible (cheap to serialize across the RSC boundary).
- No async client components — that's a build error in Next 15+, but worth knowing.
- Hoist static JSX out of components (`rendering-hoist-jsx`).
- Use `useDeferredValue` / `startTransition` for expensive client work — relevant for the search page (TASK-06).

---

## Tailwind CSS v4

### Setup

- `app/globals.css` opens with `@import "tailwindcss";`.
- `postcss.config.mjs` lists exactly one plugin: `@tailwindcss/postcss`.
- **No `tailwind.config.js`.** Tokens live in CSS via `@theme { ... }`.

### Design tokens (from design brief §9)

```css
@theme {
  --color-bg: #0a0a0a;
  --color-surface: #161616;
  --color-accent: #FFD300;
  --color-in-person: #22c55e;

  --text-h1: 32px;
  --text-h2: 24px;
  --text-h3: 18px;
  --text-body: 16px;
  --text-meta: 14px;
  --text-micro: 12px;

  --font-sans: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto,
    "Helvetica Neue", Arial, sans-serif;
}
```

These become Tailwind utilities automatically: `bg-bg`, `bg-surface`, `text-accent`, `text-h1`, `font-sans`, etc.

### Fonts: why we don't use `next/font`

System font stack only. `next/font` exists to optimize **custom or Google** fonts (eliminates layout shift, hosts files locally, generates preload tags). For pure system fonts that ship with the OS, the network cost is already zero. Using `next/font` for them would add complexity without benefit. **Do not "fix" this.**

---

## TypeScript

- `strict: true` in `tsconfig.json`. No `any` without an inline justification comment.
- Path alias: `@/*` → repo root. Use it for imports across `lib/`, `components/`, `app/`.
- `noEmit: true` — TS is type-checking only; Next handles emit.
- `moduleResolution: bundler` — Next 15's recommendation for App Router.

---

## Testing

### Vitest (two projects)

`vitest.config.ts` declares two projects so we don't pay jsdom cost for pure-logic tests:

| Project | Env | Includes |
|---|---|---|
| `node` | `node` | `lib/data/**/*.test.ts`, `lib/queries/**/*.test.ts`, `lib/banner/**/*.test.ts` |
| `jsdom` | `jsdom` | `lib/favorites/**/*.test.ts`, `components/client/**/*.test.tsx` |

Only the jsdom project loads `vitest.setup.ts` (which registers `@testing-library/jest-dom/vitest` matchers). Pure-logic test files must NOT import RTL or jest-dom.

**Why `--passWithNoTests`**: scaffold has zero tests until TASK-02. Without the flag, Vitest 3 exits non-zero on an empty run, breaking CI.

### Playwright (single spec)

`playwright.config.ts`:
- `chromium` only — no Firefox/WebKit. Demo app, no cross-browser need.
- `webServer.command = 'pnpm build && pnpm start'` — E2E runs against the production build, not dev. Catches RSC issues that dev's HMR hides.
- `--pass-with-no-tests` flag in the script keeps the scaffold green before TASK-08 lands the spec.

The single spec (when written) lives at `e2e/demo-flow.spec.ts` and exercises the workshop demo flow: schedule → favorite → favorites page → search.

---

## pnpm 11

### Native build allowlist

**Trap that bit us during TASK-01**: pnpm 11 refuses to run any script (including `pnpm typecheck`) if any dependency has unapproved postinstall build scripts. For us that's `esbuild`, `sharp`, and `unrs-resolver`.

**Fix**: `pnpm-workspace.yaml` (yes, even in a non-monorepo project):

```yaml
allowBuilds:
  esbuild: true
  sharp: true
  unrs-resolver: true
onlyBuiltDependencies:
  - esbuild
  - sharp
  - unrs-resolver
```

The `pnpm.onlyBuiltDependencies` field in `package.json` (the v10 location) is **not** honored by pnpm 11. Always put this in `pnpm-workspace.yaml`.

### Lockfile

`pnpm-lock.yaml` is committed. Reproducibility on Vercel + CI depends on it.

---

## Module-level Zod validation (planned for TASK-02)

When `lib/data/getSchedule.ts` lands, it will look like:

```ts
import schedule from '@/data/schedule.snapshot.json' assert { type: 'json' };
import { ScheduleSchema } from './schema';

export const SCHEDULE = ScheduleSchema.parse(schedule); // fail loud at build time
```

The `parse` (not `safeParse`) at module load is intentional: upstream drift should fail the build, not silently render an empty schedule.

---

## What this file is NOT

- Not a Next.js tutorial. Read `vercel:nextjs` skill for general guidance.
- Not a React best-practices catalog. Read `vercel:react-best-practices` for the full 64-rule list.
- Not the design system. Read `.agent/system/design-brief.md` §9 for tokens and visual rules.

This file documents only the choices that are *specific to this project* and would surprise a contributor walking in from outside.
