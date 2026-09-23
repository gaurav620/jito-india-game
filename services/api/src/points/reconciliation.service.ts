/**
 * PointsReconciliationService — verifies invariant #1 from
 * docs/DATABASE_V2.md §9:
 *
 *   points_accounts.balance_minor = SUM(credits) - SUM(debits)  per account
 *
 * The balance column is a performance cache; the ledger is the truth
 * (docs/POINTS_SYSTEM.md §1). This service proves the cache actually equals
 * the ledger, catching anything the DB constraints cannot express — e.g. a
 * future code path that updates one table without the other despite the
 * transactional primitive in points-ledger.service.ts.
 *
 * SCOPE (Phase 2C): a callable, tested verification method. This is NOT a
 * scheduled cron job with alerting infrastructure — docs/DATABASE_V2.md §9
 * describes that as future ops tooling ("a scheduled reconciliation job
 * asserts these and alerts on violation"); wiring a scheduler and an alert
 * channel is out of scope here and not invented. A future phase can call
 * `verifyAccount` / `verifyAll` from a cron trigger without any change to
 * this service.
 *
 * This service NEVER repairs a mismatch automatically — docs/PHASE_2_
 * IMPLEMENTATION_PLAN.md and AGENTS.md both require unconfirmed/undecided
 * behaviour to stay unimplemented rather than guessed. A detected mismatch
 * is reported for a human to investigate; auto-repair of financial history
 * is not architecture the project has approved.
 */
import { Injectable, Logger } from '@nestjs/common';

// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import { PrismaService } from '../database/prisma.service'; // DI token — must be value import

export interface AccountInvariantResult {
  userId: string;
  accountId: string;
  /** The cached projection currently stored on points_accounts. */
  projectedBalanceMinor: bigint;
  /** SUM(credits) - SUM(debits) computed fresh from points_transactions. */
  ledgerDerivedBalanceMinor: bigint;
  /** true when projected === ledger-derived. */
  matches: boolean;
}

export interface ReconciliationSummary {
  checked: number;
  mismatches: AccountInvariantResult[];
}

@Injectable()
export class PointsReconciliationService {
  private readonly logger = new Logger(PointsReconciliationService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Verify a single account's balance equals its ledger-derived sum.
   * Read-only — takes no lock, since this is a diagnostic check, not a
   * mutation. A concurrent mutation during the check can theoretically
   * produce a false-positive mismatch on an in-flight account; callers
   * running this at scale should treat a single mismatch as "recheck",
   * not "alert", and only alert on a mismatch that persists on a re-read.
   */
  async verifyAccount(userId: string): Promise<AccountInvariantResult> {
    const account = await this.prisma.pointsAccount.findUniqueOrThrow({
      where: { userId },
      select: { id: true, balanceMinor: true },
    });

    const ledgerDerived = await this.computeLedgerDerivedBalance(account.id);

    return {
      userId,
      accountId: account.id,
      projectedBalanceMinor: account.balanceMinor,
      ledgerDerivedBalanceMinor: ledgerDerived,
      matches: account.balanceMinor === ledgerDerived,
    };
  }

  /**
   * Verify every account. Intended for a future scheduled job to call
   * periodically — not invoked automatically by any request path today.
   */
  async verifyAll(): Promise<ReconciliationSummary> {
    const accounts = await this.prisma.pointsAccount.findMany({
      select: { id: true, userId: true, balanceMinor: true },
    });

    const mismatches: AccountInvariantResult[] = [];

    for (const account of accounts) {
      const ledgerDerived = await this.computeLedgerDerivedBalance(account.id);
      const matches = account.balanceMinor === ledgerDerived;

      if (!matches) {
        const result: AccountInvariantResult = {
          userId: account.userId,
          accountId: account.id,
          projectedBalanceMinor: account.balanceMinor,
          ledgerDerivedBalanceMinor: ledgerDerived,
          matches: false,
        };
        mismatches.push(result);
        this.logger.error(
          `Points invariant violation: account=${account.id} user=${account.userId} ` +
            `projected=${account.balanceMinor} ledgerDerived=${ledgerDerived}`,
        );
      }
    }

    return { checked: accounts.length, mismatches };
  }

  /** SUM(credits) - SUM(debits) for one account, computed fresh from the ledger. */
  private async computeLedgerDerivedBalance(accountId: string): Promise<bigint> {
    // Two casts, both required, both found by running this against a real
    // database (points.integration.spec.ts test 1+2):
    //   - ::uuid on account_id — Postgres has no implicit uuid = text operator.
    //   - ::bigint on the COALESCE/SUM result — PostgreSQL's SUM(bigint)
    //     returns NUMERIC, not BIGINT, by design (it avoids silent overflow
    //     on large aggregates). Without the cast, Prisma maps that NUMERIC
    //     to a Decimal object, not a JS `bigint`, and `decimal === 0n` is
    //     always false even when both print as "0" — the comparison never
    //     throws, it just silently reports every account as mismatched.
    const rows = await this.prisma.$queryRaw<Array<{ derived_balance: bigint }>>`
      SELECT
        COALESCE(SUM(CASE WHEN direction = 'credit' THEN amount_minor ELSE -amount_minor END), 0)::bigint
          AS derived_balance
        FROM points_transactions
       WHERE account_id = ${accountId}::uuid`;

    return rows[0]?.derived_balance ?? 0n;
  }
}
