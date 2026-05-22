'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { computeBannerState, type MinimalSession } from '@/lib/banner/state';
import { LiveDot } from '@/components/server/LiveDot';

interface HappeningNowBannerProps {
  sessions: MinimalSession[];
}

function formatCountdown(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

function setBannerPad(value: string) {
  if (typeof document === 'undefined') return;
  document.documentElement.style.setProperty('--banner-pad', value);
}

function isValidIso(s: string | null | undefined): s is string {
  if (typeof s !== 'string') return false;
  const t = Date.parse(s);
  return Number.isFinite(t);
}

export function HappeningNowBanner({ sessions }: HappeningNowBannerProps) {
  const searchParams = useSearchParams();
  const devNowOverride =
    process.env.NODE_ENV !== 'production' ? searchParams?.get('now') ?? null : null;
  const hasOverride = isValidIso(devNowOverride);

  const [now, setNow] = useState<Date>(() =>
    hasOverride ? new Date(devNowOverride) : new Date(),
  );

  useEffect(() => {
    if (hasOverride) return;
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, [hasOverride]);

  const state = useMemo(
    () => computeBannerState(now, { sessions }),
    [now, sessions],
  );

  useEffect(() => {
    setBannerPad(state.kind === 'hidden' ? '50px' : '96px');
  }, [state.kind]);

  if (state.kind === 'hidden') return null;

  const session = state.session;
  const isLive = state.kind === 'live';
  const tailCopy = isLive
    ? `ends in ${formatCountdown(state.minutesRemaining)}`
    : `starts in ${formatCountdown(state.minutesUntil)}`;

  return (
    <Link
      href={`/sessions/${session.slug}`}
      aria-label={`${isLive ? 'Live now' : 'Up next'}: ${session.title}`}
      style={{
        position: 'fixed',
        top: 'env(safe-area-inset-top, 0)',
        left: 0,
        right: 0,
        zIndex: 40,
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '8px 14px',
        background: 'var(--banner-bg)',
        textDecoration: 'none',
        color: '#fff',
      }}
    >
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          minWidth: 60,
        }}
      >
        {isLive ? <LiveDot /> : null}
        <span
          style={{
            color: isLive ? 'var(--color-live)' : 'var(--color-brand-on-surface)',
            fontSize: 10.5,
            fontWeight: 800,
            letterSpacing: 0.6,
            textTransform: 'uppercase',
          }}
        >
          {isLive ? 'Live' : 'Up Next'}
        </span>
      </span>

      <span
        style={{
          flex: 1,
          minWidth: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: 1,
        }}
      >
        <span
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: '#fff',
            lineHeight: 1.25,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {session.title}
        </span>
        <span
          style={{
            fontSize: 11.5,
            fontWeight: 500,
            color: 'rgba(255,255,255,0.6)',
            lineHeight: 1.3,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {tailCopy}
        </span>
      </span>

      <svg
        width={18}
        height={18}
        viewBox="0 0 24 24"
        fill="none"
        stroke="rgba(255,255,255,0.5)"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        style={{ flexShrink: 0 }}
      >
        <path d="M9 18l6-6-6-6" />
      </svg>
    </Link>
  );
}
