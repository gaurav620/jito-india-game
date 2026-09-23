'use client';

import React, { useState } from 'react';

import { CellBetTooltip } from './CellBetTooltip';
import { TotalPlayTooltip } from './TotalPlayTooltip';

export interface DoubleBoardProps {
  gameId: string;
  bets: Record<string, number>;
  winValue?: number;
  activeTooltipCell?: number | null;
  onPlaceBet: (type: 'double', value: number) => void;
  onRemoveBet: (type: 'double', value: number) => void;
  onQuickRow?: (row: number) => void;
  onQuickRowUndo?: (row: number) => void;
  onQuickCol?: (col: number) => void;
  onQuickColUndo?: (col: number) => void;
  onRandomPick?: (count: number) => void;
  isLocked?: boolean;
  onToggleState?: () => void;
}

const RANDOM_COUNTS = [5, 10, 15, 20, 25, 50, 75];

export const DoubleBoard: React.FC<DoubleBoardProps> = ({
  gameId,
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
  onToggleState,
}) => {
  const [hoveredCol, setHoveredCol] = useState<number | null>(null);
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);

  const getColPlay = (col: number) => {
    let total = 0;
    for (let r = 0; r < 10; r++) {
      total += bets[`double:${r}${col}`] || 0;
    }
    return total;
  };

  const getRowPlay = (row: number) => {
    let total = 0;
    for (let c = 0; c < 10; c++) {
      total += bets[`double:${row}${c}`] || 0;
    }
    return total;
  };

  return (
    <div
      id="double-section-container"
      style={{
        position: 'absolute',
        left: '0px',
        top: '0px',
        width: '490px',
        height: '600px',
        userSelect: 'none',
      }}
    >
      {/* Background Ornate Baroque Frame Panel (Includes baked-in DOUBLES header) */}
      <div
        id="double-panel-bg"
        style={{
          position: 'absolute',
          left: '-8.5px',
          top: '26.7px',
          width: '512px',
          height: '590px',
          backgroundImage: "url('/assets/tc/sectionpanel.webp')",
          backgroundSize: '100% 100%',
          backgroundRepeat: 'no-repeat',
          pointerEvents: 'none',
          zIndex: 1,
        }}
      />

      {/* Top Header Badge (GAME ID 745TC694) */}
      <div
        id="game-id-badge"
        onClick={onToggleState}
        style={{
          position: 'absolute',
          left: '134.5px',
          top: '43.5px',
          width: '177px',
          height: '28.5px',
          backgroundImage: "url('/assets/tc/GAME_ID.webp')",
          backgroundSize: '100% 100%',
          backgroundRepeat: 'no-repeat',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingLeft: '14px',
          paddingRight: '14px',
          cursor: onToggleState ? 'pointer' : 'default',
          zIndex: 6,
        }}
        title="Toggle Betting / Win State Preview"
      >
        <span
          style={{
            fontFamily: "'HERMESC_20', 'Century Gothic', sans-serif",
            fontSize: '13px',
            fontWeight: 'normal',
            color: '#39FF14',
            letterSpacing: '0.8px',
          }}
        >
          GAME ID
        </span>
        <span
          style={{
            fontFamily: "'HERMESC_20', 'Century Gothic', sans-serif",
            fontSize: '13px',
            fontWeight: 'normal',
            color: '#39FF14',
            letterSpacing: '0.8px',
          }}
        >
          {gameId}
        </span>
      </div>

      {/* Left Row Quick Selection Arrows R0..R9 */}
      <div
        id="double-left-row-arrows"
        style={{
          position: 'absolute',
          left: '0px',
          top: '129px',
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
            key={`row-arrow-left-wrap-${r}`}
            style={{
              position: 'relative',
              width: '20px',
              height: '30px',
              marginBottom: '12.3px',
              pointerEvents: 'auto',
            }}
          >
            <button
              key={`row-arrow-left-${r}`}
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
                backgroundImage: "url('/assets/tc/RightGlow.webp')",
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
                direction="left"
                style={{ top: '-45px', left: '18px' }}
              />
            )}
          </div>
        ))}
      </div>

      {/* 10×10 Grid of Double Cells (00–99) */}
      <div
        id="double-grid"
        style={{
          position: 'absolute',
          left: '15.75px',
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
        {Array.from({ length: 100 }).map((_, val) => {
          const formattedVal = String(val).padStart(2, '0');
          const stake = bets[`double:${val}`] || 0;
          const isWinning = winValue !== undefined && winValue === val;
          const showTooltip = activeTooltipCell === val && stake > 0;
          // Alternating checkerboard: (row + col) % 2 === 0 is green, else pink
          const isGreen = (Math.floor(val / 10) + (val % 10)) % 2 === 0;

          const cellBg = stake > 0
            ? '/assets/tc/51X510003.webp'
            : isGreen
            ? '/assets/tc/51X510001.webp'
            : '/assets/tc/51X510002.webp';

          return (
            <button
              key={`double-${formattedVal}`}
              type="button"
              className="tc-board-cell"
              disabled={isLocked}
              onClick={() => onPlaceBet('double', val)}
              onContextMenu={(e) => {
                e.preventDefault();
                onRemoveBet('double', val);
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
              title={`Double ${formattedVal}${stake > 0 ? ` (Stake: ${stake})` : ''}`}
            >
              {/* Cell Bet Calculation Tooltip */}
              {showTooltip && (
                <CellBetTooltip
                  type="double"
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
                  fontSize: stake > 0 ? '16px' : '23px',
                  fontWeight: 700,
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
                    fontSize: '13px',
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

      {/* Bottom Column Quick Selection Arrows C0..C9 */}
      <div
        id="double-bottom-col-arrows"
        style={{
          position: 'absolute',
          left: '21.25px',
          top: '542px',
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
              marginRight: c < 9 ? '12.1px' : '0px',
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

      {/* Random Pick Controls */}
      <div
        id="double-random-pick-bar"
        style={{
          position: 'absolute',
          left: '0px',
          top: '563px',
          width: '370px',
          height: '35px',
          display: 'flex',
          alignItems: 'center',
          zIndex: 6,
        }}
      >
        {/* Pink Token Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '2px', marginLeft: '5px' }}>
          {RANDOM_COUNTS.map((count) => (
            <button
              key={`rp-double-${count}`}
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
              title={`Random Pick ${count} Doubles`}
            >
              <span
                style={{
                  fontFamily: "'HERMESC_20', 'Oswald', sans-serif",
                  fontSize: '15px',
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

        {/* RANDOM PICK Gold Sprite Label */}
        <img
          src="/assets/tc/Random_Select.webp"
          alt="RANDOM PICK"
          style={{
            width: '83px',
            height: '13px',
            marginLeft: '5px',
            objectFit: 'contain',
            userSelect: 'none',
            pointerEvents: 'none',
          }}
        />
      </div>
    </div>
  );
};
