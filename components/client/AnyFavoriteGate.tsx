'use client';

import { useSyncExternalStore, type ReactNode } from 'react';
import { isFavorite, subscribe } from '@/lib/favorites/store';

interface AnyFavoriteGateProps {
  sessionIds: number[];
  children: ReactNode;
}

/**
 * Renders children only when at least one of the given session IDs is in
 * the favorites store. Used to hide time-slot markers when none of the
 * slot's sessions have been saved.
 */
export function AnyFavoriteGate({ sessionIds, children }: AnyFavoriteGateProps) {
  const anyFav = useSyncExternalStore(
    subscribe,
    () => sessionIds.some((id) => isFavorite(id)),
    () => false,
  );
  return anyFav ? <>{children}</> : null;
}
