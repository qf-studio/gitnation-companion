'use client';

import { useState, useSyncExternalStore } from 'react';
import { isFavorite, subscribe, toggle } from '@/lib/favorites/store';

interface FavoriteStarProps {
  sessionId: number;
  size?: 22 | 26;
}

export function FavoriteStar({ sessionId, size = 22 }: FavoriteStarProps) {
  const isFav = useSyncExternalStore(
    subscribe,
    () => isFavorite(sessionId),
    () => false,
  );
  const [pressed, setPressed] = useState(false);

  return (
    <button
      type="button"
      data-testid="favorite-toggle"
      aria-pressed={isFav}
      aria-label={isFav ? 'Remove from saved' : 'Save session'}
      onClick={() => toggle(sessionId)}
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerCancel={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
      style={{
        appearance: 'none',
        background: 'transparent',
        border: 'none',
        padding: 6,
        margin: 0,
        cursor: 'pointer',
        color: isFav ? 'var(--color-star-on)' : 'var(--color-star-off)',
        transform: pressed ? 'scale(0.82)' : 'scale(1)',
        transition: 'transform .15s cubic-bezier(.4,1.4,.6,1), color .15s ease',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill={isFav ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <polygon points="12 3 14.9 9.3 22 10.2 17 15 18.2 22 12 18.6 5.8 22 7 15 2 10.2 9.1 9.3" />
      </svg>
    </button>
  );
}
