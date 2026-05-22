// @vitest-environment node
import { describe, expect, it } from 'vitest';

describe('SSR safety', () => {
  it('imports without throwing', async () => {
    await expect(import('./store')).resolves.toBeDefined();
  });

  it('listFavorites returns [] in node (no window)', async () => {
    const { listFavorites } = await import('./store');
    expect(listFavorites()).toEqual([]);
  });

  it('addFavorite is a silent no-op (no throw, no state change)', async () => {
    const { addFavorite, listFavorites } = await import('./store');
    expect(() => addFavorite(5)).not.toThrow();
    expect(listFavorites()).toEqual([]);
  });
});
