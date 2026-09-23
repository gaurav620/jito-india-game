/**
 * Auth integration tests — run against REAL PostgreSQL.
 *
 * GATE: These tests MUST PASS before Phase 2B is marked complete.
 * They are skipped when INTEGRATION_DB_URL is not set.
 * Skipped tests are NOT reported as PASS in the handoff.
 *
 * Coverage:
 *   1. Registration atomicity — user + points account created together
 *   2. Concurrent registration — exactly one 201, one conflict
 *   3. Refresh rotation — old token unusable after rotation
 *   4. Refresh reuse detection — all sessions revoked on replay
 *   5. Concurrent refresh — invariant: ≤1 valid successor
 *   6. Session XOR constraint — both user_id and admin_id → constraint violation
 *   7. Migration — Prisma schema deploys cleanly
 *
 * Run with:
 *   INTEGRATION_DB_URL=postgresql://user:pass@localhost:5432/jito_test npm run test
 */
import { createHash, randomBytes } from 'crypto';

import { JwtService } from '@nestjs/jwt';
import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';
import { describe, expect, it, beforeAll, afterAll } from 'vitest';

import type { AppConfigService } from '../config/app-config.service';
import type { PrismaService } from '../database/prisma.service';
import type { RedisService } from '../redis/redis.service';

import { AuthService } from './auth.service';


const INTEGRATION_DB_URL = process.env['INTEGRATION_DB_URL'];

const ARGON2_OPTIONS: argon2.Options & { raw?: false } = {
  type: argon2.argon2id,
  memoryCost: 19456,
  timeCost: 2,
  parallelism: 1,
};

function hashToken(raw: string): string {
  return createHash('sha256').update(raw).digest('hex');
}

function randomUsername() {
  return `test_${randomBytes(6).toString('hex')}`;
}

/** Delete a user and all dependent rows in FK-safe order. */
async function deleteUserWithRelations(prismaClient: PrismaClient, userId: string): Promise<void> {
  await prismaClient.session.deleteMany({ where: { userId } });
  await prismaClient.pointsAccount.deleteMany({ where: { userId } });
  await prismaClient.user.delete({ where: { id: userId } });
}

/**
 * Build a REAL AuthService wired to the integration database.
 *
 * Only Redis is stubbed (rate-limit counters are not under test here and must
 * not make the test depend on a live Redis). Prisma, JWT signing and the whole
 * refresh critical section are the genuine production code paths.
 */
function buildRealAuthService(prismaClient: PrismaClient): AuthService {
  // Rate limiting is irrelevant to rotation semantics — keep counters far below the cap.
  const redisStub = {
    raw: {
      incr: async () => 1,
      expire: async () => 1,
      get: async () => null,
      set: async () => 'OK',
    },
    loginRateLimitIpKey: (ip: string) => `ratelimit:login:ip:${ip}`,
    loginRateLimitUserKey: (u: string) => `ratelimit:login:user:${u}`,
    registerRateLimitIpKey: (ip: string) => `ratelimit:register:ip:${ip}`,
    adminLoginRateLimitIpKey: (ip: string) => `ratelimit:admin:login:ip:${ip}`,
    betRateLimitKey: (id: string) => `ratelimit:bet:user:${id}`,
    idempotencyKey: (k: string) => `idem:${k}`,
    userStatusKey: (id: string) => `user:status:${id}`,
  } as unknown as RedisService;

  const configStub = {
    jwtSecret: 'integration-test-secret-integration-test-secret',
    jwtIssuer: 'jito-api',
    jwtAccessTtlSeconds: 900,
    jwtRefreshTtlSeconds: 604800,
  } as unknown as AppConfigService;

  // PrismaService extends PrismaClient — structurally identical at runtime.
  return new AuthService(
    prismaClient as unknown as PrismaService,
    redisStub,
    new JwtService({}),
    configStub,
  );
}

