'use client';

import React from 'react';

export interface TripleBoardProps {
  activeTab: number; // 0..9 (representing 000, 100, ..., 900)
  onTabChange: (tab: number) => void;
  bets: Record<string, number>;
  onPlaceBet: (type: 'triple', value: number) => void;
  onRemoveBet: (type: 'triple', value: number) => void;
  onQuickRow?: (row: number) => void;
  onQuickCol?: (col: number) => void;
  onRandomPick?: (count: number) => void;
  isLocked?: boolean;
}

const RANDOM_COUNTS = [5, 10, 15, 20, 25, 50, 100];
const TABS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

export const TripleBoard: React.FC<TripleBoardProps> = ({
  activeTab,
  onTabChange,
  bets,
  onPlaceBet,
  onRemoveBet,
  onQuickRow,
  onQuickCol,
  onRandomPick,
  isLocked = false,
}) => {
  const baseOffset = activeTab * 100;

  return (
    <div
      id="triple-section-container"
      style={{
        position: 'absolute',
        right: '0px',
        top: '0px',
        width: '490px',
        height: '560px',
        userSelect: 'none',
      }}
    >
      {/* Background Frame Panel */}
      <div
        id="triple-panel-bg"
        style={{
          position: 'absolute',
          left: '0px',
          top: '0px',
          width: '488px',
          height: '556px',
          backgroundImage: "url('/assets/tc/triplepanel.webp')",
          backgroundSize: '100% 100%',
          backgroundRepeat: 'no-repeat',
        }}
      />

      {/* TRIPLES Header Pill Badge centered in the top golden arch */}
      <div
        id="triples-header-badge"
        style={{
          position: 'absolute',
          left: '244px',
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
          TRIPLES
        </span>
      </div>

      {/* 10 Hundreds Range Tabs (000..900) */}
      <div
        id="triple-tabs-row"
        style={{
          position: 'absolute',
          left: '42px',
          top: '44px',
          width: '425px',
          height: '24px',
          display: 'grid',
          gridTemplateColumns: 'repeat(10, 1fr)',
          gap: '1px',
          zIndex: 6,
        }}
      >
        {TABS.map((t) => {
          const isSelected = t === activeTab;

          return (
            <button
              key={`tab-${t}00`}
              type="button"
              onClick={() => onTabChange(t)}
              style={{
                height: '24px',
                border: isSelected ? '1.5px solid #000000' : '1px solid #78350f',
                borderRadius: '3px 3px 0 0',
                background: isSelected
                  ? 'linear-gradient(180deg, #4ade80 0%, #22c55e 100%)'
                  : 'linear-gradient(180deg, #f59e0b 0%, #d97706 100%)',
                fontFamily: "'GOTHAMCONDENSED-MEDIUM', 'Century Gothic', sans-serif",
                fontSize: '13px',
                fontWeight: 'bold',
                color: '#000000',
                cursor: 'pointer',
                padding: 0,
                outline: 'none',
                boxShadow: isSelected
                  ? '0 0 6px rgba(74, 222, 128, 0.9), inset 0 1px 1px #fff'
                  : 'inset 0 1px 1px rgba(255, 255, 255, 0.4)',
                transform: isSelected ? 'scale(1.04)' : 'scale(1)',
                zIndex: isSelected ? 2 : 1,
              }}
              title={`View ${t}00 Range`}
            >
              {t}00
            </button>
          );
        })}
      </div>

      {/* Top Column Buttons (Quick Selection C0..C9) */}
      <div
        id="triple-col-buttons-top"
        style={{
          position: 'absolute',
          left: '42px',
          top: '68px',
          width: '425px',
          height: '16px',
          display: 'grid',
          gridTemplateColumns: 'repeat(10, 1fr)',
          gap: '0px',
        }}
      >
        {Array.from({ length: 10 }).map((_, c) => (
          <button
            key={`triple-col-top-${c}`}
            type="button"
            disabled={isLocked}
            onClick={() => onQuickCol?.(c)}
            style={{
              height: '16px',
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

      {/* Left Row Buttons (Quick Selection R0..R9) */}
      <div
        id="triple-left-row-arrows"
        style={{
          position: 'absolute',
          left: '18px',
          top: '84px',
          width: '20px',
          height: '425px',
          display: 'grid',
          gridTemplateRows: 'repeat(10, 1fr)',
          gap: '0px',
        }}
      >
        {Array.from({ length: 10 }).map((_, r) => (
          <button
            key={`triple-row-left-${r}`}
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

      {/* 10×10 Grid of Triple Cells (000–999 based on activeTab) */}
      <div
        id="triple-grid"
        style={{
          position: 'absolute',
          left: '42px',
          top: '84px',
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
          const fullValue = baseOffset + i;
          const numStr = String(fullValue).padStart(3, '0');
          const stake = bets[`triple:${fullValue}`] || 0;
          // Checkerboard rule: green if (row + col) % 2 === 0, else pink
          const isGreen = (Math.floor(i / 10) + (i % 10)) % 2 === 0;
          const cellBg = stake > 0
            ? '/assets/tc/51X510003.webp'
            : isGreen
            ? '/assets/tc/51X510001.webp'
            : '/assets/tc/51X510002.webp';

          return (
            <button
              key={`triple-${numStr}`}
              type="button"
              disabled={isLocked}
              onClick={() => onPlaceBet('triple', fullValue)}
              onContextMenu={(e) => {
                e.preventDefault();
                onRemoveBet('triple', fullValue);
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
              title={`Triple ${numStr}${stake > 0 ? ` (Stake: ${stake})` : ''}`}
            >
              {/* Printed Number — BOLD BLACK DIGITS matching reference */}
              <span
                style={{
                  fontFamily: "'GOTHAMCONDENSED-MEDIUM', 'Century Gothic', sans-serif",
                  fontSize: '15px',
                  fontWeight: 'bold',
                  color: '#000000',
                  lineHeight: '15px',
                  letterSpacing: '0.3px',
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
                      fontSize: '10px',
                      fontWeight: 'bold',
                      color: '#FFD700',
                      lineHeight: '11px',
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

      {/* Right Row Buttons (Quick Selection R0..R9) */}
      <div
        id="triple-right-row-arrows"
        style={{
          position: 'absolute',
          left: '468px',
          top: '84px',
          width: '20px',
          height: '425px',
          display: 'grid',
          gridTemplateRows: 'repeat(10, 1fr)',
          gap: '0px',
        }}
      >
        {Array.from({ length: 10 }).map((_, r) => (
          <button
            key={`triple-row-right-${r}`}
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

      {/* Bottom Column Buttons (Quick Selection C0..C9) */}
      <div
        id="triple-bottom-col-arrows"
        style={{
          position: 'absolute',
          left: '42px',
          top: '510px',
          width: '425px',
          height: '16px',
          display: 'grid',
          gridTemplateColumns: 'repeat(10, 1fr)',
          gap: '0px',
        }}
      >
        {Array.from({ length: 10 }).map((_, c) => (
          <button
            key={`triple-col-bottom-${c}`}
            type="button"
            disabled={isLocked}
            onClick={() => onQuickCol?.(c)}
            style={{
              height: '16px',
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

      {/* Random Triples Selection Bar (RANDOM PICK on left, Pink Circular Tokens on right) */}
      <div
        id="random-triple-bar"
        style={{
          position: 'absolute',
          left: '32px',
          top: '528px',
          width: '445px',
          height: '38px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {/* RANDOM PICK Label on Left */}
        <span
          style={{
            fontFamily: "'GOTHAMCONDENSED-MEDIUM', 'Century Gothic', sans-serif",
            fontSize: '13px',
            fontWeight: 'bold',
            color: '#FFD700',
            letterSpacing: '1px',
            textShadow: '0 1px 2px rgba(0,0,0,0.9)',
          }}
        >
          RANDOM PICK
        </span>

        {/* 7 Round Quick-Pick Buttons (5, 10, 15, 20, 25, 50, 100) */}
        <div style={{ display: 'flex', gap: '5px' }}>
          {RANDOM_COUNTS.map((cnt) => (
            <button
              key={`rnd-triple-${cnt}`}
              type="button"
              disabled={isLocked}
              onClick={() => onRandomPick?.(cnt)}
              style={{
                width: '35px',
                height: '35px',
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
                fontSize: cnt === 100 ? '12.5px' : '15px',
                fontWeight: 'bold',
                color: '#000000',
                outline: 'none',
                padding: 0,
                transition: 'transform 0.08s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.08)')}
              onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1.0)')}
              title={`Random Pick ${cnt} Triples`}
            >
              {cnt}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
