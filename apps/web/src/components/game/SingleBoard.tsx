'use client';

import React from 'react';

export interface SingleBoardProps {
  bets: Record<string, number>;
  onPlaceBet: (type: 'single', value: number) => void;
  onRemoveBet: (type: 'single', value: number) => void;
  isLocked?: boolean;
}

export const SingleBoard: React.FC<SingleBoardProps> = ({
  bets,
  onPlaceBet,
  onRemoveBet,
  isLocked = false,
}) => {
  return (
    <div
      id="single-section-container"
      style={{
        position: 'absolute',
        left: '372px',
        bottom: '88px',
        width: '615px',
        height: '115px',
        backgroundImage: "url('/assets/tc/Pixel_holder_Game2.webp')",
        backgroundSize: '100% 100%',
        backgroundRepeat: 'no-repeat',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        userSelect: 'none',
        zIndex: 5,
      }}
    >
      {/* SINGLES Header Pill Badge centered in the golden arch */}
      <div
        id="singles-header-badge"
        style={{
          position: 'absolute',
          top: '-12px',
          padding: '2px 24px',
          background: 'radial-gradient(ellipse at center, #1b6320 0%, #08330c 100%)',
          borderRadius: '12px',
          border: '1.5px solid #d4af37',
          boxShadow: '0 2px 5px rgba(0,0,0,0.8), inset 0 1px 2px rgba(255,255,255,0.4)',
          zIndex: 6,
        }}
      >
        <span
          style={{
            fontFamily: "'GOTHAMCONDENSED-MEDIUM', 'Century Gothic', sans-serif",
            fontSize: '13px',
            fontWeight: '900',
            color: '#a3e635',
            letterSpacing: '1.5px',
            textShadow: '0 1px 2px rgba(0,0,0,0.9)',
          }}
        >
          SINGLES
        </span>
      </div>

      {/* 10 Single Digit Cells (0..9) */}
      <div
        id="single-cells-row"
        style={{
          width: '530px',
          height: '53px',
          marginTop: '12px',
          display: 'grid',
          gridTemplateColumns: 'repeat(10, 53px)',
          gap: '0px',
          backgroundColor: '#1a1012',
        }}
      >
        {Array.from({ length: 10 }).map((_, digit) => {
          const stake = bets[`single:${digit}`] || 0;
          // Singles alternate starting on pink (0 is pink, 1 is green)
          const isGreen = digit % 2 !== 0;
          const cellBg = stake > 0
            ? '/assets/tc/51X510003.webp'
            : isGreen
            ? '/assets/tc/51X510001.webp'
            : '/assets/tc/51X510002.webp';

          return (
            <button
              key={`single-${digit}`}
              type="button"
              disabled={isLocked}
              onClick={() => onPlaceBet('single', digit)}
              onContextMenu={(e) => {
                e.preventDefault();
                onRemoveBet('single', digit);
              }}
              style={{
                position: 'relative',
                width: '53px',
                height: '53px',
                border: 'none',
                backgroundColor: isGreen ? '#76D88F' : '#FFAAC8',
                backgroundImage: `url('${cellBg}')`,
                backgroundSize: '100% 100%',
                backgroundRepeat: 'no-repeat',
                cursor: isLocked ? 'not-allowed' : 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 0,
                outline: 'none',
              }}
              title={`Single ${digit}${stake > 0 ? ` (Stake: ${stake})` : ''}`}
            >
              {/* Digit Value — BOLD BLACK NUMBERS */}
              <span
                style={{
                  fontFamily: "'GOTHAMCONDENSED-MEDIUM', 'Century Gothic', sans-serif",
                  fontSize: '24px',
                  fontWeight: 'bold',
                  color: '#000000',
                  lineHeight: '24px',
                  transform: 'translateY(-1px)',
                }}
              >
                {digit}
              </span>

              {/* Stake Amount Badge if Staked */}
              {stake > 0 && (
                <div
                  style={{
                    position: 'absolute',
                    bottom: '2px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '2px',
                    backgroundColor: 'rgba(0, 0, 0, 0.75)',
                    borderRadius: '3px',
                    padding: '0 4px',
                  }}
                >
                  <span
                    style={{
                      fontFamily: "'GOTHAMCONDENSED-MEDIUM', sans-serif",
                      fontSize: '11px',
                      fontWeight: 'bold',
                      color: '#FFD700',
                      lineHeight: '12px',
                    }}
                  >
                    {stake}
                  </span>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
