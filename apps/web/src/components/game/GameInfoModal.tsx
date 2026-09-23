'use client';

import React, { useState, useEffect, useCallback } from 'react';

import { fetchDailyReport } from '@/services/game/gameService';
import type { HistoryRow, ReportRow } from '@/services/game/types';

export interface GameInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  recentHistory: HistoryRow[];
  /** Called when a tab button inside the modal is clicked (for audio) */
  onTabClick?: () => void;
}

type ModalTab = 'history' | 'report';

/** Formats ISO string (YYYY-MM-DD) into slash format (DD/M/YYYY or D/M/YYYY) */
function formatSlashDate(iso: string): string {
  const parts = iso.split('-');
  if (parts.length === 3) {
    const day = parseInt(parts[2], 10);
    const month = parseInt(parts[1], 10);
    const year = parts[0];
    return `${day}/${month}/${year}`;
  }
  return iso;
}

/** Formats ISO string (YYYY-MM-DD) into display format (DD-MM-YYYY) */
function formatDashDate(dateStr: string): string {
  if (/^\d{2}-\d{2}-\d{4}$/.test(dateStr)) return dateStr;
  const parts = dateStr.split('-');
  if (parts.length === 3 && parts[0].length === 4) {
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }
  return dateStr;
}

/** Formats numeric points to 2 decimal places */
function formatPoints(val?: number): string {
  return (val ?? 0).toFixed(2);
}

