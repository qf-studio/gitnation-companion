# GitNation Conference Companion — Claude Code Configuration

## Context

Conference companion web app for GitNation events. Provides a lightweight, fast schedule browser sourced from `gitnation.com`'s `_next/data/<buildId>/events/<slug>.json` JSON at build time, with a committed snapshot fallback for offline/CI builds.

**Tech Stack**: Next.js (App Router), TypeScript, Vercel (Fluid Compute, Node.js 24 LTS)

**Core Principle**: Build-time data extraction over runtime API calls — no upstream GitNation API exists, so we scrape `_next/data` JSON and commit a snapshot for resilience.

**Last Updated**: 2026-05-22
**Navigator Version**: 6.15.4

---

## Navigator Workflow

Start each session with: `"Start my Navigator session"` — loads `.agent/DEVELOPMENT-README.md`.

Core loop:
1. **Start session** → navigator auto-loads
2. **Load task doc** → only the one relevant to current work
3. **Implement** → follow patterns below
4. **Document** → archive task doc on completion (`/navigator:nav-task`)
5. **Compact** → preserve markers after isolated sub-tasks (`/navigator:nav-compact`)

Natural-language triggers:
- "Start my Navigator session"
- "Archive TASK-XX documentation"
- "Create an SOP for debugging [issue]"
- "Clear context and preserve markers"

---

## Project-Specific Standards

### Architecture
- **Data**: pull from `gitnation.com/_next/data/<buildId>/events/<slug>.json` at build time. Commit a snapshot fallback in the repo so CI builds don't break when upstream rotates its build ID.
- **Rendering**: Static (SSG) where possible. Use ISR (`revalidate`) only for slowly-changing schedule data.
- **No runtime data fetching from GitNation** — everything must be resolvable at build time.

### Delegation
- Pure-logic milestones (M1.2–M1.8) are delegated to a worker subagent for TDD.
- Main thread drives UI (M1.9–M1.13) and deploy (M2.x).

### Code Standards
- **TypeScript**: strict mode, no `any` without justification.
- **Next.js**: Server Components by default; `'use client'` only when interactive state/effects are required.
- **Styling**: Tailwind CSS (when added). No inline styles.
- **Line length**: 100 chars max.
- **Testing**: pure-logic modules require unit tests (TDD for M1.2–M1.8).

### Vercel Conventions
- Prefer `vercel.ts` over `vercel.json` for project config.
- Use Fluid Compute defaults (Node.js 24 LTS) — do not opt into Edge runtime.
- Manage env vars with `vercel env pull` → `.env.local`.
- If AI features are added, route through Vercel AI Gateway using `"provider/model"` strings.

---

## Forbidden Actions

### Navigator
- Don't load all `.agent/` docs at once — defeats token optimization.
- Don't skip the navigator (`DEVELOPMENT-README.md`).
- Don't leave completed work undocumented.

### General
- No Claude Code or AI-tool mentions in commits or code.
- Never commit `.env` files, API keys, or session tokens.
- Don't add runtime calls to the GitNation site — build-time only.
- Don't delete tests without a replacement.
- Don't modify `package.json` dependencies without confirmation.

---

## Documentation Structure

```
.agent/
├── DEVELOPMENT-README.md     ← navigator entry point
├── .nav-config.json          ← Navigator config
├── tasks/                    ← TASK-XX implementation plans
├── system/                   ← living architecture docs
├── sops/                     ← standard operating procedures
│   ├── integrations/
│   ├── debugging/
│   ├── development/
│   └── deployment/
└── grafana/                  ← optional metrics dashboard
```
