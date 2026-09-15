/**
 * Application-wide constants for JITO INDIA GAMES.
 *
 * IMPORTANT: Game-specific values (timing, payouts) are placeholders.
 * Actual values NEED CLIENT CONFIRMATION before implementation.
 */

// ── Branding ──────────────────────────────────────────

export const BRAND_NAME = 'JITO INDIA';
export const BRAND_NAME_FULL = 'JITO INDIA GAMES';
export const BRAND_DOMAIN = 'jitoindia.com';

// ── API ───────────────────────────────────────────────

export const API_VERSION = 'v1';
export const API_PREFIX = `/api/${API_VERSION}`;

// ── Authentication ────────────────────────────────────

export const JWT_EXPIRY_SECONDS = 3600; // 1 hour
export const REFRESH_TOKEN_EXPIRY_SECONDS = 604800; // 7 days
export const BCRYPT_ROUNDS = 12;
export const MAX_LOGIN_ATTEMPTS = 5;
export const LOGIN_LOCKOUT_MINUTES = 15;

// ── Pagination ────────────────────────────────────────

export const DEFAULT_PAGE = 1;
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

// ── WebSocket ─────────────────────────────────────────

export const WS_RECONNECT_DELAYS_MS = [1000, 2000, 4000, 8000, 16000, 30000];
export const WS_HEARTBEAT_INTERVAL_MS = 30000;
export const WS_PAYLOAD_VERSION = 1;

// ── Game (PLACEHOLDERS — NEEDS CLIENT CONFIRMATION) ───

/** Placeholder round duration in seconds */
export const PLACEHOLDER_ROUND_DURATION_SECONDS = 60;

/** Placeholder lock period before result (seconds) */
export const PLACEHOLDER_LOCK_PERIOD_SECONDS = 5;

/** Placeholder gap between rounds (seconds) */
export const PLACEHOLDER_ROUND_GAP_SECONDS = 10;

// ── Performance Targets ───────────────────────────────

export const TARGET_FPS = 60;
export const TARGET_API_LATENCY_MS = 200;
export const TARGET_WS_LATENCY_MS = 100;
export const TARGET_TTI_SECONDS = 3;
export const TARGET_RECONNECT_SECONDS = 2;
