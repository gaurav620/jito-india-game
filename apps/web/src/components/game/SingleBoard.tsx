'use client';

import React from 'react';

import { CellBetTooltip } from './CellBetTooltip';

export interface SingleBoardProps {
  bets: Record<string, number>;
  winValue?: number;
  winStake?: number;
  winPayout?: number;
  activeTooltipCell?: number | null;
  onPlaceBet: (type: 'single', value: number) => void;
  onRemoveBet: (type: 'single', value: number) => void;
  isLocked?: boolean;
}

export const SingleBoard: React.FC<SingleBoardProps> = ({
  bets,
  winValue,
  winStake,
  winPayout: _winPayout,
  activeTooltipCell,
  onPlaceBet,
  onRemoveBet,
  isLocked = false,
}) => {
  return (
    <div
      id="single-section-container"
      style={{
        position: 'absolute',
        left: '372.5px',
        top: '511.5px',
        width: '615px',
        height: '148px',
        backgroundImage: "url('/assets/tc/Pixel_holder_Game2.webp')",
        backgroundSize: '100% 100%',
        backgroundRepeat: 'no-repeat',
        userSelect: 'none',
        zIndex: 5,
        pointerEvents: 'none',
      }}
    >
      {/* 10 Single Digit Cells (0..9) */}
      <div
        id="single-cells-row"
        style={{
          position: 'absolute',
          left: '42.5px',
          top: '63px',
          width: '530px',
          height: '53px',
          display: 'grid',
          gridTemplateColumns: 'repeat(10, 53px)',
          gap: '0px',
          pointerEvents: 'auto',
        }}
      >
        {Array.from({ length: 10 }).map((_, digit) => {
          const stake = bets[`single:${digit}`] || 0;
          const isWinning = winValue !== undefined && winValue === digit;
          // Singles alternate starting on pink (0 is pink, 1 is green)
          const isGreen = digit % 2 !== 0;
          const cellBg = stake > 0
            ? '/assets/tc/51X510003.webp'
            : isGreen
            ? '/assets/tc/51X510001.webp'
            : '/assets/tc/51X510002.webp';

          const showTooltip = activeTooltipCell === digit && stake > 0 && !isWinning;

          return (
            <div
              key={`single-wrapper-${digit}`}
              style={{ position: 'relative', width: '53px', height: '53px', zIndex: showTooltip ? 60 : undefined }}
            >
              {/* Cell Bet Calculation Tooltip */}
              {showTooltip && (
                <CellBetTooltip
                  type="single"
                  value={digit}
                  stake={stake}
                />
              )}

              {/* Winner Tooltip Speech Bubble (Pop_Pixel_Icon.webp) */}
              {isWinning && winStake !== undefined && (
                <CellBetTooltip
                  type="single"
                  value={digit}
                  stake={winStake}
                  style={{ bottom: '56px' }}
                />
              )}

              <button
                type="button"
                className="tc-board-cell"
                disabled={isLocked}
                onClick={() => onPlaceBet('single', digit)}
                onContextMenu={(e) => {
                  e.preventDefault();
                  onRemoveBet('single', digit);
                }}
                style={{
                  width: '53px',
                  height: '53px',
                  backgroundImage: `url('${cellBg}')`,
                  cursor: isLocked ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: isWinning ? 'center' : stake > 0 ? 'flex-start' : 'center',
                  paddingTop: isWinning ? '0px' : stake > 0 ? '4px' : '0px',
                  padding: 0,
                }}
                title={`Single ${digit}${stake > 0 ? ` (Stake: ${stake})` : ''}`}
              >
                {/* Win Starburst Badge (behind text at zIndex: 3) */}
                {isWinning && (
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      backgroundImage: "url('/assets/tc/ICON0003.webp')",
                      backgroundSize: '100% 100%',
                      backgroundRepeat: 'no-repeat',
                      zIndex: 3,
                    }}
                  />
                )}

                {/* Digit Value */}
                <span
                  style={{
                    fontFamily: "'HERMESC_20', 'Oswald', 'Impact', sans-serif",
                    fontSize: stake > 0 ? '22px' : '34px',
                    fontWeight: 700,
                    color: !isWinning && stake > 0 ? '#FFFFFF' : '#000000',
                    lineHeight: '1',
                    zIndex: 5,
                  }}
                >
                  {digit}
                </span>

                {/* Stake Amount on golden dome */}
                {stake > 0 && !isWinning && (
                  <span
                    style={{
                      position: 'absolute',
                      bottom: '4px',
                      fontFamily: "'HERMESC_20', 'Oswald', sans-serif",
                      fontSize: '14px',
                      fontWeight: 700,
                      color: '#000000',
                      lineHeight: '1',
                      zIndex: 5,
                    }}
                  >
                    {stake}
                  </span>
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
