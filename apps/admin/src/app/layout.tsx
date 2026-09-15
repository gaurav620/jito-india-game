import './globals.css';

import type { Metadata } from 'next';
import Link from 'next/link';
import React from 'react';

export const metadata: Metadata = {
  title: 'JITO INDIA GAMES — Admin Operation Center',
  description: 'Operations and points monitoring console for JITO INDIA GAMES.',
};

const NAV_ITEMS = [
  { label: 'Dashboard', href: '/', icon: '📊' },
  { label: 'Users & Points', href: '/users', icon: '👥' },
  { label: 'Points Ledger', href: '/points', icon: '💰' },
  { label: 'Game Rounds', href: '/rounds', icon: '🎰' },
  { label: 'Game History', href: '/history', icon: '📜' },
  { label: 'Reports', href: '/reports', icon: '📈' },
  { label: 'Announcements', href: '/announcements', icon: '📢' },
  { label: 'Downloads', href: '/downloads', icon: '📦' },
  { label: 'Audit Logs', href: '/audit', icon: '🔒' },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#0A0B10] text-gray-100 flex flex-col antialiased">
        {/* Top Header */}
        <header className="h-14 border-b border-white/10 bg-[#12131C] px-6 flex items-center justify-between sticky top-0 z-40">
          <div className="flex items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-black text-sm uppercase tracking-wider text-[#FFD700]">
              JITO INDIA <span className="text-white text-xs">ADMIN CONSOLE</span>
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
              POINTS SYSTEM ONLY
            </span>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <div className="text-right">
              <div className="font-bold text-white">SuperAdmin_01</div>
              <div className="text-[10px] text-gray-400">Node: ap-south-1a</div>
            </div>
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#B8860B] to-[#FFE57F] text-black font-black flex items-center justify-center text-xs shadow">
              SA
            </div>
          </div>
        </header>

        <div className="flex-1 flex">
          {/* Sidebar Navigation */}
          <aside className="w-60 border-r border-white/10 bg-[#0E0F17] p-4 flex flex-col justify-between hidden md:flex">
            <nav className="space-y-1">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg font-bold text-xs text-gray-300 hover:text-white hover:bg-white/5 transition"
                >
                  <span className="text-base">{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              ))}
            </nav>

            <div className="p-3 rounded-xl bg-black/40 border border-white/5 text-[11px] text-gray-400">
              <div className="font-bold text-gray-300">Phase 1 Foundation</div>
              <div className="mt-0.5 text-[10px] text-emerald-400">No payment gateways</div>
            </div>
          </aside>

          {/* Main Content Area */}
          <main className="flex-1 p-6 overflow-y-auto max-w-7xl mx-auto w-full">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
