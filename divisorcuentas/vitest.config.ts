/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: 'src/test.ts', // <= SIN ./, así funciona en Angular
    include: ['src/**/*.spec.ts']
  },
});
