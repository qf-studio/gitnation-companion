# TASK-04: Favorites Store (M3, TDD, jsdom)

**Status**: ⏸️ Blocked on TASK-01
**Created**: 2026-05-22
**Assignee**: Worker subagent
**Effort**: ~1h
**Prereqs**: [TASK-01](./TASK-01-scaffold-and-data-layer.md)
**Blocks**: TASK-06
**Parallel-safe with**: [TASK-03](./TASK-03-query-layer-banner-state.md) (disjoint directories)

---

## Context

**Problem**:
Favorites are the only piece of mutable user state, and there is no backend or auth to persist them. We need a tiny client store that survives reloads, stays in sync across tabs, and is safe to import from Server Components.

**Goal**:
Build a `localStorage`-backed favorites store that is (a) trivially small, (b) SSR-safe (imported in Server Components without throwing), (c) cross-tab synchronized via the `storage` event, and (d) same-tab synchronized via an internal `EventTarget` (the `storage` event fires only on *other* tabs).

---

## Acceptance Criteria

- [ ] `pnpm test lib/favorites` green (jsdom + node projects)
- [ ] `pnpm typecheck` clean
- [ ] Importing `lib/favorites/store` in a node test file does not throw
- [ ] All 5 subscription cases (same-tab, cross-tab, unrelated key, double-add idempotent, unsubscribe) pass
- [ ] SSR safety test passes: importing the store in a node environment is a no-op, never throws

---

## Implementation

### Phase 1: Tests first (jsdom + node)

**Goal**: Lock behavior in tests before any implementation exists.

**Tasks**:
- [ ] Write jsdom test for `addFavorite(id)`, `removeFavorite(id)`, `toggle(id)`, `isFavorite(id)`, `listFavorites(): number[]`
- [ ] Assert storage key constant `companion:favorites:v1`
- [ ] Bad input safety: corrupted JSON in storage → `listFavorites()` returns `[]`, no throw
- [ ] Empty key: never-set key → `listFavorites()` returns `[]`
- [ ] Wrong shape: stored value is an object instead of array → returns `[]`
- [ ] `subscribe(cb)` case 1: fires when same-tab `toggle()` runs
- [ ] `subscribe(cb)` case 2: fires when a `storage` event arrives for our key (simulate via `window.dispatchEvent(new StorageEvent(...))`)
- [ ] `subscribe(cb)` case 3: does NOT fire for unrelated `storage` events (different key)
- [ ] `subscribe(cb)` case 4: returns an unsubscribe function that actually detaches both listeners
- [ ] `subscribe(cb)` case 5 / Idempotency: `addFavorite(5)` twice yields `[5]`, not `[5, 5]`
- [ ] Write node-project SSR safety test: importing `./store` does not throw; `listFavorites()` returns `[]`; `addFavorite(5)` is a no-op (no throw, no state change)

**Files**:
- `lib/favorites/store.test.ts` — jsdom project, full behavior + 5 subscription cases
- `lib/favorites/store.ssr.test.ts` — node project (no jsdom), SSR safety test

### Phase 2: Implement

**Goal**: Make the tests pass with the smallest viable surface.

**Tasks**:
- [ ] Guard every `window.localStorage` access behind `typeof window !== 'undefined'`
- [ ] Create internal `EventTarget` for same-tab `subscribe`
- [ ] `subscribe` attaches `window.addEventListener('storage', ...)` AND internal listener; returns combined unsubscribe
- [ ] Export only plain functions (no class, no React)

**Files**:
- `lib/favorites/store.ts` — store implementation

---

## Out of Scope

- `FavoriteToggle` button component (→ TASK-06)
- `FavoritesGate` server-list / client-gate component (→ TASK-06)
- Favorites page wiring (→ TASK-06)

---

## Technical Decisions

| Decision | Options Considered | Chosen | Reasoning |
|---|---|---|---|
| Storage location | localStorage, sessionStorage, IndexedDB, cookies | `localStorage` | No backend, no auth; localStorage survives reloads |
| Key versioning | unversioned key, `:v1` suffix | `:v1` suffix | Lets us migrate schema later without colliding |
| Cross-tab sync | `storage` event, BroadcastChannel, polling | `storage` event | Native, free, works across windows of same origin |
| Same-tab sync | Re-read on access, internal `EventTarget`, custom event bus | Internal `EventTarget` | `storage` doesn't fire in writing tab |
| Data shape | `number[]` of session IDs, `Set<number>`, richer object | `number[]` of session IDs | Tiny, no need for richer state |
| SSR guard | `typeof window !== 'undefined'`, dynamic import only | `typeof window !== 'undefined'` | Works in RSC import graph without errors |

---

## Verify

```bash
pnpm test lib/favorites
pnpm typecheck
```

---

## Done

- [ ] Jsdom test file covers all 5 subscription cases and bad-input/empty/wrong-shape paths
- [ ] Node SSR safety test passes without jsdom
- [ ] `lib/favorites/store.ts` exports plain functions, no React, no class
- [ ] Both test projects pass under `pnpm test lib/favorites`
- [ ] `pnpm typecheck` is clean

---

## Refs

- Approved plan: `/Users/aleks.petrov/.claude/plans/let-s-plan-complete-execution-velvet-stallman.md` §M3
- Design brief §7.5 (favorites screen spec)

---

## Notes

_(execution-time observations go here)_

---

**Last Updated**: 2026-05-22
