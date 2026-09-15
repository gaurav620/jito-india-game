import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: [
      'packages/**/*.test.ts',
      'packages/**/*.spec.ts',
      'services/**/*.test.ts',
      'services/**/*.spec.ts',
    ],
    exclude: [
      // Top-level and workspace-nested node_modules
      '**/node_modules/**',
      // Build outputs
      '**/dist/**',
      // Next.js / other build dirs
      '**/.next/**',
      // Non-testable apps
      'apps/desktop/**',
      'apps/mobile/**',
    ],
    // Ensure reflect-metadata is available for NestJS decorator-based tests
    setupFiles: ['reflect-metadata'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'dist/', '**/*.d.ts', '**/*.test.ts', '**/*.spec.ts'],
    },
  },
});

