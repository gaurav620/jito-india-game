import React, { useId } from 'react';

export interface LogoProps {
  width?: number;
  className?: string;
}

/**
 * JITO INDIA GAMES marquee badge — vector artwork matching the reference game.
 * Features 26 radial perimeter bulbs, casino chip & dice accents,
 * dual-tone gold typography and ribbon banner.
 */
export const Logo: React.FC<LogoProps> = ({ width = 360, className = '' }) => {
  const rawId = useId();
  const id = rawId.replace(/[^a-zA-Z0-9]/g, '');
  const bulbs = Array.from({ length: 26 }, (_, i) => {
    const t = (i / 26) * Math.PI * 2;
    return { x: 180 + Math.cos(t) * 150, y: 118 + Math.sin(t) * 92, on: i % 2 === 0 };
  });

  return (
    <svg
      className={className}
      width={width}
      height={(width * 250) / 360}
      viewBox="0 0 360 250"
      role="img"
      aria-label="JITO INDIA GAMES"
    >
      <defs>
        <radialGradient id={`${id}rays`} cx="50%" cy="46%" r="60%">
          <stop offset="0" stopColor="#ff5a4d" />
          <stop offset="0.6" stopColor="#c0141c" />
          <stop offset="1" stopColor="#6d0409" />
        </radialGradient>
        <linearGradient id={`${id}gold`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff6c4" />
          <stop offset="0.35" stopColor="#ffd35a" />
          <stop offset="0.7" stopColor="#e39a12" />
          <stop offset="1" stopColor="#8a4b06" />
        </linearGradient>
        <linearGradient id={`${id}ribbon`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff1a8" />
          <stop offset="0.5" stopColor="#f5c542" />
          <stop offset="1" stopColor="#b77412" />
        </linearGradient>
        <radialGradient id={`${id}bulb`}>
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.45" stopColor="#fff2a0" />
          <stop offset="1" stopColor="#f7a600" />
        </radialGradient>
        <clipPath id={`${id}clip`}>
          <ellipse cx="180" cy="118" rx="150" ry="92" />
        </clipPath>
        <filter id={`${id}glow`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2.2" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      {/* Marquee body */}
      <ellipse cx="180" cy="118" rx="164" ry="104" fill={`url(#${id}gold)`} stroke="#5c2a02" strokeWidth="3" />
      <ellipse cx="180" cy="118" rx="150" ry="92" fill={`url(#${id}rays)`} stroke="#7a3b04" strokeWidth="2" />
      <g clipPath={`url(#${id}clip)`}>
        {Array.from({ length: 18 }, (_, i) => (
          <path
            key={i}
            d={`M180 118 L${180 + Math.cos((i / 18) * Math.PI * 2) * 170} ${118 + Math.sin((i / 18) * Math.PI * 2) * 110} L${
              180 + Math.cos(((i + 0.5) / 18) * Math.PI * 2) * 170
            } ${118 + Math.sin(((i + 0.5) / 18) * Math.PI * 2) * 110} Z`}
            fill="#ff7a5c"
            opacity="0.22"
          />
        ))}
      </g>
      {bulbs.map((b, i) => (
        <circle key={i} cx={b.x} cy={b.y} r="6.2" fill={`url(#${id}bulb)`} filter={`url(#${id}glow)`} opacity={b.on ? 1 : 0.75} />
      ))}
      {/* Chip + dice accents */}
      <g transform="translate(62 128) rotate(-18)">
        <circle r="22" fill="#138a4a" stroke="#fff" strokeWidth="3" strokeDasharray="7 5" />
        <circle r="13" fill="#e8fff1" />
        <text y="5" textAnchor="middle" fontFamily="Oswald, 'Arial Narrow', sans-serif" fontWeight="700" fontSize="13" fill="#0b5c31">
          50
        </text>
      </g>
      <g transform="translate(290 96) rotate(14)">
        <rect x="-17" y="-17" width="34" height="34" rx="7" fill="#fff" stroke="#8a1010" strokeWidth="2" />
        <circle cx="-8" cy="-8" r="3.6" fill="#b3121b" />
        <circle cx="0" cy="0" r="3.6" fill="#b3121b" />
        <circle cx="8" cy="8" r="3.6" fill="#b3121b" />
      </g>
      {/* Wordmark */}
      <text
        x="180"
        y="92"
        textAnchor="middle"
        fontFamily="'Kaushan Script', 'Brush Script MT', cursive"
        fontSize="54"
        fill={`url(#${id}gold)`}
        stroke="#4a1d00"
        strokeWidth="2.4"
        paintOrder="stroke"
      >
        Jito
      </text>
      <text
        x="180"
        y="148"
        textAnchor="middle"
        fontFamily="Oswald, 'Arial Narrow', Impact, sans-serif"
        fontWeight="700"
        fontSize="54"
        letterSpacing="2"
        fill={`url(#${id}gold)`}
        stroke="#4a1d00"
        strokeWidth="3"
        paintOrder="stroke"
      >
        INDIA
      </text>
      {/* Ribbon */}
      <path d="M40 176 Q180 146 320 176 L308 214 Q180 186 52 214 Z" fill={`url(#${id}ribbon)`} stroke="#6b3a05" strokeWidth="2.5" />
      <path d="M40 176 L18 196 L52 214 Z" fill="#c98914" stroke="#6b3a05" strokeWidth="2" />
      <path d="M320 176 L342 196 L308 214 Z" fill="#c98914" stroke="#6b3a05" strokeWidth="2" />
      <text
        x="180"
        y="200"
        textAnchor="middle"
        fontFamily="Oswald, 'Arial Narrow', Impact, sans-serif"
        fontWeight="700"
        fontSize="28"
        letterSpacing="5"
        fill="#4a1605"
      >
        GAMES
      </text>
    </svg>
  );
};
