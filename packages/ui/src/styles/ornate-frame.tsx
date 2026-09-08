import React from 'react';

export interface OrnateFrameProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'modal' | 'panel' | 'card' | 'gold-tray';
  title?: string;
}

/**
 * Ornate Baroque Gold Frame
 * Recreates the decorative gold scrollwork and filigree borders
 * observed in the reference casino client and modals.
 */
export const OrnateFrame: React.FC<OrnateFrameProps> = ({
  children,
  className = '',
  variant = 'modal',
  title,
}) => {
  if (variant === 'panel') {
    return (
      <div
        className={`relative rounded-lg p-[3px] bg-gradient-to-b from-[#FFE57F] via-[#B8860B] to-[#7D5A12] shadow-lg ${className}`}
      >
        <div className="relative rounded-[6px] bg-[#12121A] border border-[#FFD700]/30 h-full w-full overflow-hidden">
          {title && (
            <div className="bg-gradient-to-r from-[#1A1A2E] via-[#2A1F05] to-[#1A1A2E] border-b border-[#FFD700]/30 px-3 py-1.5 text-center">
              <span className="font-extrabold uppercase tracking-wider text-xs text-[#FFD700] drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                {title}
              </span>
            </div>
          )}
          {children}
        </div>
      </div>
    );
  }

  if (variant === 'gold-tray') {
    return (
      <div
        className={`relative rounded-xl p-[2px] bg-gradient-to-r from-[#7D5A12] via-[#FFD700] to-[#7D5A12] shadow-[0_4px_15px_rgba(0,0,0,0.6)] ${className}`}
      >
        <div className="relative rounded-[10px] bg-gradient-to-b from-[#1C1608] via-[#0E0C06] to-[#1C1608] border border-[#DAA520]/40 p-2">
          {children}
        </div>
      </div>
    );
  }

  // Modal variant — ornate filigree relief
  return (
    <div
      className={`relative rounded-2xl p-[6px] bg-gradient-to-b from-[#FFE57F] via-[#DAA520] to-[#7D5A12] shadow-[0_20px_50px_rgba(0,0,0,0.9),0_0_35px_rgba(218,165,32,0.45)] ${className}`}
    >
      {/* Decorative Corner Filigree SVGs */}
      <svg
        className="absolute -top-2 -left-2 w-8 h-8 text-[#FFE57F] pointer-events-none drop-shadow"
        viewBox="0 0 32 32"
        fill="currentColor"
      >
        <path d="M0,0 C12,0 16,4 16,16 C16,4 20,0 32,0 C32,12 28,16 16,16 C28,16 32,20 32,32 C20,32 16,28 16,16 C16,28 12,32 0,32 C0,20 4,16 16,16 C4,16 0,12 0,0 Z" />
      </svg>
      <svg
        className="absolute -top-2 -right-2 w-8 h-8 text-[#FFE57F] pointer-events-none drop-shadow"
        viewBox="0 0 32 32"
        fill="currentColor"
      >
        <path d="M0,0 C12,0 16,4 16,16 C16,4 20,0 32,0 C32,12 28,16 16,16 C28,16 32,20 32,32 C20,32 16,28 16,16 C16,28 12,32 0,32 C0,20 4,16 16,16 C4,16 0,12 0,0 Z" />
      </svg>
      <svg
        className="absolute -bottom-2 -left-2 w-8 h-8 text-[#FFE57F] pointer-events-none drop-shadow"
        viewBox="0 0 32 32"
        fill="currentColor"
      >
        <path d="M0,0 C12,0 16,4 16,16 C16,4 20,0 32,0 C32,12 28,16 16,16 C28,16 32,20 32,32 C20,32 16,28 16,16 C16,28 12,32 0,32 C0,20 4,16 16,16 C4,16 0,12 0,0 Z" />
      </svg>
      <svg
        className="absolute -bottom-2 -right-2 w-8 h-8 text-[#FFE57F] pointer-events-none drop-shadow"
        viewBox="0 0 32 32"
        fill="currentColor"
      >
        <path d="M0,0 C12,0 16,4 16,16 C16,4 20,0 32,0 C32,12 28,16 16,16 C28,16 32,20 32,32 C20,32 16,28 16,16 C16,28 12,32 0,32 C0,20 4,16 16,16 C4,16 0,12 0,0 Z" />
      </svg>

      {/* Inner Bevel Border */}
      <div className="relative rounded-[12px] bg-[#FDF6E2] border-2 border-[#D4AF37] overflow-hidden shadow-inner">
        {children}
      </div>
    </div>
  );
};
