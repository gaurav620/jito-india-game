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
  initialState?: 'betting' | 'win';
}

const DESIGN_WIDTH = 1360;
const DESIGN_HEIGHT = 768;

export const GameTCStage: React.FC<GameTCStageProps> = ({
  code = 'TCT',
  initialUsername = 'PINTU',
  initialBalance = 167249.0,
  initialState = 'betting',
}) => {
  const router = useRouter();
  const [transform, setTransform] = useState('');
  const [stateMode] = useState<'betting' | 'win'>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('state')?.toLowerCase() === 'win') {
        return 'win';
      }
    }
    return initialState;
  });
  const [balance, setBalance] = useState(() => (stateMode === 'win' ? 167193.0 : initialBalance));
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [keyHover, setKeyHover] = useState(false);
  const [minHover, setMinHover] = useState(false);
  const [closeHover, setCloseHover] = useState(false);
  const [tabCloseHover, setTabCloseHover] = useState(false);

  // Sync balance with stateMode
  useEffect(() => {
    if (stateMode === 'win') {
      setBalance(167193.0);
    } else {
      setBalance(167249.0);
    }
  }, [stateMode]);

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
          backgroundImage: "url('/assets/tc/BG.webp')",
          backgroundPosition: '0 0',
          backgroundSize: '100% 100%',
          backgroundRepeat: 'no-repeat',
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
              top: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '2px',
            }}
          >
            {/* LOBBY Tab (Inactive background PANNEL_2.webp - not clickable, user only closes via tab cross icon) */}
            <div
              id="header-lobby-tab-btn"
              style={{
                width: '173px',
                height: '33px',
                backgroundImage: "url('/assets/lobby/header/PANNEL_2.webp')",
                backgroundSize: '100% 100%',
                backgroundRepeat: 'no-repeat',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                outline: 'none',
                opacity: 0.85,
                cursor: 'default',
              }}
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
            </div>

            {/* Active Game Tab Button (Deep Red Tab with close x) */}
            <div
              id="header-active-game-tab"
              style={{
                position: 'relative',
                width: '185px',
                height: '33px',
                backgroundImage: "url('/assets/lobby/header/PANNEL_1.webp')",
                backgroundSize: '100% 100%',
                backgroundRepeat: 'no-repeat',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingLeft: '14px',
                paddingRight: '10px',
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
                  width: '15px',
                  height: '15px',
                  border: 'none',
                  backgroundColor: 'transparent',
                  backgroundImage: "url('/assets/lobby/header/tabclose.webp')",
                  backgroundSize: '100% 100%',
                  backgroundRepeat: 'no-repeat',
                  cursor: 'pointer',
                  outline: 'none',
                  opacity: tabCloseHover ? 1 : 0.85,
                  padding: 0,
                }}
                title="Close Game"
              />
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
              id="header-amusement-label"
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
            {/* Minimize Button */}
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
                width: '30px',
                height: '30px',
                border: 'none',
                backgroundColor: 'transparent',
                backgroundImage: minHover
                  ? "url('/assets/auth/buttons/minimize0002.webp')"
                  : "url('/assets/auth/buttons/minimize0001.webp')",
                backgroundSize: '100% 100%',
                cursor: 'pointer',
                outline: 'none',
              }}
              title="Toggle Fullscreen"
            />

            {/* Exit Button */}
            <button
              type="button"
              id="btn-game-window-close"
              onMouseEnter={() => setCloseHover(true)}
              onMouseLeave={() => setCloseHover(false)}
              onClick={handleReturnToLobby}
              style={{
                width: '30px',
                height: '30px',
                border: 'none',
                backgroundColor: 'transparent',
                backgroundImage: closeHover
                  ? "url('/assets/auth/buttons/Close0002.webp')"
                  : "url('/assets/auth/buttons/Close0001.webp')",
                backgroundSize: '100% 100%',
                cursor: 'pointer',
                outline: 'none',
              }}
              title="Return to Lobby"
            />
          </div>
        </header>

        {/* Main Table Screen View (Below 45px Header) */}
        <GameTCView
          code={code}
          initialState={stateMode}
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
