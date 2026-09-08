'use client';

import { Table, Button, Input, Modal } from '@jito/ui';
import React, { useState } from 'react';

interface UserRecord {
  id: string;
  username: string;
  phone: string;
  pointsBalance: number;
  totalPlayed: number;
  totalWon: number;
  status: 'active' | 'suspended';
  createdAt: string;
}

const INITIAL_USERS: UserRecord[] = [
  {
    id: 'USR-101',
    username: 'PINTU',
    phone: '+91 98765 43210',
    pointsBalance: 64707.0,
    totalPlayed: 142800,
    totalWon: 138500,
    status: 'active',
    createdAt: '2026-08-12',
  },
  {
    id: 'USR-102',
    username: 'RAJESH_K',
    phone: '+91 98111 22334',
    pointsBalance: 12500.0,
    totalPlayed: 85000,
    totalWon: 74200,
    status: 'active',
    createdAt: '2026-08-15',
  },
  {
    id: 'USR-103',
    username: 'VIP_AMIT',
    phone: '+91 98999 88776',
    pointsBalance: 184200.0,
    totalPlayed: 450000,
    totalWon: 489000,
    status: 'active',
    createdAt: '2026-08-20',
  },
  {
    id: 'USR-104',
    username: 'SUNIL_77',
    phone: '+91 97654 32109',
    pointsBalance: 0.0,
    totalPlayed: 3200,
    totalWon: 0,
    status: 'suspended',
    createdAt: '2026-09-01',
  },
];

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserRecord[]>(INITIAL_USERS);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserRecord | null>(null);
  const [adjustAmount, setAdjustAmount] = useState('');
  const [adjustType, setAdjustType] = useState<'add' | 'deduct'>('add');

  const filteredUsers = users.filter(
    (u) =>
      u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleApplyAdjustment = () => {
    if (!selectedUser || !adjustAmount) return;
    const val = parseFloat(adjustAmount);
    if (isNaN(val) || val <= 0) return;

    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === selectedUser.id) {
          const delta = adjustType === 'add' ? val : -val;
          return {
            ...u,
            pointsBalance: Math.max(0, u.pointsBalance + delta),
          };
        }
        return u;
      })
    );

    setSelectedUser(null);
    setAdjustAmount('');
  };

  const handleToggleStatus = (id: string) => {
    setUsers((prev) =>
      prev.map((u) =>
        u.id === id
          ? { ...u, status: u.status === 'active' ? 'suspended' : 'active' }
          : u
      )
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white uppercase tracking-tight">
            USER & POINTS MANAGEMENT
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">
            Manage player accounts, point balances, and access permissions.
          </p>
        </div>

        <div className="w-full sm:w-72">
          <Input
            placeholder="Search by username or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="rounded-xl border border-white/10 bg-[#12121A] overflow-hidden shadow-xl">
        <Table
          columns={[
            { header: 'User ID', accessor: 'id' },
            { header: 'Username', accessor: 'username' },
            { header: 'Phone', accessor: 'phone' },
            {
              header: 'Points Balance',
              accessor: (r) => (
                <span className="font-mono font-black text-emerald-400">
                  {r.pointsBalance.toLocaleString('en-IN', {
                    minimumFractionDigits: 2,
                  })}
                </span>
              ),
            },
            {
              header: 'Status',
              accessor: (r) => (
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                    r.status === 'active'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'bg-red-500/20 text-red-300 border border-red-500/40'
                  }`}
                >
                  {r.status}
                </span>
              ),
            },
            {
              header: 'Actions',
              accessor: (r) => (
                <div className="flex items-center justify-center gap-2">
                  <button
                    onClick={() => setSelectedUser(r)}
                    className="px-2.5 py-1 rounded bg-[#2A2A3C] hover:bg-[#3A3A50] text-[#FFD700] text-xs font-bold border border-[#DAA520]/40 transition"
                  >
                    Adjust Points
                  </button>
                  <button
                    onClick={() => handleToggleStatus(r.id)}
                    className="px-2.5 py-1 rounded bg-black/40 hover:bg-black/60 text-gray-300 text-xs font-bold border border-white/10 transition"
                  >
                    {r.status === 'active' ? 'Suspend' : 'Activate'}
                  </button>
                </div>
              ),
            },
          ]}
          data={filteredUsers}
          keyExtractor={(u) => u.id}
        />
      </div>

      {/* Adjust Points Modal */}
      <Modal
        isOpen={Boolean(selectedUser)}
        onClose={() => setSelectedUser(null)}
      >
        <div className="space-y-4">
          <div className="text-center border-b border-[#D4AF37]/30 pb-3">
            <h3 className="font-black text-lg text-[#332200] uppercase">
              ADJUST POINTS BALANCE
            </h3>
            <p className="text-xs font-bold text-gray-600">
              Player: <strong>{selectedUser?.username}</strong> ({selectedUser?.id})
            </p>
          </div>

          <div className="flex items-center justify-center gap-4">
            <button
              type="button"
              onClick={() => setAdjustType('add')}
              className={`px-4 py-1.5 rounded-lg font-bold text-xs uppercase border-2 transition ${
                adjustType === 'add'
                  ? 'bg-emerald-700 text-white border-[#FFE57F] shadow'
                  : 'bg-gray-200 text-gray-800 border-gray-300'
              }`}
            >
              + Credit Points
            </button>
            <button
              type="button"
              onClick={() => setAdjustType('deduct')}
              className={`px-4 py-1.5 rounded-lg font-bold text-xs uppercase border-2 transition ${
                adjustType === 'deduct'
                  ? 'bg-red-700 text-white border-[#FFE57F] shadow'
                  : 'bg-gray-200 text-gray-800 border-gray-300'
              }`}
            >
              – Debit Points
            </button>
          </div>

          <Input
            label="Points Amount"
            type="number"
            value={adjustAmount}
            onChange={(e) => setAdjustAmount(e.target.value)}
            placeholder="e.g. 5000"
            min="1"
          />

          <div className="pt-2 flex items-center justify-end gap-3">
            <Button variant="secondary" size="sm" onClick={() => setSelectedUser(null)}>
              Cancel
            </Button>
            <Button variant="gold" size="sm" onClick={handleApplyAdjustment}>
              Confirm Adjustment
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
