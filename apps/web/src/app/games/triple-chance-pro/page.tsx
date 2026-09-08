'use client';

import React from 'react';

import TripleChanceTimerPage from '../triple-chance/page';

/**
 * Triple Chance Pro Timer
 * Pro variant sharing common architectural components with Pro styling indicators.
 */
export default function TripleChanceProTimerPage() {
  return (
    <div className="relative">
      {/* Pro Badge Indicator Ribbon */}
      <div className="fixed top-12 right-6 z-50 pointer-events-none">
        <span className="px-3 py-1 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-black text-xs uppercase tracking-widest border border-purple-300 shadow-xl">
          ⚡ PRO VARIANT TABLE
        </span>
      </div>

      <TripleChanceTimerPage />
    </div>
  );
}
