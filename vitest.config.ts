import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    // Use jsdom environment for DOM APIs
    environment: 'jsdom',

    // IMPORTANT: Phaser requires threads to be disabled
    // See: https://github.com/vitest-dev/vitest/issues/740
    pool: 'forks',
    poolOptions: {
      threads: {
        singleThread: true,
      },
    },

    // Setup files for canvas mocking
    setupFiles: ['./vitest.setup.ts'],

    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      exclude: [
        'node_modules/**',
        'dist/**',
        '**/*.config.*',
        '**/*.test.ts',
        'vitest.setup.ts',
      ],
    },

    // Test file patterns
    include: ['src/**/*.{test,spec}.ts'],

    // Global test timeout
    testTimeout: 10000,
  },

  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
});
