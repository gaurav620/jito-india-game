'use client';

import React from 'react';

export interface GameCardProps {
  id: string;
  title: string;
  image: string;
  onClick?: () => void;
}

export const GameCard: React.FC<GameCardProps> = ({ id, title, image, onClick }) => {
  const [isHovered, setIsHovered] = React.useState(false);

  return (
    <div
      role="button"
      tabIndex={0}
      id={`game-card-${id}`}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.();
        }
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        width: '163px',
        height: '140px',
        backgroundImage: `url('${image}')`,
        backgroundSize: '100% 100%',
        backgroundRepeat: 'no-repeat',
        cursor: 'pointer',
        transform: isHovered ? 'scale(1.05)' : 'scale(1)',
        transition: 'transform 0.15s ease-in-out, filter 0.15s ease-in-out',
        filter: isHovered
          ? 'drop-shadow(0 6px 12px rgba(255, 215, 0, 0.45))'
          : 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.75))',
        outline: 'none',
      }}
      title={title}
      aria-label={title}
    />
  );
};
