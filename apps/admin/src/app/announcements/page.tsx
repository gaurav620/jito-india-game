'use client';

import { Button, Input, Table } from '@jito/ui';
import React, { useState } from 'react';

export default function AdminAnnouncementsPage() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  const announcements = [
    { id: 1, title: 'Server Maintenance Window', date: '2026-09-08', status: 'ACTIVE', audience: 'ALL_PLAYERS' },
    { id: 2, title: 'Triple Chance Pro Mode Launch', date: '2026-09-05', status: 'ACTIVE', audience: 'ALL_PLAYERS' },
    { id: 3, title: 'Scheduled AWS Backup', date: '2026-09-01', status: 'EXPIRED', audience: 'ADMINS' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white uppercase tracking-tight">
          PLATFORM ANNOUNCEMENTS & TICKER
        </h1>
        <p className="text-xs text-gray-400 mt-0.5">
          Broadcast ticker alerts, maintenance notices, and lobby messages.
        </p>
      </div>

      <div className="rounded-xl border border-white/10 bg-[#12121A] p-6">
        <h3 className="text-sm font-black text-[#FFE57F] uppercase mb-4">
          POST NEW ANNOUNCEMENT
        </h3>
        <div className="space-y-4 max-w-xl">
          <Input
            label="Announcement Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. New Round Cycle Schedule"
          />
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#DAA520] mb-1.5">
              Message Content
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={3}
              placeholder="Enter announcement text..."
              className="w-full rounded-md bg-[#0D0D14] border border-[#DAA520]/40 text-white p-3 text-xs focus:border-[#FFD700] focus:outline-none"
            />
          </div>
          <Button variant="gold" size="sm">
            PUBLISH ANNOUNCEMENT
          </Button>
        </div>
      </div>

      <div className="rounded-xl border border-white/10 bg-[#12121A] overflow-hidden shadow-xl">
        <Table
          columns={[
            { header: 'ID', accessor: 'id' },
            { header: 'Title', accessor: 'title' },
            { header: 'Published Date', accessor: 'date' },
            {
              header: 'Status',
              accessor: (r) => (
                <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  {r.status}
                </span>
              ),
            },
            { header: 'Audience', accessor: 'audience' },
          ]}
          data={announcements}
          keyExtractor={(r) => r.id}
        />
      </div>
    </div>
  );
}
