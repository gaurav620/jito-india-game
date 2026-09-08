'use client';

import { CasinoTopBar, GameCard } from '@jito/ui';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';

const CATEGORIES = [
  'DRAW GAMES',
  'ROULETTE GAMES',
  'SLOT GAMES',
  'TABLE GAMES',
  'SCRATCH GAMES',
];

export default function GameLobbyPage() {
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState('DRAW GAMES');

  const handlePlayGame = (id: string) => {
    if (id === 'triple-chance-pro') {
      router.push('/games/triple-chance-pro');
    } else {
      router.push('/games/triple-chance');
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-gray-100 flex flex-col justify-between selection:bg-[#FFD700] selection:text-black">
      {/* Top Application Bar */}
      <CasinoTopBar
        gameTitle="GAMES LOBBY"
        gameId="LOBBY-01"
        username="PINTU"
        pointsBalance={64707.0}
        onLobbyClick={() => router.push('/')}
        onClose={() => router.push('/')}
        onMinimize={() => {}}
      />

      <main className="max-w-7xl mx-auto px-6 py-8 flex-1 w-full">
        {/* Category Filter Tabs */}
        <div className="flex items-center justify-start sm:justify-center gap-2 overflow-x-auto pb-4 mb-8 border-b border-white/10">
          {CATEGORIES.map((category) => {
            const isActive = activeCategory === category;
            return (
              <button
                key={category}
                type="button"
                onClick={() => setActiveCategory(category)}
                className={`px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider whitespace-nowrap transition-all select-none ${
                  isActive
                    ? 'bg-gradient-to-b from-[#FFE57F] via-[#FFD700] to-[#B8860B] text-black shadow-[0_0_15px_rgba(255,215,0,0.5)] scale-105'
                    : 'bg-[#161622] text-gray-300 hover:text-white hover:bg-[#202030] border border-white/5'
                }`}
              >
                {category}
              </button>
            );
          })}
        </div>

        {/* Category Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-black text-white uppercase tracking-tight flex items-center gap-2">
              <span className="w-2.5 h-6 rounded bg-gradient-to-b from-[#00E676] to-[#007E33]" />
              {activeCategory}
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Select an active game table to begin betting with server-synchronized timing.
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-xs font-bold text-[#FFD700]">
            <span>Active Server Nodes: <strong>ap-south-1</strong></span>
          </div>
        </div>

        {/* Games Grid */}
        {activeCategory === 'DRAW GAMES' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <GameCard
              id="triple-chance"
              title="Triple Chance Timer"
              category="DRAW GAMES"
              description="The flagship 3-Ring concentric wheel game with 00–99 Doubles checkered grid, 000–999 Triples range selector, and Singles bar. Server-authoritative 90s countdown."
              badge="MOST POPULAR"
              activePlayers={318}
              onPlay={handlePlayGame}
            />

            <GameCard
              id="triple-chance-pro"
              title="Triple Chance Pro Timer"
              category="DRAW GAMES"
              description="Enhanced high-roller variant with extended 12-round history analysis, fast repeat betting, and enhanced settlement tracking."
              badge="PRO TABLE"
              activePlayers={185}
              onPlay={handlePlayGame}
            />
          </div>
        ) : (
          <div className="rounded-2xl border-2 border-dashed border-white/10 p-16 text-center">
            <span className="text-4xl">🎰</span>
            <h3 className="font-extrabold text-lg text-white mt-3">
              {activeCategory} Coming Soon in Phase 2
            </h3>
            <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
              V1 focuses on the core Triple Chance Timer and Triple Chance Pro Timer draw games. Additional categories will unlock in subsequent platform releases.
            </p>
            <button
              type="button"
              onClick={() => setActiveCategory('DRAW GAMES')}
              className="mt-6 px-4 py-2 rounded-lg bg-gradient-to-b from-[#FFE57F] to-[#B8860B] text-black font-black text-xs uppercase"
            >
              View Draw Games
            </button>
          </div>
        )}
      </main>

      <footer className="border-t border-white/10 bg-[#08080C] py-4 px-6 text-center text-xs text-gray-500">
        JITO INDIA GAMES LOBBY • FOR AMUSEMENT ONLY • ALL ROUNDS ARE TIME SYNCHRONIZED
      </footer>
    </div>
  );
}
