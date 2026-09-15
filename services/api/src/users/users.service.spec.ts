/**
 * UsersService unit tests.
 */
import { UnauthorizedException } from '@nestjs/common';
import { describe, expect, it, vi, beforeEach } from 'vitest';

import type { PrismaService } from '../database/prisma.service';

import { UsersService } from './users.service';

vi.mock('argon2', () => ({
  argon2id: 2,
  hash: vi.fn().mockResolvedValue('$argon2id$v=19$mock_hash'),
  verify: vi.fn().mockResolvedValue(true),
}));

const mockPrisma = {
  $transaction: vi.fn(),
  user: {
    findUniqueOrThrow: vi.fn(),
    update: vi.fn(),
  },
  session: {
    updateMany: vi.fn(),
  },
} as unknown as PrismaService;

describe('UsersService', () => {
  let service: UsersService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new UsersService(mockPrisma);
  });

  describe('getProfile', () => {
    it('returns profile fields — never returns passwordHash', async () => {
      vi.mocked(mockPrisma.user.findUniqueOrThrow).mockResolvedValue({
        id: 'u1',
        username: 'alice',
        email: 'alice@test.com',
        phone: null,
        displayName: null,
        status: 'active',
        createdAt: new Date(),
        passwordHash: '$argon2id$secret',
        pointsAccount: { balanceMinor: 500n },
      } as never);

      const result = await service.getProfile('u1');
      expect(result.id).toBe('u1');
      expect(result.balanceMinor).toBe('500');
      expect(result).not.toHaveProperty('passwordHash');
      expect(result).not.toHaveProperty('failedLoginCount');
    });
  });

  describe('changePassword', () => {
    it('revokes all sessions atomically when password changes', async () => {
      vi.mocked(mockPrisma.user.findUniqueOrThrow).mockResolvedValue({
        passwordHash: '$argon2id$mock',
      } as never);
      vi.mocked(mockPrisma.$transaction).mockResolvedValue([{}, { count: 2 }]);
      // Make user.update and session.updateMany return Promises (not undefined)
      vi.mocked(mockPrisma.user.update).mockResolvedValue({} as never);
      vi.mocked(mockPrisma.session.updateMany).mockResolvedValue({ count: 2 } as never);

      await service.changePassword('u1', { currentPassword: 'oldpass', newPassword: 'newpass12345' });

      // $transaction must be called exactly once with an array (atomic operation)
      expect(mockPrisma.$transaction).toHaveBeenCalledOnce();
      const [arg] = vi.mocked(mockPrisma.$transaction).mock.calls[0] as [unknown[]];
      expect(Array.isArray(arg)).toBe(true);
      expect((arg as unknown[]).length).toBe(2);
    });

    it('rejects wrong current password with generic UNAUTHORIZED', async () => {
      const argon2 = await import('argon2');
      vi.mocked(argon2.verify).mockResolvedValue(false);
      vi.mocked(mockPrisma.user.findUniqueOrThrow).mockResolvedValue({
        passwordHash: '$argon2id$mock',
      } as never);

      await expect(
        service.changePassword('u1', { currentPassword: 'wrongpass', newPassword: 'newpass12345' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
