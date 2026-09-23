'use client';

import React, { useState } from 'react';

import { loginUser } from '@/services/auth';
import type { AuthStatus } from '@/services/auth';

export interface LoginFormProps {
  onOpenRegister: () => void;
  onSuccess?: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onOpenRegister, onSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [status, setStatus] = useState<AuthStatus>('IDLE');
  const [errorMessage, setErrorMessage] = useState('');
  const [isBtnHovered, setIsBtnHovered] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (status === 'SUBMITTING') return;

    if (!username.trim() || !password) {
      setStatus('ERROR');
      setErrorMessage('Please enter username and password');
      return;
    }

    setStatus('SUBMITTING');
    setErrorMessage('');

    try {
      const result = await loginUser({
        username: username.trim(),
        password,
        rememberMe,
      });

      if (result.success) {
        setStatus('SUCCESS');
        onSuccess?.();
      } else {
        setStatus('ERROR');
        setErrorMessage(result.error || 'Unable to connect to authentication server');
      }
    } catch {
      setStatus('ERROR');
      setErrorMessage('A network error occurred. Please check your connection.');
    }
  };

  return (
    <div
      style={{
        position: 'relative',
        width: '405px',
        height: '380px',
        backgroundImage: "url('/assets/auth/cards/login_Page_sup_1.webp')",
        backgroundSize: '100% 100%',
        backgroundRepeat: 'no-repeat',
      }}
    >
      {/* Title: MEMEBER LOGIN */}
      <div
        style={{
          position: 'absolute',
          left: '30px',
          top: '32px',
          width: '160px',
          height: '30px',
          fontFamily: "'GOTHAMCONDENSED-MEDIUM', sans-serif",
          fontSize: '30px',
          fontWeight: 'initial',
          color: '#FFFFFF',
          letterSpacing: '0.5px',
        }}
      >
        MEMEBER LOGIN
      </div>

      {/* FOR AMUSEMENT ONLY */}
      <div
        style={{
          position: 'absolute',
          right: '58px',
          top: '20px',
          width: '240px',
          height: '25px',
          fontFamily: "'HERMESC_20', sans-serif",
          fontSize: '13px',
          fontWeight: 'initial',
          color: '#FFFFFF',
          letterSpacing: '0.5px',
          textAlign: 'right',
        }}
      >
        FOR AMUSEMENT ONLY
      </div>

      {/* Lock Icon */}
      <div
        style={{
          position: 'absolute',
          right: '25px',
          top: '30px',
          width: '24px',
          height: '30px',
          backgroundImage: "url('/assets/auth/badges/login_Page_sup_0.webp')",
          backgroundSize: 'contain',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      />

      <form onSubmit={handleSubmit}>
        {/* Username Label */}
        <label
          htmlFor="login-username"
          style={{
            position: 'absolute',
            left: '92px',
            top: '78px',
            width: '160px',
            height: '25px',
            fontFamily: "'GOTHAMCONDENSED-MEDIUM', sans-serif",
            fontSize: '20px',
            color: '#FFFFFF',
            cursor: 'default',
          }}
        >
          Username
        </label>

        {/* Username Input Field */}
        <div
          style={{
            position: 'absolute',
            left: '90px',
            top: '106px',
            width: '245px',
            height: '35px',
            backgroundImage: "url('/assets/auth/inputs/login_Page_sup_2.webp')",
            backgroundSize: '100% 100%',
            backgroundRepeat: 'no-repeat',
          }}
        >
          <input
            id="login-username"
            name="username"
            type="text"
            autoComplete="username"
            disabled={status === 'SUBMITTING'}
            value={username}
            onChange={(e) => {
              setUsername(e.target.value);
              if (status === 'ERROR') setErrorMessage('');
            }}
            style={{
              width: '100%',
              height: '100%',
              background: 'transparent',
              border: 'none',
              outline: 'none',
              padding: '0 12px',
              color: '#FFFFFF',
              fontSize: '15px',
              fontFamily: "'GOTHAMCONDENSED-MEDIUM', sans-serif",
            }}
          />
        </div>

        {/* Password Label */}
        <label
          htmlFor="login-password"
          style={{
            position: 'absolute',
            left: '92px',
            top: '147px',
            width: '160px',
            height: '25px',
            fontFamily: "'GOTHAMCONDENSED-MEDIUM', sans-serif",
            fontSize: '20px',
            color: '#FFFFFF',
            cursor: 'default',
          }}
        >
          Password
        </label>

        {/* Password Input Field */}
        <div
          style={{
            position: 'absolute',
            left: '90px',
            top: '174px',
            width: '245px',
            height: '35px',
            backgroundImage: "url('/assets/auth/inputs/login_Page_sup_2.webp')",
            backgroundSize: '100% 100%',
            backgroundRepeat: 'no-repeat',
          }}
        >
          <input
            id="login-password"
            name="password"
            type="password"
            autoComplete="current-password"
            disabled={status === 'SUBMITTING'}
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (status === 'ERROR') setErrorMessage('');
            }}
            style={{
              width: '100%',
              height: '100%',
              background: 'transparent',
              border: 'none',
              outline: 'none',
              padding: '0 12px',
              color: '#FFFFFF',
              fontSize: '15px',
              fontFamily: "'GOTHAMCONDENSED-MEDIUM', sans-serif",
            }}
          />
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div
            style={{
              position: 'absolute',
              left: '20px',
              top: '215px',
              width: '365px',
              height: '25px',
              textAlign: 'center',
              color: '#ef4444',
              fontFamily: "'GOTHAMCONDENSED-MEDIUM', sans-serif",
              fontSize: '20px',
              fontWeight: '-moz-initial',
            }}
          >
            {errorMessage}
          </div>
        )}

        {/* Red Login Submit Button */}
        <button
          type="submit"
          disabled={status === 'SUBMITTING'}
          onMouseEnter={() => setIsBtnHovered(true)}
          onMouseLeave={() => setIsBtnHovered(false)}
          style={{
            position: 'absolute',
            left: '108.5px',
            top: '246px',
            width: '188px',
            height: '45px',
            border: 'none',
            background: 'transparent',
            backgroundImage: isBtnHovered
              ? "url('/assets/auth/buttons/sprite_220002.webp')"
              : "url('/assets/auth/buttons/sprite_220001.webp')",
            backgroundSize: '100% 100%',
            cursor: status === 'SUBMITTING' ? 'not-allowed' : 'pointer',
            outline: 'none',
          }}
          title="Login"
        >
          {status === 'SUBMITTING' && (
            <div
              className="animate-spin"
              style={{
                position: 'absolute',
                right: '12px',
                top: '12px',
                width: '20px',
                height: '20px',
                backgroundImage: "url('/assets/splash/images/Loader_Red_0.webp')",
                backgroundSize: 'contain',
                backgroundRepeat: 'no-repeat',
              }}
            />
          )}
        </button>

        {/* Remember Me Checkbox — Centered */}
        <div
          onClick={() => setRememberMe(!rememberMe)}
          style={{
            position: 'absolute',
            left: '135px',
            top: '298px',
            display: 'flex',
            alignItems: 'center',
            cursor: 'pointer',
          }}
        >
          <div
            style={{
              width: '22px',
              height: '22px',
              backgroundImage: "url('/assets/auth/toggles/tickBG.webp')",
              backgroundSize: '100% 100%',
              position: 'relative',
            }}
          >
            {rememberMe && (
              <div
                style={{
                  position: 'absolute',
                  left: '1px',
                  top: '1px',
                  width: '19px',
                  height: '17px',
                  backgroundImage: "url('/assets/auth/toggles/tick.webp')",
                  backgroundSize: 'contain',
                  backgroundRepeat: 'no-repeat',
                }}
              />
            )}
          </div>
          <span
            style={{
              marginLeft: '8px',
              color: '#FFFFFF',
              fontFamily: "'Highway Gothic Regular', sans-serif",
              fontSize: '18px',
              fontWeight: '',
            }}
          >
            Remember Me
          </span>
        </div>

        {/* New User ? Sign up here — Centered */}
        <div
          style={{
            position: 'absolute',
            left: '0px',
            width: '405px',
            top: '328px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
          }}
        >
          <span
            style={{
              color: '#FFFFFF',
              fontFamily: "'GOTHAMCONDENSED-MEDIUM', sans-serif",
              fontSize: '20px',
            }}
          >
            New User ?
          </span>
          <button
            type="button"
            onClick={onOpenRegister}
            style={{
              color: '#ef4444',
              fontFamily: "'GOTHAMCONDENSED-MEDIUM', sans-serif",
              fontSize: '20px',
              fontWeight: '',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              textDecoration: '',
              padding: 0,
            }}
          >
            Sign up here
          </button>
        </div>
      </form>
    </div>
  );
};
