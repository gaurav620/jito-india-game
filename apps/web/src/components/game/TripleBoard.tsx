'use client';

import React, { useState } from 'react';

import { CellBetTooltip } from './CellBetTooltip';
import { TotalPlayTooltip } from './TotalPlayTooltip';

export interface TripleBoardProps {
  activeTab: number; // 0..9 (representing 000, 100, ..., 900)
  onTabChange: (tab: number) => void;
  bets: Record<string, number>;
  winValue?: number;
  activeTooltipCell?: number | null;
  onPlaceBet: (type: 'triple', value: number) => void;
  onRemoveBet: (type: 'triple', value: number) => void;
  onQuickRow?: (row: number) => void;
  onQuickRowUndo?: (row: number) => void;
  onQuickCol?: (col: number) => void;
  onQuickColUndo?: (col: number) => void;
  onRandomPick?: (count: number) => void;
  isLocked?: boolean;
}

const RANDOM_COUNTS = [5, 10, 15, 20, 25, 50, 100];
const TABS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

export const TripleBoard: React.FC<TripleBoardProps> = ({
  activeTab,
  onTabChange,
  bets,
  winValue,
  activeTooltipCell,
  onPlaceBet,
  onRemoveBet,
  onQuickRow,
  onQuickRowUndo,
  onQuickCol,
  onQuickColUndo,
  onRandomPick,
  isLocked = false,
}) => {
  const baseOffset = activeTab * 100;
  const [hoveredCol, setHoveredCol] = useState<number | null>(null);
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);

  const getColPlay = (col: number) => {
    let total = 0;
    for (let r = 0; r < 10; r++) {
      const val = baseOffset + r * 10 + col;
      total += bets[`triple:${val}`] || 0;
    }
    return total;
  };

  const getRowPlay = (row: number) => {
    let total = 0;
    for (let c = 0; c < 10; c++) {
      const val = baseOffset + row * 10 + c;
      total += bets[`triple:${val}`] || 0;
    }
    return total;
  };

  return (
    <div
      id="triple-section-container"
      style={{
        position: 'absolute',
        left: '870px',
        top: '0px',
        width: '490px',
        height: '600px',
        userSelect: 'none',
      }}
    >
      {/* Background Frame Panel (Includes baked-in TRIPLES header) */}
      <div
        id="triple-panel-bg"
        style={{
          position: 'absolute',
          left: '-7.75px',
          top: '28.3px',
          width: '513px',
          height: '586px',
          backgroundImage: "url('/assets/tc/triplepanel.webp')",
          backgroundSize: '100% 100%',
          backgroundRepeat: 'no-repeat',
          pointerEvents: 'none',
          zIndex: 1,
        }}
      />

      {/* 10 Hundreds Range Tabs (000..900) */}
      <div
        id="triple-tabs-row"
        style={{
          position: 'absolute',
          left: '47.5px',
          top: '90.6px',
          width: '425px',
          height: '27px',
          display: 'flex',
          zIndex: 6,
        }}
      >
        {TABS.map((t) => {
          const isSelected = t === activeTab;
          const hasBets = Object.keys(bets).some(
            (k) => k.startsWith('triple:') && Math.floor(Number(k.slice(7)) / 100) === t
          );

          const tabBg = isSelected
            ? '/assets/tc/topline0004.webp'
            : hasBets
            ? '/assets/tc/topline0003.webp'
            : '/assets/tc/topline0002.webp';

          return (
            <button
              key={`tab-${t}00`}
              type="button"
              onClick={() => onTabChange(t)}
              style={{
                width: '42.5px',
                height: '27px',
                border: 'none',
                backgroundColor: 'transparent',
                backgroundImage: `url('${tabBg}')`,
                backgroundSize: '100% 100%',
                backgroundRepeat: 'no-repeat',
                fontFamily: "'HERMESC_20', 'Oswald', 'Century Gothic', sans-serif",
                fontSize: '14px',
                fontWeight: 700,
                color: '#000000',
                cursor: 'pointer',
                padding: 0,
                outline: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: isSelected ? 2 : 1,
              }}
              title={`View ${t}00 Range`}
            >
              {t}00
            </button>
          );
        })}
      </div>

      {/* 10×10 Grid of Triple Cells (baseOffset .. baseOffset + 99) */}
      <div
        id="triple-grid"
        style={{
          position: 'absolute',
          left: '47.5px',
          top: '120px',
          width: '425px',
          height: '425px',
          display: 'grid',
          gridTemplateColumns: 'repeat(10, 42.5px)',
          gridTemplateRows: 'repeat(10, 42.5px)',
          gap: '0px',
          zIndex: 5,
        }}
      >
        {Array.from({ length: 100 }).map((_, i) => {
          const val = baseOffset + i;
          const formattedVal = String(val).padStart(3, '0');
          const stake = bets[`triple:${val}`] || 0;
          const isWinning = winValue !== undefined && winValue === val;
          const showTooltip = activeTooltipCell === val && stake > 0;
          // Checkerboard matches double board pattern of the last 2 digits
          const isGreen = (Math.floor(i / 10) + (i % 10)) % 2 === 0;

          const cellBg = stake > 0
            ? '/assets/tc/51X510003.webp'
            : isGreen
            ? '/assets/tc/51X510001.webp'
            : '/assets/tc/51X510002.webp';

          return (
            <button
              key={`triple-${formattedVal}`}
              type="button"
              className="tc-board-cell"
              disabled={isLocked}
              onClick={() => onPlaceBet('triple', val)}
              onContextMenu={(e) => {
                e.preventDefault();
                onRemoveBet('triple', val);
              }}
              style={{
                position: 'relative',
                width: '42.5px',
                height: '42.5px',
                backgroundImage: `url('${cellBg}')`,
                cursor: isLocked ? 'not-allowed' : 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: isWinning ? 'center' : stake > 0 ? 'flex-start' : 'center',
                paddingTop: isWinning ? '0px' : stake > 0 ? '3px' : '0px',
                zIndex: showTooltip ? 60 : undefined,
              }}
              title={`Triple ${formattedVal}${stake > 0 ? ` (Stake: ${stake})` : ''}`}
            >
              {/* Cell Bet Calculation Tooltip */}
              {showTooltip && (
                <CellBetTooltip
                  type="triple"
                  value={val}
                  stake={stake}
                />
              )}

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

              {/* Cell Digit Label */}
              <span
                style={{
                  fontFamily: "'HERMESC_20', 'Oswald', 'Impact', sans-serif",
                  fontSize: stake > 0 ? '13px' : '19px',
                  fontWeight: 700,
                  letterSpacing: '-0.5px',
                  color: !isWinning && stake > 0 ? '#FFFFFF' : '#000000',
                  lineHeight: '1',
                  zIndex: 5,
                }}
              >
                {formattedVal}
              </span>

              {/* Stake on golden dome */}
              {stake > 0 && !isWinning && (
                <span
                  style={{
                    position: 'absolute',
                    bottom: '3px',
                    fontFamily: "'HERMESC_20', 'Oswald', sans-serif",
                    fontSize: '12px',
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
          );
        })}
      </div>

      {/* Right Row Selection Arrows R0..R9 (Pointing Left) */}
      <div
        id="triple-right-row-arrows"
        style={{
          position: 'absolute',
          left: '470.5px',
          top: '127.8px',
          width: '20px',
          height: '423px',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 6,
          pointerEvents: 'none',
        }}
      >
        {Array.from({ length: 10 }).map((_, r) => (
          <div
            key={`row-arrow-right-wrap-${r}`}
            style={{
              position: 'relative',
              width: '20px',
              height: '30px',
              marginBottom: '12.3px',
              pointerEvents: 'auto',
            }}
          >
            <button
              key={`row-arrow-right-${r}`}
              type="button"
              disabled={isLocked}
              onClick={() => onQuickRow?.(r)}
              onContextMenu={(e) => {
                e.preventDefault();
                onQuickRowUndo?.(r);
              }}
              onMouseEnter={() => setHoveredRow(r)}
              onMouseLeave={() => setHoveredRow(null)}
              style={{
                width: '20px',
                height: '30px',
                border: 'none',
                backgroundColor: 'transparent',
                backgroundImage: "url('/assets/tc/LeftGlow.webp')",
                backgroundSize: 'contain',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                cursor: isLocked ? 'not-allowed' : 'pointer',
                outline: 'none',
                padding: 0,
              }}
              aria-label={`Select Row ${r}`}
            />
            {hoveredRow === r && (
              <TotalPlayTooltip
                totalPlay={getRowPlay(r)}
                direction="right"
                style={{ top: '-45px', right: '18px' }}
              />
            )}
          </div>
        ))}
      </div>

      {/* Bottom Column Quick Selection Arrows C0..C9 (Pointing Up) */}
      <div
        id="triple-bottom-col-arrows"
        style={{
          position: 'absolute',
          left: '59.75px',
          top: '542.5px',
          width: '421px',
          height: '20px',
          display: 'flex',
          zIndex: 6,
          pointerEvents: 'none',
        }}
      >
        {Array.from({ length: 10 }).map((_, c) => (
          <div
            key={`col-arrow-bottom-wrap-${c}`}
            style={{
              position: 'relative',
              width: '30px',
              height: '20px',
              marginRight: c < 9 ? '12.2px' : '0px',
              pointerEvents: 'auto',
            }}
          >
            <button
              key={`col-arrow-bottom-${c}`}
              type="button"
              disabled={isLocked}
              onClick={() => onQuickCol?.(c)}
              onContextMenu={(e) => {
                e.preventDefault();
                onQuickColUndo?.(c);
              }}
              onMouseEnter={() => setHoveredCol(c)}
              onMouseLeave={() => setHoveredCol(null)}
              style={{
                width: '30px',
                height: '20px',
                border: 'none',
                backgroundColor: 'transparent',
                backgroundImage: "url('/assets/tc/ARROW_UP.webp')",
                backgroundSize: 'contain',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                cursor: isLocked ? 'not-allowed' : 'pointer',
                outline: 'none',
                padding: 0,
              }}
              aria-label={`Select Column ${c}`}
            />
            {hoveredCol === c && (
              <TotalPlayTooltip
                totalPlay={getColPlay(c)}
                direction={c === 0 ? 'left' : 'right'}
                style={{
                  bottom: '24px',
                  left: c === 0 ? '-6px' : '-48px',
                }}
              />
            )}
          </div>
        ))}
      </div>

      {/* Random Pick Controls (Text on Left, Tokens on Right) */}
      <div
        id="triple-random-pick-bar"
        style={{
          position: 'absolute',
          left: '150px',
          top: '563px',
          width: '370px',
          height: '35px',
          display: 'flex',
          alignItems: 'center',
          zIndex: 6,
        }}
      >
        {/* RANDOM PICK Gold Sprite Label */}
        <img
          src="/assets/tc/Random_Select.webp"
          alt="RANDOM PICK"
          style={{
            width: '83px',
            height: '13px',
            objectFit: 'contain',
            userSelect: 'none',
            pointerEvents: 'none',
            marginRight: '6px',
          }}
        />

        {/* Pink Token Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
          {RANDOM_COUNTS.map((count) => (
            <button
              key={`rp-triple-${count}`}
              type="button"
              disabled={isLocked}
              onClick={() => onRandomPick?.(count)}
              style={{
                width: '33px',
                height: '33px',
                border: 'none',
                backgroundColor: 'transparent',
                backgroundImage: "url('/assets/tc/05.webp')",
                backgroundSize: '100% 100%',
                backgroundRepeat: 'no-repeat',
                cursor: isLocked ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                outline: 'none',
                padding: 0,
              }}
              title={`Random Pick ${count} Triples`}
            >
              <span
                style={{
                  fontFamily: "'HERMESC_20', 'Oswald', sans-serif",
                  fontSize: '13px',
                  fontWeight: 700,
                  color: '#450a0a',
                  lineHeight: '1',
                }}
              >
                {count}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
