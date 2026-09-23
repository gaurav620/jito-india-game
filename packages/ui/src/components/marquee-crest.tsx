import React from 'react';

export type CrestSize = 'sm' | 'md' | 'lg';

export interface MarqueeCrestProps {
  size?: CrestSize;
  className?: string;
}

const SIZE_MAP: Record<CrestSize, { scale: string }> = {
  sm: { scale: 'w-[180px] h-[120px]' },
  md: { scale: 'w-[260px] h-[175px]' },
  lg: { scale: 'w-[340px] h-[230px]' },
};

/**
 * MarqueeCrest
 *
 * 1:1 Recreation of the iconic casino marquee crest observed in the
 * reference game (assets/reference/starting-screen/image.png), updated
 * with the official JITO INDIA GAMES brand.
 */
export const MarqueeCrest: React.FC<MarqueeCrestProps> = ({ size = 'md', className = '' }) => {
  const dimensions = SIZE_MAP[size];

  return (
    <div
      className={`relative select-none inline-flex items-center justify-center filter drop-shadow-[0_8px_25px_rgba(0,0,0,0.85)] ${dimensions.scale} ${className}`}
      role="img"
      aria-label="Jito India Games Marquee Logo"
    >
      <svg
        viewBox="0 0 340 230"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full overflow-visible"
      >
        <defs>
          {/* Gold Frame Gradients */}
          <linearGradient id="goldRim" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFF2A3" />
            <stop offset="25%" stopColor="#E5B83B" />
            <stop offset="50%" stopColor="#8A5A12" />
            <stop offset="75%" stopColor="#F9D462" />
            <stop offset="100%" stopColor="#9C6615" />
          </linearGradient>

          <linearGradient id="bannerGold" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFFDF0" />
            <stop offset="30%" stopColor="#F5D061" />
            <stop offset="70%" stopColor="#CE9622" />
            <stop offset="100%" stopColor="#84520B" />
          </linearGradient>

          <radialGradient id="sunburstGrad" cx="50%" cy="45%" r="60%">
            <stop offset="0%" stopColor="#E52D27" />
            <stop offset="70%" stopColor="#B31217" />
            <stop offset="100%" stopColor="#5B0507" />
          </radialGradient>

          <radialGradient id="bulbGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="50%" stopColor="#FFF4A3" />
            <stop offset="100%" stopColor="#D4A017" />
          </radialGradient>

          <filter id="goldGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#FFD700" floodOpacity="0.6" />
          </filter>

          <filter id="cardShadow" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="1" dy="3" stdDeviation="3" floodColor="#000000" floodOpacity="0.7" />
          </filter>
        </defs>

        {/* --- Background Casino Accents: Roulette Wheel & Cards (Top-Right) --- */}
        <g id="casino-accents" filter="url(#cardShadow)">
          {/* Roulette Wheel Disc */}
          <circle cx="255" cy="80" r="32" fill="#1C1B22" stroke="#D4AF37" strokeWidth="2.5" />
          <circle cx="255" cy="80" r="24" fill="none" stroke="#B31217" strokeWidth="6" strokeDasharray="3 3" />
          <circle cx="255" cy="80" r="14" fill="#0A0A0F" stroke="#E5B83B" strokeWidth="1.5" />
          <circle cx="255" cy="80" r="5" fill="#E5B83B" />

          {/* Playing Cards */}
          {/* Card 1 (Ace of Diamonds) */}
          <g transform="translate(230, 48) rotate(18)">
            <rect width="26" height="38" rx="3" fill="#FDFBF7" stroke="#333333" strokeWidth="1" />
            <text x="5" y="12" fill="#C62828" fontSize="10" fontWeight="bold" fontFamily="serif">A</text>
            <polygon points="13,18 17,24 13,30 9,24" fill="#C62828" />
          </g>
          {/* Card 2 (Ace of Spades) */}
          <g transform="translate(244, 42) rotate(32)">
            <rect width="26" height="38" rx="3" fill="#FFFFFF" stroke="#333333" strokeWidth="1" />
            <text x="5" y="12" fill="#1A1A1A" fontSize="10" fontWeight="bold" fontFamily="serif">A</text>
            <path d="M 13 18 C 11 21 8 23 8 25 C 8 27 10 28 12 28 C 12.5 28 12.8 27.8 13 27.5 L 12.5 30 L 13.5 30 L 13 27.5 C 13.2 27.8 13.5 28 14 28 C 16 28 18 27 18 25 C 18 23 15 21 13 18 Z" fill="#1A1A1A" />
          </g>
        </g>

        {/* --- Main Outer Scalloped Marquee Frame --- */}
        {/* Drop shadow / dark base */}
        <polygon
          points="170,12 270,72 260,165 170,195 80,165 70,72"
          fill="#1C1408"
        />

        {/* Gold Beveled Frame */}
        <polygon
          points="170,14 266,74 256,163 170,192 84,163 74,74"
          fill="url(#goldRim)"
          stroke="#523508"
          strokeWidth="3"
        />

        {/* Inner Sunburst Diamond Face */}
        <polygon
          points="170,26 252,78 244,153 170,178 96,153 88,78"
          fill="url(#sunburstGrad)"
          stroke="#420608"
          strokeWidth="2"
        />

        {/* Sunburst Rays */}
        <g opacity="0.3">
          <polygon points="170,102 110,36 128,30" fill="#FFE082" />
          <polygon points="170,102 148,26 166,24" fill="#FFE082" />
          <polygon points="170,102 174,24 192,26" fill="#FFE082" />
          <polygon points="170,102 212,30 230,36" fill="#FFE082" />
          <polygon points="170,102 240,54 250,68" fill="#FFE082" />
          <polygon points="170,102 90,68 100,54" fill="#FFE082" />
        </g>

        {/* --- Marquee Perimeter Bulbs (Incandescent gold/amber studs) --- */}
        {[
          { cx: 170, cy: 19 },
          { cx: 194, cy: 33 },
          { cx: 218, cy: 47 },
          { cx: 242, cy: 61 },
          { cx: 262, cy: 76 },
          { cx: 259, cy: 104 },
          { cx: 254, cy: 132 },
          { cx: 248, cy: 158 },
          { cx: 222, cy: 171 },
          { cx: 196, cy: 182 },
          { cx: 170, cy: 188 },
          { cx: 144, cy: 182 },
          { cx: 118, cy: 171 },
          { cx: 92, cy: 158 },
          { cx: 86, cy: 132 },
          { cx: 81, cy: 104 },
          { cx: 78, cy: 76 },
          { cx: 98, cy: 61 },
          { cx: 122, cy: 47 },
          { cx: 146, cy: 33 },
        ].map((bulb, i) => (
          <g key={i}>
            <circle cx={bulb.cx} cy={bulb.cy} r="4.2" fill="#5A3A0A" />
            <circle cx={bulb.cx} cy={bulb.cy} r="3.2" fill="url(#bulbGlow)" />
            <circle cx={bulb.cx - 0.8} cy={bulb.cy - 0.8} r="1" fill="#FFFFFF" opacity="0.9" />
          </g>
        ))}

        {/* --- Top Arched Title: "JITO" --- */}
        <g id="brand-jito">
          {/* Deep drop shadow */}
          <text
            x="170"
            y="94"
            textAnchor="middle"
            fontFamily="'Outfit', 'Impact', sans-serif"
            fontWeight="900"
            fontSize="54"
            letterSpacing="2"
            fill="#380608"
            transform="scale(1, 0.95)"
          >
            JITO
          </text>
          {/* Front Gold Bevel */}
          <text
            x="170"
            y="92"
            textAnchor="middle"
            fontFamily="'Outfit', 'Impact', sans-serif"
            fontWeight="900"
            fontSize="54"
            letterSpacing="2"
            fill="url(#goldRim)"
            stroke="#5A2E05"
            strokeWidth="2"
            transform="scale(1, 0.95)"
            filter="url(#goldGlow)"
          >
            JITO
          </text>
          {/* Inner Bright Highlight */}
          <text
            x="170"
            y="91"
            textAnchor="middle"
            fontFamily="'Outfit', 'Impact', sans-serif"
            fontWeight="900"
            fontSize="52"
            letterSpacing="2"
            fill="#FFFCE0"
            stroke="none"
            transform="scale(1, 0.95)"
            opacity="0.85"
          >
            JITO
          </text>
        </g>

        {/* --- Central Curved Gold Banner Ribbon --- */}
        <g id="ribbon-banner" filter="url(#goldGlow)">
          {/* Banner Fold Left */}
          <polygon points="46,148 76,134 76,168 46,182 56,165" fill="#84520B" stroke="#482C05" strokeWidth="1.5" />
          {/* Banner Fold Right */}
          <polygon points="294,148 264,134 264,168 294,182 284,165" fill="#84520B" stroke="#482C05" strokeWidth="1.5" />

          {/* Main Gold Ribbon Path */}
          <path
            d="M 68,142 C 120,132 220,132 272,142 L 268,180 C 220,168 120,168 72,180 Z"
            fill="url(#bannerGold)"
            stroke="#653F0A"
            strokeWidth="2.5"
          />
          <path
            d="M 72,146 C 120,136 220,136 268,146"
            stroke="#FFFFFF"
            strokeWidth="1.5"
            strokeOpacity="0.8"
            fill="none"
          />

          {/* Banner Text: "INDIA" */}
          <text
            x="170"
            y="166"
            textAnchor="middle"
            fontFamily="'Impact', 'Arial Black', sans-serif"
            fontWeight="900"
            fontSize="30"
            letterSpacing="4"
            fill="#45080A"
          >
            INDIA
          </text>
          <text
            x="170"
            y="165"
            textAnchor="middle"
            fontFamily="'Impact', 'Arial Black', sans-serif"
            fontWeight="900"
            fontSize="30"
            letterSpacing="4"
            fill="#5A0A0D"
            stroke="#FFF2A3"
            strokeWidth="0.8"
          >
            INDIA
          </text>
        </g>

        {/* --- Left Casino Accent: Green "50" Chip --- */}
        <g id="casino-chip-50" transform="translate(68, 126)" filter="url(#cardShadow)">
          {/* Outer Green Chip Rim */}
          <circle cx="0" cy="0" r="22" fill="#00C853" stroke="#004D20" strokeWidth="2" />
          {/* White Chip Edge Stripes */}
          <circle cx="0" cy="0" r="20" fill="none" stroke="#FFFFFF" strokeWidth="3" strokeDasharray="5 5" />
          {/* Inner Dark Core */}
          <circle cx="0" cy="0" r="14" fill="#008E3B" stroke="#D4AF37" strokeWidth="1" />
          {/* Chip Number 50 */}
          <text
            x="0"
            y="5"
            textAnchor="middle"
            fontFamily="'Impact', 'Arial Black', sans-serif"
            fontWeight="bold"
            fontSize="14"
            fill="#FFFFFF"
          >
            50
          </text>
        </g>
      </svg>
    </div>
  );
};
