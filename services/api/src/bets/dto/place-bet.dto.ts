/**
 * PlaceBetDto — POST /api/v1/bets request body.
 *
 * docs/API_V2.md §6:
 *   { "roundId": "a91b…", "gameId": "triple-chance-timer",
 *     "items": [{ "category": "doubles", "selection": 72, "amountMinor": 400 }, …] }
 *
 * The global ValidationPipe (whitelist: true, forbidNonWhitelisted: true)
 * rejects any field not declared here — a player cannot smuggle a result,
 * payout, balance, or another user's id through this endpoint (`userId`
 * always comes from the authenticated JWT, never the body).
 *
 * Only shape/type validation lives here. Selection-range-per-category
 * validation (singles 0–9, doubles 0–99, triples 0–999 — the confirmed DB
 * CHECK constraint, docs/DATABASE_V2.md §4.7) is done in BetsService, where
 * it can be reported as the documented `INVALID_SELECTION` code rather than
 * a generic validation error. `gameId` membership is validated here via
 * `@IsIn` since it is a closed, already-confirmed set (`@jito/types` GameId).
 */
import { GameId } from '@jito/types';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsIn,
  IsInt,
  IsPositive,
  IsUUID,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

export class PlaceBetItemDto {
  /** 'singles' | 'doubles' | 'triples' — validated against BetCategory in the service (avoids a second enum import here). */
  @IsIn(['singles', 'doubles', 'triples'])
  category!: 'singles' | 'doubles' | 'triples';

  /**
   * The number played. Range depends on `category` — checked in
   * BetsService, not here (see file doc comment).
   */
  @IsInt()
  @Min(0)
  @Max(999)
  selection!: number;

  /**
   * Centipoints staked on this selection. Bounded at
   * Number.MAX_SAFE_INTEGER for the same JSON-transport-precision reason as
   * AdjustPointsDto.amountMinor (services/api/src/admin/points/dto/adjust-points.dto.ts)
   * — body-parser's JSON.parse already loses precision beyond 2^53-1 before
   * class-validator ever sees the value.
   */
  @IsInt()
  @IsPositive()
  @Max(Number.MAX_SAFE_INTEGER)
  amountMinor!: number;
}

export class PlaceBetDto {
  @IsUUID()
  roundId!: string;

  @IsIn(Object.values(GameId))
  gameId!: GameId;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => PlaceBetItemDto)
  items!: PlaceBetItemDto[];
}
