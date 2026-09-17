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
}

export const ActionBar: React.FC<ActionBarProps> = ({
  hasBets,
  hasPreviousBets,
  isLocked,
  onDouble,
  onRepeat,
  onOpenInfo,
  onClear,
}) => {
  const [pressedBtn, setPressedBtn] = useState<string | null>(null);

  const doubleDisabled = isLocked || !hasBets;
  const repeatDisabled = isLocked || !hasPreviousBets;
  const clearDisabled = isLocked || !hasBets;

  const getBtnBg = (name: string, disabled: boolean) => {
    if (disabled) return '/assets/tc/disable.webp';
    return '/assets/tc/Btn1.webp';
  };

  return (
    <div
      id="action-button-panel"
      style={{
        position: 'absolute',
        right: '0px',
        bottom: '0px',
        width: '330px',
        height: '165px',
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 150px)',
        gridTemplateRows: 'repeat(2, 70px)',
        columnGap: '12px',
        rowGap: '9px',
        padding: '8px 9px',
        userSelect: 'none',
        alignContent: 'center',
        justifyContent: 'center',
      }}
    >
      {/* DOUBLE Button */}
      <button
        type="button"
        id="btn-action-double"
        disabled={doubleDisabled}
        onClick={onDouble}
        onPointerDown={() => setPressedBtn('double')}
        onPointerUp={() => setPressedBtn(null)}
        onPointerLeave={() => setPressedBtn(null)}
        style={{
          width: '150px',
          height: '70px',
          border: 'none',
          backgroundColor: 'transparent',
          backgroundImage: `url('${getBtnBg('double', doubleDisabled)}')`,
          backgroundSize: '100% 100%',
          backgroundRepeat: 'no-repeat',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: doubleDisabled ? 'not-allowed' : 'pointer',
          outline: 'none',
          transform: pressedBtn === 'double' ? 'scale(0.96)' : 'scale(1)',
          transition: 'transform 0.08s ease, filter 0.12s ease',
          filter: !doubleDisabled && pressedBtn === 'double' ? 'brightness(0.92)' : 'none',
          padding: 0,
        }}
        title="Double All Stakes"
      >
        <span
          style={{
            fontFamily: "'GOTHAMCONDENSED-MEDIUM', 'Century Gothic', sans-serif",
            fontSize: '20px',
            fontWeight: 'bold',
            color: doubleDisabled ? '#6b7280' : '#0a420a',
            textShadow: doubleDisabled ? 'none' : '0 1px 1px rgba(255, 255, 255, 0.85)',
            letterSpacing: '1.5px',
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
        onClick={onRepeat}
        onPointerDown={() => setPressedBtn('repeat')}
        onPointerUp={() => setPressedBtn(null)}
        onPointerLeave={() => setPressedBtn(null)}
        style={{
          width: '150px',
          height: '70px',
          border: 'none',
          backgroundColor: 'transparent',
          backgroundImage: `url('${getBtnBg('repeat', repeatDisabled)}')`,
          backgroundSize: '100% 100%',
          backgroundRepeat: 'no-repeat',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: repeatDisabled ? 'not-allowed' : 'pointer',
          outline: 'none',
          transform: pressedBtn === 'repeat' ? 'scale(0.96)' : 'scale(1)',
          transition: 'transform 0.08s ease, filter 0.12s ease',
          filter: !repeatDisabled && pressedBtn === 'repeat' ? 'brightness(0.92)' : 'none',
          padding: 0,
        }}
        title="Repeat Previous Round Stakes"
      >
        <span
          style={{
            fontFamily: "'GOTHAMCONDENSED-MEDIUM', 'Century Gothic', sans-serif",
            fontSize: '20px',
            fontWeight: 'bold',
            color: repeatDisabled ? '#6b7280' : '#0a420a',
            textShadow: repeatDisabled ? 'none' : '0 1px 1px rgba(255, 255, 255, 0.85)',
            letterSpacing: '1.5px',
          }}
        >
          REPEAT
        </span>
      </button>

      {/* INFO Button */}
      <button
        type="button"
        id="btn-action-info"
        onClick={onOpenInfo}
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
          transform: pressedBtn === 'info' ? 'scale(0.96)' : 'scale(1)',
          transition: 'transform 0.08s ease, filter 0.12s ease',
          filter: pressedBtn === 'info' ? 'brightness(0.92)' : 'none',
          padding: 0,
        }}
        title="Game Rules, History & Reports"
      >
        <span
          style={{
            fontFamily: "'GOTHAMCONDENSED-MEDIUM', 'Century Gothic', sans-serif",
            fontSize: '20px',
            fontWeight: 'bold',
            color: '#0a420a',
            textShadow: '0 1px 1px rgba(255, 255, 255, 0.85)',
            letterSpacing: '1.5px',
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
        onClick={onClear}
        onPointerDown={() => setPressedBtn('clear')}
        onPointerUp={() => setPressedBtn(null)}
        onPointerLeave={() => setPressedBtn(null)}
        style={{
          width: '150px',
          height: '70px',
          border: 'none',
          backgroundColor: 'transparent',
          backgroundImage: `url('${getBtnBg('clear', clearDisabled)}')`,
          backgroundSize: '100% 100%',
          backgroundRepeat: 'no-repeat',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: clearDisabled ? 'not-allowed' : 'pointer',
          outline: 'none',
          transform: pressedBtn === 'clear' ? 'scale(0.96)' : 'scale(1)',
          transition: 'transform 0.08s ease, filter 0.12s ease',
          filter: !clearDisabled && pressedBtn === 'clear' ? 'brightness(0.92)' : 'none',
          padding: 0,
        }}
        title="Clear Current Bets"
      >
        <span
          style={{
            fontFamily: "'GOTHAMCONDENSED-MEDIUM', 'Century Gothic', sans-serif",
            fontSize: '20px',
            fontWeight: 'bold',
            color: clearDisabled ? '#6b7280' : '#0a420a',
            textShadow: clearDisabled ? 'none' : '0 1px 1px rgba(255, 255, 255, 0.85)',
            letterSpacing: '1.5px',
          }}
        >
          CLEAR
        </span>
      </button>
    </div>
  );
};
