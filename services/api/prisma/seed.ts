/* eslint-disable no-console */
/**
 * Prisma seed script â€” populates a local dev database with minimal fixtures.
 *
 * Usage: npx prisma db seed
 * Configure in services/api/package.json â†’ "prisma": { "seed": "ts-node prisma/seed.ts" }
 *
 * NEVER run this against staging or production.
 *
 * Seeds:
 *   1. One admin user (username: admin, password: admin_dev_password)
 *   2. One player user (username: testplayer, password: test_password_1)
 *   3. PointsAccount for the test player (1,000 display points = 100,000 centipoints)
 *
 * NOTE: Passwords are hardcoded here for dev convenience ONLY.
 * In production, admin accounts are provisioned via a secure out-of-band process.
 * No real passwords exist in this file â€” the strings below are dev-only fixtures.
 */
import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';

// Production guard â€” must never run in production
if (process.env['NODE_ENV'] === 'production') {
  console.error('âŒ Seed must not run in production (NODE_ENV=production).');
  process.exit(1);
}

const prisma = new PrismaClient();

// argon2id parameters per AUTH_V2.md Â§5 (OWASP baseline)
const ARGON2_OPTIONS: argon2.Options & { raw?: false } = {
  type: argon2.argon2id,
  memoryCost: 19456,
  timeCost: 2,
  parallelism: 1,
};

async function main(): Promise<void> {
  console.log('ðŸŒ± Seeding local dev databaseâ€¦');
  console.log('  Hashing passwords with argon2id (this may take a moment)â€¦');

  // Generate real argon2id hashes at seed runtime (Phase 2B fix)
  const [adminHash, playerHash] = await Promise.all([
    argon2.hash('admin_dev_password', ARGON2_OPTIONS),
    argon2.hash('test_password_1', ARGON2_OPTIONS),
  ]);

  // Admin user
  const admin = await prisma.adminUser.upsert({
    where: { username: 'admin' },
    update: { passwordHash: adminHash },
    create: {
      username: 'admin',
      passwordHash: adminHash,
      role: 'super_admin',
      status: 'active',
    },
  });
  console.log(`âœ… Admin user: ${admin.username} (id: ${admin.id})`);

  // Test player
  const player = await prisma.user.upsert({
    where: { username: 'testplayer' },
    update: { passwordHash: playerHash },
    create: {
      username: 'testplayer',
      email: 'testplayer@dev.local',
      passwordHash: playerHash,
      displayName: 'Test Player',
      status: 'active',
    },
  });
  console.log(`âœ… Player: ${player.username} (id: ${player.id})`);

  // Points account â€” 1,000.00 display points = 100,000 centipoints
  const account = await prisma.pointsAccount.upsert({
    where: { userId: player.id },
    update: {},
    create: {
      userId: player.id,
      balanceMinor: 100_000n, // 1,000.00 display points
      version: 0n,
    },
  });
  console.log(`âœ… PointsAccount: ${account.id} â€” balance: ${account.balanceMinor} minor (1000.00 pts)`);

  console.log('ðŸŒ± Seed complete.');
}

main()
  .catch((err: unknown) => {
    console.error('âŒ Seed failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
