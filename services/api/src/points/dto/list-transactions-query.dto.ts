/**
 * Query DTO for GET /points/transactions.
 *
 * Scope per docs/API_V2.md §4 + §11: pagination (page/limit) plus filtering
 * by date range and referenceType — nothing beyond what is documented.
 *
 * The global ValidationPipe (whitelist: true, forbidNonWhitelisted: true) in
 * main.ts rejects any query parameter not declared here.
 */
import { Type } from 'class-transformer';
import { IsEnum, IsISO8601, IsInt, IsOptional, Max, Min } from 'class-validator';

/**
 * Mirrors the Prisma-generated TxnRefType enum values without importing
 * @prisma/client into a DTO (keeps validation errors readable and avoids
 * coupling the HTTP layer's allowed values to the generated client).
 */
export enum TransactionRefTypeFilter {
  bet_placed = 'bet_placed',
  bet_refund = 'bet_refund',
  settlement_win = 'settlement_win',
  admin_credit = 'admin_credit',
  admin_debit = 'admin_debit',
}

export class ListTransactionsQueryDto {
  /** 1-indexed page number (docs/API_V2.md §11). */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  /** Items per page, max 100 (docs/API_V2.md §11). */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  /** Filter: only transactions on/after this ISO 8601 timestamp. */
  @IsOptional()
  @IsISO8601()
  from?: string;

  /** Filter: only transactions on/before this ISO 8601 timestamp. */
  @IsOptional()
  @IsISO8601()
  to?: string;

  /** Filter: only transactions of this reference type. */
  @IsOptional()
  @IsEnum(TransactionRefTypeFilter)
  referenceType?: TransactionRefTypeFilter;
}
