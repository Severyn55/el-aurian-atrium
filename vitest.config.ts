import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['src/**/*.{test,spec}.ts', 'src/lib/admin/**/*.{test,spec}.ts'],
    exclude: ['node_modules', 'dist', '.astro'],
    // Helpful for debugging parser issues
    setupFiles: [],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      exclude: ['**/*.astro', '**/node_modules/**']
    }
  },
  // Resolve .ts imports cleanly in tests
  resolve: {
    conditions: ['node']
  }
});