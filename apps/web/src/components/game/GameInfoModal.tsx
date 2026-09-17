'use client';

import React, { useState, useEffect } from 'react';

import type { HistoryRow } from '@/services/game/types';

export interface GameInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  recentHistory: HistoryRow[];
}

type InfoTab = 'rules' | 'payslip' | 'history' | 'result' | 'report';

export const GameInfoModal: React.FC<GameInfoModalProps> = ({
  isOpen,
  onClose,
  recentHistory,
}) => {
  const [activeTab, setActiveTab] = useState<InfoTab>('rules');

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      id="game-info-overlay"
      role="dialog"
      aria-modal="true"
      style={{
        position: 'absolute',
        inset: 0,
        width: '1360px',
        height: '768px',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        zIndex: 80,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* 920×500 px Modal Frame Container */}
      <div
        id="game-info-frame"
        style={{
          position: 'relative',
          width: '920px',
          height: '500px',
          backgroundColor: '#12121c',
          border: '2px solid #eab308',
          borderRadius: '12px',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.95), 0 0 20px rgba(234, 179, 8, 0.3)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Bar with Tabs & Close */}
        <div
          id="info-header-bar"
          style={{
            height: '52px',
            backgroundColor: '#0a0a10',
            borderBottom: '1px solid rgba(234, 179, 8, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 16px',
          }}
        >
          {/* Navigation Tabs */}
          <div style={{ display: 'flex', gap: '8px' }}>
            {[
              { id: 'rules', label: 'RULES', icon: '/assets/tc/Rules_Btn0001.webp' },
              { id: 'payslip', label: 'PAY SLIP', icon: '/assets/tc/PaySlip_Btn0001.webp' },
              { id: 'history', label: 'GAME HISTORY', icon: '/assets/tc/History_Btn0001.webp' },
              { id: 'result', label: 'DRAW RESULT', icon: '/assets/tc/Result_Btn0001.webp' },
              { id: 'report', label: 'DAILY REPORT', icon: '/assets/tc/Report_Btn0001.webp' },
            ].map((tab) => {
              const isSelected = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as InfoTab)}
                  style={{
                    height: '36px',
                    padding: '0 16px',
                    borderRadius: '6px',
                    border: isSelected ? '1px solid #eab308' : '1px solid rgba(255, 255, 255, 0.1)',
                    backgroundColor: isSelected ? '#332200' : 'rgba(255, 255, 255, 0.04)',
                    color: isSelected ? '#FFE57F' : '#d0d2db',
                    fontFamily: "'GOTHAMCONDENSED-MEDIUM', sans-serif",
                    fontSize: '15px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    outline: 'none',
                    letterSpacing: '0.5px',
                  }}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Close Button */}
          <button
            type="button"
            id="btn-info-close"
            onClick={onClose}
            style={{
              width: '36px',
              height: '36px',
              border: 'none',
              backgroundColor: 'transparent',
              backgroundImage: "url('/assets/tc/Close_btn0001.webp')",
              backgroundSize: 'contain',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
              cursor: 'pointer',
              outline: 'none',
            }}
            title="Close Info"
          />
        </div>

        {/* Tab Content Area */}
        <div
          id="info-tab-content"
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '16px 20px',
            color: '#d0d2db',
          }}
        >
          {/* 1. RULES TAB */}
          {activeTab === 'rules' && (
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <img
                src="/assets/tc/RulesNew_2.webp"
                alt="Triple Chance Game Rules"
                style={{
                  maxWidth: '820px',
                  height: 'auto',
                  borderRadius: '6px',
                  boxShadow: '0 4px 15px rgba(0, 0, 0, 0.6)',
                }}
              />
            </div>
          )}

          {/* 2. PAY SLIP TAB */}
          {activeTab === 'payslip' && (
            <div style={{ textAlign: 'center', paddingTop: '40px' }}>
              <h3
                style={{
                  fontFamily: "'GOTHAMCONDENSED-MEDIUM', sans-serif",
                  fontSize: '24px',
                  color: '#FFE57F',
                  letterSpacing: '1px',
                }}
              >
                PAY SLIP BREAKDOWN
              </h3>
              <p style={{ marginTop: '10px', fontSize: '14px', color: '#9ca3af' }}>
                Single Stake Multiplier: 9x • Double Stake Multiplier: 90x • Triple Stake Multiplier: 900x
              </p>
              <div
                style={{
                  marginTop: '20px',
                  display: 'inline-block',
                  textAlign: 'left',
                  backgroundColor: 'rgba(255, 255, 255, 0.03)',
                  padding: '20px',
                  borderRadius: '8px',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                }}
              >
                <div>• Minimum Single Bet: 2 pts • Maximum Stake: 5,000 pts</div>
                <div style={{ marginTop: '8px' }}>• Minimum Double Bet: 2 pts • Maximum Stake: 2,000 pts</div>
                <div style={{ marginTop: '8px' }}>• Minimum Triple Bet: 2 pts • Maximum Stake: 1,000 pts</div>
              </div>
            </div>
          )}

          {/* 3. GAME HISTORY TAB */}
          {activeTab === 'history' && (
            <div>
              <table
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  textAlign: 'left',
                  fontSize: '14px',
                }}
              >
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(234, 179, 8, 0.4)', color: '#FFE57F' }}>
                    <th style={{ padding: '10px' }}>S.NO</th>
                    <th style={{ padding: '10px' }}>GAME ID</th>
                    <th style={{ padding: '10px' }}>DRAW TIME</th>
                    <th style={{ padding: '10px' }}>TRIPLE</th>
                    <th style={{ padding: '10px' }}>DOUBLE</th>
                    <th style={{ padding: '10px' }}>SINGLE</th>
                    <th style={{ padding: '10px' }}>PLAYED</th>
                    <th style={{ padding: '10px' }}>WON</th>
                  </tr>
                </thead>
                <tbody>
                  {recentHistory.map((row, i) => (
                    <tr
                      key={row.gameId || i}
                      style={{
                        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                        backgroundColor: i % 2 === 0 ? 'rgba(255, 255, 255, 0.02)' : 'transparent',
                      }}
                    >
                      <td style={{ padding: '10px' }}>{row.sno}</td>
                      <td style={{ padding: '10px', color: '#FFE57F', fontWeight: 'bold' }}>{row.gameId}</td>
                      <td style={{ padding: '10px' }}>{row.drawTime}</td>
                      <td style={{ padding: '10px', color: '#facc15', fontWeight: 'bold' }}>{row.triple}</td>
                      <td style={{ padding: '10px', color: '#4ade80', fontWeight: 'bold' }}>{row.double}</td>
                      <td style={{ padding: '10px', color: '#f472b6', fontWeight: 'bold' }}>{row.single}</td>
                      <td style={{ padding: '10px' }}>{row.played ?? 0}</td>
                      <td style={{ padding: '10px', color: (row.won ?? 0) > 0 ? '#4ade80' : '#d0d2db' }}>
                        {row.won ?? 0}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* 4. DRAW RESULT TAB */}
          {activeTab === 'result' && (
            <div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  marginBottom: '16px',
                }}
              >
                <span style={{ color: '#FFE57F', fontWeight: 'bold' }}>DATE:</span>
                <span style={{ color: '#d0d2db' }}>Today (Live Sync)</span>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(234, 179, 8, 0.4)', color: '#FFE57F' }}>
                    <th style={{ padding: '8px' }}>DRAW TIME</th>
                    <th style={{ padding: '8px' }}>ROUND</th>
                    <th style={{ padding: '8px' }}>RESULT NUMBER</th>
                  </tr>
                </thead>
                <tbody>
                  {recentHistory.map((row, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                      <td style={{ padding: '8px' }}>{row.drawTime}</td>
                      <td style={{ padding: '8px', color: '#FFE57F' }}>{row.gameId}</td>
                      <td style={{ padding: '8px', fontWeight: 'bold', color: '#facc15' }}>{row.triple}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* 5. DAILY REPORT TAB */}
          {activeTab === 'report' && (
            <div style={{ textAlign: 'center', paddingTop: '40px' }}>
              <h3 style={{ fontFamily: "'GOTHAMCONDENSED-MEDIUM', sans-serif", fontSize: '22px', color: '#FFE57F' }}>
                DAILY AMUSEMENT ACCOUNT REPORT
              </h3>
              <p style={{ marginTop: '10px', fontSize: '14px', color: '#9ca3af' }}>
                Total Sale Points: 420 • Win Points: 360 • NTP: +60 • Commission: 14.00
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
