import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: 'node',
          environment: 'node',
          include: [
            'lib/data/**/*.test.ts',
            'lib/queries/**/*.test.ts',
            'lib/banner/**/*.test.ts',
          ],
        },
      },
      {
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
