'use client';

import React, { useState, useEffect, useRef } from 'react';

import { JitoLogo } from '@/components/branding/JitoLogo';

export interface SplashScreenProps {
  onComplete?: () => void;
  /** Duration in ms to reach 100%. Defaults to 1800ms */
  targetDurationMs?: number;
}

const CANVAS_WIDTH = 1360;
const CANVAS_HEIGHT = 768;

/**
 * High-fidelity Splash / Starting Screen matching reference project `pr-project-2-main`.
 *
 * Visual features:
 * - Authentic 1360x768 geometric red background (Loader_Bg_3.webp)
 * - Scaled letterbox viewport ensuring zero-distortion on any device screen ratio
 * - Vector JITO INDIA GAMES marquee badge with 26 glowing perimeter bulbs
 * - Central update container with:
 *   - Animated red circular chaser spinner
 *   - Recessed slider progress track (shape_63.webp) with red glowing fill (1_Pixel_loder.webp)
 *   - Authentic "Downloading Update : X %" text in Gotham Condensed typography
 * - Smooth fade-out exit transition triggering `onComplete`
 */
export const SplashScreen: React.FC<SplashScreenProps> = ({
  onComplete,
  targetDurationMs = 1800,
}) => {
  const [progress, setProgress] = useState(0);
  const [scale, setScale] = useState(1);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  // Viewport scale calculator matching 1360x768 reference resolution
  useEffect(() => {
    const updateScale = () => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const nextScale = Math.min(vw / CANVAS_WIDTH, vh / CANVAS_HEIGHT);
      setScale(Math.max(0.2, nextScale));
    };

    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, []);

  // Progress ticker simulating boot & asset verification
  useEffect(() => {
    const startTime = performance.now();
    const interval = setInterval(() => {
      const elapsed = performance.now() - startTime;
      const rawPct = Math.min(100, Math.floor((elapsed / targetDurationMs) * 100));

      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        // Small random jumps to feel natural while strictly bounded by elapsed time
        const jitter = Math.floor(Math.random() * 6);
        const next = Math.min(100, Math.max(prev + jitter, rawPct));
        if (next >= 100) {
          clearInterval(interval);
        }
        return next;
      });
    }, 60);

    return () => clearInterval(interval);
  }, [targetDurationMs]);

  // Navigate to the next screen once progress hits 100%.
  // This effect only depends on `progress` so no unrelated state change
  // can accidentally cancel the navigation timer via cleanup.
  useEffect(() => {
    if (progress < 100) return;
    const navTimer = setTimeout(() => {
      onCompleteRef.current?.();
    }, 300);
    return () => clearTimeout(navTimer);
  }, [progress]);

  return (
    <div
      className="fixed inset-0 overflow-hidden select-none flex items-center justify-center bg-[#140001]"
    >
      {/* Scaled 1360x768 Reference Stage */}
      <div
        className="relative shrink-0 overflow-hidden"
        style={{
          width: `${CANVAS_WIDTH}px`,
          height: `${CANVAS_HEIGHT}px`,
          transform: `scale(${scale})`,
          transformOrigin: 'center center',
          backgroundImage: "url('/assets/splash/backgrounds/Loader_Bg_3.webp')",
          backgroundSize: '100% 100%',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      >
        {/* Original JITO INDIA GAMES Logo Badge — Positioned above central update box */}
        <div
          className="absolute left-1/2 -translate-x-1/2 flex items-center justify-center pointer-events-none"
          style={{
            top: '70px',
            width: '380px',
            height: '230px',
            filter: 'drop-shadow(0 12px 28px rgba(0, 0, 0, 0.95))',
          }}
        >
          <JitoLogo width={380} height={225} priority />
        </div>

        {/* Central Update Box Content — Centered at Y: 384px (768 / 2) */}
        <div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center pointer-events-none"
          style={{
            width: '450px',
            height: '130px',
          }}
        >
          {/* Red Dotted Circular Chaser Spinner */}
          <div className="relative w-8 h-8 mb-2 flex items-center justify-center">
            <svg
              className="w-full h-full animate-spin"
              style={{ animationDuration: '0.9s' }}
              viewBox="0 0 48 48"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle cx="38" cy="24" r="4.2" fill="#ff3344" opacity="1.0" />
              <circle cx="35.6" cy="31.8" r="3.7" fill="#f83040" opacity="0.9" />
              <circle cx="29.8" cy="37.2" r="3.2" fill="#f02a3a" opacity="0.8" />
              <circle cx="22.2" cy="38" r="2.7" fill="#e52434" opacity="0.7" />
              <circle cx="15.2" cy="34.6" r="2.2" fill="#d91e2e" opacity="0.55" />
              <circle cx="11.2" cy="28.4" r="1.8" fill="#cc1828" opacity="0.4" />
              <circle cx="10.8" cy="20.8" r="1.4" fill="#be1220" opacity="0.28" />
              <circle cx="14" cy="14.2" r="1.0" fill="#b00e1a" opacity="0.18" />
            </svg>
          </div>

          {/* Recessed Progress Slider Bar */}
          <div
            className="relative overflow-hidden mb-3"
            style={{
              width: '380px',
              height: '14px',
              backgroundImage: "url('/assets/splash/images/shape_63.webp')",
              backgroundSize: '100% 100%',
              backgroundRepeat: 'no-repeat',
              borderRadius: '3px',
            }}
          >
            {/* Red Filled Bar */}
            <div
              className="h-full transition-all duration-75 ease-out"
              style={{
                width: `${progress}%`,
                backgroundImage: "url('/assets/splash/images/1_Pixel_loder.webp')",
                backgroundSize: '100% 100%',
                backgroundRepeat: 'no-repeat',
                boxShadow: '0 0 8px rgba(255, 30, 45, 0.75)',
              }}
            />
          </div>

          {/* Typography: "Downloading Update : X %" */}
          <div className="text-center select-none">
            <span
              style={{
                fontFamily: "'GOTHAMCONDENSED-MEDIUM', 'Inter', sans-serif",
                fontSize: '15px',
                letterSpacing: '1.2px',
                color: '#d0d2db',
                textShadow: '0 1px 2px rgba(0, 0, 0, 0.9)',
              }}
            >
              Downloading Update : {progress} %
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
