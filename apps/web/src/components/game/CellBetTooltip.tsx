'use client';

import React from 'react';

export interface CellBetTooltipProps {
  type: 'single' | 'double' | 'triple';
  value: number;
  stake: number;
  style?: React.CSSProperties;
}

/**
 * Cell Bet Tooltip
 *
 * Speech-bubble popup displayed when a user clicks a cell to place a bet.
 * Shows:
 * - Number (e.g. 032, 21, 5)
 * - Play (current active stake on that cell)
 * - WIN (calculated potential payout: 9x for Single, 90x for Double, 900x for Triple)
 */
export const CellBetTooltip: React.FC<CellBetTooltipProps> = ({
  type,
  value,
  stake,
  style,
}) => {
  const formattedNumber =
    type === 'triple'
      ? String(value).padStart(3, '0')
      : type === 'double'
      ? String(value).padStart(2, '0')
      : String(value);

  // Payout multiplier: Single = 9x, Double = 90x, Triple = 900x
  const multiplier = type === 'triple' ? 900 : type === 'double' ? 90 : 9;
  const winAmount = stake * multiplier;

  return (
    <div
      className="cell-bet-tooltip"
      style={{
        position: 'absolute',
        bottom: type === 'single' ? '54px' : '36px',
        left: '50%',
        transform: 'translateX(-48%)',
        width: '71px',
        height: '84px',
        backgroundImage: "url('/assets/tc/Pop_Pixel_Icon.webp')",
        backgroundSize: '100% 100%',
        backgroundRepeat: 'no-repeat',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        paddingTop: '6px',
        zIndex: 60,
        pointerEvents: 'none',
        filter: 'drop-shadow(0 3px 6px rgba(0, 0, 0, 0.65))',
        userSelect: 'none',
        ...style,
      }}
    >
      {/* Top Black Area: No & Play (exact bounds: left 7px, top 7px, width 57px, height 28px) */}
      <div
        style={{
          position: 'absolute',
          left: '7px',
          top: '7px',
          width: '57px',
          height: '28px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '11px',
            fontFamily: "'HERMESC_20', 'Oswald', 'Century Gothic', sans-serif",
            fontWeight: 700,
            lineHeight: '1.1',
            letterSpacing: '0.2px',
          }}
        >
          <span style={{ color: '#FFFFFF' }}>No:&nbsp;</span>
          <span style={{ color: '#FFFF00' }}>{formattedNumber}</span>
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '11px',
            fontFamily: "'HERMESC_20', 'Oswald', 'Century Gothic', sans-serif",
            fontWeight: 700,
            lineHeight: '1.1',
            letterSpacing: '0.2px',
            marginTop: '1px',
          }}
        >
          <span style={{ color: '#FFFFFF' }}>Play:&nbsp;</span>
          <span style={{ color: '#FFFF00' }}>{stake}</span>
        </div>
      </div>

      {/* Bottom Golden Area: WIN & Potential Payout (exact bounds: left 7px, top 36px, width 57px, height 26px) */}
      <div
        style={{
          position: 'absolute',
          left: '7px',
          top: '36px',
          width: '57px',
          height: '26px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            fontSize: '11px',
            fontFamily: "'HERMESC_20', 'Oswald', 'Century Gothic', sans-serif",
            fontWeight: 900,
            color: '#382006',
            lineHeight: '1',
            letterSpacing: '0.4px',
          }}
        >
          WIN
        </div>
        <div
          style={{
            fontSize: winAmount >= 10000 ? '11px' : '12px',
            fontFamily: "'HERMESC_20', 'Oswald', 'Century Gothic', sans-serif",
            fontWeight: 900,
            color: '#201202',
            lineHeight: '1',
            marginTop: '1px',
          }}
        >
          {winAmount}
        </div>
      </div>
    </div>
  );
};
