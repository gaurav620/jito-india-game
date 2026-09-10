/**
 * Tests for environment variable validation (validateEnv).
 *
 * Verifies that the service refuses to start on misconfiguration
 * and accepts valid configurations.
 *
 * Note: class-transformer's enableImplicitConversion requires emitDecoratorMetadata
 * (TypeScript type reflection). Vitest uses esbuild which doesn't emit metadata,
 * so we pass correctly-typed values in tests that expect success, and string
 * values that fail validation in tests that expect errors.
 */
import { describe, expect, it } from 'vitest';

import { validateEnv } from './env.schema';

// Valid env with already-coerced numeric types for the success path.
// In production, ConfigModule handles the string→number coercion via
// NestJS's own env loading pipeline before validateEnv is called.
const VALID_ENV = {
  NODE_ENV: 'development',
  API_PORT: 3001,
  DATABASE_URL: 'postgresql://jito:secret@localhost:5432/jito_dev',
  REDIS_URL: 'redis://localhost:6379',
  JWT_SECRET: 'a-very-long-secret-at-least-32-chars-long',
  JWT_AUDIENCE_PLAYER: 'jito-player',
  JWT_AUDIENCE_ADMIN: 'jito-admin',
  JWT_ISSUER: 'jito-api',
  JWT_ACCESS_TTL_SECONDS: 900,
  JWT_REFRESH_TTL_SECONDS: 604800,
  LOG_LEVEL: 'info',
  LOG_FORMAT: 'json',
  IDEMPOTENCY_CACHE_TTL_SECONDS: 86400,
};

describe('validateEnv', () => {
  it('accepts a fully valid configuration', () => {
    expect(() => validateEnv(VALID_ENV)).not.toThrow();
  });

  it('returns typed EnvironmentVariables on success', () => {
    const config = validateEnv(VALID_ENV);
    expect(config.API_PORT).toBe(3001);
    expect(config.JWT_ACCESS_TTL_SECONDS).toBe(900);
    expect(config.JWT_REFRESH_TTL_SECONDS).toBe(604800);
    expect(config.NODE_ENV).toBe('development');
  });

  it('throws when DATABASE_URL is missing', () => {
    const env = { ...VALID_ENV, DATABASE_URL: undefined };
    expect(() => validateEnv(env)).toThrow();
  });

  it('throws when REDIS_URL is missing', () => {
    const env = { ...VALID_ENV, REDIS_URL: undefined };
    expect(() => validateEnv(env)).toThrow();
  });

  it('throws when JWT_SECRET is missing', () => {
    const env = { ...VALID_ENV, JWT_SECRET: undefined };
    expect(() => validateEnv(env)).toThrow();
  });

  it('throws when NODE_ENV is an invalid value', () => {
    const env = { ...VALID_ENV, NODE_ENV: 'staging' };
    expect(() => validateEnv(env)).toThrow();
  });

  it('throws when LOG_LEVEL is an invalid value', () => {
    const env = { ...VALID_ENV, LOG_LEVEL: 'verbose' };
    expect(() => validateEnv(env)).toThrow();
  });

  it('throws when API_PORT is below minimum (1024)', () => {
    const env = { ...VALID_ENV, API_PORT: 80 };
    expect(() => validateEnv(env)).toThrow();
  });

  it('accepts numeric API_PORT value', () => {
    const config = validateEnv({ ...VALID_ENV, API_PORT: 4000 });
    expect(config.API_PORT).toBe(4000);
    expect(typeof config.API_PORT).toBe('number');
  });

  it('uses default JWT_AUDIENCE_PLAYER when not provided', () => {
    const env = { ...VALID_ENV };
    delete (env as Record<string, unknown>).JWT_AUDIENCE_PLAYER;
    const config = validateEnv(env);
    expect(config.JWT_AUDIENCE_PLAYER).toBe('jito-player');
  });

  // Fix #14 regression tests
  it('throws when JWT_SECRET is shorter than 32 characters', () => {
    const env = { ...VALID_ENV, JWT_SECRET: 'tooshort' };
    expect(() => validateEnv(env)).toThrow(/JWT_SECRET must be at least 32/);
  });

  it('accepts JWT_SECRET that is exactly 32 characters', () => {
    const env = { ...VALID_ENV, JWT_SECRET: 'a'.repeat(32) };
    expect(() => validateEnv(env)).not.toThrow();
  });

  it('accepts JWT_SECRET longer than 32 characters', () => {
    const env = { ...VALID_ENV, JWT_SECRET: 'a'.repeat(64) };
    expect(() => validateEnv(env)).not.toThrow();
  });
});

