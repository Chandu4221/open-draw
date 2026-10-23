import { defineConfig } from 'vite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  root: __dirname,
  resolve: {
    alias: {
      '@open-draw/schema': path.resolve(__dirname, '../../../schema/src/index.ts'),
      '@open-draw/canvas': path.resolve(__dirname, '../../src/index.ts'),
      '@open-draw/semantics': path.resolve(__dirname, '../../../semantics/src/index.ts'),
    },
  },
  server: {
    port: 5173,
    host: '127.0.0.1',
  },
});
