import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    // Allow the sandbox preview without disabling Vite's host check generally.
    allowedHosts: ['.e2b.app'],
  },
  build: {
    target: 'es2022',
    manifest: true,
    chunkSizeWarningLimit: 900,
  },
  test: {
    include: ['src/tests/**/*.{test,spec}.{ts,tsx}'],
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: true,
  },
});
