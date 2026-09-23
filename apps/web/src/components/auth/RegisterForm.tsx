'use client';

import React, { useState } from 'react';

import { registerUser } from '@/services/auth';
import type { AuthStatus } from '@/services/auth';

export interface RegisterFormProps {
  onClose: () => void;
  onSuccess?: () => void;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({ onClose, onSuccess }) => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [gender, setGender] = useState<'MALE' | 'FEMALE'>('MALE');
  const [month, setMonth] = useState('');
  const [day, setDay] = useState('');
  const [year, setYear] = useState('');
  const [status, setStatus] = useState<AuthStatus>('IDLE');
  const [errorMessage, setErrorMessage] = useState('');
  const [isBtnHovered, setIsBtnHovered] = useState(false);

  const validateAge = (m: number, d: number, y: number): boolean => {
    const today = new Date();
    const birthDate = new Date(y, m - 1, d);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age >= 18;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (status === 'SUBMITTING') return;

    if (!username.trim()) {
      setStatus('ERROR');
      setErrorMessage('Please enter a username');
      return;
    }

    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setStatus('ERROR');
      setErrorMessage('Please enter a valid email address');
      return;
    }

    const m = parseInt(month, 10);
    const d = parseInt(day, 10);
    const y = parseInt(year, 10);

    if (isNaN(m) || isNaN(d) || isNaN(y) || m < 1 || m > 12 || d < 1 || d > 31 || y < 1900 || y > 2030) {
      setStatus('ERROR');
      setErrorMessage('Please enter a valid Date of Birth (MM / DD / YYYY)');
      return;
    }

    if (!validateAge(m, d, y)) {
      setStatus('ERROR');
      setErrorMessage('You must be 18 years or older to register');
      return;
    }

    setStatus('SUBMITTING');
    setErrorMessage('');

