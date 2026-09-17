'use client';

import { useRouter } from 'next/navigation';
import React, { useState, useEffect } from 'react';

import { ChangePasswordModal } from './ChangePasswordModal';
import { LobbyHeader } from './LobbyHeader';
import { LobbyMainPanel } from './LobbyMainPanel';

import { JitoLogo } from '@/components/branding/JitoLogo';

export interface LobbyStageProps {
  initialUsername?: string;
  initialBalance?: number;
}

const DESIGN_WIDTH = 1360;
const DESIGN_HEIGHT = 768;

export const LobbyStage: React.FC<LobbyStageProps> = ({
  initialUsername = 'PINTU',
  initialBalance = 62933.0,
}) => {
  const router = useRouter();
  const [transform, setTransform] = useState('');
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);

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
          username={initialUsername}
          pointsBalance={initialBalance}
          onLobbyClick={() => {}}
          onChangePassword={() => setIsChangePasswordOpen(true)}
          onMinimize={() => {}}
          onClose={() => router.push('/')}
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
