import { beforeEach, describe, expect, it } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import { FavoritesGate } from './FavoritesGate';
import { addFavorite, toggle } from '@/lib/favorites/store';

beforeEach(() => {
  window.localStorage.clear();
});

describe('FavoritesGate', () => {
  it('renders nothing when not favorited, then renders children once favorited', () => {
    render(
      <FavoritesGate sessionId={5}>
        <span data-testid="gated">visible</span>
      </FavoritesGate>,
    );

    expect(screen.queryByTestId('gated')).toBeNull();

    act(() => {
      toggle(5);
    });

    expect(screen.getByTestId('gated')).toBeInTheDocument();
  });

  it('renders children immediately when storage already has the favorite on mount', () => {
    addFavorite(11);

    render(
      <FavoritesGate sessionId={11}>
        <span data-testid="gated">visible</span>
      </FavoritesGate>,
    );

    expect(screen.getByTestId('gated')).toBeInTheDocument();
  });
});
