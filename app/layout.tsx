import type { ReactNode } from 'react';
import './globals.css';

export const metadata = {
  title: 'JSNation 2026',
  description: 'Conference companion for JSNation 2026',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" data-theme="dark">
      <body className="min-h-dvh antialiased">{children}</body>
    </html>
  );
}
