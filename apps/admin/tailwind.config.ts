import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    '../../packages/ui/src/**/*.{js,ts,jsx,tsx,mdx}',
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
          dark: '#B8860B',
          antique: '#DAA520',
        },
      },
    },
  },
  plugins: [],
};

export default config;
