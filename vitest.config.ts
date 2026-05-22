import path from 'node:path';
import { defineConfig } from 'vitest/config';

const alias = {
  '@': path.resolve(__dirname, '.'),
};

export default defineConfig({
  resolve: { alias },
  test: {
    projects: [
      {
        resolve: { alias },
        test: {
          name: 'node',
          environment: 'node',
          include: [
            'lib/data/**/*.test.ts',
            'lib/queries/**/*.test.ts',
            'lib/banner/**/*.test.ts',
            'lib/favorites/**/*.ssr.test.ts',
          ],
        },
      },
      {
        resolve: { alias },
        esbuild: { jsx: 'automatic' },
        test: {
          name: 'jsdom',
          environment: 'jsdom',
          include: [
            'lib/favorites/**/*.test.ts',
            'components/client/**/*.test.tsx',
          ],
          setupFiles: ['./vitest.setup.ts'],
        },
      },
    ],
  },
});
