import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  STORAGE_KEY,
  addFavorite,
  isFavorite,
  listFavorites,
  removeFavorite,
  subscribe,
  toggle,
} from './store';

beforeEach(() => {
  window.localStorage.clear();
});

describe('storage key', () => {
  it('uses the versioned key constant', () => {
    expect(STORAGE_KEY).toBe('companion:favorites:v1');
  });
});

describe('listFavorites', () => {
  it('returns [] when key is never set', () => {
    expect(listFavorites()).toEqual([]);
  });

  it('returns [] when stored value is corrupted JSON', () => {
    window.localStorage.setItem(STORAGE_KEY, '{not valid json');
    expect(listFavorites()).toEqual([]);
  });

  it('returns [] when stored value is an object (wrong shape)', () => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ id: 1 }));
    expect(listFavorites()).toEqual([]);
  });
});

describe('addFavorite / isFavorite', () => {
  it('adds an id', () => {
    addFavorite(1);
    expect(listFavorites()).toEqual([1]);
    expect(isFavorite(1)).toBe(true);
  });

  it('is idempotent — adding twice yields one entry', () => {
    addFavorite(5);
    addFavorite(5);
    expect(listFavorites()).toEqual([5]);
  });

  it('returns false for an id that was never added', () => {
    expect(isFavorite(99)).toBe(false);
  });
});

describe('removeFavorite', () => {
  it('removes an existing id', () => {
    addFavorite(2);
    removeFavorite(2);
    expect(listFavorites()).toEqual([]);
    expect(isFavorite(2)).toBe(false);
  });

  it('is a no-op when id is not present', () => {
    addFavorite(3);
    removeFavorite(99);
    expect(listFavorites()).toEqual([3]);
  });
});

describe('toggle', () => {
  it('adds when not present', () => {
    toggle(7);
    expect(isFavorite(7)).toBe(true);
  });

  it('removes when already present', () => {
    addFavorite(7);
    toggle(7);
    expect(isFavorite(7)).toBe(false);
  });
});

describe('subscribe', () => {
  it('case 1: fires on same-tab toggle()', () => {
    const cb = vi.fn();
    const unsub = subscribe(cb);
    toggle(10);
    expect(cb).toHaveBeenCalledTimes(1);
    unsub();
  });

  it('case 2: fires when a storage event arrives for our key', () => {
    const cb = vi.fn();
    const unsub = subscribe(cb);
    window.dispatchEvent(
      new StorageEvent('storage', {
        key: STORAGE_KEY,
        newValue: JSON.stringify([42]),
        storageArea: window.localStorage,
      }),
    );
    expect(cb).toHaveBeenCalledTimes(1);
    unsub();
  });

  it('case 3: does NOT fire for storage events with a different key', () => {
    const cb = vi.fn();
    const unsub = subscribe(cb);
    window.dispatchEvent(
      new StorageEvent('storage', {
        key: 'some:other:key',
        newValue: 'whatever',
      }),
    );
    expect(cb).not.toHaveBeenCalled();
    unsub();
  });

  it('case 4: unsubscribe detaches both listeners', () => {
    const cb = vi.fn();
    const unsub = subscribe(cb);
    unsub();

    toggle(20);
    window.dispatchEvent(
      new StorageEvent('storage', { key: STORAGE_KEY, newValue: '[]' }),
    );
    expect(cb).not.toHaveBeenCalled();
  });

  it('case 5: multiple calls to addFavorite with same id fire subscribe once per write', () => {
    const cb = vi.fn();
    const unsub = subscribe(cb);
    addFavorite(5);
    addFavorite(5); // idempotent — no write, no event
    expect(cb).toHaveBeenCalledTimes(1);
    unsub();
  });
});