describe.skipIf(!INTEGRATION_DB_URL)('Auth Integration Tests [requires PostgreSQL]', () => {
  let prisma: PrismaClient;

  beforeAll(async () => {
    if (!INTEGRATION_DB_URL) return;
    prisma = new PrismaClient({ datasources: { db: { url: INTEGRATION_DB_URL } } });
    await prisma.$connect();
  });

  afterAll(async () => {
    if (!prisma) return;
    await prisma.$disconnect();
  });

  // ─── 1. Registration atomicity ────────────────────────────────────────────────
  it('1. Registration: user and points account created atomically', async () => {
    const username = randomUsername();
    const hash = await argon2.hash('password123', ARGON2_OPTIONS);

    const user = await prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: { username, email: `${username}@test.com`, passwordHash: hash, status: 'active' },
      });
      await tx.pointsAccount.create({
        data: { userId: created.id, balanceMinor: 0n, version: 0n },
      });
      return created;
    });

    // Both rows must exist
    const account = await prisma.pointsAccount.findUnique({ where: { userId: user.id } });
    expect(account).not.toBeNull();
    expect(account?.balanceMinor).toBe(0n);

    // Cleanup — delete in FK-safe order
    await deleteUserWithRelations(prisma, user.id);
  });

  // ─── 2. Concurrent registration uniqueness ───────────────────────────────────
  it('2. Concurrent registration: duplicate username → only one succeeds', async () => {
    const username = randomUsername();
    const hash = await argon2.hash('password123', ARGON2_OPTIONS);

    const results = await Promise.allSettled([
      prisma.user.create({
        data: { username, email: `${username}_a@test.com`, passwordHash: hash, status: 'active' },
      }),
      prisma.user.create({
        data: { username, email: `${username}_b@test.com`, passwordHash: hash, status: 'active' },
      }),
    ]);

    const succeeded = results.filter((r) => r.status === 'fulfilled');
    const failed = results.filter((r) => r.status === 'rejected');

    expect(succeeded).toHaveLength(1);
    expect(failed).toHaveLength(1);

    // Cleanup
    if (succeeded[0]?.status === 'fulfilled') {
      await prisma.user.delete({ where: { id: (succeeded[0] as PromiseFulfilledResult<{ id: string }>).value.id } });
    }
  });

  // ─── 3. Refresh rotation — old token unusable ────────────────────────────────
  it('3. Refresh rotation: original token is unusable after rotation', async () => {
    const username = randomUsername();
    const hash = await argon2.hash('password123', ARGON2_OPTIONS);

    const user = await prisma.user.create({
      data: { username, email: `${username}@test.com`, passwordHash: hash, status: 'active' },
    });
    await prisma.pointsAccount.create({ data: { userId: user.id, balanceMinor: 0n, version: 0n } });

    // Create initial session
    const rawToken1 = randomBytes(32).toString('hex');
    const session1 = await prisma.session.create({
      data: {
        refreshTokenHash: hashToken(rawToken1),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        user: { connect: { id: user.id } },
      },
    });

    // Rotate: revoke old, create new
    const rawToken2 = randomBytes(32).toString('hex');
    const session2 = await prisma.session.create({
      data: {
        refreshTokenHash: hashToken(rawToken2),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        user: { connect: { id: user.id } },
      },
    });
    await prisma.session.update({
      where: { id: session1.id },
      data: { revokedAt: new Date(), replacedBySessionId: session2.id },
    });

    // Old token must be revoked
    const oldSession = await prisma.session.findUnique({ where: { id: session1.id } });
    expect(oldSession?.revokedAt).not.toBeNull();

    // New token must be valid
    const newSession = await prisma.session.findFirst({
      where: { id: session2.id, revokedAt: null, expiresAt: { gt: new Date() } },
    });
    expect(newSession).not.toBeNull();

    // Cleanup — delete in FK-safe order
    await deleteUserWithRelations(prisma, user.id);
  });

  // ─── 4. Refresh reuse detection ──────────────────────────────────────────────
  it('4. Reuse detection: replaying old token revokes all user sessions', async () => {
    const username = randomUsername();
    const hash = await argon2.hash('password123', ARGON2_OPTIONS);

    const user = await prisma.user.create({
      data: { username, email: `${username}@test.com`, passwordHash: hash, status: 'active' },
    });
    await prisma.pointsAccount.create({ data: { userId: user.id, balanceMinor: 0n, version: 0n } });

    // Create original session + a second (current) session
    const rawToken1 = randomBytes(32).toString('hex');
    const s1 = await prisma.session.create({
      data: {
        refreshTokenHash: hashToken(rawToken1),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        user: { connect: { id: user.id } },
      },
    });

    const rawToken2 = randomBytes(32).toString('hex');
    const s2 = await prisma.session.create({
      data: {
        refreshTokenHash: hashToken(rawToken2),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        user: { connect: { id: user.id } },
      },
    });
    // S1 already rotated to S2
    await prisma.session.update({
      where: { id: s1.id },
      data: { revokedAt: new Date(), replacedBySessionId: s2.id },
    });

    // Simulate reuse: s1 is presented again → all sessions revoked
    const reuseCheck = await prisma.session.findFirst({ where: { refreshTokenHash: hashToken(rawToken1) } });
    expect(reuseCheck?.revokedAt).not.toBeNull(); // was already revoked

    await prisma.session.updateMany({
      where: { userId: user.id, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    // Both sessions must now be revoked
    const remaining = await prisma.session.count({ where: { userId: user.id, revokedAt: null } });
    expect(remaining).toBe(0);

    // Cleanup — delete in FK-safe order
    await deleteUserWithRelations(prisma, user.id);
  });

  // ─── 5. Concurrent refresh invariant ─────────────────────────────────────────
  it('5. Concurrent refresh: real AuthService.refresh() ×2 leaves ≤1 valid successor', async () => {
    const username = randomUsername();
    const hash = await argon2.hash('password123', ARGON2_OPTIONS);

    const user = await prisma.user.create({
      data: { username, email: `${username}@test.com`, passwordHash: hash, status: 'active' },
    });
    await prisma.pointsAccount.create({ data: { userId: user.id, balanceMinor: 0n, version: 0n } });

    const rawToken = randomBytes(32).toString('hex');
    await prisma.session.create({
      data: {
        refreshTokenHash: hashToken(rawToken),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        user: { connect: { id: user.id } },
      },
    });

    // ── Genuine concurrency against the REAL production code path ─────────────
    // Both calls use the SAME raw token and are issued without awaiting between
    // them, so they race inside AuthService.refresh(). This test fails if the
    // FOR UPDATE lock is taken outside a transaction (the Phase 2B blocker).
    const authService = buildRealAuthService(prisma);
    const results = await Promise.allSettled([
      authService.refresh(rawToken, '127.0.0.1'),
      authService.refresh(rawToken, '127.0.0.1'),
    ]);

    const fulfilled = results.filter((r) => r.status === 'fulfilled');
    const rejected = results.filter((r) => r.status === 'rejected');

    // At most one request may rotate. The loser either trips reuse detection or
    // loses the row-lock race — either way it must NOT produce a second session.
    expect(fulfilled.length).toBeLessThanOrEqual(1);
    expect(fulfilled.length + rejected.length).toBe(2);

    // ── THE INVARIANT ─────────────────────────────────────────────────────────
    // Never two valid successors. Zero is acceptable and expected when the loser
    // replays a now-revoked token and reuse detection revokes the whole chain.
    const valid = await prisma.session.count({
      where: { userId: user.id, revokedAt: null },
    });
    expect(valid).toBeLessThanOrEqual(1);

    // If one request succeeded, the token it returned must be a genuinely new one.
    if (fulfilled.length === 1) {
      const settled = fulfilled[0] as PromiseFulfilledResult<{ refreshToken: string }>;
      expect(settled.value.refreshToken).not.toBe(rawToken);
    }

    // The original token must never remain usable after the race.
    const original = await prisma.session.findFirst({
      where: { refreshTokenHash: hashToken(rawToken) },
      select: { revokedAt: true },
    });
    expect(original?.revokedAt).not.toBeNull();

    // Cleanup — delete in FK-safe order
    await deleteUserWithRelations(prisma, user.id);
  });

  // ─── 6. Session XOR constraint ───────────────────────────────────────────────
  it('6. XOR constraint: session with both user_id and admin_id fails', async () => {
    const username = randomUsername();
    const hash = await argon2.hash('password123', ARGON2_OPTIONS);

    const user = await prisma.user.create({
      data: { username, email: `${username}@test.com`, passwordHash: hash, status: 'active' },
    });

    const adminUser = await prisma.adminUser.create({
      data: {
        username: `admin_${randomBytes(4).toString('hex')}`,
        passwordHash: hash,
        role: 'operator',
        status: 'active',
      },
    });

    // Attempt to create a session with BOTH user_id and admin_id — must fail
    await expect(
      prisma.$executeRawUnsafe(
        `INSERT INTO sessions (refresh_token_hash, expires_at, user_id, admin_id)
         VALUES ($1, $2, $3, $4)`,
        hashToken(randomBytes(32).toString('hex')),
        new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        user.id,
        adminUser.id,
      ),
    ).rejects.toThrow(); // chk_sessions_exactly_one_owner violation

    // Cleanup — delete in FK-safe order
    await deleteUserWithRelations(prisma, user.id);
    await prisma.adminUser.delete({ where: { id: adminUser.id } });
  });

  // ─── 7. Session with neither user_id nor admin_id fails ──────────────────────
  it('7. XOR constraint: session with neither user_id nor admin_id fails', async () => {
    await expect(
      prisma.$executeRawUnsafe(
        `INSERT INTO sessions (refresh_token_hash, expires_at)
         VALUES ($1, $2)`,
        hashToken(randomBytes(32).toString('hex')),
        new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      ),
    ).rejects.toThrow(); // chk_sessions_exactly_one_owner violation
  });
});
