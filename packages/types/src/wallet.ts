/**
 * Points Account and Transaction types for JITO INDIA GAMES.
 *
 * Phase 2 — Replaces Wallet/WalletTransaction per ADR-014.
 *
 * STRICTLY POINTS-ONLY. No payment gateway, deposit, withdrawal, cashout,
 * or real-money wallet. No payment types may be added (ADR-011, PRD §12).
 *
 * All monetary values use BIGINT centipoints (1 point = 100 centipoints)
 * with a `_minor` suffix. Conversion to display format (e.g. "64707.00")
 * happens only at the API boundary via @jito/shared centipoints helpers.
 */

/**
 * Transaction direction — always positive amount_minor, direction carries sign.
 * This makes SUM aggregations unambiguous and prevents a sign error from
 * silently reversing a transaction.
 */
export enum TxnDirection {
  Credit = 'credit',
  Debit = 'debit',
}

/**
 * What caused a points transaction — every ledger row must name its cause.
 * There is no deposit, withdrawal, cashout, topup_purchase, or payout_transfer
 * type, and none may be added (ADR-011).
 */
export enum TransactionRefType {
  /** Bet accepted — points debited from balance */
  BetPlaced = 'bet_placed',
  /** Round voided / bet cancelled — points refunded (ADR-015) */
  BetRefund = 'bet_refund',
  /** Winning settlement — points credited */
  SettlementWin = 'settlement_win',
  /** Operator grants amusement balance */
  AdminCredit = 'admin_credit',
  /** Operator removes points */
  AdminDebit = 'admin_debit',
}

/**
 * Points account (one per user, created in the same transaction as the user).
 * Phase 2 name per ADR-014. balance_minor is a cached projection of the ledger.
 */
export interface PointsAccount {
  id: string;
  userId: string;
  /** BIGINT centipoints. CHECK (balance_minor >= 0) at the database level. */
  balanceMinor: bigint;
  /** Increments on every mutation — for optimistic-concurrency diagnostics */
  version: bigint;
  createdAt: string;
  updatedAt: string;
}

/**
 * Points transaction (append-only ledger — never updated or deleted).
 * Phase 2 name per ADR-014.
 *
 * Ledger integrity guarantees:
 *   balance_after_minor = balance_before_minor + (credit ? +amount_minor : -amount_minor)
 *   UNIQUE(idempotency_key) — the primary anti-double-spend guarantee.
 */
export interface PointsTransaction {
  id: string;
  accountId: string;
  direction: TxnDirection;
  /** Always positive. Direction carries the sign. */
  amountMinor: bigint;
  balanceBeforeMinor: bigint;
  balanceAfterMinor: bigint;
  referenceType: TransactionRefType;
  /** FK to bet/settlement/admin_log that caused this entry */
  referenceId: string | null;
  /** UNIQUE — prevents replay at the database level */
  idempotencyKey: string;
  description: string | null;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Phase 1 backward-compatibility aliases
// DEPRECATED — do not use in new Phase 2 code.
// Retained so apps/web and apps/admin continue to compile without changes.
// ---------------------------------------------------------------------------

/** @deprecated Use TxnDirection. Phase 1 compat alias only. */
export enum TransactionType {
  Credit = 'credit',
  Debit = 'debit',
}

/** @deprecated Use PointsAccount. Phase 1 compat alias only. */
export interface Wallet {
  id: string;
  userId: string;
  balance: number;
  createdAt: string;
  updatedAt: string;
}

/** @deprecated Use PointsTransaction. Phase 1 compat alias only. */
export interface WalletTransaction {
  id: string;
  walletId: string;
  type: TransactionType;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  referenceType: TransactionRefType;
  referenceId?: string;
  description?: string;
  createdAt: string;
}
