'use client';

import { Table } from '@jito/ui';
import React from 'react';

export default function AdminDownloadsPage() {
  const releases = [
    { platform: 'Windows PC (.exe)', version: 'v1.2.0', releaseDate: '2026-09-08', downloads: 1420, activeInstalls: 980, status: 'STABLE' },
    { platform: 'Android APK (.apk)', version: 'v1.1.2', releaseDate: '2026-09-05', downloads: 3540, activeInstalls: 2610, status: 'STABLE' },
    { platform: 'Print Client (.exe)', version: 'v1.0.4', releaseDate: '2026-08-30', downloads: 210, activeInstalls: 195, status: 'STABLE' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white uppercase tracking-tight">
          DOWNLOADS & INSTALLER DISTRIBUTION
        </h1>
        <p className="text-xs text-gray-400 mt-0.5">
          Manage desktop and mobile release binaries, version updates, and distribution statistics.
        </p>
      </div>

      <div className="rounded-xl border border-white/10 bg-[#12121A] overflow-hidden shadow-xl">
        <Table
          columns={[
            { header: 'Target Platform', accessor: 'platform' },
            {
              header: 'Version',
              accessor: (r) => (
                <span className="font-mono font-bold text-[#FFE57F]">
                  {r.version}
                </span>
              ),
            },
            { header: 'Release Date', accessor: 'releaseDate' },
            {
              header: 'Total Downloads',
              accessor: (r) => (
                <span className="font-mono text-white">
                  {r.downloads.toLocaleString('en-IN')}
                </span>
              ),
            },
            {
              header: 'Active Installs',
              accessor: (r) => (
                <span className="font-mono text-emerald-400">
                  {r.activeInstalls.toLocaleString('en-IN')}
                </span>
              ),
            },
            {
              header: 'Channel',
              accessor: (r) => (
                <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  {r.status}
                </span>
              ),
            },
          ]}
          data={releases}
          keyExtractor={(r) => r.platform}
        />
      </div>
    </div>
  );
}
