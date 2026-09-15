import React from 'react';

import { casinoColors } from '../styles/tokens';

export type ChipDenomination = 2 | 5 | 10 | 20 | 30 | 40 | 50 | 75 | 100 | 500;

export interface ChipProps {
  value: ChipDenomination;
  isSelected?: boolean;
  onClick?: () => void;
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
}

/**
 * Realistic Casino Chip Component
 * Recreates authentic casino chip tokens with edge stripes and inner numeric core.
 */
export const Chip: React.FC<ChipProps> = ({
  value,
  isSelected = false,
  onClick,
  size = 'md',
  disabled = false,
}) => {
  const config = casinoColors.chips[value] || casinoColors.chips[10];

  const sizeClasses = {
    sm: 'w-8 h-8 text-[10px]',
    md: 'w-12 h-12 text-xs',
    lg: 'w-14 h-14 text-sm',
  }[size];

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`relative rounded-full select-none font-black flex items-center justify-center transition-all duration-150 ${sizeClasses} ${
        isSelected
          ? 'scale-115 ring-4 ring-[#FFD700] shadow-[0_0_15px_rgba(255,215,0,0.8)] z-10 -translate-y-1'
          : 'hover:scale-105 hover:-translate-y-0.5 shadow-md'
      } ${disabled ? 'opacity-40 pointer-events-none' : 'cursor-pointer'}`}
      style={{
        backgroundColor: config.bg,
        border: `3px dashed ${config.border}`,
        boxShadow: isSelected
          ? '0 6px 12px rgba(0,0,0,0.6), inset 0 2px 4px rgba(255,255,255,0.6)'
          : '0 3px 6px rgba(0,0,0,0.5), inset 0 1px 2px rgba(255,255,255,0.4)',
      }}
    >
      {/* Outer Striped Ring */}
      <div
        className="absolute inset-1 rounded-full flex items-center justify-center border border-white/40"
        style={{
          background: `radial-gradient(circle, ${config.bg} 50%, ${config.ring} 100%)`,
        }}
      >
        {/* Inner Core */}
        <div className="w-[72%] h-[72%] rounded-full bg-white/95 text-black font-extrabold flex items-center justify-center border border-black/20 shadow-inner">
          <span className="leading-none drop-shadow-[0_1px_0_rgba(255,255,255,0.8)]">
            {value}
          </span>
        </div>
      </div>
    </button>
  );
};
