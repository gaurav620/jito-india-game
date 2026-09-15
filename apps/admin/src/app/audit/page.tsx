'use client';

import { Table } from '@jito/ui';
import React from 'react';

export default function AdminAuditLogsPage() {
  const logs = [
    { id: 'LOG-771', timestamp: '2026-09-08 22:18:12', actor: 'SuperAdmin_01', action: 'MANUAL_POINT_CREDIT', details: 'Credited 50,000 pts to USR-103', ip: '103.21.244.18' },
    { id: 'LOG-770', timestamp: '2026-09-08 22:15:00', actor: 'SYSTEM_ENGINE', action: 'ROUND_SETTLEMENT', details: 'Settled Round 736TC658 (772)', ip: '10.0.1.4' },
    { id: 'LOG-769', timestamp: '2026-09-08 22:05:44', actor: 'SuperAdmin_01', action: 'USER_SUSPENDED', details: 'Suspended USR-104 for multi-tab activity', ip: '103.21.244.18' },
    { id: 'LOG-768', timestamp: '2026-09-08 21:50:21', actor: 'Operator_02', action: 'REPORT_GENERATION', details: 'Exported daily turnover report for 2026-09-07', ip: '103.21.244.22' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white uppercase tracking-tight">
          OPERATOR & SYSTEM AUDIT TRAIL
        </h1>
        <p className="text-xs text-gray-400 mt-0.5">
          Immutable cryptographic log of operator actions, balance changes, and settlements.
        </p>
      </div>

      <div className="rounded-xl border border-white/10 bg-[#12121A] overflow-hidden shadow-xl">
        <Table
          columns={[
            { header: 'Log ID', accessor: 'id' },
            { header: 'Timestamp', accessor: 'timestamp' },
            { header: 'Actor', accessor: 'actor' },
            {
              header: 'Action',
              accessor: (r) => (
                <span className="font-mono text-xs font-bold text-[#FFD700]">
                  {r.action}
                </span>
              ),
            },
            { header: 'Details', accessor: 'details' },
            { header: 'Source IP', accessor: 'ip' },
          ]}
          data={logs}
          keyExtractor={(r) => r.id}
        />
      </div>
    </div>
  );
}
