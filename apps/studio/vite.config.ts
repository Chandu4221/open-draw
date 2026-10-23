import { resolve } from 'node:path';
import { defineConfig } from 'vite';

export default defineConfig({
  base: '/open-draw/',
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
        playground: resolve(import.meta.dirname, 'playground/index.html'),
      },
    },
  },
});
