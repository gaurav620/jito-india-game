'use client';

import React from 'react';

export interface DoubleBoardProps {
  gameId: string;
  bets: Record<string, number>;
  onPlaceBet: (type: 'double', value: number) => void;
  onRemoveBet: (type: 'double', value: number) => void;
  onQuickRow?: (row: number) => void;
  onQuickCol?: (col: number) => void;
  onRandomPick?: (count: number) => void;
  isLocked?: boolean;
}

const RANDOM_COUNTS = [5, 10, 15, 20, 25, 50, 75];

export const DoubleBoard: React.FC<DoubleBoardProps> = ({
  gameId,
  bets,
  onPlaceBet,
  onRemoveBet,
  onQuickRow,
  onQuickCol,
  onRandomPick,
  isLocked = false,
}) => {
  return (
    <div
      id="double-section-container"
      style={{
        position: 'absolute',
        left: '0px',
        top: '0px',
        width: '490px',
        height: '560px',
        userSelect: 'none',
      }}
    >
      {/* Background Ornate Frame Panel */}
      <div
        id="double-panel-bg"
        style={{
          position: 'absolute',
          left: '2px',
          top: '0px',
          width: '488px',
          height: '556px',
          backgroundImage: "url('/assets/tc/sectionpanel.webp')",
          backgroundSize: '100% 100%',
          backgroundRepeat: 'no-repeat',
        }}
      />

      {/* DOUBLES Header Pill Badge centered in the top golden arch */}
      <div
        id="doubles-header-badge"
        style={{
          position: 'absolute',
          left: '235px',
          top: '22px',
          transform: 'translateX(-50%)',
          padding: '2px 28px',
          background: 'radial-gradient(ellipse at center, #1b6320 0%, #08330c 100%)',
          borderRadius: '12px',
          border: '1.5px solid #d4af37',
          boxShadow: '0 2px 5px rgba(0,0,0,0.8), inset 0 1px 2px rgba(255,255,255,0.4)',
          zIndex: 5,
        }}
      >
        <span
          style={{
            fontFamily: "'GOTHAMCONDENSED-MEDIUM', 'Century Gothic', sans-serif",
            fontSize: '14px',
            fontWeight: '900',
            color: '#a3e635',
            letterSpacing: '1.5px',
            textShadow: '0 1px 2px rgba(0,0,0,0.9)',
          }}
        >
          DOUBLES
        </span>
      </div>

      {/* Game ID Badge */}
      <div
        id="game-id-badge"
        style={{
          position: 'absolute',
          left: '22px',
          top: '8px',
          width: '176px',
          height: '29px',
          backgroundImage: "url('/assets/tc/GAME_ID.webp')",
          backgroundSize: '100% 100%',
          backgroundRepeat: 'no-repeat',
          display: 'flex',
          alignItems: 'center',
          paddingLeft: '68px',
          zIndex: 6,
        }}
      >
        <span
          style={{
            fontFamily: "'HERMESC_20', sans-serif",
            fontSize: '14px',
            fontWeight: 'bold',
            color: '#39FF14',
            letterSpacing: '0.8px',
            textShadow: '0 0 4px rgba(57, 255, 20, 0.6)',
          }}
        >
          {gameId}
        </span>
      </div>

      {/* Top Column Quick Selection Arrows C0..C9 */}
      <div
        id="double-top-col-arrows"
        style={{
          position: 'absolute',
          left: '42px',
          top: '44px',
          width: '425px',
          height: '18px',
          display: 'grid',
          gridTemplateColumns: 'repeat(10, 1fr)',
          gap: '0px',
        }}
      >
        {Array.from({ length: 10 }).map((_, c) => (
          <button
            key={`col-arrow-top-${c}`}
            type="button"
            disabled={isLocked}
            onClick={() => onQuickCol?.(c)}
            style={{
              height: '18px',
              border: 'none',
              backgroundColor: 'transparent',
              backgroundImage: "url('/assets/tc/ARROW_UP.webp')",
              backgroundSize: 'contain',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
              transform: 'rotate(180deg)',
              cursor: isLocked ? 'not-allowed' : 'pointer',
              outline: 'none',
              opacity: 0.9,
              padding: 0,
            }}
            title={`Select Column ${c}`}
          />
        ))}
      </div>

      {/* Left Row Quick Selection Arrows R0..R9 */}
      <div
        id="double-left-row-arrows"
        style={{
          position: 'absolute',
          left: '18px',
          top: '64px',
          width: '20px',
          height: '425px',
          display: 'grid',
          gridTemplateRows: 'repeat(10, 1fr)',
          gap: '0px',
        }}
      >
        {Array.from({ length: 10 }).map((_, r) => (
          <button
            key={`row-arrow-left-${r}`}
            type="button"
            disabled={isLocked}
            onClick={() => onQuickRow?.(r)}
            style={{
              width: '20px',
              height: '100%',
              border: 'none',
              backgroundColor: 'transparent',
              backgroundImage: "url('/assets/tc/RightGlow.webp')",
              backgroundSize: 'contain',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
              cursor: isLocked ? 'not-allowed' : 'pointer',
              outline: 'none',
              opacity: 0.9,
              padding: 0,
            }}
            title={`Select Row ${r}`}
          />
        ))}
      </div>

      {/* 10×10 Grid of Double Cells (00–99) */}
      <div
        id="double-grid"
        style={{
          position: 'absolute',
          left: '42px',
          top: '64px',
          width: '425px',
          height: '425px',
          display: 'grid',
          gridTemplateColumns: 'repeat(10, 1fr)',
          gridTemplateRows: 'repeat(10, 1fr)',
          gap: '0px',
          backgroundColor: '#1a1012',
        }}
      >
        {Array.from({ length: 100 }).map((_, i) => {
          const numStr = String(i).padStart(2, '0');
          const stake = bets[`double:${i}`] || 0;
          // Authentic checkerboard rule: green if (row + col) % 2 === 0, else pink
          const isGreen = (Math.floor(i / 10) + (i % 10)) % 2 === 0;
          const cellBg = stake > 0
            ? '/assets/tc/51X510003.webp'
            : isGreen
            ? '/assets/tc/51X510001.webp'
            : '/assets/tc/51X510002.webp';

          return (
            <button
              key={`double-${numStr}`}
              type="button"
              disabled={isLocked}
              onClick={() => onPlaceBet('double', i)}
              onContextMenu={(e) => {
                e.preventDefault();
                onRemoveBet('double', i);
              }}
              style={{
                position: 'relative',
                width: '100%',
                height: '100%',
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
              title={`Double ${numStr}${stake > 0 ? ` (Stake: ${stake})` : ''}`}
            >
              {/* Printed Number — BOLD BLACK DIGITS matching reference */}
              <span
                style={{
                  fontFamily: "'GOTHAMCONDENSED-MEDIUM', 'Century Gothic', sans-serif",
                  fontSize: '18px',
                  fontWeight: 'bold',
                  color: '#000000',
                  lineHeight: '18px',
                  letterSpacing: '0.5px',
                  transform: 'translateY(-1px)',
                }}
              >
                {numStr}
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
                    padding: '0 3px',
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

      {/* Right Row Quick Selection Arrows R0..R9 */}
      <div
        id="double-right-row-arrows"
        style={{
          position: 'absolute',
          left: '468px',
          top: '64px',
          width: '20px',
          height: '425px',
          display: 'grid',
          gridTemplateRows: 'repeat(10, 1fr)',
          gap: '0px',
        }}
      >
        {Array.from({ length: 10 }).map((_, r) => (
          <button
            key={`row-arrow-right-${r}`}
            type="button"
            disabled={isLocked}
            onClick={() => onQuickRow?.(r)}
            style={{
              width: '20px',
              height: '100%',
              border: 'none',
              backgroundColor: 'transparent',
              backgroundImage: "url('/assets/tc/LeftGlow.webp')",
              backgroundSize: 'contain',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
              cursor: isLocked ? 'not-allowed' : 'pointer',
              outline: 'none',
              opacity: 0.9,
              padding: 0,
            }}
            title={`Select Row ${r}`}
          />
        ))}
      </div>

      {/* Bottom Column Quick Selection Arrows C0..C9 */}
      <div
        id="double-bottom-col-arrows"
        style={{
          position: 'absolute',
          left: '42px',
          top: '491px',
          width: '425px',
          height: '18px',
          display: 'grid',
          gridTemplateColumns: 'repeat(10, 1fr)',
          gap: '0px',
        }}
      >
        {Array.from({ length: 10 }).map((_, c) => (
          <button
            key={`col-arrow-bottom-${c}`}
            type="button"
            disabled={isLocked}
            onClick={() => onQuickCol?.(c)}
            style={{
              height: '18px',
              border: 'none',
              backgroundColor: 'transparent',
              backgroundImage: "url('/assets/tc/ARROW_UP.webp')",
              backgroundSize: 'contain',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
              cursor: isLocked ? 'not-allowed' : 'pointer',
              outline: 'none',
              opacity: 0.9,
              padding: 0,
            }}
            title={`Select Column ${c}`}
          />
        ))}
      </div>

      {/* Random Double Selection Bar (Pink Circular Tokens FIRST, then RANDOM PICK label) */}
      <div
        id="random-double-bar"
        style={{
          position: 'absolute',
          left: '32px',
          top: '512px',
          width: '445px',
          height: '42px',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
        }}
      >
        {/* 7 Round Quick-Pick Buttons (5, 10, 15, 20, 25, 50, 75) */}
        <div style={{ display: 'flex', gap: '5px' }}>
          {RANDOM_COUNTS.map((cnt) => (
            <button
              key={`rnd-double-${cnt}`}
              type="button"
              disabled={isLocked}
              onClick={() => onRandomPick?.(cnt)}
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                border: 'none',
                backgroundImage: "url('/assets/tc/05.webp')",
                backgroundSize: '100% 100%',
                backgroundRepeat: 'no-repeat',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: isLocked ? 'not-allowed' : 'pointer',
                fontFamily: "'GOTHAMCONDENSED-MEDIUM', 'Century Gothic', sans-serif",
                fontSize: '15px',
                fontWeight: 'bold',
                color: '#000000',
                outline: 'none',
                padding: 0,
                transition: 'transform 0.08s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.08)')}
              onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1.0)')}
              title={`Random Pick ${cnt} Doubles`}
            >
              {cnt}
            </button>
          ))}
        </div>

        {/* RANDOM PICK Text Label */}
        <span
          style={{
            fontFamily: "'GOTHAMCONDENSED-MEDIUM', 'Century Gothic', sans-serif",
            fontSize: '13px',
            fontWeight: 'bold',
            color: '#FFD700',
            letterSpacing: '1px',
            textShadow: '0 1px 2px rgba(0,0,0,0.9)',
            marginLeft: '4px',
          }}
        >
          RANDOM PICK
        </span>
      </div>
    </div>
  );
};
