/**
 * JITO INDIA GAMES — Design System Tokens
 *
 * Centralized design tokens for colors, typography, gold gradients,
 * shadows, and casino grid states.
 */

export const casinoColors = {
  // Backgrounds
  deepBlack: '#0A0A0F',
  richBlack: '#12121A',
  darkSurface: '#1A1A2E',
  darkPanel: '#161622',
  tableDimOverlay: 'rgba(0, 0, 0, 0.75)',

  // Gold Palette (Frames, borders, luxury accents)
  goldPrimary: '#FFD700',
  goldLight: '#FFE57F',
  goldSecondary: '#FFC107',
  goldWarm: '#B8860B',
  goldAntique: '#DAA520',
  goldDark: '#7D5A12',
  goldBorder: '#C5A059',

  // Casino Game Grids (Alternating green and pink/magenta)
  gridGreen: '#00C853',
  gridGreenHover: '#00E676',
  gridPink: '#E91E63',
  gridPinkHover: '#FF4081',

  // Game State Indicators
  winHighlight: '#FFD740',
  timerGreen: '#00E676',
  timerWarning: '#FF9100',
  timerCritical: '#FF1744',
  lockedRed: '#D50000',

  // Modal styling (Baroque frame with cream interior)
  modalCreamBg: '#FDF6E2',
  modalCreamLight: '#FFFDF5',
  modalCreamBorder: '#E6D7B8',
  modalTextDark: '#1A1A1A',

  // Chip Denominations colors
  chips: {
    2: { bg: '#2196F3', text: '#FFFFFF', border: '#1565C0', ring: '#90CAF9' },
    5: { bg: '#E53935', text: '#FFFFFF', border: '#B71C1C', ring: '#EF9A9A' },
    10: { bg: '#43A047', text: '#FFFFFF', border: '#1B5E20', ring: '#A5D6A7' },
    20: { bg: '#8E24AA', text: '#FFFFFF', border: '#4A148C', ring: '#CE93D8' },
    30: { bg: '#FB8C00', text: '#FFFFFF', border: '#E65100', ring: '#FFE082' },
    40: { bg: '#00ACC1', text: '#FFFFFF', border: '#006064', ring: '#80DEEA' },
    50: { bg: '#3949AB', text: '#FFFFFF', border: '#1A237E', ring: '#9FA8DA' },
    75: { bg: '#D81B60', text: '#FFFFFF', border: '#880E4F', ring: '#F48FB1' },
    100: { bg: '#F4511E', text: '#FFFFFF', border: '#BF360C', ring: '#FFAB91' },
    500: { bg: '#FFB300', text: '#000000', border: '#FF6F00', ring: '#FFE082' },
  },
} as const;

export const casinoGradients = {
  goldButton: 'linear-gradient(180deg, #FFE57F 0%, #FFD700 30%, #B8860B 80%, #7D5A12 100%)',
  greenButton: 'linear-gradient(180deg, #69F0AE 0%, #00C853 35%, #007E33 80%, #004D20 100%)',
  redButton: 'linear-gradient(180deg, #FF8A80 0%, #FF1744 35%, #C62828 80%, #7F0000 100%)',
  blueButton: 'linear-gradient(180deg, #82B1FF 0%, #2979FF 35%, #1565C0 80%, #0D47A1 100%)',
  darkBar: 'linear-gradient(180deg, #22222E 0%, #151520 60%, #0C0C14 100%)',
  baroqueGoldFrame: 'linear-gradient(135deg, #FFE57F 0%, #DAA520 25%, #7D5A12 50%, #FFD700 75%, #B8860B 100%)',
  goldSphere: 'radial-gradient(circle at 35% 35%, #FFF9C4 0%, #FFD700 40%, #B8860B 75%, #4A3505 100%)',
} as const;

export const casinoShadows = {
  goldGlow: '0 0 15px rgba(255, 215, 0, 0.5), 0 0 30px rgba(255, 215, 0, 0.25)',
  goldGlowSm: '0 0 8px rgba(255, 215, 0, 0.4)',
  bevelInset: 'inset 0 1px 0 rgba(255, 255, 255, 0.4), inset 0 -1px 0 rgba(0, 0, 0, 0.4)',
  chipShadow: '0 4px 8px rgba(0, 0, 0, 0.5), inset 0 2px 3px rgba(255, 255, 255, 0.3)',
  modalShadow: '0 25px 60px -10px rgba(0, 0, 0, 0.8), 0 0 40px rgba(218, 165, 32, 0.35)',
} as const;
