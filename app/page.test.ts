import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

describe('Footer copyright', () => {
  it('renders © 2026 React Summit', () => {
    const src = readFileSync(join(process.cwd(), 'app/page.tsx'), 'utf8');
    expect(src).toContain('© 2026 React Summit');
  });
});
