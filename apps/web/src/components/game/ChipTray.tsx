'use client';

import React from 'react';

export interface ChipTrayProps {
  selectedChip: number;
  onSelectChip: (value: number) => void;
  availableChips?: number[];
  statusMessage: string;
}

const DEFAULT_CHIPS = [2, 5, 10, 20, 30, 40, 50, 100, 500];

const CHIP_SPRITES: Record<number, string> = {
  2: '/assets/tc/CHIP_05_Pop.webp',
  5: '/assets/tc/CHIP_10_Pop.webp',
  10: '/assets/tc/CHIP_20_Pop.webp',
  20: '/assets/tc/chipsymbol50001.webp',
  30: '/assets/tc/chipsymbol60002.webp',
  40: '/assets/tc/chipsymbol70002.webp',
  50: '/assets/tc/chipsymbol80002.webp',
  100: '/assets/tc/CHIP_02.webp',
  500: '/assets/tc/CHIP_500.png',
};

export const ChipTray: React.FC<ChipTrayProps> = ({
  selectedChip,
  onSelectChip,
  availableChips = DEFAULT_CHIPS,
  statusMessage,
}) => {
  const chipsToRender = availableChips.filter((c) => CHIP_SPRITES[c] !== undefined);

  return (
    <div
      id="bet-chip-container"
      style={{
        position: 'absolute',
        left: '330px',
        top: '652.5px',
        width: '700px',
        height: '118px',
        userSelect: 'none',
        zIndex: 6,
      }}
    >
      {/* Background Frame (Chip_holder_2.webp) */}
      <div
        id="chip-tray-bg"
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: "url('/assets/tc/Chip_holder_2.webp')",
          backgroundSize: '100% 100%',
          backgroundRepeat: 'no-repeat',
          pointerEvents: 'none',
          zIndex: 1,
        }}
      />

      {/* Chips Container inside teal tray */}
      <div
        id="chips-container"
        style={{
          position: 'absolute',
          left: '163px',
          top: '20px',
          width: '374px',
          height: '48px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '4px',
          zIndex: 2,
        }}
      >
        {chipsToRender.map((chipVal) => {
          const isSelected = selectedChip === chipVal;
          const sprite = CHIP_SPRITES[chipVal] || '/assets/tc/CHIP_02.webp';

          return (
            <button
              key={`chip-btn-${chipVal}`}
              type="button"
              onClick={() => onSelectChip(chipVal)}
              style={{
                position: 'relative',
                width: '38px',
                height: '38px',
                border: 'none',
                backgroundColor: 'transparent',
                cursor: 'pointer',
                outline: 'none',
                padding: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transform: isSelected ? 'translateY(-2px)' : 'none',
                transition: 'transform 0.1s ease',
              }}
              title={`${chipVal} Points Chip`}
            >
              {/* Chip Face Texture */}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  backgroundImage: `url('${sprite}')`,
                  backgroundSize: '100% 100%',
                  backgroundRepeat: 'no-repeat',
                  zIndex: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  filter: isSelected
                    ? 'drop-shadow(0 0 4px rgba(255, 215, 0, 0.9)) drop-shadow(0 0 2px rgba(255, 255, 255, 0.7))'
                    : 'none',
                }}
              >
                {/* Chip Denomination Digit Label Centered */}
                <span
                  style={{
                    fontFamily: "'HERMESC_20', 'Century Gothic', sans-serif",
                    fontSize: chipVal >= 100 ? '11px' : '13px',
                    fontWeight: 'normal',
                    color: '#000000',
                    lineHeight: '1',
                    transform: 'translate(-1px, -1px)',
                    display: 'inline-block',
                  }}
                >
                  {chipVal}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Red Status Message Banner inside bottom trapezoid */}
      <div
        id="chip-status-msg"
        style={{
          position: 'absolute',
          left: '120.75px',
          top: '85.5px',
          width: '455px',
          height: '25px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 3,
        }}
      >
        {/* Live Status Message Text */}
        <span
          id="chip-status-text"
          style={{
            fontFamily: "'HERMESC_20', 'Century Gothic', sans-serif",
            fontSize: '17px',
            fontWeight: 'bold',
            color: '#FFFFFF',
            letterSpacing: '0.5px',
            textShadow: '0 1px 3px rgba(0, 0, 0, 0.9)',
            lineHeight: '1',
          }}
        >
          {statusMessage}
        </span>
      </div>
    </div>
  );
};
