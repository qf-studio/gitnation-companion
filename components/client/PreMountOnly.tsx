'use client';

import { useEffect, useState, type ReactNode } from 'react';

interface PreMountOnlyProps {
  children: ReactNode;
}

/**
 * Renders children during SSR and the first client paint, then unmounts them
 * after `useEffect` runs. Used to display a skeleton placeholder that should
 * disappear once client-side data (e.g. localStorage favorites) has been read.
 */
export function PreMountOnly({ children }: PreMountOnlyProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted ? null : <>{children}</>;
}