    try {
      const result = await registerUser({
        username: username.trim(),
        email: email.trim(),
        gender,
        dateOfBirth: `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`,
      });

      if (result.success) {
        setStatus('SUCCESS');
        onSuccess?.();
        onClose();
      } else {
        setStatus('ERROR');
        setErrorMessage(result.error || 'Unable to complete registration');
      }
    } catch {
      setStatus('ERROR');
      setErrorMessage('A network error occurred. Please try again.');
    }
  };

  return (
    <div
      style={{
        position: 'relative',
        width: '405px',
        height: '380px',
        backgroundImage: "url('/assets/auth/cards/Reg_page_0.webp')",
        backgroundSize: '100% 100%',
        backgroundRepeat: 'no-repeat',
      }}
    >
      {/* Close Button */}
      <button
        type="button"
        onClick={onClose}
        style={{
          position: 'absolute',
          right: '16px',
          top: '12px',
          width: '22px',
          height: '22px',
          border: 'none',
          background: 'transparent',
          backgroundImage: "url('/assets/auth/buttons/sprite_1173wq0001.webp')",
          backgroundSize: '100% 100%',
          cursor: 'pointer',
          outline: 'none',
        }}
        title="Close"
      />

      {/* Title: REGISTRATION */}
      <div
        style={{
          position: 'absolute',
          left: '30px',
          top: '20px',
          fontFamily: "'GOTHAMCONDENSED-MEDIUM', sans-serif",
          fontSize: '25px',
          fontWeight: '',
          color: '#FFFFFF',
          letterSpacing: '0.5px',
        }}
      >
        REGISTRATION
      </div>

      <form onSubmit={handleSubmit}>
        {/* Username Field */}
        <label
          htmlFor="reg-username"
          style={{
            position: 'absolute',
            left: '20px',
            top: '80px',
            fontFamily: "'GOTHAMCONDENSED-MEDIUM', sans-serif",
            fontSize: '20px',
            color: '#FFFFFF',
          }}
        >
          Username
        </label>
        <div
          style={{
            position: 'absolute',
            left: '150px',
            top: '75px',
            width: '180px',
            height: '30px',
            backgroundImage: "url('/assets/auth/inputs/Reg_and_Login_0.webp')",
            backgroundSize: '100% 100%',
          }}
        >
          <input
            id="reg-username"
            name="username"
            type="text"
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
              padding: '0 10px',
              color: '#FFFFFF',
              fontSize: '14px',
              fontFamily: "'GOTHAMCONDENSED-MEDIUM', sans-serif",
            }}
          />
        </div>

        {/* Gender Selector */}
        <span
          style={{
            position: 'absolute',
            left: '20px',
            top: '120px',
            fontFamily: "'GOTHAMCONDENSED-MEDIUM', sans-serif",
            fontSize: '20px',
            color: '#FFFFFF',
          }}
        >
          Gender
        </span>
        <div
          style={{
            position: 'absolute',
            left: '150px',
            top: '118px',
            display: 'flex',
            alignItems: 'center',
            gap: '24px',
          }}
        >
          {/* Male Radio */}
          <div
            onClick={() => setGender('MALE')}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
          >
            <div
              style={{
                width: '18px',
                height: '18px',
                backgroundImage:
                  gender === 'MALE'
                    ? "url('/assets/auth/toggles/sprite_94xdf0002.webp')"
                    : "url('/assets/auth/toggles/sprite_94xdf0001.webp')",
                backgroundSize: '100% 100%',
              }}
            />
            <span
              style={{
                color: '#FFFFFF',
                fontFamily: "'GOTHAMCONDENSED-MEDIUM', sans-serif",
                fontSize: '15px',
              }}
            >
              MALE
            </span>
          </div>

          {/* Female Radio */}
          <div
            onClick={() => setGender('FEMALE')}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
          >
            <div
              style={{
                width: '18px',
                height: '18px',
                backgroundImage:
                  gender === 'FEMALE'
                    ? "url('/assets/auth/toggles/sprite_94xdf0002.webp')"
                    : "url('/assets/auth/toggles/sprite_94xdf0001.webp')",
                backgroundSize: '100% 100%',
              }}
            />
            <span
              style={{
                color: '#FFFFFF',
                fontFamily: "'GOTHAMCONDENSED-MEDIUM', sans-serif",
                fontSize: '15px',
              }}
            >
              FEMALE
            </span>
          </div>
        </div>

        {/* Date of Birth Field */}
        <span
          style={{
            position: 'absolute',
            left: '20px',
            top: '160px',
            fontFamily: "'GOTHAMCONDENSED-MEDIUM', sans-serif",
            fontSize: '20px',
            color: '#FFFFFF',
          }}
        >
          Date of Birth
        </span>
        <div
          style={{
            position: 'absolute',
            left: '150px',
            top: '156px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <div
            style={{
              width: '35px',
              height: '30px',
              backgroundImage: "url('/assets/auth/inputs/Reg_and_Login_0.webp')",
              backgroundSize: '100% 100%',
            }}
          >
            <input
              type="text"
              maxLength={2}
              placeholder="MM"
              disabled={status === 'SUBMITTING'}
              value={month}
              onChange={(e) => {
                setMonth(e.target.value.replace(/\D/g, ''));
                if (status === 'ERROR') setErrorMessage('');
              }}
              style={{
                width: '100%',
                height: '100%',
                background: 'transparent',
                border: 'none',
                outline: 'none',
                textAlign: 'center',
                color: '#FFFFFF',
                fontSize: '13px',
                fontFamily: "'GOTHAMCONDENSED-MEDIUM', sans-serif",
              }}
            />
          </div>

          <div
            style={{
              width: '35px',
              height: '30px',
              backgroundImage: "url('/assets/auth/inputs/Reg_and_Login_0.webp')",
              backgroundSize: '100% 100%',
            }}
          >
            <input
              type="text"
              maxLength={2}
              placeholder="DD"
              disabled={status === 'SUBMITTING'}
              value={day}
              onChange={(e) => {
                setDay(e.target.value.replace(/\D/g, ''));
                if (status === 'ERROR') setErrorMessage('');
              }}
              style={{
                width: '100%',
                height: '100%',
                background: 'transparent',
                border: 'none',
                outline: 'none',
                textAlign: 'center',
                color: '#FFFFFF',
                fontSize: '13px',
                fontFamily: "'GOTHAMCONDENSED-MEDIUM', sans-serif",
              }}
            />
          </div>

          <div
            style={{
              width: '70px',
              height: '30px',
              backgroundImage: "url('/assets/auth/inputs/Reg_and_Login_0.webp')",
              backgroundSize: '100% 100%',
            }}
          >
            <input
              type="text"
              maxLength={4}
              placeholder="YYYY"
              disabled={status === 'SUBMITTING'}
              value={year}
              onChange={(e) => {
                setYear(e.target.value.replace(/\D/g, ''));
                if (status === 'ERROR') setErrorMessage('');
              }}
              style={{
                width: '100%',
                height: '100%',
                background: 'transparent',
                border: 'none',
                outline: 'none',
                textAlign: 'center',
                color: '#FFFFFF',
                fontSize: '13px',
                fontFamily: "'GOTHAMCONDENSED-MEDIUM', sans-serif",
              }}
            />
          </div>
        </div>

        {/* Email Field */}
        <label
          htmlFor="reg-email"
          style={{
            position: 'absolute',
            left: '20px',
            top: '200px',
            fontFamily: "'GOTHAMCONDENSED-MEDIUM', sans-serif",
            fontSize: '20px',
            color: '#FFFFFF',
          }}
        >
          E-Mail Address
        </label>
        <div
          style={{
            position: 'absolute',
            left: '150px',
            top: '196px',
            width: '180px',
            height: '30px',
            backgroundImage: "url('/assets/auth/inputs/Reg_and_Login_0.webp')",
            backgroundSize: '100% 100%',
          }}
        >
          <input
            id="reg-email"
            name="email"
            type="email"
            disabled={status === 'SUBMITTING'}
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (status === 'ERROR') setErrorMessage('');
            }}
            style={{
              width: '100%',
              height: '100%',
              background: 'transparent',
              border: 'none',
              outline: 'none',
              padding: '0 10px',
              color: '#FFFFFF',
              fontSize: '14px',
              fontFamily: "'GOTHAMCONDENSED-MEDIUM', sans-serif",
            }}
          />
        </div>

        {/* Mail Notice */}
        <div
          style={{
            position: 'absolute',
            left: '0',
            width: '405px',
            top: '238px',
            textAlign: 'center',
            color: '#d1d5db',
            fontFamily: "'GOTHAMCONDENSED-MEDIUM', sans-serif",
            fontSize: '15px',
          }}
        >
          Password will be sent to this mail
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div
            style={{
              position: 'absolute',
              left: '20px',
              top: '260px',
              width: '365px',
              textAlign: 'center',
              color: '#ef4444',
              fontFamily: "'GOTHAMCONDENSED-MEDIUM', sans-serif",
              fontSize: '20px',
              fontWeight: '',
            }}
          >
            {errorMessage}
          </div>
        )}

        {/* Register Button */}
        <button
          type="submit"
          disabled={status === 'SUBMITTING'}
          onMouseEnter={() => setIsBtnHovered(true)}
          onMouseLeave={() => setIsBtnHovered(false)}
          style={{
            position: 'absolute',
            left: '109px',
            top: '290px',
            width: '187px',
            height: '45px',
            border: 'none',
            background: 'transparent',
            backgroundImage: isBtnHovered
              ? "url('/assets/auth/buttons/highlight.webp')"
              : "url('/assets/auth/buttons/normal.webp')",
            backgroundSize: '100% 100%',
            cursor: status === 'SUBMITTING' ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            outline: 'none',
          }}
        >
          <span
            style={{
              color: '#FFFFFF',
              fontFamily: "'GOTHAMCONDENSED-MEDIUM', sans-serif",
              fontSize: '20px',
              fontWeight: '',
              letterSpacing: '0.5px',
            }}
          >
            Register
          </span>
        </button>
      </form>
    </div>
  );
};
