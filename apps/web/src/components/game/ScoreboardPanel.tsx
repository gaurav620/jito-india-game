'use client';

import React from 'react';

import type { HistoryRow } from '@/services/game/types';

export interface ScoreboardPanelProps {
  recentHistory: HistoryRow[];
  playStake: number;
  winAmount: number;
}

export const ScoreboardPanel: React.FC<ScoreboardPanelProps> = ({
  recentHistory,
  playStake,
  winAmount,
}) => {
  const displayHistory = recentHistory.slice(0, 6);

  return (
    <div
      id="scoreboard-left-panel"
      style={{
        position: 'absolute',
        left: '0px',
        bottom: '0px',
        width: '337px',
        height: '165px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        userSelect: 'none',
        zIndex: 5,
      }}
    >
      {/* Recent Draw Results Scoreboard */}
      <div
        id="scoreboard-box"
        style={{
          width: '337px',
          height: '102px',
          backgroundImage: "url('/assets/tc/scoreboard.webp')",
          backgroundSize: '100% 100%',
          backgroundRepeat: 'no-repeat',
          position: 'relative',
          padding: '24px 10px 10px 60px',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        {/* Row Labels (Triple, Double, Single) on Left */}
        <div
          id="scoreboard-row-labels"
          style={{
            position: 'absolute',
            left: '12px',
            top: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '5px',
          }}
        >
          <span
            style={{
              fontFamily: "'HERMESC_20', sans-serif",
              fontSize: '12px',
              fontWeight: 'bold',
              color: '#382006',
              lineHeight: '16px',
            }}
          >
            Triple
          </span>
          <span
            style={{
              fontFamily: "'HERMESC_20', sans-serif",
              fontSize: '12px',
              fontWeight: 'bold',
              color: '#382006',
              lineHeight: '16px',
            }}
          >
            Double
          </span>
          <span
            style={{
              fontFamily: "'HERMESC_20', sans-serif",
              fontSize: '12px',
              fontWeight: 'bold',
              color: '#382006',
              lineHeight: '16px',
            }}
          >
            Single
          </span>
        </div>

        {/* Draw History 6-Column Strip */}
        <div
          id="scoreboard-history-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(6, 1fr)',
            gap: '3px',
            width: '100%',
            textAlign: 'center',
          }}
        >
          {displayHistory.map((row, idx) => {
            const isNewest = idx === 0;

            return (
              <div
                key={`sc-${row.gameId || idx}`}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px',
                  backgroundColor: isNewest ? 'rgba(255, 255, 255, 0.85)' : 'transparent',
                  borderRadius: '3px',
                  padding: '1px 2px',
                  border: isNewest ? '1px solid #78350f' : 'none',
                }}
              >
                {/* Triple Result */}
                <span
                  style={{
                    fontFamily: "'HERMESC_20', 'Century Gothic', sans-serif",
                    fontSize: '13px',
                    fontWeight: '900',
                    color: '#000000',
                    lineHeight: '16px',
                  }}
                >
                  {row.triple}
                </span>

                {/* Double Result */}
                <span
                  style={{
                    fontFamily: "'HERMESC_20', 'Century Gothic', sans-serif",
                    fontSize: '13px',
                    fontWeight: '900',
                    color: '#000000',
                    lineHeight: '16px',
                  }}
                >
                  {row.double}
                </span>

                {/* Single Result */}
                <span
                  style={{
                    fontFamily: "'HERMESC_20', 'Century Gothic', sans-serif",
                    fontSize: '13px',
                    fontWeight: '900',
                    color: '#000000',
                    lineHeight: '16px',
                  }}
                >
                  {row.single}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Play / Win Points Panel */}
      <div
        id="play-win-box"
        style={{
          width: '337px',
          height: '60px',
          backgroundImage: "url('/assets/tc/playwin.webp')",
          backgroundSize: '100% 100%',
          backgroundRepeat: 'no-repeat',
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 25px',
        }}
      >
        {/* Play Points Value */}
        <div
          id="play-stake-section"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <span
            style={{
              fontFamily: "'HERMESC_20', sans-serif",
              fontSize: '15px',
              fontWeight: 'bold',
              color: '#000000',
              letterSpacing: '0.5px',
            }}
          >
            PLAY :
          </span>
          <span
            id="play-stake-value"
            style={{
              fontFamily: "'HERMESC_20', 'GOTHAMCONDENSED-MEDIUM', sans-serif",
              fontSize: '18px',
              fontWeight: '900',
              color: '#000000',
              minWidth: '40px',
              textAlign: 'right',
            }}
          >
            {playStake}
          </span>
        </div>

        {/* Win Points Value */}
        <div
          id="win-amount-section"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <span
            style={{
              fontFamily: "'HERMESC_20', sans-serif",
              fontSize: '15px',
              fontWeight: 'bold',
              color: '#22c55e',
              textShadow: '0 0 4px rgba(34, 197, 94, 0.6)',
              letterSpacing: '0.5px',
            }}
          >
            WIN :
          </span>
          <span
            id="win-amount-value"
            style={{
              fontFamily: "'HERMESC_20', 'GOTHAMCONDENSED-MEDIUM', sans-serif",
              fontSize: '18px',
              fontWeight: '900',
              color: '#22c55e',
              textShadow: '0 0 6px rgba(34, 197, 94, 0.8)',
              minWidth: '40px',
              textAlign: 'right',
            }}
          >
            {winAmount > 0 ? winAmount : ''}
          </span>
        </div>
      </div>
    </div>
  );
};
