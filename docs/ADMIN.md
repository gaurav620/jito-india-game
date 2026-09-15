# JITO INDIA GAMES — Admin Panel

> Version: 1.1 | Date: 2026-09-08

---

## 1. Admin Modules (Phase 1 Built)

All admin screens are built with Next.js 14 in `apps/admin`:

| Module | Route | Purpose & Key Elements |
|--------|-------|------------------------|
| Dashboard | `/` | Real-time active players (486), active draw tables, today's sale points (428,950.00), settled win points (312,400.00), active round status cards for Triple Chance & Pro. |
| Users & Points | `/users` | Player search by ID/username, status toggle (Active/Suspended), and modal for points credit/debit adjustments. |
| Points Ledger | `/points` | Immutable ledger tracking bet debits, win payouts, and manual point adjustments with timestamps. |
| Game Rounds | `/rounds` | Real-time monitor of active game rounds (Betting Open, countdown, bet volume, and result status). |
| Game History | `/history` | Historical searchable archive of rounds, winning 3-digit results, and turnover. |
| Reports | `/reports` | Daily settlement reports matching reference columns: DATE, SALE POINT, WIN POINT, END, COMMI POINT, NTP POINT. |
| Announcements | `/announcements` | Ticker alerts and maintenance notification creator. |
| Downloads | `/downloads` | Release management for Windows PC, Android APK, and Print Client. |
| Audit Logs | `/audit` | Cryptographic audit trail of operator and system events. |

## 2. Strict Points System Architecture

> [!IMPORTANT]
> The JITO INDIA platform operates on a **POINTS SYSTEM ONLY**.
> There is strictly **NO** payment gateway integration, payment service, payment webhook, deposit/withdrawal gateway, UPI, card payment, or real-money wallet administration.

## 3. Security

- Admin interface isolated on dedicated port / subdomain.
- All point adjustments and player status toggles require operator credentials and generate audit log records.
