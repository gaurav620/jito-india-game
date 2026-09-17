'use client';

import React, { useMemo } from 'react';

export interface WheelContainerProps {
  secondsLeft: number;
  isSpinning?: boolean;
  drawDigits?: [number, number, number]; // [hundreds, tens, units]
  isWinState?: boolean;
}

/** Sequence of digits on all 3 concentric rings (clockwise) */
const WHEEL_SEQUENCE = [0, 6, 4, 7, 3, 8, 2, 9, 1, 5];
const SEGMENT_DEG = 36; // 360 / 10

function digitAngle(digit: number): number {
  const index = WHEEL_SEQUENCE.indexOf(digit);
  if (index < 0) return 0;
  // Offset by -SEGMENT_DEG so digit matches top crown pointer
  return -index * SEGMENT_DEG - SEGMENT_DEG;
}

export const WheelContainer: React.FC<WheelContainerProps> = ({
  secondsLeft,
  isSpinning = false,
  drawDigits = [7, 7, 2],
  isWinState = false,
}) => {
  // Compute resting angles for the 3 rings
  const [outerAngle, midAngle, innerAngle] = useMemo(() => {
    const d0 = digitAngle(drawDigits[0]);
    const d1 = -digitAngle(drawDigits[1]); // Middle ring rotates counter-clockwise
    const d2 = digitAngle(drawDigits[2]);
    return [d0, d1, d2];
  }, [drawDigits]);

  const winningNumberStr = drawDigits.join('');

  return (
    <div
      id="wheel-mid-section"
      style={{
        position: 'absolute',
        left: '490px',
        top: '0px',
        width: '380px',
        height: '560px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        userSelect: 'none',
        pointerEvents: 'none',
        zIndex: 4,
      }}
    >
      {/* Timer Section (Red script "Seconds left" on top, large glowing yellow digits below) */}
      <div
        id="timer-container"
        style={{
          width: '200px',
          height: '75px',
          marginTop: '6px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* Seconds left script title */}
        <span
          id="sec-left-script-title"
          style={{
            fontFamily: "'Kaushan Script', 'Brush Script MT', 'Lucida Handwriting', cursive",
            fontSize: '24px',
            color: '#E53935',
            lineHeight: '26px',
            textShadow: '0 0 4px #FFFFFF, 0 1px 2px #000000',
            letterSpacing: '0.5px',
          }}
        >
          Seconds left
        </span>

        {/* Countdown Digits — Big Golden Yellow Bold Digits */}
        <div
          id="timer-digits"
          style={{
            fontFamily: "'GOTHAMCONDENSED-MEDIUM', 'Century Gothic', sans-serif",
            fontSize: '48px',
            lineHeight: '48px',
            fontWeight: '900',
            color: secondsLeft <= 5 ? '#ff2233' : '#FDD835',
            textShadow: '0 0 10px rgba(253, 216, 53, 0.8), 0 2px 5px rgba(0, 0, 0, 0.9)',
            letterSpacing: '1px',
            marginTop: '-2px',
          }}
        >
          {String(secondsLeft).padStart(2, '0')}
        </div>
      </div>

      {/* Concentric 3-Wheel Stage Container */}
      <div
        id="wheel-stage"
        style={{
          position: 'relative',
          width: '460px',
          height: '412px',
          marginTop: '-6px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* Layer 1: Outer Rotating Ring (Red Segments) */}
        <div
          id="wheel-outer-ring"
          style={{
            position: 'absolute',
            width: '360px',
            height: '360px',
            backgroundImage: "url('/assets/tc/Wheel_1.webp')",
            backgroundSize: '100% 100%',
            backgroundRepeat: 'no-repeat',
            transform: isSpinning ? undefined : `rotate(${outerAngle}deg)`,
            animation: isSpinning ? 'spin-clockwise 10s linear infinite' : undefined,
            transition: isSpinning ? 'none' : 'transform 1.8s cubic-bezier(0.25, 1, 0.5, 1)',
            zIndex: 1,
          }}
        />

        {/* Layer 2: Middle Rotating Ring (Green Segments, Counter-Clockwise) */}
        <div
          id="wheel-middle-ring"
          style={{
            position: 'absolute',
            width: '285px',
            height: '285px',
            backgroundImage: "url('/assets/tc/Wheel_2.webp')",
            backgroundSize: '100% 100%',
            backgroundRepeat: 'no-repeat',
            transform: isSpinning ? undefined : `rotate(${midAngle}deg)`,
            animation: isSpinning ? 'spin-counter-clockwise 8s linear infinite' : undefined,
            transition: isSpinning ? 'none' : 'transform 1.6s cubic-bezier(0.25, 1, 0.5, 1)',
            zIndex: 2,
          }}
        />

        {/* Layer 3: Inner Rotating Ring (Magenta Segments) */}
        <div
          id="wheel-inner-ring"
          style={{
            position: 'absolute',
            width: '205px',
            height: '205px',
            backgroundImage: "url('/assets/tc/Wheel_3.webp')",
            backgroundSize: '100% 100%',
            backgroundRepeat: 'no-repeat',
            transform: isSpinning ? undefined : `rotate(${innerAngle}deg)`,
            animation: isSpinning ? 'spin-clockwise 6s linear infinite' : undefined,
            transition: isSpinning ? 'none' : 'transform 1.4s cubic-bezier(0.25, 1, 0.5, 1)',
            zIndex: 3,
          }}
        />

        {/* Center Orb (Golden 3D Sphere in active state; shows winning digits in win state) */}
        <div
          id="wheel-center-orb"
          style={{
            position: 'absolute',
            width: '115px',
            height: '115px',
            backgroundImage: "url('/assets/tc/Wheel_Middel.webp')",
            backgroundSize: '100% 100%',
            backgroundRepeat: 'no-repeat',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 20px rgba(0, 0, 0, 0.8)',
            borderRadius: '50%',
            zIndex: 5,
          }}
        >
          {isWinState && (
            <span
              style={{
                fontFamily: "'GOTHAMCONDENSED-MEDIUM', 'Century Gothic', sans-serif",
                fontSize: '36px',
                fontWeight: '900',
                color: '#FFFFFF',
                letterSpacing: '1px',
                textShadow: '0 0 6px #000, 0 2px 4px #000, 0 0 12px #FFD700',
              }}
            >
              {winningNumberStr}
            </span>
          )}
        </div>

        {/* Ornate Gold Outer Bezel Frame */}
        <div
          id="wheel-ornate-frame"
          style={{
            position: 'absolute',
            width: '460px',
            height: '412px',
            backgroundImage: "url('/assets/tc/FRAME_1.webp')",
            backgroundSize: '100% 100%',
            backgroundRepeat: 'no-repeat',
            pointerEvents: 'none',
            zIndex: 6,
          }}
        />

        {/* Golden Crown Reveal Indicator Marker at 12 o'clock */}
        <div
          id="wheel-crown-indicator"
          style={{
            position: 'absolute',
            top: '8px',
            width: '288px',
            height: '90px',
            backgroundImage: "url('/assets/tc/ghn.webp')",
            backgroundSize: '100% 100%',
            backgroundRepeat: 'no-repeat',
            pointerEvents: 'none',
            zIndex: 7,
          }}
        />

        {/* Win Highlighter Pointer Frame in Win State */}
        {isWinState && (
          <div
            id="wheel-win-jewel-frame"
            style={{
              position: 'absolute',
              top: '40px',
              width: '128px',
              height: '151px',
              backgroundImage: "url('/assets/tc/sprite_8270001.webp')",
              backgroundSize: '100% 100%',
              backgroundRepeat: 'no-repeat',
              pointerEvents: 'none',
              zIndex: 8,
              animation: 'u-win-pulse 0.9s infinite ease-in-out',
            }}
          />
        )}
      </div>

      {/* Rotation Keyframe Animations */}
      <style jsx>{`
        @keyframes spin-clockwise {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes spin-counter-clockwise {
          from { transform: rotate(360deg); }
          to { transform: rotate(0deg); }
        }
      `}</style>
    </div>
  );
};
