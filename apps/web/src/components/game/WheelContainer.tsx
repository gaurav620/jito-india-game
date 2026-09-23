'use client';

import { RING_STOP_MS, restAngle, ringAngleAt, type RingIndex } from '@jito/game-core';
import React, { useEffect, useRef } from 'react';

export interface WheelContainerProps {
  secondsLeft: number;
  /** True while the draw animation (spin → settle) is in progress. */
  isSpinning?: boolean;
  /** Epoch ms (Date.now()) the current draw animation started at. Required while isSpinning. */
  drawStartTs?: number | null;
  /** Digits each ring was resting on before this draw started. */
  fromDigits?: [number, number, number];
  /** [hundreds, tens, units] the wheel is spinning toward / resting on. */
  drawDigits?: [number, number, number];
  /** 0-3 result digits revealed so far in the jewelled window (outer ring first). */
  revealed?: number;
  isWinState?: boolean;
}

export const WheelContainer: React.FC<WheelContainerProps> = ({
  secondsLeft,
  isSpinning = false,
  drawStartTs = null,
  fromDigits = [5, 9, 4],
  drawDigits = [1, 3, 1],
  isWinState = false,
  revealed = isWinState ? 3 : 0,
}) => {
  const outerRef = useRef<HTMLDivElement>(null);
  const midRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);

  // Drives all three rings off one deterministic clock (elapsed ms since the draw started),
  // so the angle applied to each ring is a pure function of time — no drift, no re-render churn.
  useEffect(() => {
    if (!isSpinning || drawStartTs === null) {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      return;
    }

    const rings: [RingIndex, RingIndex, RingIndex] = [0, 1, 2];
    const refs = [outerRef, midRef, innerRef];

    const tick = () => {
      const elapsed = Date.now() - drawStartTs;
      for (const ring of rings) {
        const el = refs[ring].current;
        if (!el) continue;
        const angle = ringAngleAt(ring, fromDigits[ring], drawDigits[ring], elapsed, RING_STOP_MS[ring]);
        el.style.transform = `rotate(${angle}deg)`;
      }
      if (elapsed < RING_STOP_MS[2]) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        rafRef.current = null;
      }
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
    // fromDigits/drawDigits are fixed for the lifetime of one draw; drawStartTs changing is what
    // (re)starts the clock.
  }, [isSpinning, drawStartTs]);

  // At rest (idle, or the moment a draw's animation loop above has handed off) show the exact
  // resting rotation for the current digits — no animation, so a mid-draw reconnect or a
  // direct RESULT entry (e.g. the win-preview hotkey) still lands the right digit under the
  // pointer instantly.
  useEffect(() => {
    if (isSpinning) return;
    if (outerRef.current) outerRef.current.style.transform = `rotate(${restAngle(0, drawDigits[0])}deg)`;
    if (midRef.current) midRef.current.style.transform = `rotate(${restAngle(1, drawDigits[1])}deg)`;
    if (innerRef.current) innerRef.current.style.transform = `rotate(${restAngle(2, drawDigits[2])}deg)`;
  }, [isSpinning, drawDigits]);

  const winningNumberStr = drawDigits.join('');

  return (
    <div
      id="wheel-mid-section"
      style={{
        position: 'absolute',
        left: '448px',
        top: '0px',
        width: '465px',
        height: '560px',
        userSelect: 'none',
        pointerEvents: 'none',
        zIndex: 4,
      }}
    >
      {/* Timer Section ("Seconds left" script header on top, digits below) */}
      <div
        id="timer-container"
        style={{
          position: 'absolute',
          left: '152px',
          top: '42.5px',
          width: '160px',
          height: '75px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'flex-start',
        }}
      >
        {/* Seconds left authentic asset title */}
        <img
          id="sec-left-script-title"
          src="/assets/tc/sec.webp"
          alt="Seconds left"
          style={{
            width: '148px',
            height: '29px',
            objectFit: 'contain',
            userSelect: 'none',
            pointerEvents: 'none',
          }}
        />

        {/* Countdown Digits — Bold, high-contrast, no-glow digits (Yellow > 15s, Orange 15-6s, Red <= 5s) */}
        <div
          id="timer-digits"
          style={{
            fontFamily: "'GOTHAMCONDENSED-MEDIUM', 'Century Gothic', sans-serif",
            fontSize: '48px',
            lineHeight: '48px',
            fontWeight: '900',
            color:
              isWinState || secondsLeft <= 5
                ? '#FF0000'
                : secondsLeft <= 15
                ? '#FF9D06'
                : '#F4D010',
            textShadow: '0 2px 4px rgba(0, 0, 0, 0.95), 0 1px 2px #000000',
            letterSpacing: '1px',
            marginTop: '-2px',
          }}
        >
          {isWinState ? '00' : String(secondsLeft).padStart(2, '0')}
        </div>
      </div>

      {/* Concentric 3-Wheel Stage Container */}
      <div
        id="wheel-stage"
        style={{
          position: 'absolute',
          left: '0px',
          top: '156.3px',
          width: '465px',
          height: '410px',
        }}
      >
        {/* Golden Crown Indicator Marker at 12 o'clock */}
        <div
          id="wheel-crown-indicator"
          style={{
            position: 'absolute',
            top: '-64.4px',
            left: '88.5px',
            width: '288px',
            height: '90px',
            backgroundImage: "url('/assets/tc/ghn.webp')",
            backgroundSize: '100% 100%',
            backgroundRepeat: 'no-repeat',
            pointerEvents: 'none',
            zIndex: 7,
          }}
        />

        {/* Ornate Gold Outer Bezel Frame */}
        <div
          id="wheel-ornate-frame"
          style={{
            position: 'absolute',
            left: '2.5px',
            top: '-3.9px',
            width: '460px',
            height: '412px',
            backgroundImage: "url('/assets/tc/FRAME_1.webp')",
            backgroundSize: '100% 100%',
            backgroundRepeat: 'no-repeat',
            pointerEvents: 'none',
            zIndex: 6,
          }}
        />

        {/* Layer 1: Outer Rotating Ring — hundreds (Wheel_1.webp, top digit 5) */}
        <div
          ref={outerRef}
          id="wheel-outer-ring"
          style={{
            position: 'absolute',
            left: '52.5px',
            top: '10.9px',
            width: '360px',
            height: '360px',
            backgroundImage: "url('/assets/tc/Wheel_1.webp')",
            backgroundSize: '100% 100%',
            backgroundRepeat: 'no-repeat',
            transformOrigin: 'center center',
            transform: `rotate(${restAngle(0, drawDigits[0])}deg)`,
            willChange: isSpinning ? 'transform' : undefined,
            zIndex: 1,
          }}
        />

        {/* Layer 2: Middle Rotating Ring — tens (Wheel_2.webp, top digit 9, spins clockwise) */}
        <div
          ref={midRef}
          id="wheel-middle-ring"
          style={{
            position: 'absolute',
            left: '90px',
            top: '48.7px',
            width: '285px',
            height: '285px',
            backgroundImage: "url('/assets/tc/Wheel_2.webp')",
            backgroundSize: '100% 100%',
            backgroundRepeat: 'no-repeat',
            transformOrigin: 'center center',
            transform: `rotate(${restAngle(1, drawDigits[1])}deg)`,
            willChange: isSpinning ? 'transform' : undefined,
            zIndex: 2,
          }}
        />

        {/* Layer 3: Inner Rotating Ring — units (Wheel_3.webp, top digit 4) */}
        <div
          ref={innerRef}
          id="wheel-inner-ring"
          style={{
            position: 'absolute',
            left: '130px',
            top: '90.6px',
            width: '205px',
            height: '205px',
            backgroundImage: "url('/assets/tc/Wheel_3.webp')",
            backgroundSize: '100% 100%',
            backgroundRepeat: 'no-repeat',
            transformOrigin: 'center center',
            transform: `rotate(${restAngle(2, drawDigits[2])}deg)`,
            willChange: isSpinning ? 'transform' : undefined,
            zIndex: 3,
          }}
        />

        {/* Decorative Ring Inset Overlays */}
        <div
          id="wheel-rings-divider"
          style={{
            position: 'absolute',
            left: '84.6px',
            top: '42.2px',
            width: '304px',
            height: '304px',
            backgroundImage: "url('/assets/tc/Wheel_Ring.webp')",
            backgroundSize: '100% 100%',
            backgroundRepeat: 'no-repeat',
            pointerEvents: 'none',
            zIndex: 4,
          }}
        />

        {/* Center Orb (Golden 3D Sphere in active state; shows winning digits in win state) */}
        <div
          id="wheel-center-orb"
          style={{
            position: 'absolute',
            left: '176.9px',
            top: '134.3px',
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
            clipPath: 'circle(50% at 50% 50%)',
            WebkitClipPath: 'circle(50% at 50% 50%)',
            zIndex: 5,
            overflow: 'hidden',
          }}
        >
          {/* Equatorial groove / slit line across the sphere */}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '0px',
              width: '100%',
              height: '1.5px',
              background:
                'linear-gradient(90deg, transparent 0%, rgba(255, 220, 100, 0.3) 12%, rgba(255, 245, 170, 0.9) 50%, rgba(255, 220, 100, 0.3) 88%, transparent 100%)',
              boxShadow: '0 1px 2px rgba(0, 0, 0, 0.9), 0 -0.5px 1px rgba(0, 0, 0, 0.6)',
              transform: 'translateY(-50%)',
              pointerEvents: 'none',
              zIndex: 1,
            }}
          />

          {/* 3D Swiping Multipliers ("2x 3x 4x 5x") — active only while wheel is spinning */}
          {isSpinning && revealed < 3 && (
            <div className="sphere-3d-stage">
              {/* 2X Multiplier Badge */}
              <img
                src="/assets/tc/2X.webp"
                alt="2X Multiplier"
                className="sphere-multiplier-item sphere-multiplier-2x"
              />
              {/* 3X Multiplier Badge */}
              <img
                src="/assets/tc/3X.webp"
                alt="3X Multiplier"
                className="sphere-multiplier-item sphere-multiplier-3x"
              />
              {/* 4X Multiplier Badge */}
              <img
                src="/assets/tc/4X.webp"
                alt="4X Multiplier"
                className="sphere-multiplier-item sphere-multiplier-4x"
              />
              {/* 5X Multiplier Badge */}
              <img
                src="/assets/tc/5X.webp"
                alt="5X Multiplier"
                className="sphere-multiplier-item sphere-multiplier-5x"
              />
            </div>
          )}

          {/* Spherical 3D Glass / Specular Sheen Overlay */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: '50%',
              background:
                'radial-gradient(circle at 35% 26%, rgba(255, 255, 255, 0.4) 0%, rgba(255, 255, 255, 0.1) 28%, transparent 58%)',
              boxShadow:
                'inset 0 0 15px rgba(0, 0, 0, 0.7), inset 0 2px 3px rgba(255, 255, 255, 0.35), inset 0 -3px 6px rgba(0, 0, 0, 0.85)',
              pointerEvents: 'none',
              zIndex: 3,
            }}
          />

          {revealed >= 3 && (
            <span
              style={{
                fontFamily: "'GOTHAMCONDENSED-MEDIUM', 'Century Gothic', sans-serif",
                fontSize: '42px',
                fontWeight: '900',
                color: '#000000',
                letterSpacing: '1px',
                textShadow: '0 0 4px rgba(255, 255, 255, 0.9)',
                zIndex: 4,
              }}
            >
              {winningNumberStr}
            </span>
          )}
        </div>

        {/* Result window — blue wedge overlays appear as numbers are selected, diamond frame appears after all 3 */}
        {revealed > 0 && (
          <div
            id="wheel-win-highlighter-group"
            data-testid="reveal-window"
            style={{
              position: 'absolute',
              top: '-4.5px',
              left: '170.5px',
              width: '128px',
              height: '151px',
              pointerEvents: 'none',
              zIndex: 8,
            }}
          >
            {/* Outer Ring Highlight (Third_WIN_HIGHLight0001.webp) — hundreds, first to settle */}
            <div
              style={{
                position: 'absolute',
                top: '14px',
                left: '7px',
                width: '110px',
                height: '46px',
                backgroundImage: "url('/assets/tc/Third_WIN_HIGHLight0001.webp')",
                backgroundSize: '100% 100%',
                backgroundRepeat: 'no-repeat',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                visibility: revealed >= 1 ? 'visible' : 'hidden',
                zIndex: 1,
              }}
            >
              <span
                style={{
                  fontFamily: "'GOTHAMCONDENSED-MEDIUM', sans-serif",
                  fontSize: '24px',
                  fontWeight: '900',
                  color: '#FFFFFF',
                  textShadow: '0 1px 3px #000000',
                }}
              >
                {drawDigits[0]}
              </span>
            </div>

            {/* Mid Ring Highlight (Mid_WIN_HIGHLight0001.webp) — tens, settles at 7 s */}
            <div
              style={{
                position: 'absolute',
                top: '54px',
                left: '20px',
                width: '85px',
                height: '44px',
                backgroundImage: "url('/assets/tc/Mid_WIN_HIGHLight0001.webp')",
                backgroundSize: '100% 100%',
                backgroundRepeat: 'no-repeat',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                visibility: revealed >= 2 ? 'visible' : 'hidden',
                zIndex: 1,
              }}
            >
              <span
                style={{
                  fontFamily: "'GOTHAMCONDENSED-MEDIUM', sans-serif",
                  fontSize: '22px',
                  fontWeight: '900',
                  color: '#FFFFFF',
                  textShadow: '0 1px 3px #000000',
                }}
              >
                {drawDigits[1]}
              </span>
            </div>

            {/* Inner Ring Highlight (Single_WIN_HIGHLight0001.webp) — units, settles at 9 s */}
            <div
              style={{
                position: 'absolute',
                top: '94px',
                left: '33px',
                width: '59px',
                height: '43px',
                backgroundImage: "url('/assets/tc/Single_WIN_HIGHLight0001.webp')",
                backgroundSize: '100% 100%',
                backgroundRepeat: 'no-repeat',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                visibility: revealed >= 3 ? 'visible' : 'hidden',
                zIndex: 1,
              }}
            >
              <span
                style={{
                  fontFamily: "'GOTHAMCONDENSED-MEDIUM', sans-serif",
                  fontSize: '20px',
                  fontWeight: '900',
                  color: '#FFFFFF',
                  textShadow: '0 1px 3px #000000',
                }}
              >
                {drawDigits[2]}
              </span>
            </div>

            {/* Diamond/Jewel Pointer Frame — appears only AFTER all 3 numbers are selected */}
            {revealed >= 3 && (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  backgroundImage: "url('/assets/tc/sprite_8270001.webp')",
                  backgroundSize: '100% 100%',
                  backgroundRepeat: 'no-repeat',
                  zIndex: 2,
                }}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
};
