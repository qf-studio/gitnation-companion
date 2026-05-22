import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { HappeningNowBanner } from './HappeningNowBanner';
import type { MinimalSession } from '@/lib/banner/state';

vi.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams(),
}));

function makeSessions(): MinimalSession[] {
  return [
    {
      id: 1,
      slug: 'past-talk',
      title: 'Past Talk',
      startsAt: '2026-06-12T08:00:00Z',
      endsAt: '2026-06-12T09:00:00Z',
    },
    {
      id: 2,
      slug: 'live-talk',
      title: 'Live Talk',
      startsAt: '2026-06-12T10:00:00Z',
      endsAt: '2026-06-12T11:00:00Z',
    },
    {
      id: 3,
      slug: 'future-talk',
      title: 'Future Talk',
      startsAt: '2026-06-12T12:00:00Z',
      endsAt: '2026-06-12T13:00:00Z',
    },
  ];
}

beforeEach(() => {
  vi.useFakeTimers();
  document.documentElement.style.removeProperty('--banner-pad');
});

afterEach(() => {
  vi.useRealTimers();
});

describe('HappeningNowBanner', () => {
  it('renders the LIVE state at the midpoint of a live session', () => {
    vi.setSystemTime(new Date('2026-06-12T10:30:00Z'));

    render(<HappeningNowBanner sessions={makeSessions()} />);

    expect(screen.getByText('Live')).toBeInTheDocument();
    expect(screen.getByText('Live Talk')).toBeInTheDocument();
    expect(screen.getByText(/ends in/i)).toBeInTheDocument();
    expect(document.documentElement.style.getPropertyValue('--banner-pad')).toBe('96px');
  });

  it('renders the UP NEXT state when a session starts within 6h', () => {
    vi.setSystemTime(new Date('2026-06-12T11:30:00Z'));

    render(<HappeningNowBanner sessions={makeSessions()} />);

    expect(screen.getByText('Up Next')).toBeInTheDocument();
    expect(screen.getByText('Future Talk')).toBeInTheDocument();
    expect(screen.getByText(/starts in/i)).toBeInTheDocument();
    expect(document.documentElement.style.getPropertyValue('--banner-pad')).toBe('96px');
  });

  it('renders nothing (hidden) when no live or near-upcoming sessions', () => {
    vi.setSystemTime(new Date('2026-06-12T01:00:00Z'));

    const { container } = render(<HappeningNowBanner sessions={makeSessions()} />);

    expect(container.firstChild).toBeNull();
    expect(document.documentElement.style.getPropertyValue('--banner-pad')).toBe('50px');
  });

  it('formats countdown as plain minutes when under 60', () => {
    vi.setSystemTime(new Date('2026-06-12T09:15:00Z'));

    render(<HappeningNowBanner sessions={makeSessions()} />);

    expect(screen.getByText('Up Next')).toBeInTheDocument();
    expect(screen.getByText(/starts in 45m/i)).toBeInTheDocument();
  });

  it('formats countdown as Hh Mm for multi-hour upcoming', () => {
    vi.setSystemTime(new Date('2026-06-12T07:18:00Z'));

    const sessions: MinimalSession[] = [
      {
        id: 99,
        slug: 'far-talk',
        title: 'Far Talk',
        startsAt: '2026-06-12T10:00:00Z',
        endsAt: '2026-06-12T11:00:00Z',
      },
    ];

    render(<HappeningNowBanner sessions={sessions} />);

    expect(screen.getByText(/starts in 2h 42m/i)).toBeInTheDocument();
  });
});
