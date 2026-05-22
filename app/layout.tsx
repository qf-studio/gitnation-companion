import type { ReactNode } from 'react';
import './globals.css';
import BottomNav from '@/components/client/BottomNav';

export const metadata = {
  title: 'JSNation 2026',
  description: 'Conference companion for JSNation 2026',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  userScalable: false,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" data-theme="dark">
      <body
        style={{
          background: 'var(--bg)',
          color: 'var(--text)',
          fontFamily: 'var(--font-sans)',
          minHeight: '100dvh',
          paddingBottom: 'calc(64px + env(safe-area-inset-bottom, 22px))',
        }}
      >
        {/* Banner placeholder — TASK-07 will mount the real banner here */}
        <div style={{ height: 'var(--banner-pad, 50px)' }} />
        <main style={{ minHeight: '100%' }}>{children}</main>
        <BottomNav />
      </body>
    </html>
  );
}
