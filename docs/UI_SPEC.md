# JITO INDIA GAMES — UI Specification

> Version: 1.2 | Date: 2026-09-08 | Status: REFERENCE RECREATION FOUNDATION

---

## 1. Reference Asset Inventory

The following reference assets were inspected from client-provided recordings and screenshots, and organized under `assets/reference/`:

| Filename | Screen / Feature | Key Visual & Layout Details | Implementation Relevance |
|----------|------------------|-----------------------------|--------------------------|
| `landing-page/legacy-landing-page-reference.jpg` | Public Landing Page | Vibrant casino night theme: giant 3D red dice, neon "CASINO" signage, luxury skyline, marquee banner, 3 teal/gold download buttons: "FREE DOWNLOAD FOR PC", "FREE DOWNLOAD FOR PRINT", "FREE DOWNLOAD FOR ANDROID", bottom scrolling ticker bar. Rebrand old "Khelo Indian Games" to **JITO INDIA GAMES**. | Informs `apps/web/src/app/page.tsx` and `apps/web/src/app/download/page.tsx`. High-conversion casino landing page with direct download CTAs. |
| `triple-chance-timer/triple-chance-active-state-reference.jpg` | Triple Chance Timer (Active Betting) | Desktop casino software interface: Top application bar with Lobby link, active red tab, "FOR AMUSEMENT ONLY", "Welcome, PINTU", "POINTS BALANCE 64707.00", minimize/close buttons. Game ID `736TC658`. Centered "Seconds left" with large bold numeric countdown `73`. Left zone: 00-99 Doubles grid (10x10 alternating vibrant green & pink cells) with quick picks `5, 10, 15, 20, 25, 50, 75, RANDOM PICK`. Center: Ornate gold baroque filigree frame with 3 concentric rings (Outer Triples red 0-9, Middle Doubles green 0-9, Inner Singles purple 0-9), center 3D gold sphere, top diamond pointer, and Singles 0-9 bar below. Right zone: 000-999 Triples grid with range tabs `000, 100, 200...900` and quick picks `RANDOM PICK, 5, 10, 15, 20, 25, 50, 100`. Bottom left: Recent Triple/Double/Single history table + PLAY/WIN counters. Bottom center: Chip denomination tray `2, 5, 10, 20, 30, 40, 50, 100` + "Place your chips" banner. Bottom right: Green beveled action buttons `DOUBLE, REPEAT, INFO, CLEAR`. | Primary visual blueprint for `apps/web/src/app/games/triple-chance/page.tsx`, `packages/game-core`, and `packages/ui` grid/chip primitives. |
| `triple-chance-timer/triple-chance-win-state-reference.jpg` | Triple Chance Timer (Result / Win State) | Shows active win resolution: Countdown transitioning, center gold sphere displaying winning 3-digit number `772`, top pointer aligned with outer ring `7`, middle ring `7`, inner ring `2`. Winning selection cell `063` displays floating bet slip badge with gold/black border: `No: 063`, `Play: 4`, `WIN: 3600`. Bottom left counters update to `PLAY : 4` and `WIN : 3600`. Demonstrates result reveal, pointer alignment, bet slip overlay, and celebration highlight. | Informs result state machine, winning cell highlights, bet slip overlays, and point counter updates. |
| `game-history/game-history-modal-reference.jpg` | Game History Modal | Centered desktop modal over dimmed game background. Heavy ornate gold baroque filigree outer frame. Pale cream inner panel. Top pill buttons: `GAME HISTORY` (active green) and `REPORT` (inactive). Red circular close button `X` with gold rim at top right. Table columns: `S NO`, `Game ID`, `Played`, `Won` (e.g. `1 | 623TC2314 | 40 | 0`). Scrollbar on right edge. | Direct visual specification for `GameHistoryModal` in `packages/ui` and game screen modal layer. |
| `report/report-modal-reference.jpg` | Report Modal | Same ornate gold filigree modal shell and cream panel. `REPORT` tab active. Table columns: `DATE`, `SALE POINT`, `WIN POINT`, `END`, `COMMI POINT`, `NTP POINT` (e.g. `08-09-2026 | 962.00 | 198.00 | 764.00 | 34.00 | 730.00`). Date selector controls at bottom: `FROM [8/9/2026] [Calendar Icon]`, `TO [8/9/2026] [Calendar Icon]`, and green `VIEW` button. Notice points-based accounting only (no payment gateway references). | Direct visual specification for `ReportModal` in `packages/ui` and admin reporting. |

---

## 2. Desktop Casino Game Layout Composition

