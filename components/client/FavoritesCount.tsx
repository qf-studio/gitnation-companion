'use client';

import { useSyncExternalStore } from 'react';
import { listFavorites, subscribe } from '@/lib/favorites/store';

interface FavoritesCountProps {
  /** When 'digit', render the raw number; when 'subtitle', render "{N} sessions starred". */
  variant?: 'digit' | 'subtitle';
}

export function FavoritesCount({ variant = 'subtitle' }: FavoritesCountProps) {
  const count = useSyncExternalStore(
    subscribe,
    () => listFavorites().length,
    () => 0,
  );

  if (variant === 'digit') return <>{count}</>;
  return <>{count} {count === 1 ? 'session' : 'sessions'} starred</>;
}
