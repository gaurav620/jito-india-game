# JITO INDIA GAMES — Wallet / Points System

---

## 1. Principles

- Server-authoritative — client never determines balance
- Every mutation creates an auditable transaction record
- All balance changes within database transactions
- Prevent negative balances via CHECK constraint
- Prevent duplicate settlements via idempotency keys
- Prevent race conditions via row-level locking

## 2. Transaction Types

| Type | Direction | Description |
|------|-----------|-------------|
| `bet_placed` | Debit | Balance deducted when bet accepted |
| `settlement_win` | Credit | Winnings added after settlement |
| `admin_credit` | Credit | Admin adds points |
| `admin_debit` | Debit | Admin removes points |
| `refund` | Credit | Bet refund (cancelled round) |

## 3. Transaction Record

Every balance change records:
- `balance_before`
- `balance_after`
- `amount`
- `reference_type` + `reference_id`
- `timestamp`

## 4. Concurrency Protection

```sql
-- Use SELECT FOR UPDATE to prevent race conditions
BEGIN;
SELECT balance FROM wallets WHERE user_id = $1 FOR UPDATE;
-- validate sufficient balance
UPDATE wallets SET balance = balance - $amount WHERE user_id = $1;
INSERT INTO wallet_transactions (...) VALUES (...);
COMMIT;
```

## 5. Open Questions

> **NEEDS CLIENT CONFIRMATION**:
> - Is this real currency or a points system?
> - Deposit/withdrawal methods?
> - Minimum/maximum balance limits?
> - Any commission or rake on winnings?
