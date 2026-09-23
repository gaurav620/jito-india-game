/**
 * AdjustPointsDto — POST /admin/users/:id/points/adjust request body.
 *
 * docs/API_V2.md §8.2:
 *   { "direction": "credit", "amountMinor": 500000, "reason": "…" }
 *
 * `reason` is mandatory and non-empty (docs/POINTS_SYSTEM.md §9) — an
 * adjustment without a stated reason is rejected, not defaulted.
 *
 * The global ValidationPipe (whitelist: true, forbidNonWhitelisted: true)
 * rejects any field not declared here — an admin cannot smuggle a
 * `balanceMinor` override or any other field through this endpoint.
 */
import { IsIn, IsInt, IsPositive, IsString, Max, MaxLength, MinLength } from 'class-validator';

export type AdjustPointsDirection = 'credit' | 'debit';

export class AdjustPointsDto {
  @IsIn(['credit', 'debit'])
  direction!: AdjustPointsDirection;

  /**
   * Centipoints. Must be a positive integer — direction carries the sign.
   *
   * Bounded at Number.MAX_SAFE_INTEGER: the documented contract (above) is a
   * bare JSON number, and body-parser's JSON.parse already loses precision
   * for integers beyond 2^53-1 before class-validator ever sees the value —
   * @IsInt() alone cannot detect that after the fact. This bound rejects the
   * unsafe range outright (400) instead of silently accepting a corrupted
   * amount. Not a contract change: real admin adjustments never approach it.
   */
  @IsInt()
  @IsPositive()
  @Max(Number.MAX_SAFE_INTEGER)
  amountMinor!: number;

  @IsString()
  @MinLength(1, { message: 'reason must not be empty (docs/POINTS_SYSTEM.md §9)' })
  @MaxLength(500)
  reason!: string;
}
