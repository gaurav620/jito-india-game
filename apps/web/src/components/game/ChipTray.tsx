'use client';

import React, { useState, useEffect } from 'react';

export interface ChipTrayProps {
  selectedChip: number;
  onSelectChip: (value: number) => void;
  availableChips?: number[];
  statusMessage: string;
}

const DEFAULT_CHIPS = [2, 5, 10, 20, 30, 40, 50, 100];

const CHIP_SPRITES: Record<number, string> = {
  2: '/assets/tc/CHIP_02.webp',
  5: '/assets/tc/CHIP_05_Pop.webp',
  10: '/assets/tc/CHIP_10_Pop.webp',
  20: '/assets/tc/CHIP_20_Pop.webp',
  30: '/assets/tc/chipsymbol50001.webp',
  40: '/assets/tc/chipsymbol60002.webp',
  50: '/assets/tc/chipsymbol70002.webp',
  100: '/assets/tc/chipsymbol80002.webp',
};

export const ChipTray: React.FC<ChipTrayProps> = ({
  selectedChip,
  onSelectChip,
  availableChips = DEFAULT_CHIPS,
  statusMessage,
}) => {
  const [blinkerFrame, setBlinkerFrame] = useState(1);

  // 12 fps status lamp animation (matching reference STATUS_BLINK_FPS = 12)
  useEffect(() => {
    const interval = setInterval(() => {
      setBlinkerFrame((prev) => (prev % 10) + 1);
    }, 1000 / 12);
    return () => clearInterval(interval);
  }, []);

  const blinkerSprite = `/assets/tc/dfgd${String(blinkerFrame).padStart(4, '0')}.webp`;
  const chipsToRender = availableChips.filter((c) => CHIP_SPRITES[c] !== undefined);

  return (
    <div
      id="bet-chip-container"
      style={{
        position: 'absolute',
        left: '330px',
        bottom: '0px',
        width: '700px',
        height: '110px',
        userSelect: 'none',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
        zIndex: 6,
      }}
    >
      {/* Golden Oval Chip Tray Frame */}
      <div
        id="chip-tray-holder"
        style={{
          width: '700px',
          height: '78px',
          backgroundImage: "url('/assets/tc/Chip_holder_2.webp')",
          backgroundSize: '100% 100%',
          backgroundRepeat: 'no-repeat',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          paddingTop: '2px',
        }}
      >
        {/* Horizontal Row of 8 Chips */}
        <div
          id="chips-row"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
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
                  width: '46px',
                  height: '46px',
                  border: 'none',
                  backgroundColor: 'transparent',
                  backgroundImage: `url('${sprite}')`,
                  backgroundSize: '100% 100%',
                  backgroundRepeat: 'no-repeat',
                  cursor: 'pointer',
                  outline: 'none',
                  transform: isSelected ? 'scale(1.15) translateY(-3px)' : 'scale(1.0)',
                  transition: 'transform 0.12s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                  padding: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                title={`${chipVal} Points Chip`}
              >
                {/* Chip Denomination Digit Label */}
                <span
                  style={{
                    fontFamily: "'HERMESC_20', 'GOTHAMCONDENSED-MEDIUM', sans-serif",
                    fontSize: chipVal >= 100 ? '13px' : '15px',
                    fontWeight: 'bold',
                    color: '#000000',
                    lineHeight: '1',
                    zIndex: 2,
                    textShadow: '0 0 2px rgba(255,255,255,0.8)',
                  }}
                >
                  {chipVal}
                </span>

                {/* Selection Glowing Halo Overlay */}
                {isSelected && (
                  <div
                    style={{
                      position: 'absolute',
                      inset: '-6px',
                      backgroundImage: "url('/assets/tc/circle.webp')",
                      backgroundSize: '100% 100%',
                      backgroundRepeat: 'no-repeat',
                      pointerEvents: 'none',
                      zIndex: 3,
                    }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Red Status Message Banner at the very bottom */}
      <div
        id="chip-tray-status-bar"
        style={{
          width: '455px',
          height: '24px',
          marginTop: '2px',
          background: 'linear-gradient(180deg, #991b1b 0%, #7f1d1d 100%)',
          borderRadius: '12px',
          border: '1.5px solid #d4af37',
          boxShadow: '0 2px 4px rgba(0,0,0,0.8), inset 0 1px 1px rgba(255,255,255,0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '10px',
        }}
      >
        {/* Animated Status Blinker Lamp */}
        <div
          id="status-blinker-lamp"
          style={{
            width: '18px',
            height: '18px',
            backgroundImage: `url('${blinkerSprite}')`,
            backgroundSize: 'contain',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
          }}
        />

        {/* Status Message Text */}
        <span
          id="status-message-text"
          style={{
            fontFamily: "'GOTHAMCONDENSED-MEDIUM', 'Century Gothic', sans-serif",
            fontSize: '16px',
            fontWeight: 'bold',
            color: '#FFFFFF',
            letterSpacing: '1px',
            textShadow: '0 1px 3px rgba(0,0,0,0.9)',
          }}
        >
          {statusMessage}
        </span>
      </div>
    </div>
  );
};
