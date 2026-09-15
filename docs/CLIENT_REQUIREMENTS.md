# JITO INDIA GAMES — Client Requirements

> Tracks all requirements from the client. Items marked **CONFIRMED** have been
> validated. Items marked **NEEDS CLIENT CONFIRMATION** are pending.

---

## 1. Confirmed Requirements (Updated Phase 1)

- [x] Replace legacy PHP platform completely
- [x] Rebrand to **JITO INDIA / JITO INDIA GAMES** (strictly eliminate old Khelo India references)
- [x] **Strict Points System**: Platform operates exclusively with points. NO payment gateways, NO real-money deposits, NO withdrawals.
- [x] Desktop Casino Layout Composition: Three-zone layout (Doubles left, Wheel & Singles center, Triples right, History/Chips/Actions bottom).
- [x] Number Ranges:
  - Singles: Digits 0 to 9 in horizontal bar
  - Doubles: 00 to 99 in 10x10 alternating green/pink checkered grid
  - Triples: 000 to 999 in 10x10 grid with 000, 100, 200 ... 900 range selector tabs
- [x] Central Wheel: 3 concentric rings (Outer: Triples 0-9 red, Middle: Doubles 0-9 green, Inner: Singles 0-9 purple), top pointer, center gold sphere displaying 3-digit winning result.
- [x] Chip Denominations: 2, 5, 10, 20, 30, 40, 50, 75, 100, 500, plus RANDOM PICK.
- [x] Game Actions: DOUBLE, REPEAT, INFO, CLEAR.
- [x] Game History Modal: S NO, Game ID, Played, Won.
- [x] Report Modal: DATE, SALE POINT, WIN POINT, END, COMMI POINT, NTP POINT, date range filter (FROM/TO), VIEW button.
- [x] Support Windows PC (Electron desktop shell)
- [x] Support Android (Capacitor mobile shell, landscape orientation)
- [x] Two Games for V1: Triple Chance Timer, Triple Chance Pro Timer
- [x] Server-authoritative state model (Client consumes state; NO client RNG)

---

## 2. Pending Client Confirmation

| # | Question | Category | Impact | Current Phase 1 Default |
|---|----------|----------|--------|-------------------------|
| 1 | Exact round countdown duration | Game | Timing | 90s total (with 10s "NO MORE PLAY" lock) |
| 2 | Exact payout multipliers per category | Game | Settlement | Configurable constants in Phase 2 |
| 3 | Exact commission / rake percentage formula | Game | Settlement | Configurable percentage |
| 4 | Exact difference in rules between Timer vs Pro Timer | Game | Game Logic | Pro mode supports extended history & high-roller tiers |
| 5 | Registration requirements: Phone only or Email + Phone? | Auth | API | Implemented flexible form supporting both |
| 6 | Exact thermal POS printer protocol for Print Client | Desktop | Distribution | ESC/POS standard |
| 7 | Legacy user database export format | Migration | Migration script | Pending database dump |
| 13 | **Is each chip placement an immediate server-side bet, or does the client accumulate selections and submit one bet per round?** Raised by the Phase 2 architecture review. | Game / API | `POST /bets` contract, rate limits, history volume | Server supports **both** models; rate limit sized for the per-chip worst case (240/min). See `docs/API_V2.md` §6. |
