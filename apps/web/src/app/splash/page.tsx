'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import React, { useState, useEffect, useCallback } from 'react';

/**
 * 1:1 Recreation of the original game's Starting / Splash Screen
 * Reference:
 * - Background: /splash-screen/bg.png
 * - Logo: /jito-india-logo.png
 * - Loader: Red dotted chaser spinner (from client reference)
 * - Box: Centered dark rounded modal with "Downloading Update : X %"
 * - Flow: Splash screen -> Login screen
 */
export default function SplashScreen() {
  const router = useRouter();
  const [progress, setProgress] = useState(0);

  const goToLogin = useCallback(() => {
    router.push('/login');
  }, [router]);
  void goToLogin;

  // Update progress ticker (0% -> 100%)
  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          return 100;
        }
        // Increment realistically
        const jump = Math.floor(Math.random() * 9) + 4;
        const next = Math.min(prev + jump, 100);
        return next;
      });
    }, 150);

    return () => clearInterval(timer);
  }, []);

  // Transition to /login once progress hits 100%
  useEffect(() => {
    if (progress >= 100) {
      const timeout = setTimeout(() => {
        goToLogin();
      }, 400);
      return () => clearTimeout(timeout);
    }
  }, [progress, goToLogin]);

  return (
    <div
      className="relative w-screen h-screen overflow-hidden select-none flex flex-col items-center justify-center"
      style={{
        backgroundImage: "url('/splash-screen/bg.png')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundColor: '#1a0003',
      }}
    >
      {/* Center Container: Logo + Update Box */}
      <div className="flex flex-col items-center justify-center relative z-10 -mt-4">
        {/* Main Logo from /jito-india-logo.png */}
        <div className="mb-6 pointer-events-none drop-shadow-[0_8px_20px_rgba(0,0,0,0.85)]">
          <Image
            src="/jito-india-logo.png"
            alt="Jito India Games"
            width={340}
            height={200}
            priority
            className="w-[280px] sm:w-[340px] h-auto object-contain"
          />
        </div>

        {/* Update Box (Exactly as in starting-screen/image.png) */}
        <div
          className="w-[460px] sm:w-[560px] md:w-[620px] max-w-[92vw] h-[125px] sm:h-[140px] rounded-xl sm:rounded-2xl border border-[#343746]  flex flex-col items-center justify-center gap-3 px-8"
          style={{
            background:
              'radial-gradient(ellipse at center, #2d303e 0%, #1a1b24 55%, #0d0e14 100%)',
          }}
        >
          {/* Red Dotted Chaser Loader (Matching reference image) */}
          <div className="relative w-10 h-10 flex items-center justify-center">
            <svg
              className="w-full h-full animate-spin"
              style={{ animationDuration: '0.95s' }}
              viewBox="0 0 48 48"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/*
                8 red circular dots in a tapering tail:
                Head dot is largest and brightest, tail diminishes in size and opacity
              */}
              {/* Dot 1 - Head (Largest & brightest) */}
              <circle cx="38" cy="24" r="4.2" fill="#ff3344" opacity="1.0" />
              {/* Dot 2 */}
              <circle cx="35.6" cy="31.8" r="3.7" fill="#f83040" opacity="0.9" />
              {/* Dot 3 */}
              <circle cx="29.8" cy="37.2" r="3.2" fill="#f02a3a" opacity="0.8" />
              {/* Dot 4 */}
              <circle cx="22.2" cy="38" r="2.7" fill="#e52434" opacity="0.7" />
              {/* Dot 5 */}
              <circle cx="15.2" cy="34.6" r="2.2" fill="#d91e2e" opacity="0.55" />
              {/* Dot 6 */}
              <circle cx="11.2" cy="28.4" r="1.8" fill="#cc1828" opacity="0.4" />
              {/* Dot 7 */}
              <circle cx="10.8" cy="20.8" r="1.4" fill="#be1220" opacity="0.28" />
              {/* Dot 8 - Tail (Smallest & faintest) */}
              <circle cx="14" cy="14.2" r="1.0" fill="#b00e1a" opacity="0.18" />
            </svg>
          </div>

          {/* Exact text format: "Downloading Update : 0 %" */}
          <div className="text-center font-normal">
            <span className="text-[#c8c9d0] text-xs sm:text-[13px] tracking-wide font-sans">
              Downloading Update : {progress} %
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
