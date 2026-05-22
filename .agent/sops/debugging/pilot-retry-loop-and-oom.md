# SOP — Pilot Worker: Retry Loops on Completed Work + OOM Triage

**Created**: 2026-05-22
**When to read**: a Pilot worker keeps failing on a re-opened issue, or you see SIGKILL exit 137 in the daemon log/DB

---

## Symptom matrix

| Surface error | Where seen | Real meaning |
|---|---|---|
| `no_changes: branch has no commits relative to base (PR guard)` | sub-issue execution | worker produced no diff because work is already on `main` |
| `quality gates failed after 2 auto-retries` | sub-issue execution | worker produced a *redundant* diff that broke `pnpm test` (e.g. re-declared exports) |
| `PR creation refused: title is not a conventional commit: empty title` | parent task | downstream of empty sub-issue output — title-generator had nothing to summarize |
| `sub-issue execution failed: sub-issue N failed: <any of above>` | parent task | parent treats child failure as retryable → **infinite loop** |
| `oom_killed: Process killed by SIGKILL (exit code 137)` | sub-issue execution | worker subprocess heap exceeded host RAM budget (typically during `pnpm install`) |
| `stale queued/running task recovered (...)` | any task | daemon restarted while task was alive — one-shot; safe to ignore unless it repeats |

---

## Root cause #1 — retry loop on already-merged work

**Pilot lacks an `already-implemented` worker exit code.** When a smoke-test issue is re-opened (or the worker races a contributor), the worker is in an unwinnable position:

1. Produce no diff → PR guard rejects with `no_changes`
2. Produce a redundant diff → quality gates reject (test duplication, etc.)
3. Parent task sees `sub-issue failed` → retries → step 1 again

One session burned ~143k worker tokens across 4 retry cycles before the loop was broken manually.

### Fix when you observe a loop

1. **Break the loop fast**: close the GitHub issue with `gh issue close <n> --reason completed`. Pilot will not pick up the next retry on a closed issue. The currently-running worker drains naturally (~2 min).
2. **Don't `pilot stop` the daemon** — that kills *all* projects' workers and produces `stale running task recovered` rows everywhere.
3. **Don't re-open smoke-test issues a second time** — the loop will start again. If you need pipeline verification, write a tiny throwaway issue ("add a single file `pilot-test.txt`") rather than re-opening a completed one.

### Diagnostic queries

```bash
# Current state of gitnation runs (UTC times; subtract 2h for CEST)
sqlite3 -readonly ~/.pilot/data/pilot.db "
SELECT task_id, status, substr(created_at,1,19), substr(completed_at,1,19), substr(error,1,80)
FROM executions
WHERE project_path LIKE '%gitnation%'
ORDER BY created_at DESC LIMIT 15"

# Only runs that actually consumed worker tokens (filters out queue artifacts)
sqlite3 -readonly ~/.pilot/data/pilot.db "
SELECT task_id, tokens_total, peak_rss_mb, files_changed, error
FROM executions
WHERE project_path LIKE '%gitnation%' AND tokens_total > 0
ORDER BY created_at DESC LIMIT 10"

# Active worktrees (also reveals zombie ones if daemon was kill -9'd)
git worktree list
```

---

## Root cause #2 — OOM during `pnpm install`

Pilot worktrees start **bare**: `node_modules/` and `.next/` are gitignored, so every worker runs `pnpm install` from scratch. With this project's tree (Next.js + Vitest + Tailwind v4 + Zod + tsx), a cold-store install peaks at **~600–800 MB RSS** during the linking phase, well above the **344–378 MB ceiling** of successful workers. The OS sends `SIGKILL` (exit 137) before Node can throw, so Pilot has no recoverable error to surface.

### Mitigations (in priority order)

1. **Pre-warm the pnpm content-addressable store on the host.** Set `PNPM_STORE_DIR=/tmp/pnpm-store` (or a persistent path) in the Pilot daemon env and run `pnpm install --frozen-lockfile` once on the main tree before any worker spawns. Workers then do store-link-only, cutting install RSS to ~80–100 MB.

2. **Cap Node heap in `package.json` test/build scripts.** A clean throw with `--max-old-space-size=512` gives Pilot a recoverable exit code instead of a hard SIGKILL:

   ```json
   "test": "NODE_OPTIONS='--max-old-space-size=512' vitest run"
   ```

   512 MB has headroom above the 378 MB observed ceiling but forces a clean OOM before the OS gets involved.

3. **Force `--frozen-lockfile` everywhere.** Without it pnpm may attempt a resolution pass. Add it to scripts and to the worker install command. Safe because the lockfile is committed.

### Files most likely to inflate worker heap once `pnpm install` succeeds

| File | Size | Risk |
|---|---|---|
| `data/upstream/jsnation-2026.raw.json` | 265 KB | parses to ~2–3 MB V8 heap |
| `data/schedule.snapshot.json` | 129 KB | ~1 MB V8 heap |
| `pnpm-lock.yaml` | 192 KB | only matters during install |
| `data/__fixtures__/*.json` | <11 KB each | negligible |

None of these alone triggers OOM. They become a problem only if the worker loads all three + runs the Zod schema parse in the same process **without** the heap cap from mitigation #2.

---

## Prevention checklist

- [ ] After Pilot pipeline changes, **don't re-open completed issues** to verify — use a fresh throwaway issue
- [ ] Before re-opening an issue intentionally, add the `pilot` label and a comment explicitly noting "expected outcome: `no_changes`, will close on first failure"
- [ ] Apply OOM mitigations #1 and #2 before letting Pilot tackle any task that touches large fixtures (TASK-06 may qualify)
- [ ] Watch the daemon for **single instance** — `pgrep -lf 'pilot start'` should return exactly one row
- [ ] DB times are **UTC**; convert before reasoning about durations

---

## Related

- Memory: `[[project_pilot_label_workflow]]` — when `pilot` label gets applied
- Task IDs are **not repo-scoped** in `pilot logs <id>` — `GH-5` in this repo collides with `GH-5` in `alekspetrov/pilot`. Always filter by `project_path` in DB queries.
- Upstream feature request to file: add `already_implemented` worker exit code so parent tasks treat "work is done" as success, not retryable failure
