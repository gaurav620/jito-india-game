'use client';

import { Button, Table } from '@jito/ui';
import React, { useState } from 'react';

export default function AdminReportsPage() {
  const [fromDate, setFromDate] = useState('2026-09-01');
  const [toDate, setToDate] = useState('2026-09-08');

  const reportRows = [
    { date: '08-09-2026', salePoint: 962.0, winPoint: 198.0, end: 764.0, commiPoint: 34.0, ntpPoint: 730.0 },
    { date: '07-09-2026', salePoint: 1420.0, winPoint: 560.0, end: 860.0, commiPoint: 52.0, ntpPoint: 808.0 },
    { date: '06-09-2026', salePoint: 2150.0, winPoint: 890.0, end: 1260.0, commiPoint: 75.0, ntpPoint: 1185.0 },
    { date: '05-09-2026', salePoint: 1890.0, winPoint: 1200.0, end: 690.0, commiPoint: 68.0, ntpPoint: 622.0 },
    { date: '04-09-2026', salePoint: 3100.0, winPoint: 2400.0, end: 700.0, commiPoint: 110.0, ntpPoint: 590.0 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white uppercase tracking-tight">
            POINTS ACCOUNTING & TURNOVER REPORTS
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">
            Daily settlement statistics matching the reference report format.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="px-3 py-1.5 rounded bg-[#161622] border border-white/20 text-white font-mono"
          />
          <span className="text-gray-400 font-bold">TO</span>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="px-3 py-1.5 rounded bg-[#161622] border border-white/20 text-white font-mono"
          />
          <Button variant="gold" size="sm">
            GENERATE
          </Button>
        </div>
      </div>

      <div className="rounded-xl border border-white/10 bg-[#12121A] overflow-hidden shadow-xl">
        <Table
          columns={[
            { header: 'DATE', accessor: 'date' },
            {
              header: 'SALE POINT',
              accessor: (r) => (
                <span className="font-mono text-white">
                  {r.salePoint.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              ),
            },
            {
              header: 'WIN POINT',
              accessor: (r) => (
                <span className="font-mono font-bold text-emerald-400">
                  {r.winPoint.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              ),
            },
            {
              header: 'END',
              accessor: (r) => (
                <span className="font-mono font-bold text-amber-300">
                  {r.end.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              ),
            },
            {
              header: 'COMMI POINT',
              accessor: (r) => (
                <span className="font-mono text-gray-300">
                  {r.commiPoint.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              ),
            },
            {
              header: 'NTP POINT',
              accessor: (r) => (
                <span className="font-mono font-black text-[#FFE57F]">
                  {r.ntpPoint.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              ),
            },
          ]}
          data={reportRows}
          keyExtractor={(r) => r.date}
        />
      </div>
    </div>
  );
}
