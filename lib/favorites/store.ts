export const STORAGE_KEY = 'companion:favorites:v1';

const INTERNAL_EVENT = 'fav';

// Only exists in browser; null in SSR/Node
const internalBus: EventTarget | null =
  typeof window !== 'undefined' ? new EventTarget() : null;

function read(): number[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw === null) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((x): x is number => typeof x === 'number');
  } catch {
    return [];
  }
}

function write(ids: number[]): void {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  internalBus!.dispatchEvent(new Event(INTERNAL_EVENT));
}

export function addFavorite(id: number): void {
  if (typeof window === 'undefined') return;
  const current = read();
  if (current.includes(id)) return;
  write([...current, id]);
}

export function removeFavorite(id: number): void {
  if (typeof window === 'undefined') return;
  write(read().filter((x) => x !== id));
}

export function toggle(id: number): void {
  if (typeof window === 'undefined') return;
  isFavorite(id) ? removeFavorite(id) : addFavorite(id);
}

export function isFavorite(id: number): boolean {
  return read().includes(id);
}

export function listFavorites(): number[] {
  return read();
}

export function subscribe(cb: () => void): () => void {
  if (typeof window === 'undefined') return () => {};

  const storageHandler = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) cb();
  };
  const internalHandler = () => cb();

  window.addEventListener('storage', storageHandler);
  internalBus!.addEventListener(INTERNAL_EVENT, internalHandler);

  return () => {
    window.removeEventListener('storage', storageHandler);
    internalBus!.removeEventListener(INTERNAL_EVENT, internalHandler);
  };
}
