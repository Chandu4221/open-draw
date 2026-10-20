import { defineConfig } from 'vitest/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      '@open-draw/schema': path.resolve(__dirname, 'packages/schema/src/index.ts'),
      '@open-draw/canvas': path.resolve(__dirname, 'packages/canvas/src/index.ts'),
      '@open-draw/semantics': path.resolve(__dirname, 'packages/semantics/src/index.ts'),
      '@open-draw/markdown': path.resolve(__dirname, 'packages/markdown/src/index.ts'),
      '@open-draw/studio': path.resolve(__dirname, 'apps/studio/src/index.ts'),
    },
  },
  test: {
    include: ['**/*.test.ts'],
    exclude: ['**/dist/**', '**/node_modules/**', '**/.git/**'],
  },
});
