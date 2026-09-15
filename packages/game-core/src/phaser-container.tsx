'use client';

import React, { useEffect, useRef, useState } from 'react';

import type { WheelTargetResult } from './types';
import { WheelEngine } from './wheel-renderer';

export interface PhaserWheelProps {
  targetResult?: WheelTargetResult | null;
  isSpinning?: boolean;
  onSpinComplete?: (result: string) => void;
  className?: string;
  size?: number;
}

/**
 * Triple Chance 3-Ring Concentric Wheel
 * Recreates the central visual centerpiece from the reference videos:
 * - Outer Ring: Triples (Red segments, white numbers 0-9)
 * - Middle Ring: Doubles (Green segments, black numbers 0-9)
 * - Inner Ring: Singles (Purple segments, black numbers 0-9)
 * - Top Pointer: Diamond & gold arrow aligning with result
 * - Center Sphere: Amber/gold metallic 3D sphere showing result (e.g. 772)
 */
export const PhaserWheel: React.FC<PhaserWheelProps> = ({
  targetResult,
  isSpinning = false,
  onSpinComplete,
  className = '',
  size = 380,
}) => {
  const [engine] = useState(() => new WheelEngine());
  const [angles, setAngles] = useState({ outer: 0, middle: 0, inner: 0 });
  const [displayResult, setDisplayResult] = useState<string | null>(null);
  const animFrameRef = useRef<number>();

  useEffect(() => {
    if (isSpinning && targetResult) {
      setDisplayResult(null);
      const { targetOuter, targetMiddle, targetInner } = engine.setTargetResult(targetResult);

      const startOuter = angles.outer;
      const startMiddle = angles.middle;
      const startInner = angles.inner;

      const duration = 3500; // 3.5s total spin
      const startTime = performance.now();

      // Cubic ease-out function
      const easeOut = (t: number): number => 1 - Math.pow(1 - t, 3);

      const step = (now: number) => {
        const elapsed = now - startTime;
        const progress = Math.min(1, elapsed / duration);
        const eased = easeOut(progress);

        const currentOuter = startOuter + (targetOuter - startOuter) * eased;
        const currentMiddle = startMiddle + (targetMiddle - startMiddle) * eased;
        const currentInner = startInner + (targetInner - startInner) * eased;

        setAngles({
          outer: currentOuter,
          middle: currentMiddle,
          inner: currentInner,
        });

        if (progress < 1) {
          animFrameRef.current = requestAnimationFrame(step);
        } else {
          engine.setAngles(targetOuter, targetMiddle, targetInner);
          engine.finalizeResult();
          const finalStr = `${targetResult.triple}${targetResult.double}${targetResult.single}`;
          setDisplayResult(finalStr);
          onSpinComplete?.(finalStr);
        }
      };

      animFrameRef.current = requestAnimationFrame(step);
    } else if (!isSpinning && !targetResult) {
      setDisplayResult(null);
    }

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [isSpinning, targetResult]);

  // Digits 0 to 9 arranged around a circle
  const digits = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

  return (
    <div
      className={`relative flex items-center justify-center select-none ${className}`}
      style={{ width: size, height: size }}
    >
      {/* Ornate Gold Outer Filigree Frame */}
      <div
        className="absolute inset-0 rounded-full p-2 bg-gradient-to-tr from-[#7D5A12] via-[#FFD700] to-[#FFE57F] shadow-[0_0_30px_rgba(255,215,0,0.5),0_10px_25px_rgba(0,0,0,0.8)]"
        style={{
          boxShadow: '0 0 25px rgba(218,165,32,0.6), inset 0 2px 4px rgba(255,255,255,0.7)',
        }}
      >
        {/* Decorative Jeweled Crest at top */}
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-gradient-to-b from-[#A5D6A7] via-[#00C853] to-[#004D20] border-2 border-[#FFE57F] shadow-lg flex items-center justify-center z-40">
          <div className="w-3 h-3 rounded-full bg-white/70 shadow-inner" />
        </div>

        {/* Wheel Backing Layer */}
        <div className="relative w-full h-full rounded-full overflow-hidden bg-[#0A0A10] border-4 border-[#B8860B]">
          {/* 1. OUTER RING (Triples: Red segments, white numbers) */}
          <div
            className="absolute inset-0 rounded-full transition-transform"
            style={{
              transform: `rotate(${angles.outer}deg)`,
              background: 'conic-gradient(#D32F2F 0deg 36deg, #C2185B 36deg 72deg, #D32F2F 72deg 108deg, #C2185B 108deg 144deg, #D32F2F 144deg 180deg, #C2185B 180deg 216deg, #D32F2F 216deg 252deg, #C2185B 252deg 288deg, #D32F2F 288deg 324deg, #C2185B 324deg 360deg)',
            }}
          >
            {digits.map((d, idx) => {
              const angle = idx * 36;
              return (
                <div
                  key={idx}
                  className="absolute inset-0 flex items-start justify-center"
                  style={{ transform: `rotate(${angle}deg)` }}
                >
                  <span
                    className="font-black text-sm text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)] pt-2"
                    style={{ transform: `rotate(${-angle}deg)` }}
                  >
                    {d}
                  </span>
                </div>
              );
            })}
          </div>

          {/* 2. MIDDLE RING (Doubles: Green segments, black numbers) */}
          <div
            className="absolute inset-[15%] rounded-full transition-transform border-2 border-[#FFD700]/70"
            style={{
              transform: `rotate(${angles.middle}deg)`,
              background: 'conic-gradient(#00C853 0deg 36deg, #00E676 36deg 72deg, #00C853 72deg 108deg, #00E676 108deg 144deg, #00C853 144deg 180deg, #00E676 180deg 216deg, #00C853 216deg 252deg, #00E676 252deg 288deg, #00C853 288deg 324deg, #00E676 324deg 360deg)',
            }}
          >
            {digits.map((d, idx) => {
              const angle = idx * 36;
              return (
                <div
                  key={idx}
                  className="absolute inset-0 flex items-start justify-center"
                  style={{ transform: `rotate(${angle}deg)` }}
                >
                  <span
                    className="font-black text-sm text-black drop-shadow-[0_1px_0_rgba(255,255,255,0.7)] pt-1.5"
                    style={{ transform: `rotate(${-angle}deg)` }}
                  >
                    {d}
                  </span>
                </div>
              );
            })}
          </div>

          {/* 3. INNER RING (Singles: Purple/pink segments, black numbers) */}
          <div
            className="absolute inset-[30%] rounded-full transition-transform border-2 border-[#FFD700]/70"
            style={{
              transform: `rotate(${angles.inner}deg)`,
              background: 'conic-gradient(#E1BEE7 0deg 36deg, #CE93D8 36deg 72deg, #E1BEE7 72deg 108deg, #CE93D8 108deg 144deg, #E1BEE7 144deg 180deg, #CE93D8 180deg 216deg, #E1BEE7 216deg 252deg, #CE93D8 252deg 288deg, #E1BEE7 288deg 324deg, #CE93D8 324deg 360deg)',
            }}
          >
            {digits.map((d, idx) => {
              const angle = idx * 36;
              return (
                <div
                  key={idx}
                  className="absolute inset-0 flex items-start justify-center"
                  style={{ transform: `rotate(${angle}deg)` }}
                >
                  <span
                    className="font-black text-xs text-black drop-shadow-[0_1px_0_rgba(255,255,255,0.8)] pt-1"
                    style={{ transform: `rotate(${-angle}deg)` }}
                  >
                    {d}
                  </span>
                </div>
              );
            })}
          </div>

          {/* 4. CENTER METALLIC GOLD SPHERE */}
          <div
            className="absolute inset-[44%] rounded-full shadow-[0_0_20px_rgba(0,0,0,0.8)] flex items-center justify-center border-2 border-[#FFE57F] z-30"
            style={{
              background: 'radial-gradient(circle at 35% 35%, #FFF9C4 0%, #FFD700 45%, #B8860B 80%, #4A3505 100%)',
              boxShadow: 'inset 0 3px 6px rgba(255,255,255,0.8), 0 4px 10px rgba(0,0,0,0.7)',
            }}
          >
            {displayResult ? (
              <span className="font-mono font-black text-lg sm:text-xl text-white tracking-widest drop-shadow-[0_2px_4px_rgba(0,0,0,1)] animate-bounce">
                {displayResult}
              </span>
            ) : (
              <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-[#B8860B] to-[#FFE57F] shadow-inner" />
            )}
          </div>
        </div>
      </div>

      {/* Top Diamond / Gold Pointer (observed in reference screen) */}
      <div className="absolute -top-1 left-1/2 -translate-x-1/2 z-40 flex flex-col items-center pointer-events-none">
        <div className="w-7 h-9 bg-gradient-to-b from-[#FFE57F] via-[#FFD700] to-[#B8860B] border-2 border-white rounded-t-sm shadow-md flex items-center justify-center">
          <div className="w-2 h-2 rounded-full bg-red-600 shadow-inner animate-pulse" />
        </div>
        <div
          className="w-0 h-0 border-l-[14px] border-l-transparent border-r-[14px] border-r-transparent border-t-[14px] border-t-[#B8860B] -mt-0.5"
          style={{ filter: 'drop-shadow(0 2px 2px rgba(0,0,0,0.8))' }}
        />
      </div>
    </div>
  );
};
