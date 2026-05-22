import { Suspense, type ReactNode } from 'react';
import { BottomNav } from '@/components/client/BottomNav';
import { HappeningNowBanner } from '@/components/client/HappeningNowBanner';
import { getSchedule } from '@/lib/data';
import { toMinimalSessions } from '@/lib/banner/serialize';
import './globals.css';

export const metadata = {
  title: 'JSNation 2026',
  description: 'Conference companion for JSNation 2026',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover' as const,
  userScalable: false,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  const minimalSessions = toMinimalSessions(getSchedule());

  return (
    <html lang="en" data-theme="dark">
      <body>
        <Suspense fallback={null}>
          <HappeningNowBanner sessions={minimalSessions} />
        </Suspense>
        <main>{children}</main>
        <BottomNav />
      </body>
    </html>
  );
}
