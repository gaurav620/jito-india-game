import React from 'react';

export interface GridCellProps {
  label: string;
  isPink?: boolean;
  isSelected?: boolean;
  isWinning?: boolean;
  betAmount?: number;
  winAmount?: number;
  disabled?: boolean;
  onClick?: () => void;
  size?: 'sm' | 'md';
}

/**
 * Doubles & Triples Game Grid Cell
 * Recreates the vibrant alternating green/pink checkered cells with
 * bet indicators and winning celebration badges.
 */
export const GridCell: React.FC<GridCellProps> = ({
  label,
  isPink = false,
  isSelected = false,
  isWinning = false,
  betAmount,
  winAmount,
  disabled = false,
  onClick,
  size = 'md',
}) => {
  const sizeClasses = {
    sm: 'w-6 h-6 text-[10px]',
    md: 'w-8 h-8 sm:w-9 sm:h-9 text-xs sm:text-sm font-black',
  }[size];

  let bgClass = isPink
    ? 'bg-gradient-to-b from-[#F06292] via-[#E91E63] to-[#C2185B] text-white border-[#F8BBD0]/40'
    : 'bg-gradient-to-b from-[#81C784] via-[#00C853] to-[#007E33] text-white border-[#C8E6C9]/40';

  if (isWinning) {
    bgClass =
      'bg-gradient-to-b from-[#FFF9C4] via-[#FFD700] to-[#FF8F00] text-black border-2 border-white shadow-[0_0_15px_rgba(255,215,0,0.9)] animate-pulse z-20';
  } else if (isSelected) {
    bgClass =
      'bg-gradient-to-b from-[#FFD54F] via-[#FFA000] to-[#FF6F00] text-black border-2 border-[#FFE57F] shadow-[0_0_8px_rgba(255,160,0,0.8)] z-10';
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`relative select-none rounded-[3px] border flex items-center justify-center transition-transform duration-100 ${sizeClasses} ${bgClass} ${
        disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer hover:brightness-120 hover:scale-105 active:scale-95'
      }`}
      style={{
        boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.4), 0 1px 2px rgba(0,0,0,0.5)',
      }}
    >
      <span className="leading-none drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]">
        {label}
      </span>

      {/* Placed Chip Badge Overlay */}
      {betAmount && betAmount > 0 && !isWinning && (
        <span className="absolute -top-1 -right-1 min-w-[14px] h-[14px] px-0.5 rounded-full bg-yellow-400 text-black font-black text-[9px] flex items-center justify-center border border-black shadow">
          {betAmount}
        </span>
      )}

      {/* Floating Bet Slip Overlay for Winning Cell (observed in reference 063) */}
      {isWinning && winAmount && (
        <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-black/90 border border-yellow-400 rounded px-1.5 py-0.5 whitespace-nowrap text-[9px] leading-tight text-yellow-300 font-bold z-30 shadow-lg pointer-events-none">
          <div>Play: {betAmount || 0}</div>
          <div className="text-white font-extrabold">WIN: {winAmount}</div>
        </div>
      )}
    </button>
  );
};
