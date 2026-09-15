/**
 * Environment configuration helper.
 * Provides typed access to environment variables.
 */

export interface EnvironmentConfig {
  nodeEnv: 'development' | 'staging' | 'production' | 'test';
  appPort: number;
  appUrl: string;

  // Database
  dbHost: string;
  dbPort: number;
  dbName: string;
  dbUser: string;
  dbPassword: string;

  // Redis
  redisHost: string;
  redisPort: number;
  redisPassword: string;

  // Auth
  jwtSecret: string;
  jwtExpiration: number;
  refreshTokenExpiration: number;

  // AWS
  awsRegion: string;
  awsS3Bucket: string;
  awsCloudfrontDomain: string;

  // WebSocket
  wsPort: number;
}

/**
 * Get an environment variable or throw if missing.
 * Use for required variables in production.
 */
export function getEnvOrThrow(key: string): string {
  const value = process.env[key];
  if (value === undefined || value === '') {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

/**
 * Get an environment variable with a default fallback.
 * Use for optional variables or development defaults.
 */
export function getEnvOrDefault(key: string, defaultValue: string): string {
  return process.env[key] ?? defaultValue;
}

/**
 * Get an integer environment variable with a default.
 */
export function getEnvIntOrDefault(key: string, defaultValue: number): number {
  const value = process.env[key];
  if (value === undefined || value === '') return defaultValue;
  const parsed = parseInt(value, 10);
  if (isNaN(parsed)) return defaultValue;
  return parsed;
}

/**
 * Check if running in production.
 */
export function isProduction(): boolean {
  return process.env['NODE_ENV'] === 'production';
}

/**
 * Check if running in development.
 */
export function isDevelopment(): boolean {
  return process.env['NODE_ENV'] === 'development' || process.env['NODE_ENV'] === undefined;
}

/**
 * Check if running in test environment.
 */
export function isTest(): boolean {
  return process.env['NODE_ENV'] === 'test';
}
