# JITO INDIA GAMES — Asset Pipeline

> Version: 1.1 | Date: 2026-09-08

---

## 1. Asset Categories

| Category | Repository Location | Format | Usage |
|----------|---------------------|--------|-------|
| Reference Assets | `assets/reference/` | JPG, PNG | Visual truth from client recordings; never directly imported as runtime UI background. |
| Vector Graphics | `packages/ui/src/styles/` | SVG | Ornate baroque frames, filigree borders, diamond pointers, gemstone highlights. |
| Chips & Badges | `packages/ui/src/components/` | CSS / SVG | Vector chip components with customizable denominations (2, 5, 10, 20, 30, 40, 50, 100, 500). |
| Phaser Canvas Sprites | `packages/game-core/src/` | Canvas graphics / WebGL | Procedural and sprite-based 3-ring wheel graphics, concentric numbered rings, center sphere. |
| Branding | `assets/branding/` | SVG, PNG | JITO INDIA GAMES logos, favicons, app icons. |
| Audio (Phase 2+) | `assets/sounds/` | MP3, WebM | Spin click, timer warning beep, win fanfare, chip drop. |

---

## 2. Reference Asset Directory Structure

```
assets/reference/
├── landing-page/
│   └── legacy-landing-page-reference.jpg
├── login/
├── lobby/
├── triple-chance-timer/
│   ├── triple-chance-active-state-reference.jpg
│   └── triple-chance-win-state-reference.jpg
├── triple-chance-pro-timer/
├── game-history/
│   └── game-history-modal-reference.jpg
├── report/
│   └── report-modal-reference.jpg
└── client-reference/
```

---

## 3. Asset Implementation Rules

1. **No Screenshot Backgrounds**: The application must NOT depend on static screenshot backgrounds for normal UI behavior. All grids, chips, timers, controls, and tables must be built using real, interactive React & Tailwind components.
2. **Vector Filigree Borders**: Ornate baroque borders are rendered via scalable SVGs and CSS gradients with metallic gold bevels (`#FFE57F`, `#FFD700`, `#DAA520`, `#B8860B`, `#7D5A12`).
3. **Responsive Scaling**: Assets must render sharply on both desktop high-DPI displays (1920x1080 standard) and mobile devices.
4. **Phaser Procedural Rendering**: The central 3-ring wheel uses Phaser Graphics and Text objects to achieve smooth 60 FPS rotation without large bitmap texture overhead.
