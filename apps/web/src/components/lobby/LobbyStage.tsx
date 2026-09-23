'use client';

import { useRouter } from 'next/navigation';
import React, { useState, useEffect } from 'react';

import { ChangePasswordModal } from './ChangePasswordModal';
import { LobbyHeader } from './LobbyHeader';
import { LobbyMainPanel } from './LobbyMainPanel';

import { JitoLogo } from '@/components/branding/JitoLogo';
import { balanceMinorToPoints, logoutSession, restoreSession } from '@/services/auth';
import type { AuthSession } from '@/services/auth';

const DESIGN_WIDTH = 1360;
const DESIGN_HEIGHT = 768;

export const LobbyStage: React.FC = () => {
  const router = useRouter();
  /** Real authenticated user + balance from GET /auth/me; null until verified. */
  const [session, setSession] = useState<AuthSession | null>(null);
  const [transform, setTransform] = useState('');
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);

  // The lobby requires a real session (refresh cookie or in-memory token).
  // No session → back to /login; no fake user or balance is ever rendered.
  useEffect(() => {
    let active = true;
    restoreSession()
      .then((restored) => {
        if (!active) return;
        if (restored) setSession(restored);
        else router.replace('/login');
      })
      .catch(() => {
        if (active) router.replace('/login');
      });
    return () => {
      active = false;
    };
  }, [router]);

  const handleExit = async () => {
    await logoutSession();
    router.push('/');
  };

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

  const handlePlayGame = (gameId: string) => {
    if (gameId === 'triple-chance-pro') {
      router.push('/games/triple-chance-pro');
    } else if (gameId === 'triple-chance') {
      router.push('/games/triple-chance');
    }
  };

  if (!session) {
    return <div className="fixed inset-0 bg-black" />;
  }

  return (
    <div
      className="fixed inset-0 w-screen h-screen overflow-hidden select-none bg-black"
      style={{ margin: 0, padding: 0 }}
    >
      <div
        id="lobby-stage-canvas"
        style={{
          width: `${DESIGN_WIDTH}px`,
          height: `${DESIGN_HEIGHT}px`,
          transformOrigin: '0 0',
          transform: transform || 'scale(1)',
          position: 'absolute',
          left: 0,
          top: 0,
          backgroundImage: "url('/assets/lobby/backgrounds/lobbyBg.webp')",
          backgroundSize: '100% 100%',
          backgroundRepeat: 'no-repeat',
        }}
      >
        {/* Top Header Bar */}
        <LobbyHeader
          username={session.user.displayName ?? session.user.username}
          pointsBalance={balanceMinorToPoints(session.balanceMinor)}
          onLobbyClick={() => {}}
          onChangePassword={() => setIsChangePasswordOpen(true)}
          onMinimize={() => {}}
          onClose={handleExit}
        />

        {/* Official Jito India Games Logo — Top Right Corner above Main Panel */}
        <div
          id="lobby-brand-logo"
          style={{
            position: 'absolute',
            left: '1115px',
            top: '60px',
            width: '160px',
            height: '110px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 40,
            filter: 'drop-shadow(0 4px 10px rgba(0, 0, 0, 0.9))',
            pointerEvents: 'none',
          }}
        >
          <JitoLogo width={160} height={105} priority />
        </div>

        {/* Central Lobby Panel with Active Draw Games Category and Game Cards */}
        <LobbyMainPanel onPlayGame={handlePlayGame} />

        {/* Authentic Change Password Modal Dialog */}
        <ChangePasswordModal
          isOpen={isChangePasswordOpen}
          onClose={() => setIsChangePasswordOpen(false)}
        />
      </div>
    </div>
  );
};
