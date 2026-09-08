import { Button } from '@jito/ui';
import Link from 'next/link';
import React from 'react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0A0A0F] text-gray-100 flex flex-col justify-between selection:bg-[#FFD700] selection:text-black">
      {/* Top Notice Banner */}
      <div className="bg-gradient-to-r from-[#1C1608] via-[#332200] to-[#1C1608] border-b border-[#FFD700]/30 py-1 px-4 text-center text-xs font-bold text-[#FFD700] tracking-wider uppercase flex items-center justify-center gap-2">
        <span>🔑 FOR AMUSEMENT ONLY</span>
        <span className="text-gray-500">•</span>
        <span>POINTS SYSTEM • NO REAL MONEY GAMBLING</span>
        <span className="text-gray-500">•</span>
        <span className="text-emerald-400">⚡ 60 FPS ULTRA LOW LAG ENGINE</span>
      </div>

      {/* Main Navigation Header */}
      <header className="border-b border-white/10 bg-[#0E0E17]/80 backdrop-blur-md sticky top-0 z-40 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* JITO INDIA GAMES Logo Marquee */}
            <div className="p-1 rounded-xl bg-gradient-to-tr from-[#7D5A12] via-[#FFD700] to-[#FFE57F] shadow-[0_0_15px_rgba(255,215,0,0.4)]">
              <div className="px-3 py-1 bg-[#12121A] rounded-[10px] flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-red-600 animate-pulse" />
                <span className="font-extrabold text-lg sm:text-xl tracking-tight text-[#FFD700] uppercase font-serif">
                  JITO INDIA <span className="text-white text-xs font-sans tracking-widest block -mt-1 font-bold">GAMES</span>
                </span>
              </div>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-bold text-gray-300">
            <Link href="/games" className="hover:text-[#FFD700] transition-colors">
              GAMES LOBBY
            </Link>
            <Link href="/games/triple-chance" className="hover:text-[#FFD700] transition-colors">
              TRIPLE CHANCE
            </Link>
            <Link href="/download" className="hover:text-[#FFD700] transition-colors">
              DOWNLOADS
            </Link>
            <Link href="http://localhost:3001" target="_blank" className="hover:text-[#FFD700] transition-colors text-amber-400">
              ADMIN PANEL
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="secondary" size="sm">
                LOG IN
              </Button>
            </Link>
            <Link href="/register">
              <Button variant="gold" size="sm">
                REGISTER
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section Recreating the Reference Casino Visuals */}
      <main className="flex-1">
        <section className="relative overflow-hidden pt-12 pb-20 px-6 bg-gradient-to-b from-[#12121E] via-[#0A0A0F] to-[#0A0A0F]">
          {/* Subtle Casino Background Elements */}
          <div className="absolute inset-0 opacity-15 pointer-events-none bg-[radial-gradient(#FFD700_1px,transparent_1px)] [background-size:24px_24px]" />

          <div className="max-w-6xl mx-auto text-center relative z-10">
            {/* Casino Marquee Logo Badge */}
            <div className="inline-block p-2 rounded-2xl bg-gradient-to-b from-[#FFE57F] via-[#DAA520] to-[#7D5A12] shadow-[0_0_40px_rgba(218,165,32,0.4)] mb-8">
              <div className="px-8 py-4 rounded-xl bg-gradient-to-b from-[#1C1608] to-[#0A0A0F] border-2 border-[#FFE57F]">
                <h1 className="font-extrabold text-3xl sm:text-5xl lg:text-6xl text-[#FFE57F] tracking-tight drop-shadow-[0_2px_4px_rgba(0,0,0,1)] uppercase">
                  JITO INDIA <span className="text-white">GAMES</span>
                </h1>
                <p className="text-xs sm:text-sm font-bold tracking-widest text-[#FFC107] uppercase mt-1">
                  OFFICIAL DESKTOP & MOBILE AMUSEMENT PLATFORM
                </p>
              </div>
            </div>

            <p className="text-base sm:text-lg text-gray-300 max-w-2xl mx-auto mb-10 leading-relaxed font-medium">
              Play the authentic 3-Ring Wheel draw games: <strong className="text-[#FFD700]">Triple Chance Timer</strong> and{' '}
              <strong className="text-[#00E676]">Triple Chance Pro Timer</strong>. Built for high performance, zero lag, and instant real-time synchronization.
            </p>

            {/* 3 Prominent Download CTAs observed in Reference Screenshot */}
            <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 mb-16">
              {/* PC Download Button */}
              <Link href="/download?platform=pc">
                <button className="px-7 py-3.5 rounded-xl bg-gradient-to-b from-[#00E5FF] via-[#00B0FF] to-[#0070BA] text-black font-black text-sm uppercase tracking-wider border-2 border-[#E0F7FA] shadow-[0_4px_15px_rgba(0,176,255,0.5),inset_0_1px_2px_rgba(255,255,255,0.8)] hover:scale-105 active:scale-95 transition-all flex items-center gap-3">
                  <span className="text-xl">💻</span>
                  <span>FREE DOWNLOAD FOR PC</span>
                </button>
              </Link>

              {/* Print Client Download Button */}
              <Link href="/download?platform=print">
                <button className="px-7 py-3.5 rounded-xl bg-gradient-to-b from-[#00E5FF] via-[#00B0FF] to-[#0070BA] text-black font-black text-sm uppercase tracking-wider border-2 border-[#E0F7FA] shadow-[0_4px_15px_rgba(0,176,255,0.5),inset_0_1px_2px_rgba(255,255,255,0.8)] hover:scale-105 active:scale-95 transition-all flex items-center gap-3">
                  <span className="text-xl">🖨️</span>
                  <span>FREE DOWNLOAD FOR PRINT</span>
                </button>
              </Link>

              {/* Android Download Button */}
              <Link href="/download?platform=android">
                <button className="px-7 py-3.5 rounded-xl bg-gradient-to-b from-[#00E5FF] via-[#00B0FF] to-[#0070BA] text-black font-black text-sm uppercase tracking-wider border-2 border-[#E0F7FA] shadow-[0_4px_15px_rgba(0,176,255,0.5),inset_0_1px_2px_rgba(255,255,255,0.8)] hover:scale-105 active:scale-95 transition-all flex items-center gap-3">
                  <span className="text-xl">📱</span>
                  <span>FREE DOWNLOAD FOR ANDROID</span>
                </button>
              </Link>
            </div>

            {/* Quick Launch Direct Web Game Preview Button */}
            <div className="inline-flex items-center gap-3 p-1.5 rounded-full bg-white/5 border border-white/10">
              <span className="px-3 text-xs font-bold text-gray-400">Want to test in browser?</span>
              <Link href="/games/triple-chance">
                <Button variant="green" size="sm">
                  LAUNCH TRIPLE CHANCE NOW →
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Featured Games Section */}
        <section className="py-16 px-6 max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-black text-[#FFE57F] uppercase tracking-wide">
              FEATURED DRAW GAMES
            </h2>
            <p className="text-sm text-gray-400 mt-2 font-medium">
              Select a game to enter the lobby or play directly in high-performance mode.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Triple Chance Timer Card */}
            <div className="rounded-2xl bg-gradient-to-b from-[#1C1608] via-[#12121A] to-[#0A0A0F] border-2 border-[#DAA520]/50 p-6 flex flex-col justify-between shadow-xl">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-xs font-black uppercase">
                    ACTIVE NOW • ROUND #736TC658
                  </span>
                  <span className="font-mono text-xs font-bold text-[#DAA520]">90s Timer</span>
                </div>
                <h3 className="font-black text-2xl text-white">TRIPLE CHANCE TIMER</h3>
                <p className="text-xs text-gray-400 mt-2 leading-relaxed">
                  The original 3-Ring Concentric Wheel game with 00–99 Doubles checkered grid, 000–999 Triples range selector, and quick Singles bar.
                </p>
              </div>

              <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-4">
                <span className="text-xs font-bold text-gray-400">Server Synchronized</span>
                <Link href="/games/triple-chance">
                  <Button variant="gold" size="sm">
                    ENTER GAME →
                  </Button>
                </Link>
              </div>
            </div>

            {/* Triple Chance Pro Timer Card */}
            <div className="rounded-2xl bg-gradient-to-b from-[#1C1608] via-[#12121A] to-[#0A0A0F] border-2 border-[#DAA520]/50 p-6 flex flex-col justify-between shadow-xl">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40 text-xs font-black uppercase">
                    PRO VARIANT
                  </span>
                  <span className="font-mono text-xs font-bold text-[#DAA520]">Enhanced Mode</span>
                </div>
                <h3 className="font-black text-2xl text-white">TRIPLE CHANCE PRO TIMER</h3>
                <p className="text-xs text-gray-400 mt-2 leading-relaxed">
                  Enhanced variant featuring extended history statistics, multi-round repetition, and high-frequency settlement analytics.
                </p>
              </div>

              <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-4">
                <span className="text-xs font-bold text-gray-400">Server Synchronized</span>
                <Link href="/games/triple-chance-pro">
                  <Button variant="gold" size="sm">
                    ENTER PRO GAME →
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Real-time Ticker / Recent Results Showcase */}
        <section className="border-y border-[#FFD700]/30 bg-[#12121C] py-4 px-6">
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
              <span className="font-black text-xs uppercase tracking-wider text-[#FFD700]">
                RECENT DRAW RESULTS:
              </span>
            </div>
            <div className="flex items-center gap-6 font-mono font-black text-sm">
              <span className="text-white">Triple: <strong className="text-yellow-400">772</strong></span>
              <span className="text-gray-500">•</span>
              <span className="text-white">Double: <strong className="text-emerald-400">72</strong></span>
              <span className="text-gray-500">•</span>
              <span className="text-white">Single: <strong className="text-pink-400">2</strong></span>
              <span className="text-gray-500">•</span>
              <span className="text-gray-400 text-xs font-sans">Previous: 285, 925, 633, 793</span>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-[#08080C] py-8 px-6 text-center text-xs text-gray-500">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 JITO INDIA GAMES. All rights reserved. For amusement only.</p>
          <div className="flex items-center gap-6 font-bold text-gray-400">
            <Link href="/download" className="hover:text-white">Downloads</Link>
            <Link href="/games" className="hover:text-white">Lobby</Link>
            <Link href="/login" className="hover:text-white">Member Login</Link>
            <span className="text-amber-400 font-bold">POINTS PLATFORM</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
