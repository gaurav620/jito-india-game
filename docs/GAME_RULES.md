# JITO INDIA GAMES — Game Rules

> **NEEDS CLIENT CONFIRMATION**: The exact business rules, mathematics, and payout
> structures documented below are based on reference material analysis. All values
> must be confirmed by the client before implementation.

---

## 1. Game Family

**Triple Chance** — A countdown-based draw game.

### V1 Variants

| Game | Description |
|------|-------------|
| Triple Chance Timer | Standard variant with timed rounds |
| Triple Chance Pro Timer | Enhanced variant (**differences NEED CLIENT CONFIRMATION**) |

---

## 2. Betting Categories

| Category | Description | Selection |
|----------|-------------|-----------|
| Singles | Single number bet | Pick individual numbers |
| Doubles | Two-number combination | Pick number pairs |
| Triples | Three-number combination | Pick number triples |

> **NEEDS CLIENT CONFIRMATION**:
> - Number ranges for singles, doubles, triples
> - Payout multipliers per category
> - Maximum number of selections per round
> - Maximum total bet per round

---

## 3. Round Lifecycle

1. **Round Created** — New round initialized by server
2. **Betting Open** — Players can place bets
3. **Countdown Active** — Timer counting down to deadline
4. **Betting Locked** — "NO MORE PLAY" — no bets accepted
5. **Result Generation** — Server generates result
6. **Result Published** — Winning numbers displayed
7. **Settlement** — Wins/losses computed and applied
8. **Round Complete** — Transition to next round

---

## 4. Timer Rules

> **NEEDS CLIENT CONFIRMATION**:
> - Round duration (seconds)
> - Lock period before result (seconds)
> - Difference between Timer vs Pro Timer durations
> - Interval between rounds

---

## 5. Chip Denominations

> **NEEDS CLIENT CONFIRMATION**:
> - Available chip values (e.g., 10, 50, 100, 500, 1000)
> - Minimum bet per selection
> - Maximum bet per selection
> - Maximum total bet per round

---

## 6. Action Buttons

| Button | Function |
|--------|----------|
| Random Pick | Server or client selects random numbers/bets |
| Double | Doubles all current bets |
| Repeat | Repeats bets from previous round |
| Clear | Clears all current bets |
| Info | Shows game rules/help |

> **NEEDS CLIENT CONFIRMATION**:
> - Random Pick logic (server-side or client-side?)
> - Double: does it double bet amounts or number of selections?
> - Repeat: exact behavior when previous round had different denominations

---

## 7. Result Generation

> **NEEDS CLIENT CONFIRMATION**:
> - RNG algorithm requirements
> - Any regulatory/certification needs
> - Result format (how many numbers drawn)
> - How singles/doubles/triples results relate to each other

---

## 8. Payout Structure

> **NEEDS CLIENT CONFIRMATION**:
> - Singles payout multiplier
> - Doubles payout multiplier
> - Triples payout multiplier
> - Commission/rake percentage (if any)
> - Any progressive or bonus payouts

---

## 9. Wallet Rules

> **NEEDS CLIENT CONFIRMATION**:
> - Minimum balance to play
> - Maximum balance limit
> - Deposit methods
> - Withdrawal methods
> - Balance display format (currency/points)
