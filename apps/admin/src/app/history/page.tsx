'use client';

import { Input, Table } from '@jito/ui';
import React, { useState } from 'react';

export default function AdminGameHistoryPage() {
  const [searchTerm, setSearchTerm] = useState('');

  const historyData = [
    { id: '736TC658', timestamp: '2026-09-08 22:15:00', result: '772', triple: '772', double: '72', single: '2', totalPlayed: 3940, totalWon: 3600 },
    { id: '736TC657', timestamp: '2026-09-08 22:13:30', result: '285', triple: '285', double: '85', single: '5', totalPlayed: 5600, totalWon: 4200 },
    { id: '736TC656', timestamp: '2026-09-08 22:12:00', result: '925', triple: '925', double: '25', single: '5', totalPlayed: 4100, totalWon: 1800 },
    { id: '736TC655', timestamp: '2026-09-08 22:10:30', result: '633', triple: '633', double: '33', single: '3', totalPlayed: 6200, totalWon: 5400 },
    { id: '736TC654', timestamp: '2026-09-08 22:09:00', result: '793', triple: '793', double: '93', single: '3', totalPlayed: 3800, totalWon: 0 },
  ];

  const filtered = historyData.filter(
    (h) => h.id.includes(searchTerm) || h.result.includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white uppercase tracking-tight">
            HISTORICAL ROUNDS ARCHIVE
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">
            Search historical game rounds and settled winning numbers.
          </p>
        </div>

        <div className="w-full sm:w-72">
          <Input
            placeholder="Search by Round ID or Winning Number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="rounded-xl border border-white/10 bg-[#12121A] overflow-hidden shadow-xl">
        <Table
          columns={[
            { header: 'Round ID', accessor: 'id' },
            { header: 'Completed At', accessor: 'timestamp' },
            {
              header: 'Winning Number',
              accessor: (r) => (
                <span className="font-mono font-black text-amber-300 text-sm">
                  {r.result}
                </span>
              ),
            },
            {
              header: 'Triple / Double / Single',
              accessor: (r) => (
                <span className="text-xs text-gray-300 font-mono">
                  {r.triple} | {r.double} | {r.single}
                </span>
              ),
            },
            {
              header: 'Points Played',
              accessor: (r) => (
                <span className="font-mono text-white">
                  {r.totalPlayed.toLocaleString('en-IN')}
                </span>
              ),
            },
            {
              header: 'Points Won',
              accessor: (r) => (
                <span className="font-mono font-bold text-emerald-400">
                  {r.totalWon.toLocaleString('en-IN')}
                </span>
              ),
            },
          ]}
          data={filtered}
          keyExtractor={(r) => r.id}
        />
      </div>
    </div>
  );
}
