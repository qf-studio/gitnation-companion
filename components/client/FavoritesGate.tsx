'use client';

import { useSyncExternalStore, type ReactNode } from 'react';
import { isFavorite, subscribe } from '@/lib/favorites/store';

interface FavoritesGateProps {
  sessionId: number;
  children: ReactNode;
}

export function FavoritesGate({ sessionId, children }: FavoritesGateProps) {
  const isFav = useSyncExternalStore(
    subscribe,
    () => isFavorite(sessionId),
    () => false,
  );
  return isFav ? <>{children}</> : null;
}
