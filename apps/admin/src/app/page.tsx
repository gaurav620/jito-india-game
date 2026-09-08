import { Card } from '@jito/ui';
import Link from 'next/link';
import React from 'react';

export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div>
        <h1 className="text-2xl font-black text-white uppercase tracking-tight">
          OPERATIONS OVERVIEW
        </h1>
        <p className="text-xs text-gray-400 mt-0.5">
          Real-time metrics, active game round status, and points accounting.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card variant="dark">
          <div className="text-xs font-bold uppercase tracking-wider text-gray-400">
            Active Players Online
          </div>
          <div className="text-2xl font-black text-[#00E676] mt-2 font-mono">
            486
          </div>
          <div className="text-[10px] text-gray-500 mt-1">Across Windows PC & Android</div>
        </Card>

        <Card variant="dark">
          <div className="text-xs font-bold uppercase tracking-wider text-gray-400">
            Active Draw Tables
          </div>
          <div className="text-2xl font-black text-[#FFE57F] mt-2 font-mono">
            2 Tables
          </div>
          <div className="text-[10px] text-emerald-400 mt-1">Triple Chance & Pro Timer</div>
        </Card>

        <Card variant="dark">
          <div className="text-xs font-bold uppercase tracking-wider text-gray-400">
            Today&apos;s Sale Points
          </div>
          <div className="text-2xl font-black text-white mt-2 font-mono">
            428,950.00
          </div>
          <div className="text-[10px] text-[#DAA520] mt-1">Total points in play</div>
        </Card>

        <Card variant="dark">
          <div className="text-xs font-bold uppercase tracking-wider text-gray-400">
            Today&apos;s Win Points
          </div>
          <div className="text-2xl font-black text-[#FFD700] mt-2 font-mono">
            312,400.00
          </div>
          <div className="text-[10px] text-gray-500 mt-1">Settled automatically</div>
        </Card>
      </div>

      {/* Game Tables Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card variant="gold">
          <div className="flex items-center justify-between border-b border-[#FFD700]/20 pb-3 mb-4">
            <div>
              <h3 className="font-black text-lg text-[#FFE57F] uppercase">
                Triple Chance Timer
              </h3>
              <p className="text-xs text-gray-400">Table ID: TC-01 • 90s Round Cycle</p>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[10px] font-black uppercase">
              ACTIVE • ROUND #736TC659
            </span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-white/5">
              <span className="text-gray-400">State:</span>
              <span className="font-bold text-[#00E676]">Betting Open (42s left)</span>
            </div>
            <div className="flex justify-between py-1 border-b border-white/5">
              <span className="text-gray-400">Current Round Bets:</span>
              <span className="font-mono font-bold text-white">4,820 Points (32 bets)</span>
            </div>
            <div className="flex justify-between py-1 border-b border-white/5">
              <span className="text-gray-400">Last Round Result:</span>
              <span className="font-mono font-bold text-[#FFD700]">772 (Triple 772, Double 72, Single 2)</span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-white/10 flex justify-end">
            <Link href="/rounds" className="text-xs font-bold text-[#FFD700] hover:underline">
              Inspect Round Details →
            </Link>
          </div>
        </Card>

        <Card variant="dark">
          <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
            <div>
              <h3 className="font-black text-lg text-white uppercase">
                Triple Chance Pro Timer
              </h3>
              <p className="text-xs text-gray-400">Table ID: TC-PRO-01 • High-Roller Mode</p>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40 text-[10px] font-black uppercase">
              ACTIVE • ROUND #736TP412
            </span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-white/5">
              <span className="text-gray-400">State:</span>
              <span className="font-bold text-[#00E676]">Betting Open (55s left)</span>
            </div>
            <div className="flex justify-between py-1 border-b border-white/5">
              <span className="text-gray-400">Current Round Bets:</span>
              <span className="font-mono font-bold text-white">8,150 Points (45 bets)</span>
            </div>
            <div className="flex justify-between py-1 border-b border-white/5">
              <span className="text-gray-400">Last Round Result:</span>
              <span className="font-mono font-bold text-[#FFD700]">355 (Triple 355, Double 55, Single 5)</span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-white/10 flex justify-end">
            <Link href="/rounds" className="text-xs font-bold text-[#FFD700] hover:underline">
              Inspect Round Details →
            </Link>
          </div>
        </Card>
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link href="/users" className="block">
          <div className="rounded-xl bg-[#161622] hover:bg-[#1E1E2E] border border-white/10 p-4 transition cursor-pointer">
            <div className="font-black text-sm text-white">👥 User & Points Management</div>
            <p className="text-xs text-gray-400 mt-1">
              Search players, view point balances, manual point allocation, and status suspensions.
            </p>
          </div>
        </Link>

        <Link href="/reports" className="block">
          <div className="rounded-xl bg-[#161622] hover:bg-[#1E1E2E] border border-white/10 p-4 transition cursor-pointer">
            <div className="font-black text-sm text-white">📈 Daily Settlement Reports</div>
            <p className="text-xs text-gray-400 mt-1">
              Sale points, win points, end points, commission points, and NTP points summaries.
            </p>
          </div>
        </Link>

        <Link href="/audit" className="block">
          <div className="rounded-xl bg-[#161622] hover:bg-[#1E1E2E] border border-white/10 p-4 transition cursor-pointer">
            <div className="font-black text-sm text-white">🔒 Security & Audit Trail</div>
            <p className="text-xs text-gray-400 mt-1">
              Immutable logging of all admin actions, point adjustments, and system events.
            </p>
          </div>
        </Link>
      </div>
    </div>
  );
}
