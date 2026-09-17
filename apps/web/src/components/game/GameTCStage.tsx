'use client';

import { useRouter } from 'next/navigation';
import React, { useState, useEffect, useCallback } from 'react';

import { GameTCView } from './GameTCView';

import { ChangePasswordModal } from '@/components/lobby/ChangePasswordModal';
import type { GameCode } from '@/services/game/types';

export interface GameTCStageProps {
  code?: GameCode;
  initialUsername?: string;
  initialBalance?: number;
}

const DESIGN_WIDTH = 1360;
const DESIGN_HEIGHT = 768;

export const GameTCStage: React.FC<GameTCStageProps> = ({
  code = 'TCT',
  initialUsername = 'PINTU',
  initialBalance = 62933.0,
}) => {
  const router = useRouter();
  const [transform, setTransform] = useState('');
  const [balance, setBalance] = useState(initialBalance);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [keyHover, setKeyHover] = useState(false);
  const [minHover, setMinHover] = useState(false);
  const [closeHover, setCloseHover] = useState(false);
  const [tabCloseHover, setTabCloseHover] = useState(false);

  // Responsive scaling to 1360x768 letterbox
  useEffect(() => {
    const updateTransform = () => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const scale = Math.min(vw / DESIGN_WIDTH, vh / DESIGN_HEIGHT);
      const tx = (vw - DESIGN_WIDTH * scale) / 2;
      const ty = (vh - DESIGN_HEIGHT * scale) / 2;
      setTransform(`translate(${tx}px, ${ty}px) scale(${scale})`);
    };

    updateTransform();
    window.addEventListener('resize', updateTransform);
    return () => window.removeEventListener('resize', updateTransform);
  }, []);

  const handleReturnToLobby = useCallback(() => {
    router.push('/lobby');
  }, [router]);

  return (
    <div
      className="fixed inset-0 w-screen h-screen overflow-hidden select-none bg-black"
      style={{ margin: 0, padding: 0 }}
    >
      <div
        id="gametc-stage-canvas"
        style={{
          width: `${DESIGN_WIDTH}px`,
          height: `${DESIGN_HEIGHT}px`,
          transformOrigin: '0 0',
          transform: transform || 'scale(1)',
          position: 'absolute',
          left: 0,
          top: 0,
          backgroundColor: '#000000',
          overflow: 'hidden',
        }}
      >
        {/* Top Header Bar (Height 45px) */}
        <header
          id="gametc-header"
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: '1360px',
            height: '45px',
            backgroundImage: "url('/assets/lobby/header/Pannel.webp')",
            backgroundSize: '100% 100%',
            backgroundRepeat: 'no-repeat',
            zIndex: 50,
            display: 'flex',
            alignItems: 'center',
          }}
        >
          {/* Left Tabs Container: LOBBY Tab + Active Game Tab */}
          <div
            style={{
              position: 'absolute',
              left: '0px',
              top: '8px',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            {/* LOBBY Tab Button (Inactive background PANNEL_2.webp) */}
            <button
              type="button"
              id="header-lobby-tab-btn"
              onClick={handleReturnToLobby}
              style={{
                width: '173px',
                height: '28px',
                backgroundImage: "url('/assets/lobby/header/PANNEL_2.webp')",
                backgroundSize: '100% 100%',
                backgroundRepeat: 'no-repeat',
                border: 'none',
                backgroundColor: 'transparent',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                outline: 'none',
                opacity: 0.85,
                transition: 'opacity 0.15s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.85')}
              title="Return to Lobby"
            >
              <span
                style={{
                  fontFamily: "'Century Gothic', sans-serif",
                  fontSize: '13px',
                  fontWeight: 'bold',
                  color: '#C0C0C0',
                  letterSpacing: '1px',
                }}
              >
                LOBBY
              </span>
            </button>

            {/* Active Game Tab Button (Deep Red Tab with close x) */}
            <div
              id="header-active-game-tab"
              style={{
                position: 'relative',
                width: '185px',
                height: '28px',
                background: 'linear-gradient(180deg, #dc2626 0%, #991b1b 100%)',
                border: '1px solid #ef4444',
                borderRadius: '4px 4px 0 0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingLeft: '12px',
                paddingRight: '8px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.5)',
              }}
            >
              <span
                style={{
                  fontFamily: "'Century Gothic', sans-serif",
                  fontSize: '12px',
                  fontWeight: 'bold',
                  color: '#FFFFFF',
                  letterSpacing: '0.5px',
                  whiteSpace: 'nowrap',
                  textShadow: '0 1px 2px rgba(0,0,0,0.8)',
                }}
              >
                {code === 'TCPT' ? 'Triple Chance Pro' : 'Triple Chance Timer'}
              </span>

              {/* Close Game Tab Button */}
              <button
                type="button"
                id="header-close-game-tab-btn"
                onClick={handleReturnToLobby}
                onMouseEnter={() => setTabCloseHover(true)}
                onMouseLeave={() => setTabCloseHover(false)}
                style={{
                  width: '18px',
                  height: '18px',
                  border: 'none',
                  backgroundColor: tabCloseHover ? 'rgba(0, 0, 0, 0.4)' : 'transparent',
                  borderRadius: '2px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: '#FFFFFF',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  lineHeight: '1',
                  outline: 'none',
                  transition: 'background-color 0.15s ease',
                  padding: 0,
                }}
                title="Close Game"
              >
                ×
              </button>
            </div>
          </div>

          {/* Right Area: Player Data, Amusement notice, Controls */}
          <div
            style={{
              position: 'absolute',
              right: '95px',
              top: 0,
              height: '45px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            {/* FOR AMUSEMENT ONLY Text */}
            <span
              style={{
                fontFamily: "'HERMESC_20', sans-serif",
                fontSize: '13px',
                fontWeight: 500,
                color: '#FFFFFF',
                letterSpacing: '0.5px',
                whiteSpace: 'nowrap',
                textShadow: '0 1px 2px rgba(0, 0, 0, 0.8)',
              }}
            >
              FOR AMUSEMENT ONLY
            </span>

            {/* Key Icon Button: Triggers Change Password Modal */}
            <button
              type="button"
              id="btn-header-change-password"
              onClick={() => setIsChangePasswordOpen(true)}
              onMouseEnter={() => setKeyHover(true)}
              onMouseLeave={() => setKeyHover(false)}
              style={{
                width: '35px',
                height: '35px',
                border: 'none',
                backgroundColor: 'transparent',
                backgroundImage: keyHover
                  ? "url('/assets/lobby/header/sprite_4040002.webp')"
                  : "url('/assets/lobby/header/sprite_4040001.webp')",
                backgroundSize: 'contain',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                cursor: 'pointer',
                outline: 'none',
              }}
              title="Change Password"
            />

            {/* Welcome, Username Box */}
            <div
              id="game-user-greeting-box"
              style={{
                width: '260px',
                height: '32px',
                backgroundImage: "url('/assets/lobby/header/DILOUGE_BOX.webp')",
                backgroundSize: '100% 100%',
                backgroundRepeat: 'no-repeat',
                display: 'flex',
                alignItems: 'center',
                paddingLeft: '14px',
              }}
            >
              <span
                style={{
                  fontFamily: "'HERMESC_20', sans-serif",
                  fontSize: '14px',
                  fontWeight: 'bold',
                  color: '#FFFFFF',
                  letterSpacing: '0.5px',
                }}
              >
                Welcome, {initialUsername}
              </span>
            </div>

            {/* Points Balance Dual-Tone Box */}
            <div
              id="game-points-balance-box"
              style={{
                width: '260px',
                height: '32px',
                backgroundImage: "url('/assets/lobby/header/DILOUGE_BOX1.webp')",
                backgroundSize: '100% 100%',
                backgroundRepeat: 'no-repeat',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingLeft: '12px',
                paddingRight: '12px',
              }}
            >
              <span
                style={{
                  fontFamily: "'HERMESC_20', sans-serif",
                  fontSize: '13px',
                  fontWeight: 'bold',
                  color: '#FFFFFF',
                  letterSpacing: '0.5px',
                }}
              >
                POINTS BALANCE
              </span>
              <span
                style={{
                  fontFamily: "'HERMESC_20', sans-serif",
                  fontSize: '16px',
                  fontWeight: 'bold',
                  color: '#000000',
                  textShadow: '0 1px 0 rgba(255, 255, 255, 0.4)',
                  letterSpacing: '0.5px',
                }}
              >
                {balance.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Far Right: Window Controls (Minimize and Exit) */}
          <div
            style={{
              position: 'absolute',
              right: '0px',
              top: '0px',
              width: '90px',
              height: '43px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              paddingRight: '10px',
              gap: '8px',
            }}
          >
            {/* Minimize Button: Green rounded square with minus */}
            <button
              type="button"
              id="btn-game-window-minimize"
              onMouseEnter={() => setMinHover(true)}
              onMouseLeave={() => setMinHover(false)}
              onClick={() => {
                if (document.fullscreenElement) {
                  document.exitFullscreen?.().catch(() => {});
                } else {
                  document.documentElement.requestFullscreen?.().catch(() => {});
                }
              }}
              style={{
                width: '26px',
                height: '26px',
                border: '1px solid #14532d',
                borderRadius: '4px',
                background: minHover
                  ? 'linear-gradient(180deg, #4ade80 0%, #16a34a 100%)'
                  : 'linear-gradient(180deg, #22c55e 0%, #15803d 100%)',
                boxShadow: '0 1px 3px rgba(0,0,0,0.6), inset 0 1px 1px rgba(255,255,255,0.4)',
                cursor: 'pointer',
                outline: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 0,
              }}
              title="Toggle Fullscreen"
            >
              <div
                style={{
                  width: '12px',
                  height: '3px',
                  backgroundColor: '#FFFFFF',
                  borderRadius: '1px',
                }}
              />
            </button>

            {/* Exit Button: Red rounded square with X */}
            <button
              type="button"
              id="btn-game-window-close"
              onMouseEnter={() => setCloseHover(true)}
              onMouseLeave={() => setCloseHover(false)}
              onClick={handleReturnToLobby}
              style={{
                width: '26px',
                height: '26px',
                border: '1px solid #7f1d1d',
                borderRadius: '4px',
                background: closeHover
                  ? 'linear-gradient(180deg, #f87171 0%, #dc2626 100%)'
                  : 'linear-gradient(180deg, #ef4444 0%, #b91c1c 100%)',
                boxShadow: '0 1px 3px rgba(0,0,0,0.6), inset 0 1px 1px rgba(255,255,255,0.4)',
                cursor: 'pointer',
                outline: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFFFFF',
                fontSize: '15px',
                fontWeight: 'bold',
                lineHeight: '1',
                padding: 0,
              }}
              title="Return to Lobby"
            >
              ×
            </button>
          </div>
        </header>

        {/* Main Table Screen View (Below 45px Header) */}
        <GameTCView
          code={code}
          onBalanceChange={(newBal) => setBalance(newBal)}
        />

        {/* Authenticated User Change Password Dialog Modal */}
        <ChangePasswordModal
          isOpen={isChangePasswordOpen}
          onClose={() => setIsChangePasswordOpen(false)}
        />
      </div>
    </div>
  );
};
