/**
 * UsersService — player profile and password management.
 *
 * Security invariants:
 *   - passwordHash never returned in any response
 *   - Password change revokes all sessions atomically
 *   - Wrong currentPassword returns generic error (no enumeration)
 */
import { Injectable, UnauthorizedException } from '@nestjs/common';
import * as argon2 from 'argon2';

import { AppErrorCode } from '../common/errors';
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import { PrismaService } from '../database/prisma.service'; // DI token

import type { ChangePasswordDto } from './dto/change-password.dto';
import type { UpdateProfileDto } from './dto/update-profile.dto';

const ARGON2_OPTIONS: argon2.Options & { raw?: false } = {
  type: argon2.argon2id,
  memoryCost: 19456,
  timeCost: 2,
  parallelism: 1,
};

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        email: true,
        phone: true,
        displayName: true,
        status: true,
        createdAt: true,
        pointsAccount: { select: { balanceMinor: true } },
      },
    });

    // Explicit field selection — passwordHash, failedLoginCount, lockedUntil never returned
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      phone: user.phone,
      displayName: user.displayName,
      status: user.status,
      createdAt: user.createdAt,
      balanceMinor: (user.pointsAccount?.balanceMinor ?? 0n).toString(),
    };
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(dto.displayName !== undefined
          ? { displayName: dto.displayName.trim() }
          : {}),
      },
      select: {
        id: true,
        username: true,
        email: true,
        phone: true,
        displayName: true,
        status: true,
        createdAt: true,
      },
    });

    return {
      id: user.id,
      username: user.username,
      email: user.email,
      phone: user.phone,
      displayName: user.displayName,
      status: user.status,
      createdAt: user.createdAt,
    };
  }

  async changePassword(userId: string, dto: ChangePasswordDto): Promise<void> {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { passwordHash: true },
    });

    const valid = await argon2.verify(user.passwordHash, dto.currentPassword, ARGON2_OPTIONS);
    if (!valid) {
      // Generic rejection — does not say "wrong current password" to avoid oracle
      throw new UnauthorizedException(AppErrorCode.UNAUTHORIZED);
    }

    const newHash = await argon2.hash(dto.newPassword, ARGON2_OPTIONS);

    // Atomic: update password AND revoke all sessions in one transaction
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: { passwordHash: newHash },
      }),
      this.prisma.session.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ]);
  }
}
