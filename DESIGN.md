# JITO INDIA GAMES — Design System

> Version: 1.0 | Date: 2026-09-08

---

## 1. Brand Identity

- **Brand Name**: JITO INDIA / JITO INDIA GAMES
- **Visual Direction**: Premium, casino-inspired, rich, high-contrast
- **Tone**: Confident, polished, exciting, trustworthy
- **Do NOT use**: Khelo India branding — this is a complete rebrand

---

## 2. Color Palette

### Primary Colors

| Name | Hex | Usage |
|------|-----|-------|
| Deep Black | `#0A0A0F` | Primary background |
| Rich Black | `#12121A` | Card/panel backgrounds |
| Dark Surface | `#1A1A2E` | Secondary surfaces |
| Midnight Blue | `#16213E` | Tertiary surfaces |

### Accent Colors

| Name | Hex | Usage |
|------|-----|-------|
| Royal Gold | `#FFD700` | Primary accent, borders, highlights |
| Amber Gold | `#FFC107` | Secondary gold, hover states |
| Warm Gold | `#B8860B` | Muted gold, decorative elements |
| Antique Gold | `#DAA520` | Text accents, labels |

### Game State Colors

| Name | Hex | Usage |
|------|-----|-------|
| Betting Green | `#00C853` | Active betting, success |
| Result Red | `#FF1744` | Results, alerts, locked state |
| Timer Orange | `#FF9100` | Countdown warning |
| Win Highlight | `#FFD740` | Winning numbers, celebration |
| Chip Blue | `#2196F3` | Chip selection, info |
| Disabled Gray | `#424242` | Disabled state, inactive |

### Reference-Observed Grid & Modal Colors

| Name | Hex | Usage |
|------|-----|-------|
| Grid Green Cell | `#00C853` | Doubles and Triples even grid cells |
| Grid Pink Cell | `#E91E63` | Doubles and Triples odd grid cells |
| Modal Baroque Frame | `#FFE57F` / `#DAA520` / `#7D5A12` | Ornate gold filigree outer relief |
| Modal Cream Panel | `#FDF6E2` | Internal panel for Game History and Report modals |
| Modal Red Close 'X' | `#D50000` | Circular close button with gold rim |

### Semantic Colors

| Name | Hex | Usage |
|------|-----|-------|
| Success | `#00E676` | Success messages, confirmations |
| Warning | `#FFAB00` | Warnings, low balance |
| Error | `#FF5252` | Errors, validation failures |
| Info | `#448AFF` | Information, tips |

---

## 3. Typography

### Font Stack

```css
/* Primary — Headings and UI */
font-family: 'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif;

/* Monospace — Numbers, timers, amounts */
font-family: 'JetBrains Mono', 'Fira Code', 'Consolas', monospace;

/* Display — Logo, branding */
font-family: 'Outfit', 'Inter', sans-serif;
```

### Font Sizes (rem scale)

| Token | Size | Line Height | Usage |
|-------|------|-------------|-------|
| `text-xs` | 0.75rem | 1rem | Captions, fine print |
| `text-sm` | 0.875rem | 1.25rem | Labels, secondary text |
| `text-base` | 1rem | 1.5rem | Body text |
| `text-lg` | 1.125rem | 1.75rem | Subheadings |
| `text-xl` | 1.25rem | 1.75rem | Section titles |
| `text-2xl` | 1.5rem | 2rem | Page headings |
| `text-3xl` | 1.875rem | 2.25rem | Hero text |
| `text-4xl` | 2.25rem | 2.5rem | Display, branding |
| `text-5xl` | 3rem | 1 | Large display |

### Font Weights

| Token | Weight | Usage |
|-------|--------|-------|
| `font-normal` | 400 | Body text |
| `font-medium` | 500 | Labels, buttons |
| `font-semibold` | 600 | Subheadings, emphasis |
| `font-bold` | 700 | Headings, amounts |
| `font-extrabold` | 800 | Hero, branding |

