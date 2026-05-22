'use client';

import { useSyncExternalStore, type ReactNode } from 'react';
import { listFavorites, subscribe } from '@/lib/favorites/store';

interface FavoritesEmptyProps {
  children: ReactNode;
}

/**
 * Renders `children` only when the favorites count is exactly zero on the
 * client. During SSR / before subscription kicks in, returns null — the
 * empty state appears once the client has confirmed the count is zero.
 */
export function FavoritesEmpty({ children }: FavoritesEmptyProps) {
  const count = useSyncExternalStore(
    subscribe,
    () => listFavorites().length,
    () => 1,
  );
  return count === 0 ? <>{children}</> : null;
}
