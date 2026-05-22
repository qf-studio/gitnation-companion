# TASK-08: E2E + Quality Gate (M7)

**Status**: 🚫 Cancelled (2026-05-22, scope-reduced) — see GH #9
**Created**: 2026-05-22
**Assignee**: Main thread
**Effort**: ~1h
**Prereqs**: [TASK-06](./TASK-06-detail-speaker-search-favorites-pages.md), [TASK-07](./TASK-07-happening-now-banner.md)
**Blocks**: TASK-09

---

## Context

**Problem**:
We need one end-to-end spec covering the demo flow that the workshop audience will see, plus a single command that gates merges. The Playwright spec exists to catch hydration regressions on `/favorites` — a class of bug that unit tests cannot see.

**Goal**:
Ship a single Playwright spec exercising the schedule → session → favorite → /favorites flow (including a reload-persistence assertion), wire a `pnpm gate` script that runs the full quality gate, and capture mobile Lighthouse scores for the three demo pages.

---

## Acceptance Criteria

- [ ] `pnpm gate` green locally
- [ ] Playwright report shows 1/1 passing
- [ ] Lighthouse scores recorded for 3 pages, all ≥95 mobile
- [ ] `data-testid` attributes added to required elements

---

## Implementation

### Phase 1: Playwright spec

**Goal**: Add `e2e/demo-flow.spec.ts` — a single ~10-step test covering schedule → session → favorite → reload-persistence.

**Tasks**:
- [ ] `goto('/')`
- [ ] `expect(page.getByText('JSNation 2026')).toBeVisible()`
- [ ] `const firstCard = page.getByTestId('session-card').first()`
- [ ] `await firstCard.click()`
- [ ] `expect(page).toHaveURL(/\/sessions\//)`
- [ ] `const fav = page.getByTestId('favorite-toggle')`
- [ ] `await fav.click()`
- [ ] `await expect(fav).toHaveAttribute('aria-pressed', 'true')`
- [ ] `await page.goto('/favorites')`
- [ ] `expect(page.getByTestId('session-card')).toHaveCount(1)`
- [ ] `await page.reload()`
- [ ] `expect(page.getByTestId('session-card')).toHaveCount(1)` (persistence guard)
- [ ] Ensure `data-testid="session-card"` on every session card
- [ ] Ensure `data-testid="favorite-toggle"` on the heart button
- [ ] Add `data-testid` in TASK-05 / TASK-06 if not already present

**Files**:
- `e2e/demo-flow.spec.ts` — single end-to-end demo flow spec
- `app/.../session-card.tsx` — ensure `data-testid="session-card"` attribute
- `app/.../favorite-toggle.tsx` — ensure `data-testid="favorite-toggle"` attribute

### Phase 2: Quality gate command

**Goal**: Single command CI runs and that this task must pass.

**Tasks**:
- [ ] Add `package.json` script: `"gate": "pnpm typecheck && pnpm lint && pnpm test && pnpm e2e && pnpm build"`

**Files**:
- `package.json` — add `gate` script chaining typecheck, lint, test, e2e, build

### Phase 3: Manual Lighthouse

**Goal**: Capture mobile Lighthouse scores for the three demo pages and record them in Notes.

**Tasks**:
- [ ] Run mobile Lighthouse on `/` (Schedule)
- [ ] Run mobile Lighthouse on `/sessions/<slug>` (any dated session)
- [ ] Run mobile Lighthouse on `/favorites` (with one favorite set)
- [ ] Record scores in this task doc's Notes section before closing
- [ ] Verify target ≥95 mobile across the four categories

**Files**:
- `.agent/tasks/TASK-08-e2e-quality-gate.md` — record Lighthouse scores in Notes

---

## Out of Scope

- Cross-browser E2E (firefox / webkit)
- Multi-session favorite scenarios (the single spec is sufficient guard)
- Accessibility automation (Lighthouse manual run is acceptable for v1)

---

## Technical Decisions

| Decision | Options Considered | Chosen | Reasoning |
|---|---|---|---|
| Browser scope | Chromium only / Chromium + Firefox + WebKit | Chromium only | Demo app; cross-browser not in scope |
| Spec count | 1 spec / multiple specs | 1 | Minimum surface that catches the hydration bug class |
| Persistence assertion | None / Reload after toggle | Reload after toggle | Surfaces localStorage + RSC hydration issues |
| Test selectors | Semantic selectors / `data-testid` | `data-testid` | Decouples from copy / structure |

---

## Verify

```bash
pnpm gate
pnpm e2e --reporter=list
```

---

## Done

- [ ] `pnpm gate` green locally
- [ ] Playwright report shows 1/1 passing
- [ ] Lighthouse scores recorded for 3 pages, all ≥95 mobile
- [ ] `data-testid` attributes added to required elements

---

## Refs

- Approved plan §M7

---

## Notes

_(execution-time observations + Lighthouse scores go here)_

Lighthouse mobile scores:
- `/`: TBD
- `/sessions/<slug>`: TBD
- `/favorites`: TBD

---

**Last Updated**: 2026-05-22