---

## 4. Spacing Scale

```
4px   — xs     (tight padding)
8px   — sm     (compact spacing)
12px  — md     (default gap)
16px  — lg     (section padding)
24px  — xl     (component gap)
32px  — 2xl    (section gap)
48px  — 3xl    (major sections)
64px  — 4xl    (page sections)
```

---

## 5. Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `rounded-sm` | 4px | Chips, small elements |
| `rounded` | 8px | Cards, inputs, buttons |
| `rounded-lg` | 12px | Panels, modals |
| `rounded-xl` | 16px | Large cards |
| `rounded-full` | 9999px | Circular elements, chips |

---

## 6. Shadows & Effects

```css
/* Card shadow */
box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3),
            0 2px 4px -2px rgba(0, 0, 0, 0.2);

/* Elevated panel */
box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.4),
            0 4px 6px -4px rgba(0, 0, 0, 0.3);

/* Gold glow (winning state) */
box-shadow: 0 0 20px rgba(255, 215, 0, 0.4),
            0 0 40px rgba(255, 215, 0, 0.2);

/* Inner glow (active state) */
box-shadow: inset 0 0 10px rgba(255, 215, 0, 0.3);

/* Glassmorphism panel */
background: rgba(26, 26, 46, 0.8);
backdrop-filter: blur(12px);
border: 1px solid rgba(255, 215, 0, 0.15);
```

---

## 7. Component Patterns

### Buttons

| Variant | Background | Text | Border |
|---------|-----------|------|--------|
| Primary | Gold gradient | Dark | Gold |
| Secondary | Transparent | Gold | Gold 50% |
| Danger | Red gradient | White | Red |
| Ghost | Transparent | White | None |
| Disabled | Gray | Gray light | Gray |

```css
/* Primary button */
background: linear-gradient(135deg, #FFD700, #B8860B);
color: #0A0A0F;
border: 1px solid #FFD700;
border-radius: 8px;
font-weight: 600;
transition: all 0.2s ease;

/* Hover */
filter: brightness(1.1);
transform: translateY(-1px);
box-shadow: 0 4px 12px rgba(255, 215, 0, 0.3);
```

### Cards

```css
background: #1A1A2E;
border: 1px solid rgba(255, 215, 0, 0.15);
border-radius: 12px;
padding: 24px;
```

### Tables

```css
/* Header */
background: rgba(255, 215, 0, 0.1);
color: #DAA520;
font-weight: 600;
text-transform: uppercase;
font-size: 0.75rem;
letter-spacing: 0.05em;

/* Rows — alternating */
background: #12121A;           /* even */
background: rgba(26, 26, 46, 0.5); /* odd */
border-bottom: 1px solid rgba(255, 255, 255, 0.05);
```

### Modals

```css
background: #1A1A2E;
border: 1px solid rgba(255, 215, 0, 0.2);
border-radius: 16px;
box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
/* Overlay */
background: rgba(0, 0, 0, 0.7);
backdrop-filter: blur(4px);
```

---

## 8. Game-Specific Components

### Game Cells (Number Grid)

```css
/* Default */
background: #12121A;
border: 1px solid rgba(255, 215, 0, 0.2);
color: #FFFFFF;
font-weight: 700;
font-family: 'JetBrains Mono', monospace;

/* Selected (bet placed) */
background: rgba(0, 200, 83, 0.2);
border-color: #00C853;
box-shadow: 0 0 8px rgba(0, 200, 83, 0.3);

/* Winning */
background: rgba(255, 215, 0, 0.3);
border-color: #FFD700;
box-shadow: 0 0 15px rgba(255, 215, 0, 0.5);
animation: pulse-gold 1s ease-in-out infinite;

/* Locked */
opacity: 0.5;
pointer-events: none;
```

### Chip Denominations

