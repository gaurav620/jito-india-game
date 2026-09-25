/**
 * BetsService — bet placement (docs/API_V2.md §6, docs/POINTS_SYSTEM.md §6–7,
 * Step 7 of docs/PHASE_2_IMPLEMENTATION_PLAN.md).
 *
 * docs/API_V2.md §6:
 *   POST /bets
 *   Headers: Idempotency-Key: <opaque client string, required>  (REQUIRED)
 *     docs/API_V2.md §6 and docs/POINTS_SYSTEM.md §5 show
 *     `bet:{userId}:{roundId}:{clientRequestId}` as an EXAMPLE value, not a
 *     required format — see "Idempotency key" in this file's body for the
 *     full contract audit. The server requires only: present, and no
 *     longer than `bets.idempotency_key`'s `VARCHAR(120)`.
 *   { "roundId", "gameId", "items": [{ "category", "selection", "amountMinor" }] }
 *
 * Lock order (mandatory, ADR-022, docs/POINTS_SYSTEM.md §6–§7): ROUND → ACCOUNT → BET.
 *   1. Lock the round row FIRST — this is what serialises a bet against the
 *      engine's BETTING_LOCKED transition. Validate state (BETTING_OPEN |
 *      BETTING_ACTIVE) and the deadline INSIDE the lock, using PostgreSQL's
 *      own `now()` (ADR-019) — never the application host's clock, never
 *      the client's timer.
 *   2. Lock the points account and validate the balance — BEFORE persisting
 *      anything — via `PointsLedgerService.lockAndValidateAccount`. This is
 *      the split half of the ONE authoritative points-mutation primitive
 *      (ADR-028): it takes the account `FOR UPDATE` lock and proves the
 *      balance is sufficient, but writes nothing yet. The account stays
 *      locked for the rest of this transaction regardless of what runs next
 *      (`FOR UPDATE` is held until COMMIT/ROLLBACK, not until the
 *      statement returns), so step 3 below cannot race a concurrent
 *      mutation against the same account.
 *   3. Persist the `bets`/`bet_items` rows, now that the round is locked,
 *      the account is locked, and the balance is proven sufficient.
 *   4. Commit the debit via `PointsLedgerService.commitMutation` — inserts
 *      the ledger row and updates the balance projection, using the token
 *      from step 2. BetsService never runs `UPDATE points_accounts` or
 *      `INSERT points_transactions` itself; that SQL lives in exactly one
 *      place (PointsLedgerService), never duplicated here.
 *   All four writes (bet, bet_items, points_transaction, balance update)
 *   happen inside ONE `$transaction`: either all commit, or none do.
 *
 * BETTING_OPEN → BETTING_ACTIVE is intentionally NOT performed here.
 *   docs/GAME_ENGINE_V2.md §2's diagram labels "first bet placed" as this
 *   transition's trigger, but round-state transitions are exclusively
 *   `services/game-engine`'s job under the single-writer architecture
 *   (ADR-017) — `services/api` never transitions a round. Both BETTING_OPEN
 *   and BETTING_ACTIVE already accept bets identically (docs/GAME_ENGINE_V2.md
 *   §2's state table), so this has no effect on bet-acceptance correctness.
 *   TODO (future, game-engine, NOT this step): teach RoundsService's
 *   reconciler to observe "≥1 bet exists for a BETTING_OPEN round" and
 *   perform the transition itself, the same way it already observes
 *   "deadline passed" for the LOCKED transition.
 *
 * Idempotency key — two DIFFERENT keys, deliberately.
 *
 *   Contract audit (this section's finding, re-confirmed on request): the
 *   `bet:{userId}:{roundId}:{clientRequestId}` string shown in this file's
 *   header comment and in docs/API_V2.md §6 is an ILLUSTRATIVE EXAMPLE, not
 *   a required/enforced structure. Evidence:
 *     - docs/POINTS_SYSTEM.md §5's OWN table, describing the exact same
 *       operation, states the key's actual origin as "Client-generated UUID
 *       per user action" — a plain opaque UUID, not the composite string
 *       its own preceding line shows as an example.
 *     - The identical pattern already exists, approved, for admin
 *       adjustments (`adj:{adminId}:{uuid}`, docs/API_V2.md §8.2) — and
 *       `AdminPointsService` (Phase 2C, unchanged here) never parses or
 *       structurally validates that key. It is treated as an opaque
 *       required string. This is the established precedent this service
 *       follows.
 *     - Enforcing "the userId portion must equal the authenticated
 *       JwtPayload.sub" would mean branching request acceptance on
 *       content parsed OUT of a client-controlled string — i.e. using
 *       client-claimed identity for something authorization-adjacent, which
 *       is exactly what JWT-only authorization (already the rule here) exists
 *       to avoid. The JWT `sub` is authoritative for who the request is FOR;
 *       nothing about the header needs to agree with it.
 *   Conclusion: the header remains OPAQUE. The server requires it to be
 *   PRESENT and to fit the DB column, and does not parse, split, or
 *   validate any internal structure.
 *
 *   `bets(user_id, idempotency_key)` stores the RAW client-supplied header
 *   value, scoped per user by the schema's own unique constraint — this is
 *   already safe as-is, PROVIDED it fits `VARCHAR(120)` (docs/DATABASE_V2.md
 *   §4.7). An oversized header is rejected deterministically
 *   (`BetIdempotencyKeyTooLongException`, 400) before any transaction is
 *   opened — otherwise it would reach `tx.bet.create()` and fail on
 *   PostgreSQL's own length constraint, which is an uncaught
 *   `PrismaClientKnownRequestError` (not P2002), surfacing as a 500 rather
 *   than a clean 400.
 *
 *   `points_transactions(idempotency_key)` is a GLOBAL, VARCHAR(120)
 *   column. The ledger key is therefore `bet-debit:{betId}` — the
 *   server-generated bet id, never client content:
 *     - Length-safe: `bet-debit:` (10 chars) + a UUID (36 chars) = 46
 *       chars, far under 120, regardless of how long the client's raw key
 *       is (the documented format alone can already approach 120).
 *     - Collision-safe by construction, not merely by defence: two
 *       different users (or the same user, two different bets) can never
 *       produce the same betId, so no cross-user "key reused" false
 *       conflict is even possible on this constraint — unlike embedding the
 *       client's key (raw or namespaced), which would only be defended
 *       against by PointsLedgerService's ownership check, not prevented.
 *     - A GENUINE replay (same client key, same user, retried) is still
 *       caught deterministically — just by the `bets` table's constraint,
 *       not the ledger's: the retry's `tx.bet.create()` hits
 *       `uq_bets_user_idempotency` first (before the ledger is ever
 *       reached), rolls back, and `findReplay` returns the original result.
 *       The two constraints protect two different, complementary
 *       invariants: `bets` protects "this client intent produces exactly
 *       one bet"; `points_transactions` protects "this exact bet id is
 *       ever debited exactly once", which holds regardless of how the bet
 *       was reached.
 *
 * Numeric safety (technical, not a business bet limit — see docs/API_V2.md
 * §6's own note that limits are NEEDS CLIENT CONFIRMATION).
 *   Every client-supplied `amountMinor` is already bounded at the DTO layer
 *   (`@IsInt`, `@IsPositive`, `@Max(Number.MAX_SAFE_INTEGER)`). `@IsInt` uses
 *   `Number.isInteger` under the hood, which is `false` for `NaN` and
 *   `Infinity` — both are therefore already rejected before this service
 *   ever runs, with no code change needed here (confirmed by a direct
 *   `class-validator` unit test, since this fact is otherwise easy to get
 *   wrong by assumption).
 *   `mergeItems` re-checks `Number.isSafeInteger` per item anyway, as
 *   defense in depth: `BigInt()` throws an uncaught `RangeError` on a
 *   non-integer input, and that check makes this impossible regardless of
 *   caller, not only regardless of the HTTP validation pipeline.
 *   Merging duplicate selections (summing as BigInt — arbitrary precision,
 *   cannot itself lose precision) and computing the grand total can still
 *   produce a value that exceeds `Number.MAX_SAFE_INTEGER` even when every
 *   individual item was within range — and the response serializes these
 *   BigInt values back to JS numbers via `centipointsToNumber()`. Both the
 *   merged per-selection amount and the final total are therefore
 *   re-validated after merging, and rejected deterministically
 *   (`UnsafeAmountException`) rather than silently losing precision.
 *
 * Rate limiting / bet limits — deliberately NOT implemented.
 *   `RedisService.betRateLimitKey` exists but is unused: 240/min
 *   (docs/API_V2.md §10, ADR-025) is a capacity/design target, not a
 *   confirmed rejection threshold. `LIMIT_EXCEEDED` is declared in
 *   AppErrorCode (docs/API_V2.md §6's documented error-code list) but this
 *   service never throws it — no min/max bet limit is confirmed
 *   (docs/CLIENT_REQUIREMENTS.md item 9).
 */
