'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';

/**
 * 1:1 Recreation of the Desktop Member Login Screen
 * Reference: assets/reference/login-page/image.png
 *
 * Assets:
 * - Full Background: /login/bg.png
 * - Main Logo: /jito-india-logo.png
 * - Login Card Shell: /login/member-login-card.png
 * - Beveled Input Texture: /login/input-field-wide.png
 * - Lock Icon: /login/lock-icon.png
 * - Login Button Default: /login/btn-login-default.png
 * - Login Button Hover: /login/btn-login-hover.png
 * - Rules Card with Crest Base: /login/rules-card-with-crest-base.png
 * - 18+ Banner: /login/18-plus-banner.png
 * - Checkbox Box: /login/checkbox-box.png
 * - Checkbox Tick: /login/checkbox-tick.png
 * - Free to Play Emblem: /login/free-to-play-emblem.png
 */
export default function LoginPage() {
  const router = useRouter();

  // Form State
  const [username, setUsername] = useState('PINTU');
  const [password, setPassword] = useState('••••••••');
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isBtnHovered, setIsBtnHovered] = useState(false);

  // Desktop Electron window controls
  const handleMinimize = () => {
    if (typeof window !== 'undefined' && 'electronAPI' in window) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).electronAPI?.minimizeWindow?.();
    }
  };

  const handleClose = () => {
    if (typeof window !== 'undefined' && 'electronAPI' in window) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).electronAPI?.closeWindow?.();
    }
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      router.push('/games');
    }, 400);
  };

  return (
    <main
      className="relative w-screen h-screen overflow-hidden select-none flex flex-col justify-between"
      style={{
        backgroundImage: "url('/login/bg.png')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundColor: '#0c0002',
      }}
    >
      {/* 1. Top Bar: Desktop Window Controls (Minimize [-] and Close [X]) */}
      <div className="w-full h-10 px-4 flex items-center justify-end z-30 pointer-events-auto">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleMinimize}
            className="w-6 h-6 rounded bg-[#689f38] hover:bg-[#7cb342] border border-[#9ccc65] text-white font-bold flex items-center justify-center text-xs shadow transition-transform active:scale-95"
            aria-label="Minimize Window"
          >
            –
          </button>
          <button
            type="button"
            onClick={handleClose}
            className="w-6 h-6 rounded bg-[#e64a19] hover:bg-[#f4511e] border border-[#ff7043] text-white font-bold flex items-center justify-center text-xs shadow transition-transform active:scale-95"
            aria-label="Close Window"
          >
            ✕
          </button>
        </div>
      </div>

      {/* 2. Main Center Content: Scaled Up & Fixed Proportionally Across Screens */}
      <div className="flex-1 w-full flex items-center justify-center relative z-20">
        <div
          className="flex flex-col lg:flex-row items-center justify-center gap-10 lg:gap-16 origin-center"
          style={{
            transform: 'scale(1.18)',
          }}
        >
          {/* --- LEFT COLUMN: Member Login Card + 18+ Banner --- */}
          <div className="flex flex-col items-center justify-center">
            {/* Member Login Card */}
            <div
              className="relative w-[377px] h-[353px] rounded-2xl"
              style={{
                backgroundImage: "url('/login/member-login-card.png')",
                backgroundSize: 'contain',
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'center',
              }}
            >
              {/* Lock Icon at Top Right */}
              <div className="absolute top-[12px] right-[18px] pointer-events-none opacity-80">
                <Image
                  src="/login/lock-icon.png"
                  alt="Secure Login"
                  width={22}
                  height={18}
                  className="object-contain"
                />
              </div>

              {/* Login Form Inputs & Button */}
              <form onSubmit={handleLoginSubmit}>
                {/* Username Input */}
                <div
                  className="absolute top-[108px] left-[76px] w-[225px] h-[31px] rounded-md overflow-hidden flex items-center"
                  style={{
                    backgroundImage: "url('/login/input-field-wide.png')",
                    backgroundSize: '100% 100%',
                  }}
                >
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    className="w-full h-full bg-transparent px-3 text-white text-xs sm:text-sm font-sans tracking-wide outline-none"
                    placeholder="Enter Username"
                  />
                </div>

                {/* Password Input */}
                <div
                  className="absolute top-[170px] left-[76px] w-[225px] h-[31px] rounded-md overflow-hidden flex items-center"
                  style={{
                    backgroundImage: "url('/login/input-field-wide.png')",
                    backgroundSize: '100% 100%',
                  }}
                >
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full h-full bg-transparent px-3 text-white text-xs sm:text-sm font-sans tracking-widest outline-none"
                    placeholder="••••••••"
                  />
                </div>

                {/* Red Beveled "LOGIN" Button with Custom Default & Hover Images */}
                <button
                  type="submit"
                  disabled={isLoading}
                  onMouseEnter={() => setIsBtnHovered(true)}
                  onMouseLeave={() => setIsBtnHovered(false)}
                  className="absolute top-[214px] left-1/2 -translate-x-1/2 w-[150px] h-[36px] flex items-center justify-center cursor-pointer transition-transform active:scale-95 shadow-[0_4px_10px_rgba(0,0,0,0.85)] rounded-md"
                  style={{
                    backgroundImage: isBtnHovered
                      ? "url('/login/btn-login-with-text-hover.png')"
                      : "url('/login/btn-login-with-text-default.png')",
                    backgroundSize: '100% 100%',
                    backgroundRepeat: 'no-repeat',
                  }}
                >
                  {isLoading ? (
                    <span className="text-white font-bold text-xs bg-black/60 px-2 py-0.5 rounded shadow">
                      ...
                    </span>
                  ) : (
                    <span className="sr-only">LOGIN</span>
                  )}
                </button>

                {/* Custom Checkbox using checkbox-box.png & checkbox-tick.png */}
                <div
                  onClick={() => setRememberMe(!rememberMe)}
                  className="absolute top-[260px] left-1/2 -translate-x-1/2 flex items-center gap-2.5 cursor-pointer select-none"
                >
                  <div className="relative w-[18px] h-[18px] flex items-center justify-center">
                    <Image
                      src="/login/checkbox-box.png"
                      alt="Checkbox"
                      width={18}
                      height={18}
                      className="absolute inset-0 w-full h-full object-contain pointer-events-none"
                    />
                    {rememberMe && (
                      <Image
                        src="/login/checkbox-tick.png"
                        alt="Checked"
                        width={14}
                        height={13}
                        className="relative z-10 w-[14px] h-[13px] object-contain pointer-events-none -mt-0.5"
                      />
                    )}
                  </div>
                  <span className="text-white text-sm sm:text-[15px] font-bold tracking-wide drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]">
                    Remember Me
                  </span>
                </div>
              </form>
            </div>

            {/* Authentic 18+ Strictly for Amusement Only Banner */}
            <div className="mt-3 pointer-events-none">
              <Image
                src="/login/18-plus-banner.png"
                alt="Strictly For Amusement Only - 18+ You should be 18 years and above to use this site"
                width={380}
                height={70}
                className="w-[377px] h-auto object-contain drop-shadow-[0_0_12px_rgba(255,23,68,0.6)]"
              />
            </div>
          </div>

          {/* --- RIGHT COLUMN: Rules Card with Crest Base & Jito India Logo Covering Top --- */}
          <div className="relative w-[480px] sm:w-[530px] flex flex-col items-center">
            {/* Rules Card with Top Black Silhouette */}
            <Image
              src="/login/rules-card-with-crest-base.png"
              alt="Rules and Information"
              width={619}
              height={451}
              priority
              className="w-full h-auto object-contain pointer-events-none"
            />

            {/* Jito India Logo Centered and Snugly Covering the Top Silhouette */}
            <div className="absolute -top-[14px] left-1/2 -translate-x-1/2 w-[340px] sm:w-[370px] pointer-events-none">
              <Image
                src="/jito-india-logo.png"
                alt="Jito India Games"
                width={1628}
                height={966}
                priority
                className="w-full h-auto object-contain drop-shadow-[0_8px_25px_rgba(0,0,0,0.9)]"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 3. Bottom Right: Authentic "FREE TO PLAY" Emblem */}
      <div className="fixed bottom-3 right-6 pointer-events-none z-30">
        <Image
          src="/login/free-to-play-emblem.png"
          alt="Free to Play Amusement and Social Gaming Site"
          width={245}
          height={135}
          className="w-[180px] sm:w-[205px] h-auto object-contain"
        />
      </div>
    </main>
  );
}
