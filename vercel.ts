/**
 * Vercel project configuration.
 *
 * Vercel auto-detects Next.js, and Node.js 24 LTS is the default runtime on
 * Fluid Compute (the recommended Vercel runtime as of 2026). We declare the
 * framework explicitly so CI builds and local `vercel build` agree, but rely
 * on platform defaults for everything else.
 *
 * Production promotion is manual (set via Vercel project settings, not here)
 * so accidental merges to `main` cannot ship to prod — only `vercel promote`
 * does.
 */
export default {
  framework: 'nextjs',
} as const;
