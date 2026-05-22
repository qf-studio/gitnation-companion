import { describe, expect, it } from 'vitest';
import expected from '@/data/__fixtures__/expected-normalized.json';
import { ScheduleSchema } from './schema';

describe('ScheduleSchema', () => {
  it('accepts the golden normalized fixture', () => {
    const result = ScheduleSchema.safeParse(expected);
    if (!result.success) {
      // Surface zod issues on failure so the test output is actionable.
      throw new Error(JSON.stringify(result.error.issues, null, 2));
    }
    expect(result.success).toBe(true);
  });

  it('rejects a snapshot missing the required event field', () => {
    const { event: _event, ...rest } = expected;
    const result = ScheduleSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it('rejects a snapshot where session.startsAt has the wrong type', () => {
    const broken = {
      ...expected,
      sessions: expected.sessions.map((s, i) =>
        i === 0 ? { ...s, startsAt: 1234567890 } : s
      ),
    };
    const result = ScheduleSchema.safeParse(broken);
    expect(result.success).toBe(false);
  });

  it('rejects a snapshot with an invalid session.kind', () => {
    const broken = {
      ...expected,
      sessions: expected.sessions.map((s, i) =>
        i === 0 ? { ...s, kind: 'panel' } : s
      ),
    };
    const result = ScheduleSchema.safeParse(broken);
    expect(result.success).toBe(false);
  });

  it('rejects a snapshot with an invalid session.format value', () => {
    const broken = {
      ...expected,
      sessions: expected.sessions.map((s, i) =>
        i === 1 ? { ...s, format: 'Hybrid' } : s
      ),
    };
    const result = ScheduleSchema.safeParse(broken);
    expect(result.success).toBe(false);
  });
});
