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
    // Environment variables required by smoke tests that compile the real
    // AppModule / EngineAppModule. ConfigModule.forRoot() calls validateEnv
    // at module evaluation time — these vars must be in process.env before
    // any spec file imports app.module.ts or engine's app.module.ts.
    //
    // Values are safe fakes: no real connections are made in any unit test
    // because PrismaService and RedisService are overridden via
    // .overrideProvider(...).useValue(...) in the smoke tests.
    env: {
      NODE_ENV: 'test',
      DATABASE_URL: 'postgresql://test:test@localhost:5432/test_db',
      REDIS_URL: 'redis://localhost:6379',
      JWT_SECRET: 'test-jwt-secret-minimum-32-characters-long-for-unit-tests',
      JWT_AUDIENCE_PLAYER: 'jito-player',
      JWT_AUDIENCE_ADMIN: 'jito-admin',
      JWT_ISSUER: 'jito-api',
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'dist/', '**/*.d.ts', '**/*.test.ts', '**/*.spec.ts'],
    },
  },
});

