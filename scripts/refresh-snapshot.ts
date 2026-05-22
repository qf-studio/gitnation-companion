#!/usr/bin/env tsx
/**
 * refresh-snapshot
 *
 * Pulls the latest JSNation event JSON from gitnation.com, normalizes it, and
 * writes both the raw upstream payload and the normalized snapshot to disk.
 *
 * Failure mode: on any network or non-200 response, log the issue and exit 0
 * so CI never breaks because upstream is flaky. The committed snapshot is the
 * source of truth — staleness is fine, build failure is not.
 *
 * Usage: pnpm refresh:snapshot
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { normalize, RawEnvelopeSchema } from '../lib/data/normalize.js';
import { ScheduleSchema, type Schedule } from '../lib/data/schema.js';

const EVENT_SLUG = 'jsnation-2026';
const EVENT_LISTING_URL = `https://gitnation.com/events/${EVENT_SLUG}`;
const USER_AGENT = 'Mozilla/5.0 (compatible; gitnation-companion-refresh/1.0)';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const RAW_OUT = resolve(ROOT, 'data/upstream/jsnation-2026.raw.json');
const SNAPSHOT_OUT = resolve(ROOT, 'data/schedule.snapshot.json');

function log(msg: string): void {
  // eslint-disable-next-line no-console -- this is a CLI script
  console.log(`[refresh-snapshot] ${msg}`);
}

async function readJsonIfExists<T>(path: string): Promise<T | null> {
  try {
    const buf = await readFile(path, 'utf8');
    return JSON.parse(buf) as T;
  } catch {
    return null;
  }
}

async function fetchBuildId(): Promise<string | null> {
  const res = await fetch(EVENT_LISTING_URL, { headers: { 'user-agent': USER_AGENT } });
  if (!res.ok) {
    log(`event listing returned HTTP ${res.status}; keeping existing snapshot`);
    return null;
  }
  const html = await res.text();
  const match = html.match(/"buildId":"([^"]+)"/);
  if (!match) {
    log('buildId not found in event listing HTML; keeping existing snapshot');
    return null;
  }
  return match[1];
}

async function fetchRaw(buildId: string): Promise<unknown | null> {
  const url = `https://gitnation.com/_next/data/${buildId}/events/${EVENT_SLUG}.json`;
  const res = await fetch(url, { headers: { 'user-agent': USER_AGENT } });
  if (!res.ok) {
    log(`upstream JSON returned HTTP ${res.status} from ${url}; keeping existing snapshot`);
    return null;
  }
  return res.json();
}

function diffSummary(prev: Schedule | null, next: Schedule): string {
  if (!prev) return `initial snapshot: ${next.sessions.length} sessions, ${next.speakers.length} speakers`;
  const prevSessionIds = new Set(prev.sessions.map((s) => s.id));
  const nextSessionIds = new Set(next.sessions.map((s) => s.id));
  const prevSpeakerIds = new Set(prev.speakers.map((s) => s.id));
  const nextSpeakerIds = new Set(next.speakers.map((s) => s.id));

  const addedSessions = [...nextSessionIds].filter((id) => !prevSessionIds.has(id)).length;
  const removedSessions = [...prevSessionIds].filter((id) => !nextSessionIds.has(id)).length;
  const addedSpeakers = [...nextSpeakerIds].filter((id) => !prevSpeakerIds.has(id)).length;
  const removedSpeakers = [...prevSpeakerIds].filter((id) => !nextSpeakerIds.has(id)).length;

  return `sessions: +${addedSessions} / -${removedSessions} (total ${next.sessions.length}); speakers: +${addedSpeakers} / -${removedSpeakers} (total ${next.speakers.length})`;
}

async function main(): Promise<void> {
  let raw: unknown | null = null;
  try {
    const buildId = await fetchBuildId();
    if (!buildId) {
      process.exit(0);
    }
    log(`buildId = ${buildId}`);
    raw = await fetchRaw(buildId);
  } catch (err) {
    log(`network error: ${(err as Error).message}; keeping existing snapshot`);
    process.exit(0);
  }
  if (raw == null) {
    process.exit(0);
  }

  // Validate raw upstream shape (loud failure — schema drift is a real bug).
  const rawParsed = RawEnvelopeSchema.parse(raw);

  // Normalize → validate normalized output.
  const next = ScheduleSchema.parse(normalize(rawParsed));

  const prev = await readJsonIfExists<Schedule>(SNAPSHOT_OUT);
  log(diffSummary(prev, next));

  const datedCount = next.sessions.filter((s) => s.startsAt !== null).length;
  log(`dated sessions: ${datedCount}`);

  await mkdir(dirname(RAW_OUT), { recursive: true });
  await writeFile(RAW_OUT, JSON.stringify(raw, null, 2) + '\n', 'utf8');
  await writeFile(SNAPSHOT_OUT, JSON.stringify(next, null, 2) + '\n', 'utf8');
  log(`wrote ${RAW_OUT}`);
  log(`wrote ${SNAPSHOT_OUT}`);
}

main().catch((err) => {
  // Unexpected error (e.g. schema drift). Surface it loudly — we don't want
  // a silent corruption of the snapshot.
  // eslint-disable-next-line no-console -- this is a CLI script
  console.error('[refresh-snapshot] FAILED:', err);
  process.exit(1);
});
