'use client';

import { Card, Table } from '@jito/ui';
import React from 'react';

export default function AdminPointsLedgerPage() {
  const ledgerData = [
    { id: 'TX-901', timestamp: '2026-09-08 22:15:30', user: 'PINTU', type: 'BET_PLACED', amount: -40, balance: 64707.0, round: '736TC658' },
    { id: 'TX-900', timestamp: '2026-09-08 22:14:02', user: 'PINTU', type: 'WIN_SETTLEMENT', amount: 3600, balance: 64747.0, round: '736TC657' },
    { id: 'TX-899', timestamp: '2026-09-08 22:12:45', user: 'RAJESH_K', type: 'BET_PLACED', amount: -150, balance: 12500.0, round: '736TC657' },
    { id: 'TX-898', timestamp: '2026-09-08 22:10:10', user: 'VIP_AMIT', type: 'ADMIN_CREDIT', amount: 50000, balance: 184200.0, round: 'MANUAL' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white uppercase tracking-tight">
          POINTS LEDGER & AUDIT
        </h1>
        <p className="text-xs text-gray-400 mt-0.5">
          Immutable points movement ledger tracking bets, winnings, and adjustments.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card variant="dark">
          <div className="text-xs font-bold text-gray-400 uppercase">System Circulating Points</div>
          <div className="text-2xl font-black text-[#FFD700] font-mono mt-1">1,842,500.00</div>
        </Card>
        <Card variant="dark">
          <div className="text-xs font-bold text-gray-400 uppercase">Today&apos;s Bet Volume</div>
          <div className="text-2xl font-black text-white font-mono mt-1">428,950.00</div>
        </Card>
        <Card variant="dark">
          <div className="text-xs font-bold text-gray-400 uppercase">Today&apos;s Payout Volume</div>
          <div className="text-2xl font-black text-emerald-400 font-mono mt-1">312,400.00</div>
        </Card>
      </div>

      <div className="rounded-xl border border-white/10 bg-[#12121A] overflow-hidden shadow-xl">
        <Table
          columns={[
            { header: 'Tx ID', accessor: 'id' },
            { header: 'Timestamp', accessor: 'timestamp' },
            { header: 'Player', accessor: 'user' },
            {
              header: 'Event Type',
              accessor: (r) => (
                <span className="font-mono text-xs font-bold text-[#FFE57F]">
                  {r.type}
                </span>
              ),
            },
            {
              header: 'Points Delta',
              accessor: (r) => (
                <span
                  className={`font-mono font-black ${
                    r.amount > 0 ? 'text-emerald-400' : 'text-red-400'
                  }`}
                >
                  {r.amount > 0 ? `+${r.amount}` : r.amount}
                </span>
              ),
            },
            {
              header: 'Resulting Balance',
              accessor: (r) => (
                <span className="font-mono font-bold text-white">
                  {r.balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              ),
            },
            { header: 'Reference', accessor: 'round' },
          ]}
          data={ledgerData}
          keyExtractor={(r) => r.id}
        />
      </div>
    </div>
  );
}
