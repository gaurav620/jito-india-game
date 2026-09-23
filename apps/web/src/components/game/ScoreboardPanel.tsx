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
        left: '-7.3px',
        top: '607.7px',
        width: '337.3px',
        height: '162px',
        userSelect: 'none',
        zIndex: 6,
      }}
    >
      {/* Recent Draw Results Scoreboard Box */}
      <div
        id="scoreboard-box"
        style={{
          position: 'relative',
          width: '337px',
          height: '102px',
          backgroundImage: "url('/assets/tc/scoreboard.webp')",
          backgroundSize: '100% 100%',
          backgroundRepeat: 'no-repeat',
        }}
      >
        {/* Row Labels (Triple, Double, Single) on Left */}
        <div
          id="scoreboard-row-labels"
          style={{
            position: 'absolute',
            left: '18px',
            top: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
          }}
        >
          <span
            style={{
              fontFamily: "'HERMESC_20', 'Oswald', sans-serif",
              fontSize: '14px',
              fontWeight: 700,
              color: '#382006',
              lineHeight: '16px',
            }}
          >
            Triple
          </span>
          <span
            style={{
              fontFamily: "'HERMESC_20', 'Oswald', sans-serif",
              fontSize: '14px',
              fontWeight: 700,
              color: '#382006',
              lineHeight: '16px',
            }}
          >
            Double
          </span>
          <span
            style={{
              fontFamily: "'HERMESC_20', 'Oswald', sans-serif",
              fontSize: '14px',
              fontWeight: 700,
              color: '#382006',
              lineHeight: '16px',
            }}
          >
            Single
          </span>
        </div>

        {/* 6 History Columns */}
        <div
          id="scoreboard-columns"
          style={{
            position: 'absolute',
            left: '88px',
            top: '15px',
            display: 'flex',
            gap: '9.5px',
          }}
        >
          {displayHistory.map((row, idx) => {
            const isNewest = idx === 0;

            return (
              <div
                key={`sc-col-${row.gameId || idx}`}
                style={{
                  width: '30px',
                  height: '68.6px',
                  backgroundImage: isNewest ? "url('/assets/tc/SDT_Pannel_HighLight.webp')" : 'none',
                  backgroundSize: '100% 100%',
                  backgroundRepeat: 'no-repeat',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'space-around',
                  paddingTop: '1px',
                  paddingBottom: '1px',
                }}
              >
                <span
                  style={{
                    fontFamily: "'HERMESC_20', 'Oswald', sans-serif",
                    fontSize: '15px',
                    fontWeight: 700,
                    color: '#000000',
                    lineHeight: '1',
                  }}
                >
                  {row.triple}
                </span>
                <span
                  style={{
                    fontFamily: "'HERMESC_20', 'Oswald', sans-serif",
                    fontSize: '16px',
                    fontWeight: 700,
                    color: '#000000',
                    lineHeight: '1',
                  }}
                >
                  {row.double}
                </span>
                <span
                  style={{
                    fontFamily: "'HERMESC_20', 'Oswald', sans-serif",
                    fontSize: '17px',
                    fontWeight: 700,
                    color: '#000000',
                    lineHeight: '1',
                  }}
                >
                  {row.single}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Play / Win Totals Bar */}
      <div
        id="play-win-box"
        style={{
          position: 'relative',
          top: '0px',
          width: '337.3px',
          height: '60px',
          backgroundImage: "url('/assets/tc/playwin.webp')",
          backgroundSize: '100% 100%',
          backgroundRepeat: 'no-repeat',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingLeft: '20px',
          paddingRight: '36px',
        }}
      >
        {/* Play Points Section */}
        <div
          id="play-section"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <span
            style={{
              fontFamily: "'HERMESC_20', 'Oswald', sans-serif",
              fontSize: '17px',
              fontWeight: 700,
              color: '#000000',
              letterSpacing: '0.5px',
            }}
          >
            PLAY :
          </span>
          <span
            id="play-stake-value"
            style={{
              fontFamily: "'HERMESC_20', 'Oswald', sans-serif",
              fontSize: '19px',
              fontWeight: 700,
              color: '#000000',
            }}
          >
            {playStake}
          </span>
        </div>

        {/* Win Points Section */}
        <div
          id="win-section"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <span
            style={{
              fontFamily: "'HERMESC_20', 'Oswald', sans-serif",
              fontSize: '17px',
              fontWeight: 700,
              color: '#22c55e',
              letterSpacing: '0.5px',
            }}
          >
            WIN :
          </span>
          <span
            id="win-amount-value"
            style={{
              fontFamily: "'HERMESC_20', 'Oswald', sans-serif",
              fontSize: '19px',
              fontWeight: 700,
              color: '#22c55e',
            }}
          >
            {winAmount}
          </span>
        </div>
      </div>
    </div>
  );
};
