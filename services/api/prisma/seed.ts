/* eslint-disable no-console */
/**
 * Prisma seed script — populates a local dev database with minimal fixtures.
 *
 * Usage: npx prisma db seed
 * Configure in services/api/package.json → "prisma": { "seed": "ts-node prisma/seed.ts" }
 *
 * NEVER run this against staging or production.
 *
 * Seeds:
 *   1. One admin user (username: admin, password: admin_dev_password)
 *   2. One player user (username: testplayer, password: test_password)
 *   3. PointsAccount for the test player (1,000 display points = 100,000 centipoints)
 *
 * NOTE: Passwords are hardcoded here for dev convenience ONLY.
 * In production, admin accounts are provisioned via a secure out-of-band process.
 * No real passwords exist in this file.
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Dev-only placeholder hash — NOT a real argon2id hash.
// Real hashing requires the argon2 library, confirmed parameters (AUTH_V2.md §5),
// and is gated on Phase 2B. This placeholder prevents seed from failing.
const DEV_PASSWORD_PLACEHOLDER = '$argon2id$v=19$m=65536,t=3,p=4$DEVPLACEHOLDER$DEVPLACEHOLDERDEVPLACEHOLDERDEVP';

async function main(): Promise<void> {
  console.log('🌱 Seeding local dev database…');

  // Admin user
  const admin = await prisma.adminUser.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      passwordHash: DEV_PASSWORD_PLACEHOLDER,
      role: 'super_admin',
      status: 'active',
    },
  });
  console.log(`✅ Admin user: ${admin.username} (id: ${admin.id})`);

  // Test player
  const player = await prisma.user.upsert({
    where: { username: 'testplayer' },
    update: {},
    create: {
      username: 'testplayer',
      email: 'testplayer@dev.local',
      passwordHash: DEV_PASSWORD_PLACEHOLDER,
      displayName: 'Test Player',
      status: 'active',
    },
  });
  console.log(`✅ Player: ${player.username} (id: ${player.id})`);

  // Points account — 1,000.00 display points = 100,000 centipoints
  const account = await prisma.pointsAccount.upsert({
    where: { userId: player.id },
    update: {},
    create: {
      userId: player.id,
      balanceMinor: 100_000n, // 1,000.00 display points
      version: 0n,
    },
  });
  console.log(`✅ PointsAccount: ${account.id} — balance: ${account.balanceMinor} minor (1000.00 pts)`);

  console.log('🌱 Seed complete.');
}

main()
  .catch((err: unknown) => {
    console.error('❌ Seed failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
