import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    '../../packages/ui/src/**/*.{js,ts,jsx,tsx,mdx}',
    '../../packages/game-core/src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        deepBlack: '#0A0A0F',
        richBlack: '#12121A',
        darkSurface: '#1A1A2E',
        gold: {
          light: '#FFE57F',
          DEFAULT: '#FFD700',
          secondary: '#FFC107',
          dark: '#B8860B',
          antique: '#DAA520',
        },
        casinoGreen: {
          light: '#69F0AE',
          DEFAULT: '#00C853',
          dark: '#007E33',
        },
        casinoPink: {
          light: '#F06292',
          DEFAULT: '#E91E63',
          dark: '#C2185B',
        },
      },
      fontFamily: {
        sans: ['Inter', 'Segoe UI', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
        display: ['Outfit', 'Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