import { randomUUID } from 'crypto';

import { centipointsToNumber } from '@jito/shared';
import { HttpException, HttpStatus, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

import { AppErrorCode } from '../common/errors';
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import { PrismaService } from '../database/prisma.service'; // DI token — must be value import
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import { PointsLedgerService } from '../points/points-ledger.service'; // DI token — must be value import

import type { PlaceBetDto, PlaceBetItemDto } from './dto/place-bet.dto';

export class BetIdempotencyKeyRequiredException extends HttpException {
  constructor() {
    super(
      { code: AppErrorCode.IDEMPOTENCY_KEY_REQUIRED, message: 'Idempotency-Key header is required.' },
      HttpStatus.BAD_REQUEST,
    );
  }
}

/**
 * The raw client Idempotency-Key exceeds `bets.idempotency_key`'s
 * `VARCHAR(120)` (docs/DATABASE_V2.md §4.7). Rejected deterministically
 * BEFORE any transaction is opened — see "Idempotency key" in the class doc
 * comment for why this check exists (an oversized value would otherwise
 * fail as an uncaught DB-length error at insert time, surfacing as a 500).
 */
export class BetIdempotencyKeyTooLongException extends HttpException {
  constructor(maxLength: number) {
    super(
      {
        code: AppErrorCode.VALIDATION_ERROR,
        message: `Idempotency-Key header must not exceed ${maxLength} characters.`,
      },
      HttpStatus.BAD_REQUEST,
    );
  }
}

/** Same idempotency key reused with a different logical payload — a client bug, surfaced loudly, never silently resolved. */
export class BetIdempotencyKeyReusedException extends HttpException {
  constructor() {
    super(
      { code: AppErrorCode.IDEMPOTENCY_KEY_REUSED, message: 'This idempotency key was already used for a different bet.' },
      HttpStatus.CONFLICT,
    );
  }
}

/** The `roundId` does not belong to the requested `gameId` — the client's assertion of intent doesn't match reality (docs/GAME_ENGINE_V2.md §3). */
export class RoundMismatchException extends HttpException {
  constructor() {
    super({ code: AppErrorCode.ROUND_MISMATCH, message: 'The round does not belong to the requested game.' }, HttpStatus.CONFLICT);
  }
}

/** The round exists and belongs to the right game, but its current state does not accept bets. */
export class RoundNotAcceptingException extends HttpException {
  constructor() {
    super(
      { code: AppErrorCode.ROUND_NOT_ACCEPTING, message: 'This round is not currently accepting bets.' },
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
  }
}

/** The authoritative (database-clock) betting deadline has passed. Never decided by the client's timer. */
export class DeadlinePassedException extends HttpException {
  constructor() {
    super({ code: AppErrorCode.DEADLINE_PASSED, message: 'The betting deadline for this round has passed.' }, HttpStatus.UNPROCESSABLE_ENTITY);
  }
}

/** A selection is out of range for its category (singles 0–9, doubles 0–99, triples 0–999 — docs/DATABASE_V2.md §4.7). */
export class InvalidSelectionException extends HttpException {
  constructor(category: string, selection: number) {
    super(
      { code: AppErrorCode.INVALID_SELECTION, message: `Selection ${selection} is out of range for category '${category}'.` },
      HttpStatus.BAD_REQUEST,
    );
  }
}

/**
 * A merged per-selection amount or the grand total cannot be represented
 * exactly as a JS number (exceeds Number.MAX_SAFE_INTEGER) — a technical
 * transport-safety rejection, NOT a business bet limit (see class doc
 * comment). Reuses the existing generic VALIDATION_ERROR code rather than
 * inventing a bet-limit-shaped one.
 */
export class UnsafeAmountException extends HttpException {
  constructor(context: string) {
    super(
      {
        code: AppErrorCode.VALIDATION_ERROR,
        message: `The amount for ${context} cannot be represented exactly as a safe integer.`,
      },
      HttpStatus.BAD_REQUEST,
    );
  }
}

export interface PlaceBetParams {
  userId: string;
  idempotencyKey: string | undefined;
  dto: PlaceBetDto;
}

export interface PlaceBetResult {
  betId: string;
  roundId: string;
  totalAmountMinor: number;
  balanceMinor: number;
  status: string;
  acceptedAt: string;
  replayed: boolean;
}

interface MergedItem {
  category: PlaceBetItemDto['category'];
  selection: number;
  amountMinor: bigint;
}

/** Selection range per category — the confirmed DB CHECK constraint, not invented here. */
const SELECTION_RANGE: Record<PlaceBetItemDto['category'], [number, number]> = {
  singles: [0, 9],
  doubles: [0, 99],
  triples: [0, 999],
};

/** The exact boundary Number.isSafeInteger uses, as a BigInt for exact comparison against merged/total centipoint sums. */
const MAX_SAFE_AMOUNT = BigInt(Number.MAX_SAFE_INTEGER);

/** `bets.idempotency_key`'s column limit (docs/DATABASE_V2.md §4.7) — the raw client header must fit this, opaquely, with no internal structure assumed. */
const MAX_IDEMPOTENCY_KEY_LENGTH = 120;

interface RoundLockRow {
  id: string;
  game_id: string;
  state: string;
  deadline_passed: boolean;
}

@Injectable()
export class BetsService {
  private readonly logger = new Logger(BetsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly ledger: PointsLedgerService,
  ) {}

  async placeBet(params: PlaceBetParams): Promise<PlaceBetResult> {
    if (!params.idempotencyKey) {
      throw new BetIdempotencyKeyRequiredException();
    }
    const idempotencyKey = params.idempotencyKey;
    if (idempotencyKey.length > MAX_IDEMPOTENCY_KEY_LENGTH) {
      throw new BetIdempotencyKeyTooLongException(MAX_IDEMPOTENCY_KEY_LENGTH);
    }
    const { userId, dto } = params;

    const merged = this.mergeItems(dto.items);
    this.validateSelectionRanges(merged);
    const totalAmountMinor = merged.reduce((sum, item) => sum + item.amountMinor, 0n);
    this.validateSafeAmounts(merged, totalAmountMinor);

    // Unlocked pre-check — an OPTIMIZATION only. It saves opening a
    // transaction (and taking the round/account locks) for the common case
    // of an obvious retry. It is NOT what makes replay durable or correct:
    // that guarantee comes from the UNIQUE constraint on `bets`, enforced
    // again below, after the real locks are acquired inside the transaction.
    const replay = await this.findReplay(userId, idempotencyKey, dto.roundId, merged, totalAmountMinor);
    if (replay) return replay;

    try {
      return await this.runPlacementTransaction(userId, idempotencyKey, dto, merged, totalAmountMinor);
    } catch (err: unknown) {
      if (err instanceof PrismaClientKnownRequestError && err.code === 'P2002') {
        // Race: another request with the SAME key committed between our
        // pre-check and our insert. Prisma rolled our transaction back —
        // no partial bet/items/ledger row from THIS call survives.
        // Re-read and return the winner's row.
        const raced = await this.findReplay(userId, idempotencyKey, dto.roundId, merged, totalAmountMinor);
        if (raced) return raced;
      }
      throw err;
    }
  }

  private async runPlacementTransaction(
    userId: string,
    idempotencyKey: string,
    dto: PlaceBetDto,
    merged: MergedItem[],
    totalAmountMinor: bigint,
  ): Promise<PlaceBetResult> {
    return this.prisma.$transaction(async (tx) => {
      // 1. LOCK ROUND FIRST (round → account → bet, ADR-022). Deadline
      // comparison happens via PostgreSQL's own now() (ADR-019) — ::uuid
      // cast required, Postgres has no implicit uuid = text operator (the
      // same gotcha documented in points-ledger.service.ts and
      // rounds.service.ts).
      const rows = await tx.$queryRaw<RoundLockRow[]>`
        SELECT id, game_id, state,
               (betting_deadline <= now()) AS deadline_passed
          FROM game_rounds
         WHERE id = ${dto.roundId}::uuid
           FOR UPDATE`;

      const round = rows[0];
      if (!round) {
        throw new NotFoundException(AppErrorCode.NOT_FOUND);
      }
      if (round.game_id !== dto.gameId) {
        throw new RoundMismatchException();
      }
      if (round.state !== 'BETTING_OPEN' && round.state !== 'BETTING_ACTIVE') {
        throw new RoundNotAcceptingException();
      }
      if (round.deadline_passed) {
        throw new DeadlinePassedException();
      }

      // 2. LOCK ACCOUNT + validate balance — BEFORE persisting the bet
      // (round → account → bet, ADR-022, docs/POINTS_SYSTEM.md §6–§7).
      // Writes nothing yet; throws InsufficientPointsException here if the
      // balance is insufficient, before any bet/bet_items row exists.
      const locked = await this.ledger.lockAndValidateAccount(tx, {
        userId,
        direction: 'debit',
        amountMinor: totalAmountMinor,
      });

      // 3. NOW persist bet + items — the account is locked and the balance
      // is already proven sufficient.
      const betId = randomUUID();
      const betRow = await tx.bet.create({
        data: {
          id: betId,
          userId,
          roundId: dto.roundId,
          totalAmountMinor,
          idempotencyKey,
        },
      });
      await tx.betItem.createMany({
        data: merged.map((item) => ({
          betId,
          category: item.category,
          selection: item.selection,
          amountMinor: item.amountMinor,
        })),
      });

      // 4. Commit the debit using the token from step 2 — inserts the
      // ledger row and updates the balance projection. This is the ONLY
      // place points_transactions/points_accounts are written, and it
      // lives entirely inside PointsLedgerService (ADR-028); BetsService
      // never runs that SQL itself.
      const ledgerResult = await this.ledger.commitMutation(tx, locked, {
        referenceType: 'bet_placed',
        referenceId: betId,
        idempotencyKey: this.ledgerIdempotencyKey(betId),
        description: `Bet on round ${dto.roundId}`,
      });

      return {
        betId,
        roundId: dto.roundId,
        totalAmountMinor: centipointsToNumber(totalAmountMinor),
        balanceMinor: centipointsToNumber(ledgerResult.balanceAfterMinor),
        status: betRow.status,
        acceptedAt: betRow.acceptedAt.toISOString(),
        replayed: false,
      };
    });
  }

  /**
   * Idempotency pre-check (see call sites for when this runs — both the
   * cheap optimization path and the post-P2002-race durable re-check use
   * the same logic). Returns the original result if this key was already
   * used with the SAME logical payload; throws 409 if used with a
   * different one; returns undefined if the key is genuinely new.
   */
  private async findReplay(
    userId: string,
    idempotencyKey: string,
    roundId: string,
    merged: MergedItem[],
    totalAmountMinor: bigint,
  ): Promise<PlaceBetResult | undefined> {
    const existing = await this.prisma.bet.findFirst({
      where: { userId, idempotencyKey },
      include: { items: true },
    });
    if (!existing) return undefined;

    const matches =
      existing.roundId === roundId &&
      existing.totalAmountMinor === totalAmountMinor &&
      this.itemsMatch(existing.items, merged);

    if (!matches) {
      this.logger.warn(`Bet idempotency key reused with a different payload: ${idempotencyKey}`);
      throw new BetIdempotencyKeyReusedException();
    }

    // Report the ORIGINAL result, not a fresh live balance — matches the
    // established replay convention (PointsLedgerService.applyMutation,
    // AdminPointsService.findReplay both return the historical
    // balanceAfterMinor from the row the replayed key actually produced).
    const ledgerRow = await this.prisma.pointsTransaction.findFirst({
      where: { referenceType: 'bet_placed', referenceId: existing.id },
      select: { balanceAfterMinor: true },
    });

    return {
      betId: existing.id,
      roundId: existing.roundId,
      totalAmountMinor: centipointsToNumber(existing.totalAmountMinor),
      balanceMinor: centipointsToNumber(ledgerRow?.balanceAfterMinor ?? 0n),
      status: existing.status,
      acceptedAt: existing.acceptedAt.toISOString(),
      replayed: true,
    };
  }

  /** Duplicate (category, selection) pairs are merged by summing amountMinor (docs/API_V2.md §6), not rejected. */
  private mergeItems(items: PlaceBetItemDto[]): MergedItem[] {
    const byKey = new Map<string, MergedItem>();
    for (const item of items) {
      const key = `${item.category}:${item.selection}`;
      // Defense in depth: the DTO layer (`@IsInt`, `@IsPositive`,
      // `@Max(Number.MAX_SAFE_INTEGER)`) already guarantees this for every
      // request that reaches here over HTTP, but BigInt() throws an
      // uncaught RangeError on a non-integer input (e.g. 400.5) rather than
      // a clean 400 — this check makes that impossible regardless of
      // caller, not just regardless of the HTTP pipeline.
      if (!Number.isSafeInteger(item.amountMinor) || item.amountMinor <= 0) {
        throw new UnsafeAmountException(`selection '${item.category}:${item.selection}'`);
      }
      const amount = BigInt(item.amountMinor);
      const existing = byKey.get(key);
      if (existing) {
        existing.amountMinor += amount;
      } else {
        byKey.set(key, { category: item.category, selection: item.selection, amountMinor: amount });
      }
    }
    return [...byKey.values()];
  }

  private validateSelectionRanges(items: MergedItem[]): void {
    for (const item of items) {
      const [min, max] = SELECTION_RANGE[item.category];
      if (item.selection < min || item.selection > max) {
        throw new InvalidSelectionException(item.category, item.selection);
      }
    }
  }

  /**
   * Per-item DTO validation (`@Max(Number.MAX_SAFE_INTEGER)`) proves each
   * INDIVIDUAL client-supplied amount is safe, but merging duplicate
   * selections (summing as BigInt) and computing the grand total can
   * exceed that boundary even when every individual item was within range.
   * Both are re-checked here, after merging — rejected deterministically,
   * never silently rounded (see class doc comment).
   */
  private validateSafeAmounts(items: MergedItem[], totalAmountMinor: bigint): void {
    for (const item of items) {
      if (item.amountMinor > MAX_SAFE_AMOUNT) {
        throw new UnsafeAmountException(`selection '${item.category}:${item.selection}'`);
      }
    }
    if (totalAmountMinor > MAX_SAFE_AMOUNT) {
      throw new UnsafeAmountException('the total bet amount');
    }
  }

  private itemsMatch(
    existingItems: Array<{ category: string; selection: number; amountMinor: bigint }>,
    merged: MergedItem[],
  ): boolean {
    if (existingItems.length !== merged.length) return false;
    const existingByKey = new Map(existingItems.map((i) => [`${i.category}:${i.selection}`, i.amountMinor]));
    return merged.every((m) => existingByKey.get(`${m.category}:${m.selection}`) === m.amountMinor);
  }

  /**
   * The ledger's idempotency key — server-derived from the pre-generated
   * bet id only, NEVER the raw client string. See "Idempotency key" in the
   * class doc comment for the length- and collision-safety rationale.
   */
  private ledgerIdempotencyKey(betId: string): string {
    return `bet-debit:${betId}`;
  }
}