```css
/* Chip base */
border-radius: 50%;
width: 56px;
height: 56px;
font-weight: 700;
font-family: 'JetBrains Mono', monospace;
border: 3px solid;
cursor: pointer;
transition: transform 0.15s ease;

/* Chip hover */
transform: scale(1.1);

/* Chip selected */
transform: scale(1.15);
box-shadow: 0 0 12px currentColor;
```

### Countdown Timer

```css
/* Timer display */
font-family: 'JetBrains Mono', monospace;
font-size: 2.25rem;
font-weight: 800;

/* Normal (>10s) */
color: #00E676;

/* Warning (<10s) */
color: #FF9100;
animation: pulse 1s ease-in-out infinite;

/* Critical (<5s) */
color: #FF1744;
animation: pulse 0.5s ease-in-out infinite;

/* Locked */
color: #FF1744;
text-content: "NO MORE PLAY";
```

### Wheel

- Built in Phaser 3 — not CSS
- Multi-ring concentric design
- Smooth spin animation with easing
- Gold decorative frame/border
- Inner/outer ring indicators
- Result landing with bounce effect

---

## 9. State Indicators

| State | Visual Treatment |
|-------|-----------------|
| Betting Open | Green pulse, "PLACE YOUR BETS" |
| Betting Active | Green border, timer counting |
| No More Play | Red flash, all inputs locked |
| Result Generating | Wheel spinning, suspense |
| Result Published | Winning cells highlighted gold |
| Win | Gold glow animation, amount display |
| Settlement Complete | Brief confirmation, transition to next round |

---

## 10. Loading & Error States

### Loading

```css
/* Skeleton loader */
background: linear-gradient(90deg, #1A1A2E 25%, #2A2A3E 50%, #1A1A2E 75%);
background-size: 200% 100%;
animation: shimmer 1.5s ease-in-out infinite;

/* Spinner */
border: 3px solid rgba(255, 215, 0, 0.2);
border-top-color: #FFD700;
border-radius: 50%;
animation: spin 0.8s linear infinite;
```

### Toast Notifications

```css
/* Base */
background: #1A1A2E;
border-left: 4px solid;
border-radius: 8px;
padding: 12px 16px;
box-shadow: 0 10px 25px rgba(0, 0, 0, 0.4);

/* Success */ border-left-color: #00E676;
/* Error */   border-left-color: #FF5252;
/* Warning */ border-left-color: #FFAB00;
/* Info */    border-left-color: #448AFF;
```

---

## 11. Responsive Breakpoints

| Token | Width | Target |
|-------|-------|--------|
| `sm` | 640px | Small tablets |
| `md` | 768px | Tablets |
| `lg` | 1024px | Desktop |
| `xl` | 1280px | Large desktop |
| `2xl` | 1536px | Ultra-wide |

- **Desktop-first** for game presentation
- **Mobile adaptation** for Android (portrait and landscape)
- Game UI should support landscape orientation on mobile

---

## 12. Animation Standards

- **Duration**: 150-300ms for UI transitions, 500ms+ for game animations
- **Easing**: `ease-out` for entries, `ease-in` for exits, `ease-in-out` for transforms
- **Performance**: Use `transform` and `opacity` only — avoid animating layout properties
- **Reduced motion**: Respect `prefers-reduced-motion` media query
- **Game animations**: Handled by Phaser — 60 FPS target

### Key Animations

```css
@keyframes pulse-gold {
  0%, 100% { box-shadow: 0 0 10px rgba(255, 215, 0, 0.3); }
  50% { box-shadow: 0 0 25px rgba(255, 215, 0, 0.6); }
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@keyframes slideIn {
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}
```

---

## 13. Accessibility

- Minimum contrast ratio: 4.5:1 for text
- Focus indicators visible on all interactive elements
- Keyboard navigation support
- Screen reader labels for game elements
- Color is not the only indicator of state (use icons/text too)
- Respect system font size preferences where reasonable

---

## 14. Inspiration References

- Premium online casino UIs
- Modern gaming dashboards
- Dark-mode financial applications
- High-contrast data visualization
