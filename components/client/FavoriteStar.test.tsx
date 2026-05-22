import { beforeEach, describe, expect, it } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { FavoriteStar } from './FavoriteStar';
import { STORAGE_KEY, addFavorite, toggle } from '@/lib/favorites/store';

beforeEach(() => {
  window.localStorage.clear();
});

describe('FavoriteStar', () => {
  it('click flips internal state and persists to localStorage', () => {
    render(<FavoriteStar sessionId={42} />);
    const button = screen.getByTestId('favorite-toggle');

    expect(button).toHaveAttribute('aria-pressed', 'false');

    fireEvent.click(button);

    expect(button).toHaveAttribute('aria-pressed', 'true');
    expect(JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? '[]')).toEqual([42]);

    fireEvent.click(button);

    expect(button).toHaveAttribute('aria-pressed', 'false');
    expect(JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? '[]')).toEqual([]);
  });

  it('external toggle() call updates the rendered button via subscription', () => {
    render(<FavoriteStar sessionId={7} />);
    const button = screen.getByTestId('favorite-toggle');

    expect(button).toHaveAttribute('aria-pressed', 'false');

    act(() => {
      toggle(7);
    });

    expect(button).toHaveAttribute('aria-pressed', 'true');
  });

  it('initial render reflects existing localStorage state', () => {
    addFavorite(99);

    render(<FavoriteStar sessionId={99} />);
    const button = screen.getByTestId('favorite-toggle');

    expect(button).toHaveAttribute('aria-pressed', 'true');
  });
});
