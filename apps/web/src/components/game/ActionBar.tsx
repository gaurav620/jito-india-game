'use client';

import React, { useState } from 'react';

export interface ActionBarProps {
  hasBets: boolean;
  hasPreviousBets: boolean;
  isLocked: boolean;
  onDouble: () => void;
  onRepeat: () => void;
  onOpenInfo: () => void;
  onClear: () => void;
  /** Called whenever an enabled action button is clicked (for audio) */
  onButtonClick?: () => void;
}

export const ActionBar: React.FC<ActionBarProps> = ({
  hasBets,
  hasPreviousBets,
  isLocked,
  onDouble,
  onRepeat,
  onOpenInfo,
  onClear,
  onButtonClick,
}) => {
  const [pressedBtn, setPressedBtn] = useState<string | null>(null);

  const doubleDisabled = isLocked || !hasBets;
  const repeatDisabled = isLocked || !hasPreviousBets;
  const clearDisabled = isLocked || !hasBets;

  const getBtnBg = (disabled: boolean) => {
    if (disabled) return '/assets/tc/disable.webp';
    return '/assets/tc/Btn1.webp';
  };

  return (
    <div
      id="action-button-panel"
      style={{
        position: 'absolute',
        left: '1030px',
        top: '603px',
        width: '330px',
        height: '165px',
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 150px)',
        gridTemplateRows: 'repeat(2, 70px)',
        columnGap: '12px',
        rowGap: '9px',
        padding: '6px 9px',
        userSelect: 'none',
        zIndex: 6,
      }}
    >
      {/* DOUBLE Button */}
      <button
        type="button"
        id="btn-action-double"
        disabled={doubleDisabled}
        onClick={() => { if (!doubleDisabled) onButtonClick?.(); onDouble(); }}
        onPointerDown={() => setPressedBtn('double')}
        onPointerUp={() => setPressedBtn(null)}
        onPointerLeave={() => setPressedBtn(null)}
        style={{
          width: '150px',
          height: '70px',
          border: 'none',
          backgroundColor: 'transparent',
          backgroundImage: `url('${getBtnBg(doubleDisabled)}')`,
          backgroundSize: '100% 100%',
          backgroundRepeat: 'no-repeat',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: doubleDisabled ? 'not-allowed' : 'pointer',
          outline: 'none',
          transform: pressedBtn === 'double' ? 'scale(0.97)' : 'scale(1)',
          transition: 'transform 0.08s ease',
          padding: 0,
        }}
        title="Double All Stakes"
      >
        <span
          style={{
            fontFamily: "'HERMESC_20', 'Century Gothic', sans-serif",
            fontSize: '20px',
            fontWeight: 'bold',
            color: '#155215',
            textShadow: '0 1px 1px rgba(255, 255, 255, 0.95)',
            letterSpacing: '1px',
          }}
        >
          DOUBLE
        </span>
      </button>

      {/* REPEAT Button */}
      <button
        type="button"
        id="btn-action-repeat"
        disabled={repeatDisabled}
        onClick={() => { if (!repeatDisabled) onButtonClick?.(); onRepeat(); }}
        onPointerDown={() => !repeatDisabled && setPressedBtn('repeat')}
        onPointerUp={() => setPressedBtn(null)}
        onPointerLeave={() => setPressedBtn(null)}
        style={{
          width: '150px',
          height: '70px',
          border: 'none',
          backgroundColor: 'transparent',
          backgroundImage: `url('${getBtnBg(repeatDisabled)}')`,
          backgroundSize: '100% 100%',
          backgroundRepeat: 'no-repeat',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: repeatDisabled ? 'not-allowed' : 'pointer',
          outline: 'none',
          transform: pressedBtn === 'repeat' ? 'scale(0.97)' : 'scale(1)',
          transition: 'transform 0.08s ease',
          padding: 0,
        }}
        title="Repeat Previous Bets"
      >
        <span
          style={{
            fontFamily: "'HERMESC_20', 'Century Gothic', sans-serif",
            fontSize: '20px',
            fontWeight: 'bold',
            color: '#155215',
            textShadow: '0 1px 1px rgba(255, 255, 255, 0.95)',
            letterSpacing: '1px',
          }}
        >
          REPEAT
        </span>
      </button>

      {/* INFO Button (Always active/enabled) */}
      <button
        type="button"
        id="btn-action-info"
        onClick={() => { onButtonClick?.(); onOpenInfo(); }}
        onPointerDown={() => setPressedBtn('info')}
        onPointerUp={() => setPressedBtn(null)}
        onPointerLeave={() => setPressedBtn(null)}
        style={{
          width: '150px',
          height: '70px',
          border: 'none',
          backgroundColor: 'transparent',
          backgroundImage: "url('/assets/tc/Btn1.webp')",
          backgroundSize: '100% 100%',
          backgroundRepeat: 'no-repeat',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          outline: 'none',
          transform: pressedBtn === 'info' ? 'scale(0.97)' : 'scale(1)',
          transition: 'transform 0.08s ease',
          padding: 0,
        }}
        title="Game Rules & Statements"
      >
        <span
          style={{
            fontFamily: "'HERMESC_20', 'Century Gothic', sans-serif",
            fontSize: '20px',
            fontWeight: 'bold',
            color: '#155215',
            textShadow: '0 1px 1px rgba(255, 255, 255, 0.95)',
            letterSpacing: '1px',
          }}
        >
          INFO
        </span>
      </button>

      {/* CLEAR Button */}
      <button
        type="button"
        id="btn-action-clear"
        disabled={clearDisabled}
        onClick={() => { if (!clearDisabled) onButtonClick?.(); onClear(); }}
        onPointerDown={() => !clearDisabled && setPressedBtn('clear')}
        onPointerUp={() => setPressedBtn(null)}
        onPointerLeave={() => setPressedBtn(null)}
        style={{
          width: '150px',
          height: '70px',
          border: 'none',
          backgroundColor: 'transparent',
          backgroundImage: `url('${getBtnBg(clearDisabled)}')`,
          backgroundSize: '100% 100%',
          backgroundRepeat: 'no-repeat',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: clearDisabled ? 'not-allowed' : 'pointer',
          outline: 'none',
          transform: pressedBtn === 'clear' ? 'scale(0.97)' : 'scale(1)',
          transition: 'transform 0.08s ease',
          padding: 0,
        }}
        title="Clear All Current Stakes"
      >
        <span
          style={{
            fontFamily: "'HERMESC_20', 'Century Gothic', sans-serif",
            fontSize: '20px',
            fontWeight: 'bold',
            color: '#155215',
            textShadow: '0 1px 1px rgba(255, 255, 255, 0.95)',
            letterSpacing: '1px',
          }}
        >
          CLEAR
        </span>
      </button>
    </div>
  );
};
