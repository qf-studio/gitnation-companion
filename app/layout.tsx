import type { ReactNode } from 'react';
import { BottomNav } from '@/components/client/BottomNav';
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
  return (
    <html lang="en" data-theme="dark">
      <body>
        <main>{children}</main>
        <BottomNav />
      </body>
    </html>
  );
}
