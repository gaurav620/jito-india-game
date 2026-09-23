'use client';

import React, { useState } from 'react';

export interface LobbyHeaderProps {
  username?: string;
  pointsBalance?: number;
  onLobbyClick?: () => void;
  onChangePassword?: () => void;
  onMinimize?: () => void;
  onClose?: () => void;
}

export const LobbyHeader: React.FC<LobbyHeaderProps> = ({
  username = 'PINTU',
  pointsBalance = 62933.0,
  onLobbyClick,
  onChangePassword,
  onMinimize,
  onClose,
}) => {
  const [minHover, setMinHover] = useState(false);
  const [closeHover, setCloseHover] = useState(false);
  const [keyHover, setKeyHover] = useState(false);

  return (
    <header
      id="lobby-header"
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
      {/* Left: Active LOBBY Tab Button */}
      <button
        type="button"
        id="lobby-tab-button"
        onClick={onLobbyClick}
        style={{
          position: 'absolute',
          left: '0px',
          top: '8px',
          width: '173px',
          height: '28px',
          backgroundImage: "url('/assets/lobby/header/PANNEL_1.webp')",
          backgroundSize: '100% 100%',
          backgroundRepeat: 'no-repeat',
          border: 'none',
          backgroundColor: 'transparent',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          outline: 'none',
        }}
        title="Lobby"
      >
        <span
          style={{
            fontFamily: "'Century Gothic', sans-serif",
            fontSize: '14px',
            fontWeight: 'bold',
            color: '#FFFFFF',
            letterSpacing: '1px',
          }}
        >
          LOBBY
        </span>
      </button>

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
          }}
        >
          FOR AMUSEMENT ONLY
        </span>

        {/* Change Password Key Button */}
        <button
          type="button"
          id="btn-change-password"
          onClick={onChangePassword}
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

        {/* Welcome, Username Inset Box */}
        <div
          id="user-greeting-box"
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
            Welcome, {username}
          </span>
        </div>

        {/* Points Balance Dual-Tone Box */}
        <div
          id="points-balance-box"
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
            {pointsBalance.toFixed(2)}
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
          id="btn-window-minimize"
          onMouseEnter={() => setMinHover(true)}
          onMouseLeave={() => setMinHover(false)}
          onClick={onMinimize}
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
          title="Minimize"
        />

        {/* Exit Button */}
        <button
          type="button"
          id="btn-window-close"
          onMouseEnter={() => setCloseHover(true)}
          onMouseLeave={() => setCloseHover(false)}
          onClick={onClose}
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
          title="Exit"
        />
      </div>
    </header>
  );
};
