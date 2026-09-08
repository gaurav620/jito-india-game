/**
 * Wallet/Points types for JITO INDIA GAMES.
 */

/** Wallet entity */
export interface Wallet {
  id: string;
  userId: string;
  balance: number;
  createdAt: string;
  updatedAt: string;
}

/** Transaction type */
export enum TransactionType {
  Credit = 'credit',
  Debit = 'debit',
}

/** Transaction reference type — what caused this transaction */
export enum TransactionRefType {
  BetPlaced = 'bet_placed',
  SettlementWin = 'settlement_win',
  AdminCredit = 'admin_credit',
  AdminDebit = 'admin_debit',
  Refund = 'refund',
}

/** Wallet transaction record */
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
