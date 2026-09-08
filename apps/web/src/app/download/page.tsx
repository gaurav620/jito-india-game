import { Button } from '@jito/ui';
import Link from 'next/link';
import React from 'react';

export default function DownloadPage() {
  return (
    <div className="min-h-screen bg-[#0A0A0F] text-gray-100 flex flex-col justify-between selection:bg-[#FFD700] selection:text-black">
      {/* Top Header */}
      <header className="border-b border-white/10 bg-[#0E0E17] px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <h1 className="font-extrabold text-2xl tracking-tight text-[#FFE57F] uppercase">
              JITO INDIA <span className="text-white">GAMES</span>
            </h1>
          </Link>
          <div className="flex items-center gap-4 text-xs font-bold text-gray-300">
            <Link href="/games" className="hover:text-[#FFD700]">Lobby</Link>
            <Link href="/login" className="hover:text-[#FFD700]">Sign In</Link>
          </div>
        </div>
      </header>

      {/* Main Download Hub */}
      <main className="max-w-6xl mx-auto px-6 py-12 flex-1 w-full">
        <div className="text-center mb-12">
          <span className="px-3 py-1 rounded-full bg-amber-500/20 text-[#FFD700] border border-amber-500/40 text-xs font-black uppercase tracking-widest">
            OFFICIAL CLIENTS
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-white uppercase tracking-tight mt-3">
            DOWNLOAD JITO INDIA GAMES
          </h2>
          <p className="text-sm text-gray-400 mt-2 max-w-xl mx-auto">
            Install the native gaming client for maximum frame rate, low latency, and full keyboard/touch accessibility.
          </p>
        </div>

        {/* The 3 Download Cards matching reference */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {/* 1. PC Client */}
          <div className="rounded-2xl bg-gradient-to-b from-[#1A1A2E] via-[#12121A] to-[#0A0A0F] border-2 border-[#00B0FF] p-6 flex flex-col justify-between shadow-[0_8px_30px_rgba(0,176,255,0.25)]">
            <div>
              <div className="w-14 h-14 rounded-2xl bg-[#00B0FF]/20 border border-[#00B0FF] flex items-center justify-center text-3xl mb-4 shadow-inner">
                💻
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-[#00B0FF]">
                RECOMMENDED FOR PLAYERS
              </span>
              <h3 className="text-xl font-black text-white mt-1">Windows PC Client</h3>
              <p className="text-xs text-gray-400 mt-2 leading-relaxed">
                Native Electron application for Windows 10/11. Supports fullscreen arcade mode, dual-monitor setup, and hardware-accelerated 60 FPS wheel animations.
              </p>
              <div className="mt-4 space-y-1 text-xs text-gray-400">
                <div>• Version: <strong className="text-white">v1.2.0 (Latest)</strong></div>
                <div>• OS: <strong className="text-white">Windows 10 / 11 (64-bit)</strong></div>
                <div>• Size: <strong className="text-white">~68 MB</strong></div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-white/10">
              <a href="#download-pc" className="block">
                <Button variant="green" fullWidth size="lg">
                  DOWNLOAD FOR PC (.EXE)
                </Button>
              </a>
            </div>
          </div>

          {/* 2. Print Client */}
          <div className="rounded-2xl bg-gradient-to-b from-[#1A1A2E] via-[#12121A] to-[#0A0A0F] border-2 border-[#DAA520]/60 p-6 flex flex-col justify-between shadow-xl">
            <div>
              <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-400 flex items-center justify-center text-3xl mb-4 shadow-inner">
                🖨️
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-[#DAA520]">
                TERMINAL OPERATORS
              </span>
              <h3 className="text-xl font-black text-white mt-1">Print Client Utility</h3>
              <p className="text-xs text-gray-400 mt-2 leading-relaxed">
                Dedicated utility for printing game bet slips, round result slips, and shift settlement reports to thermal POS printers (80mm / 58mm).
              </p>
              <div className="mt-4 space-y-1 text-xs text-gray-400">
                <div>• Version: <strong className="text-white">v1.0.4</strong></div>
                <div>• Supported: <strong className="text-white">ESC/POS Thermal Printers</strong></div>
                <div>• Size: <strong className="text-white">~32 MB</strong></div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-white/10">
              <a href="#download-print" className="block">
                <Button variant="gold" fullWidth size="lg">
                  DOWNLOAD FOR PRINT
                </Button>
              </a>
            </div>
          </div>

          {/* 3. Android Client */}
          <div className="rounded-2xl bg-gradient-to-b from-[#1A1A2E] via-[#12121A] to-[#0A0A0F] border-2 border-[#00C853] p-6 flex flex-col justify-between shadow-[0_8px_30px_rgba(0,200,83,0.25)]">
            <div>
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-400 flex items-center justify-center text-3xl mb-4 shadow-inner">
                📱
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-[#00E676]">
                MOBILE ADAPTATION
              </span>
              <h3 className="text-xl font-black text-white mt-1">Android Mobile APK</h3>
              <p className="text-xs text-gray-400 mt-2 leading-relaxed">
                Capacitor Android application built for mobile tablets and smartphones. Features automatic landscape orientation and high-touch number grid.
              </p>
              <div className="mt-4 space-y-1 text-xs text-gray-400">
                <div>• Version: <strong className="text-white">v1.1.2</strong></div>
                <div>• Requirements: <strong className="text-white">Android 8.0 or newer</strong></div>
                <div>• Size: <strong className="text-white">~28 MB</strong></div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-white/10">
              <a href="#download-android" className="block">
                <Button variant="green" fullWidth size="lg">
                  DOWNLOAD FOR ANDROID (.APK)
                </Button>
              </a>
            </div>
          </div>
        </div>

        {/* Installation Guidelines */}
        <div className="rounded-2xl bg-[#12121A] border border-white/10 p-8 max-w-4xl mx-auto">
          <h3 className="text-lg font-black text-[#FFE57F] uppercase tracking-wide mb-4">
            INSTALLATION & VERIFICATION INSTRUCTIONS
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-gray-300 leading-relaxed">
            <div>
              <h4 className="font-bold text-white uppercase mb-1">Windows Installation:</h4>
              <p>
                1. Download <code className="bg-black px-1.5 py-0.5 rounded text-amber-300 font-mono">JitoGames-Setup.exe</code>.<br />
                2. Run the executable (no admin rights required for standard installation).<br />
                3. The installer creates a desktop shortcut and launches the kiosk shell automatically.
              </p>
            </div>
            <div>
              <h4 className="font-bold text-white uppercase mb-1">Android Installation:</h4>
              <p>
                1. Download <code className="bg-black px-1.5 py-0.5 rounded text-amber-300 font-mono">JitoGames.apk</code>.<br />
                2. Allow installation from unknown sources in your Android security settings.<br />
                3. Open and sign in with your points username.
              </p>
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t border-white/10 bg-[#08080C] py-6 px-6 text-center text-xs text-gray-500">
        © 2026 JITO INDIA GAMES • For amusement only • Points platform
      </footer>
    </div>
  );
}