```
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│ LOBBY  [Triple Chance Timer X]   FOR AMUSEMENT ONLY 🔑  Welcome, PINTU  POINTS BALANCE 64707.00 [-][X]│
├──────────────────────────────────────────────────────────────────────────────────────────┤
│ GAME ID: 736TC658                      Seconds left: 73                                  │
├───────────────────────┬───────────────────────────────────┬──────────────────────────────┤
│       DOUBLES         │           CENTRAL WHEEL           │           TRIPLES            │
│  ┌──┬──┬──┬──┬──...┐  │        ┌─────────────────┐        │ [000][100][200]...[900] tabs │
│  │00│01│02│03│04   │  │        │   Outer (0-9)   │        │  ┌───┬───┬───┬───...┐        │
│  │10│11│12│13│14   │  │        │   Middle (0-9)  │        │  │000│001│002│003   │        │
│  │..│..│..│..│..   │  │        │   Inner (0-9)   │        │  │010│011│012│013   │        │
│  │90│91│92│93│99   │  │        │  Center: [772]  │        │  │...│...│...│...   │        │
│  └──┴──┴──┴──┴──...┘  │        └─────────────────┘        │  └───┴───┴───┴───...┘        │
│ [5][10][15][20][25]   │              SINGLES              │ [RANDOM PICK][5][10][15][20] │
│ [50][75] [RANDOM PICK]│   [0][1][2][3][4][5][6][7][8][9]  │ [25][50][100]                │
├───────────────────────┴───────────────────────────────────┴──────────────────────────────┤
│ ┌───────────────────┐    ┌──────────────────────────────┐    ┌─────────────┬────────────┐│
│ │Triple: 285 925 633│    │      CHIP SELECTOR TRAY      │    │   DOUBLE    │   REPEAT   ││
│ │Double:  85  25  33│    │ (2) (5) (10) (20) (30) (40)  │    ├─────────────┼────────────┤│
│ │Single:   5   5   3│    │       (50) (100) (500)       │    │    INFO     │   CLEAR    ││
│ ├───────────────────┤    ├──────────────────────────────┤    └─────────────┴────────────┘│
│ │PLAY: 4  WIN: 3600 │    │       Place your chips       │                                │
│ └───────────────────┘    └──────────────────────────────┘                                │
└──────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Visual States & Transitions

1. **Active Betting State (`BETTING_ACTIVE`)**:
   - Countdown is decreasing (>10s green text, <10s pulsing orange).
   - Doubles, Triples, and Singles grids accept chip placements.
   - Central wheel in gentle idle rotation or suspended readiness.
   - Status bar displays "Place your chips".
2. **No More Play State (`NO_MORE_PLAY`)**:
   - Timer displays `NO MORE PLAY` in bold red with flashing alert.
   - All betting cells, chips, and action buttons immediately disabled.
   - Input locked.
3. **Wheel Spin & Resolution State (`WHEEL_SPINNING`)**:
   - 3 Concentric rings spin with realistic angular acceleration and damping.
   - Central sphere shines with gold reflective highlights.
   - Pointer arrow at top aligns sequentially with target digits (Single, Double, Triple).
4. **Result Reveal & Winning Celebration State (`RESULT_REVEAL`)**:
   - Center sphere displays the winning 3-digit number (e.g. `772`).
   - Matching Doubles (e.g. `72`) and Singles (e.g. `2`) cells pulse with gold aura.
   - Winning Triple cell (e.g. `772` or placed bet) displays bet slip badge (`No: XXX, Play: Y, WIN: Z`).
   - Bottom `WIN` total updates with celebration counter animation.
   - Brief settlement pause before transitioning to next round.

---

## 4. Color Tokens for Game Grid & Components

| Element | Background | Border | Text |
|---------|------------|--------|------|
| Doubles Even Cell | `#00C853` (Emerald Green) | `rgba(255, 215, 0, 0.4)` | `#000000` / `#FFFFFF` bold |
| Doubles Odd Cell | `#E91E63` (Casino Magenta/Pink) | `rgba(255, 215, 0, 0.4)` | `#FFFFFF` bold |
| Triples Even Cell | `#00C853` (Emerald Green) | `rgba(255, 215, 0, 0.3)` | `#000000` / `#FFFFFF` bold |
| Triples Odd Cell | `#E91E63` (Casino Magenta/Pink) | `rgba(255, 215, 0, 0.3)` | `#FFFFFF` bold |
| Selected Cell | Active chip badge overlay | Gold `#FFD700` glow | Black on chip |
| Winning Cell | Gold pulse `#FFD700` | Bright gold `#FFE57F` | Black bold with drop shadow |
| Modal Frame | Baroque Gold `#D4AF37` / `#996515` | Dual gold beveled relief | High contrast |
| Modal Inner Panel | Cream / Pale Gold `#FDF6E2` | Thin gold `#D4AF37` | `#1A1A1A` high legibility |
