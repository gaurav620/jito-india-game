import React from 'react';

export interface CountdownProps {
  seconds: number;
  isLocked?: boolean;
  className?: string;
}

/**
 * Top Centered Game Countdown Timer
 * Recreates the "Seconds left" large numeric countdown and "NO MORE PLAY" alert.
 */
export const Countdown: React.FC<CountdownProps> = ({
  seconds,
  isLocked = false,
  className = '',
}) => {
  const isWarning = seconds <= 10 && seconds > 5;
  const isCritical = seconds <= 5 && seconds > 0;

  if (isLocked || seconds <= 0) {
    return (
      <div className={`flex flex-col items-center justify-center text-center ${className}`}>
        <span className="text-xs uppercase tracking-widest text-[#FF5252] font-black drop-shadow">
          Betting Closed
        </span>
        <div className="mt-0.5 px-4 py-1 rounded bg-[#D50000] border border-[#FFE57F] text-white font-black text-lg tracking-wider animate-pulse shadow-[0_0_15px_rgba(213,0,0,0.8)]">
          NO MORE PLAY
        </div>
      </div>
    );
  }

  let colorClass = 'text-[#FFD700]';
  if (isCritical) {
    colorClass = 'text-[#FF1744] animate-ping';
  } else if (isWarning) {
    colorClass = 'text-[#FF9100] animate-pulse';
  }

  return (
    <div className={`flex flex-col items-center justify-center text-center select-none ${className}`}>
      <span className="italic font-serif text-sm sm:text-base text-[#FF8A80] drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
        Seconds left
      </span>
      <div
        className={`font-black text-3xl sm:text-5xl font-mono tracking-tight leading-none drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] ${colorClass}`}
        style={{
          textShadow: '0 0 10px rgba(255,215,0,0.4), 0 2px 5px rgba(0,0,0,0.9)',
        }}
      >
        {seconds.toString().padStart(2, '0')}
      </div>
    </div>
  );
};
