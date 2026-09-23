'use client';

import React, { useState, useEffect } from 'react';

import { AuthRightPanel } from './AuthRightPanel';
import { LoginForm } from './LoginForm';
import { RegisterForm } from './RegisterForm';

export interface AuthStageProps {
  initialScreen?: 'login' | 'register';
  /** Called when the user successfully authenticates. Use to redirect to the lobby. */
  onSuccess?: () => void;
}

const DESIGN_WIDTH = 1360;
const DESIGN_HEIGHT = 768;

export const AuthStage: React.FC<AuthStageProps> = ({ initialScreen = 'login', onSuccess }) => {
  const [screen, setScreen] = useState<'login' | 'register'>(initialScreen);
  const [transform, setTransform] = useState('');
  const [minHover, setMinHover] = useState(false);
  const [closeHover, setCloseHover] = useState(false);

  useEffect(() => {
    setScreen(initialScreen);
  }, [initialScreen]);

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

  return (
    <div
      className="fixed inset-0 w-screen h-screen overflow-hidden select-none bg-black"
      style={{ margin: 0, padding: 0 }}
    >
      <div
        style={{
          width: `${DESIGN_WIDTH}px`,
          height: `${DESIGN_HEIGHT}px`,
          transformOrigin: '0 0',
          transform: transform || 'scale(1)',
          position: 'absolute',
          left: 0,
          top: 0,
          backgroundImage: "url('/assets/auth/backgrounds/BG_login.webp')",
          backgroundSize: '100% 100%',
          backgroundRepeat: 'no-repeat',
        }}
      >
        {/* Top-Right Window Controls: Minimize & Exit */}
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
            zIndex: 50,
          }}
        >
          {/* Minimize Button */}
          <button
            type="button"
            onMouseEnter={() => setMinHover(true)}
            onMouseLeave={() => setMinHover(false)}
            style={{
              width: '30px',
              height: '30px',
              border: 'none',
              background: 'transparent',
              backgroundImage: minHover
                ? "url('/assets/auth/buttons/minimize0002.webp')"
                : "url('/assets/auth/buttons/minimize0001.webp')",
              backgroundSize: '100% 100%',
              cursor: 'pointer',
              outline: 'none',
            }}
            title="Minimize"
          />

          {/* Close Button */}
          <button
            type="button"
            onMouseEnter={() => setCloseHover(true)}
            onMouseLeave={() => setCloseHover(false)}
            style={{
              width: '30px',
              height: '30px',
              border: 'none',
              background: 'transparent',
              backgroundImage: closeHover
                ? "url('/assets/auth/buttons/Close0002.webp')"
                : "url('/assets/auth/buttons/Close0001.webp')",
              backgroundSize: '100% 100%',
              cursor: 'pointer',
              outline: 'none',
            }}
            title="Exit"
          />
        </div>

        {/* Left Side: Login Form or Register Form */}
        <div
          style={{
            position: 'absolute',
            left: '62.5px',
            top: '67px',
            width: '405px',
            height: '380px',
            zIndex: 30,
          }}
        >
          {screen === 'login' ? (
            <LoginForm onOpenRegister={() => setScreen('register')} onSuccess={onSuccess} />
          ) : (
            <RegisterForm onClose={() => setScreen('login')} />
          )}
        </div>

        {/* 18+ Strictly For Amusement Only Badge */}
        <div
          style={{
            position: 'absolute',
            left: '56.5px',
            top: '450px',
            width: '417px',
            height: '76px',
            backgroundImage: "url('/assets/auth/badges/18plus.webp')",
            backgroundSize: '100% 100%',
            backgroundRepeat: 'no-repeat',
            pointerEvents: 'none',
            zIndex: 25,
          }}
        />

        {/* Center-Right: Promotional Card with Official Jito India Logo and Free to Play Emblem */}
        <AuthRightPanel />
      </div>
    </div>
  );
};
