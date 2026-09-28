import { defineConfig } from 'vitest/config';

/**
 * Pure-TS token tests only. The primitives are React Native components and
 * run under Jest (see jest.config.cjs) — Vitest has no RN renderer.
 */
export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
    exclude: ['**/node_modules/**', '**/dist/**'],
  },
});
