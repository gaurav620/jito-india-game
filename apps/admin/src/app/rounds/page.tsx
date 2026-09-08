'use client';

import { Table } from '@jito/ui';
import React from 'react';

export default function AdminGameRoundsPage() {
  const activeRounds = [
    {
      roundId: '736TC659',
      game: 'Triple Chance Timer',
      state: 'BETTING_OPEN',
      secondsRemaining: 42,
      totalBets: 32,
      totalPoints: 4820,
      startedAt: '22:15:00',
    },
    {
      roundId: '736TP412',
      game: 'Triple Chance Pro Timer',
      state: 'BETTING_OPEN',
      secondsRemaining: 55,
      totalBets: 45,
      totalPoints: 8150,
      startedAt: '22:14:45',
    },
    {
      roundId: '736TC658',
      game: 'Triple Chance Timer',
      state: 'SETTLED',
      result: '772',
      totalBets: 28,
      totalPoints: 3940,
      payoutPoints: 3600,
      startedAt: '22:13:30',
    },
    {
      roundId: '736TC657',
      game: 'Triple Chance Timer',
      state: 'SETTLED',
      result: '285',
      totalBets: 41,
      totalPoints: 5600,
      payoutPoints: 4200,
      startedAt: '22:12:00',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white uppercase tracking-tight">
          GAME ROUND MONITOR
        </h1>
        <p className="text-xs text-gray-400 mt-0.5">
          Real-time state tracking of active and recent draw game rounds.
        </p>
      </div>

      <div className="rounded-xl border border-white/10 bg-[#12121A] overflow-hidden shadow-xl">
        <Table
          columns={[
            { header: 'Round ID', accessor: 'roundId' },
            { header: 'Game Variant', accessor: 'game' },
            {
              header: 'Status',
              accessor: (r) => (
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                    r.state === 'BETTING_OPEN'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                      : 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                  }`}
                >
                  {r.state}
                </span>
              ),
            },
            {
              header: 'Result',
              accessor: (r) => (
                <span className="font-mono font-black text-amber-300">
                  {r.result || 'Pending'}
                </span>
              ),
            },
            {
              header: 'Bets Volume',
              accessor: (r) => (
                <span className="font-mono font-bold text-white">
                  {r.totalPoints} pts ({r.totalBets} bets)
                </span>
              ),
            },
            { header: 'Started At', accessor: 'startedAt' },
          ]}
          data={activeRounds}
          keyExtractor={(r) => r.roundId}
        />
      </div>
    </div>
  );
}