export const GameInfoModal: React.FC<GameInfoModalProps> = ({
  isOpen,
  onClose,
  recentHistory,
  onTabClick,
}) => {
  const [activeTab, setActiveTab] = useState<ModalTab>('history');

  // Default to today's date in local time (e.g. 2026-09-20)
  const todayIso = new Date().toISOString().split('T')[0];
  const [fromDate, setFromDate] = useState<string>(todayIso);
  const [toDate, setToDate] = useState<string>(todayIso);
  const [reportRows, setReportRows] = useState<ReportRow[]>([]);
  const [isCloseHovered, setIsCloseHovered] = useState(false);

  const loadReport = useCallback(() => {
    fetchDailyReport(fromDate, toDate).then((rows) => {
      setReportRows(rows);
    });
  }, [fromDate, toDate]);

  useEffect(() => {
    if (isOpen && activeTab === 'report') {
      loadReport();
    }
  }, [isOpen, activeTab, loadReport]);

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
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        zIndex: 80,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* 1013×543 px Ornate Golden Box Frame Container */}
      <div
        id="game-info-container"
        style={{
          position: 'relative',
          width: '1013px',
          height: '543px',
          backgroundImage: "url('/assets/tc/box-1.webp')",
          backgroundSize: '100% 100%',
          backgroundRepeat: 'no-repeat',
          userSelect: 'none',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top-Right Close Button (44×44 px) */}
        <button
          type="button"
          id="btn-info-close"
          onClick={onClose}
          onMouseEnter={() => setIsCloseHovered(true)}
          onMouseLeave={() => setIsCloseHovered(false)}
          style={{
            position: 'absolute',
            left: '937px',
            top: '44px',
            width: '44px',
            height: '44px',
            border: 'none',
            backgroundColor: 'transparent',
            backgroundImage: isCloseHovered
              ? "url('/assets/tc/Close_btn0002.webp')"
              : "url('/assets/tc/Close_btn0001.webp')",
            backgroundSize: 'contain',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            cursor: 'pointer',
            outline: 'none',
            zIndex: 10,
          }}
          title="Close"
        />

        {/* Top Tabs Switcher (GAME HISTORY & REPORT) */}
        <div
          id="info-name-panel"
          style={{
            position: 'absolute',
            left: '56.5px',
            top: '76px',
            width: '900px',
            height: '70px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '0px',
            zIndex: 5,
          }}
        >
          {/* Tab 1: GAME HISTORY */}
          <button
            type="button"
            id="tab-btn-history"
            onClick={() => { onTabClick?.(); setActiveTab('history'); }}
            style={{
              width: '225px',
              height: '75px',
              border: 'none',
              backgroundColor: 'transparent',
              backgroundImage:
                activeTab === 'history'
                  ? "url('/assets/tc/EnableGH.webp')"
                  : "url('/assets/tc/disGH.webp')",
              backgroundSize: '100% 100%',
              backgroundRepeat: 'no-repeat',
              cursor: 'pointer',
              fontFamily: "'HERMESC_20', 'Century Gothic', sans-serif",
              fontSize: '18px',
              fontWeight: 'normal',
              color: '#024a01',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              paddingBottom: '14px',
              outline: 'none',
              letterSpacing: '0.5px',
            }}
          >
            GAME HISTORY
          </button>

          {/* Tab 2: REPORT */}
          <button
            type="button"
            id="tab-btn-report"
            onClick={() => { onTabClick?.(); setActiveTab('report'); }}
            style={{
              width: '225px',
              height: '75px',
              border: 'none',
              backgroundColor: 'transparent',
              backgroundImage:
                activeTab === 'report'
                  ? "url('/assets/tc/EnableGH.webp')"
                  : "url('/assets/tc/disGH.webp')",
              backgroundSize: '100% 100%',
              backgroundRepeat: 'no-repeat',
              cursor: 'pointer',
              fontFamily: "'HERMESC_20', 'Century Gothic', sans-serif",
              fontSize: '18px',
              fontWeight: 'normal',
              color: '#024a01',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              paddingBottom: '14px',
              outline: 'none',
              letterSpacing: '0.5px',
            }}
          >
            REPORT
          </button>
        </div>

        {/* Inner Table Rounded Tan Background (910×311.5 px) */}
        <div
          id="info-inner-bg"
          style={{
            position: 'absolute',
            left: '51.5px',
            top: '146.5px',
            width: '910px',
            height: '311.5px',
            backgroundImage: "url('/assets/tc/box-2.webp')",
            backgroundSize: '100% 100%',
            backgroundRepeat: 'no-repeat',
            pointerEvents: 'none',
            zIndex: 2,
          }}
        />

        {/* Tab 1: GAME HISTORY Table Panel */}
        {activeTab === 'history' && (
          <div
            id="history-panel"
            style={{
              position: 'absolute',
              left: '56.5px',
              top: '151.5px',
              width: '900px',
              height: '300px',
              zIndex: 3,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Header Columns */}
            <div
              id="history-table-header"
              style={{
                height: '38px',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <span
                style={{
                  width: '180px',
                  textAlign: 'center',
                  fontFamily: "'HERMESC_20', 'Century Gothic', sans-serif",
                  fontSize: '18px',
                  fontWeight: 'normal',
                  color: '#000000',
                }}
              >
                S NO
              </span>
              <span
                style={{
                  width: '240px',
                  textAlign: 'center',
                  fontFamily: "'HERMESC_20', 'Century Gothic', sans-serif",
                  fontSize: '18px',
                  fontWeight: 'normal',
                  color: '#000000',
                }}
              >
                Game ID
              </span>
              <span
                style={{
                  width: '240px',
                  textAlign: 'center',
                  fontFamily: "'HERMESC_20', 'Century Gothic', sans-serif",
                  fontSize: '18px',
                  fontWeight: 'normal',
                  color: '#000000',
                }}
              >
                Played
              </span>
              <span
                style={{
                  width: '240px',
                  textAlign: 'center',
                  fontFamily: "'HERMESC_20', 'Century Gothic', sans-serif",
                  fontSize: '18px',
                  fontWeight: 'normal',
                  color: '#000000',
                }}
              >
                Won
              </span>
            </div>

            {/* Scrollable Rows Viewport */}
            <div
              id="history-table-body"
              style={{
                flex: 1,
                overflowY: 'auto',
                paddingTop: '2px',
              }}
            >
              {recentHistory && recentHistory.length > 0
                ? recentHistory.map((row, idx) => (
                    <div
                      key={row.gameId || idx}
                      style={{
                        height: '36px',
                        display: 'flex',
                        alignItems: 'center',
                        backgroundColor: '#ffffff',
                        borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
                      }}
                    >
                      <span
                        style={{
                          width: '180px',
                          textAlign: 'center',
                          fontFamily: "'HERMESC_20', 'Century Gothic', sans-serif",
                          fontSize: '16px',
                          fontWeight: 'normal',
                          color: '#000000',
                        }}
                      >
                        {row.sno}
                      </span>
                      <span
                        style={{
                          width: '240px',
                          textAlign: 'center',
                          fontFamily: "'HERMESC_20', 'Century Gothic', sans-serif",
                          fontSize: '16px',
                          fontWeight: 'normal',
                          color: '#000000',
                        }}
                      >
                        {row.gameId}
                      </span>
                      <span
                        style={{
                          width: '240px',
                          textAlign: 'center',
                          fontFamily: "'HERMESC_20', 'Century Gothic', sans-serif",
                          fontSize: '16px',
                          fontWeight: 'normal',
                          color: '#000000',
                        }}
                      >
                        {row.played ?? 0}
                      </span>
                      <span
                        style={{
                          width: '240px',
                          textAlign: 'center',
                          fontFamily: "'HERMESC_20', 'Century Gothic', sans-serif",
                          fontSize: '16px',
                          fontWeight: 'normal',
                          color: '#000000',
                        }}
                      >
                        {row.won ?? 0}
                      </span>
                    </div>
                  ))
                : null}
            </div>
          </div>
        )}

        {/* Tab 2: REPORT Table Panel */}
        {activeTab === 'report' && (
          <>
            <div
              id="report-panel"
              style={{
                position: 'absolute',
                left: '56.5px',
                top: '151.5px',
                width: '900px',
                height: '300px',
                zIndex: 3,
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {/* Header Columns */}
              <div
                id="report-table-header"
                style={{
                  height: '38px',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <span
                  style={{
                    width: '150px',
                    textAlign: 'center',
                    fontFamily: "'HERMESC_20', 'Century Gothic', sans-serif",
                    fontSize: '17px',
                    fontWeight: 'normal',
                    color: '#000000',
                  }}
                >
                  DATE
                </span>
                <span
                  style={{
                    width: '150px',
                    textAlign: 'center',
                    fontFamily: "'HERMESC_20', 'Century Gothic', sans-serif",
                    fontSize: '17px',
                    fontWeight: 'normal',
                    color: '#000000',
                  }}
                >
                  SALE POINT
                </span>
                <span
                  style={{
                    width: '150px',
                    textAlign: 'center',
                    fontFamily: "'HERMESC_20', 'Century Gothic', sans-serif",
                    fontSize: '17px',
                    fontWeight: 'normal',
                    color: '#000000',
                  }}
                >
                  WIN POINT
                </span>
                <span
                  style={{
                    width: '130px',
                    textAlign: 'center',
                    fontFamily: "'HERMESC_20', 'Century Gothic', sans-serif",
                    fontSize: '17px',
                    fontWeight: 'normal',
                    color: '#000000',
                  }}
                >
                  END
                </span>
                <span
                  style={{
                    width: '160px',
                    textAlign: 'center',
                    fontFamily: "'HERMESC_20', 'Century Gothic', sans-serif",
                    fontSize: '17px',
                    fontWeight: 'normal',
                    color: '#000000',
                  }}
                >
                  COMMI POINT
                </span>
                <span
                  style={{
                    width: '160px',
                    textAlign: 'center',
                    fontFamily: "'HERMESC_20', 'Century Gothic', sans-serif",
                    fontSize: '17px',
                    fontWeight: 'normal',
                    color: '#000000',
                  }}
                >
                  NTP POINT
                </span>
              </div>

              {/* Scrollable Rows Viewport */}
              <div
                id="report-table-body"
                style={{
                  flex: 1,
                  overflowY: 'auto',
                  paddingTop: '2px',
                }}
              >
                {reportRows && reportRows.length > 0 ? (
                  reportRows.map((row, idx) => (
                    <div
                      key={row.date || idx}
                      style={{
                        height: '36px',
                        display: 'flex',
                        alignItems: 'center',
                        backgroundColor: '#ffffff',
                        borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
                      }}
                    >
                      <span
                        style={{
                          width: '150px',
                          textAlign: 'center',
                          fontFamily: "'HERMESC_20', 'Century Gothic', sans-serif",
                          fontSize: '16px',
                          fontWeight: 'normal',
                          color: '#000000',
                        }}
                      >
                        {formatDashDate(row.date)}
                      </span>
                      <span
                        style={{
                          width: '150px',
                          textAlign: 'center',
                          fontFamily: "'HERMESC_20', 'Century Gothic', sans-serif",
                          fontSize: '16px',
                          fontWeight: 'normal',
                          color: '#000000',
                        }}
                      >
                        {formatPoints(row.sale)}
                      </span>
                      <span
                        style={{
                          width: '150px',
                          textAlign: 'center',
                          fontFamily: "'HERMESC_20', 'Century Gothic', sans-serif",
                          fontSize: '16px',
                          fontWeight: 'normal',
                          color: '#000000',
                        }}
                      >
                        {formatPoints(row.win)}
                      </span>
                      <span
                        style={{
                          width: '130px',
                          textAlign: 'center',
                          fontFamily: "'HERMESC_20', 'Century Gothic', sans-serif",
                          fontSize: '16px',
                          fontWeight: 'normal',
                          color: '#000000',
                        }}
                      >
                        {formatPoints(row.end)}
                      </span>
                      <span
                        style={{
                          width: '160px',
                          textAlign: 'center',
                          fontFamily: "'HERMESC_20', 'Century Gothic', sans-serif",
                          fontSize: '16px',
                          fontWeight: 'normal',
                          color: '#000000',
                        }}
                      >
                        {formatPoints(row.commission)}
                      </span>
                      <span
                        style={{
                          width: '160px',
                          textAlign: 'center',
                          fontFamily: "'HERMESC_20', 'Century Gothic', sans-serif",
                          fontSize: '16px',
                          fontWeight: 'normal',
                          color: '#000000',
                        }}
                      >
                        {formatPoints(row.ntp)}
                      </span>
                    </div>
                  ))
                ) : (
                  /* Fallback row matching Screenshot 2 when initially viewing */
                  <div
                    style={{
                      height: '36px',
                      display: 'flex',
                      alignItems: 'center',
                      backgroundColor: '#ffffff',
                      borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
                    }}
                  >
                    <span
                      style={{
                        width: '150px',
                        textAlign: 'center',
                        fontFamily: "'HERMESC_20', 'Century Gothic', sans-serif",
                        fontSize: '16px',
                        fontWeight: 'normal',
                        color: '#000000',
                      }}
                    >
                      {formatDashDate(fromDate)}
                    </span>
                    <span
                      style={{
                        width: '150px',
                        textAlign: 'center',
                        fontFamily: "'HERMESC_20', 'Century Gothic', sans-serif",
                        fontSize: '16px',
                        fontWeight: 'normal',
                        color: '#000000',
                      }}
                    >
                      0.00
                    </span>
                    <span
                      style={{
                        width: '150px',
                        textAlign: 'center',
                        fontFamily: "'HERMESC_20', 'Century Gothic', sans-serif",
                        fontSize: '16px',
                        fontWeight: 'normal',
                        color: '#000000',
                      }}
                    >
                      0.00
                    </span>
                    <span
                      style={{
                        width: '130px',
                        textAlign: 'center',
                        fontFamily: "'HERMESC_20', 'Century Gothic', sans-serif",
                        fontSize: '16px',
                        fontWeight: 'normal',
                        color: '#000000',
                      }}
                    >
                      0.00
                    </span>
                    <span
                      style={{
                        width: '160px',
                        textAlign: 'center',
                        fontFamily: "'HERMESC_20', 'Century Gothic', sans-serif",
                        fontSize: '16px',
                        fontWeight: 'normal',
                        color: '#000000',
                      }}
                    >
                      0.00
                    </span>
                    <span
                      style={{
                        width: '160px',
                        textAlign: 'center',
                        fontFamily: "'HERMESC_20', 'Century Gothic', sans-serif",
                        fontSize: '16px',
                        fontWeight: 'normal',
                        color: '#000000',
                      }}
                    >
                      0.00
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Date Range & VIEW Button Bar */}
            <div
              id="report-calendar-bar"
              style={{
                position: 'absolute',
                left: '60px',
                top: '468px',
                width: '895px',
                height: '40px',
                display: 'flex',
                alignItems: 'center',
                zIndex: 4,
              }}
            >
              {/* FROM Label */}
              <span
                style={{
                  fontFamily: "'HERMESC_20', 'Century Gothic', sans-serif",
                  fontSize: '22px',
                  fontWeight: 'bold',
                  color: '#000000',
                  marginRight: '40px',
                }}
              >
                FROM
              </span>

              {/* FROM Date Picker */}
              <div
                style={{
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  cursor: 'pointer',
                }}
              >
                <span
                  style={{
                    fontFamily: "'HERMESC_20', 'Century Gothic', sans-serif",
                    fontSize: '18px',
                    fontWeight: 'bold',
                    color: '#000000',
                    minWidth: '85px',
                  }}
                >
                  {formatSlashDate(fromDate)}
                </span>
                <img
                  src="/assets/tc/calendar-512.webp"
                  alt="Calendar"
                  style={{ width: '30px', height: '30px', pointerEvents: 'none' }}
                />
                <input
                  type="date"
                  value={fromDate}
                  max={todayIso}
                  onChange={(e) => setFromDate(e.target.value)}
                  style={{
                    position: 'absolute',
                    inset: 0,
                    opacity: 0,
                    cursor: 'pointer',
                    width: '100%',
                    height: '100%',
                  }}
                  title="Select FROM date"
                />
              </div>

              {/* TO Label */}
              <span
                style={{
                  fontFamily: "'HERMESC_20', 'Century Gothic', sans-serif",
                  fontSize: '22px',
                  fontWeight: 'bold',
                  color: '#000000',
                  marginLeft: '110px',
                  marginRight: '40px',
                }}
              >
                TO
              </span>

              {/* TO Date Picker */}
              <div
                style={{
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  cursor: 'pointer',
                }}
              >
                <span
                  style={{
                    fontFamily: "'HERMESC_20', 'Century Gothic', sans-serif",
                    fontSize: '18px',
                    fontWeight: 'bold',
                    color: '#000000',
                    minWidth: '85px',
                  }}
                >
                  {formatSlashDate(toDate)}
                </span>
                <img
                  src="/assets/tc/calendar-512.webp"
                  alt="Calendar"
                  style={{ width: '30px', height: '30px', pointerEvents: 'none' }}
                />
                <input
                  type="date"
                  value={toDate}
                  max={todayIso}
                  onChange={(e) => setToDate(e.target.value)}
                  style={{
                    position: 'absolute',
                    inset: 0,
                    opacity: 0,
                    cursor: 'pointer',
                    width: '100%',
                    height: '100%',
                  }}
                  title="Select TO date"
                />
              </div>

              {/* VIEW Button */}
              <button
                type="button"
                id="btn-report-view"
                onClick={loadReport}
                style={{
                  marginLeft: 'auto',
                  marginRight: '20px',
                  width: '120px',
                  height: '32px',
                  backgroundImage: "url('/assets/tc/btn-1.webp')",
                  backgroundSize: '100% 100%',
                  backgroundRepeat: 'no-repeat',
                  border: 'none',
                  backgroundColor: 'transparent',
                  cursor: 'pointer',
                  color: '#005700',
                  fontFamily: "'HERMESC_20', 'Century Gothic', sans-serif",
                  fontSize: '17px',
                  fontWeight: 'normal',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  letterSpacing: '0.5px',
                  outline: 'none',
                }}
              >
                VIEW
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
