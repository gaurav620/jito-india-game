'use client';

import React, { useState, useEffect, useRef } from 'react';

import { changePassword } from '@/services/auth';
import type { AuthStatus } from '@/services/auth';

export interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * ChangePasswordModal
 *
 * Pixel-perfect reproduction of the authentic Change Password dialog
 * from the reference game (`pr-project-2-main`, Canvas/PasswordDialog).
 *
 * Dimensions & Coordinates:
 * - Canvas: 1360×768 viewport
 * - Modal frame: 400×390 px (`Bg.webp`), centered at left: 480px, top: 189px
 * - Input fields: 220×30 px with `InputFieldBackground.webp`:
 *   - Old Password: left: 90px, top: 107.5px
 *   - New Password: left: 90px, top: 177.5px
 *   - Confirm Password: left: 90px, top: 250px
 * - Action buttons: 133×33 px:
 *   - ChangeBtn: left: 61.5px, top: 332px (`BTN0001.webp` / `BTN0002.webp`)
 *   - CancelBtn: left: 205.5px, top: 332px (`wedcsdsd0001.webp` / `wedcsdsd0002.webp`)
 */
export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [status, setStatus] = useState<AuthStatus>('IDLE');
  const [message, setMessage] = useState('');

  const [changeHover, setChangeHover] = useState(false);
  const [cancelHover, setCancelHover] = useState(false);

  const oldInputRef = useRef<HTMLInputElement>(null);

  // Focus the first input whenever the modal opens
  useEffect(() => {
    if (isOpen) {
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setStatus('IDLE');
      setMessage('');
      setTimeout(() => oldInputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Handle Escape key to close modal
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (status === 'SUBMITTING') return;

    if (!oldPassword) {
      setStatus('ERROR');
      setMessage('Please enter your current password.');
      return;
    }

    if (!newPassword) {
      setStatus('ERROR');
      setMessage('Please enter a new password.');
      return;
    }

    if (newPassword.length < 6) {
      setStatus('ERROR');
      setMessage('Password must be at least 6 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setStatus('ERROR');
      setMessage('Passwords do not match.');
      return;
    }

    setStatus('SUBMITTING');
    setMessage('');

    try {
      const result = await changePassword({
        currentPassword: oldPassword,
        newPassword,
        confirmPassword,
      });

      if (result.success) {
        setStatus('SUCCESS');
        setMessage(result.message || 'Password changed!');
        setTimeout(() => {
          onClose();
        }, 1200);
      } else {
        setStatus('ERROR');
        setMessage(result.error || 'Unable to change password.');
      }
    } catch {
      setStatus('ERROR');
      setMessage('A network error occurred. Please try again.');
    }
  };

  return (
    <div
      id="password-dialog-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Change Password"
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        width: '1360px',
        height: '768px',
        backgroundColor: 'rgba(0, 0, 0, 0.516)',
        zIndex: 90,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      onClick={(e) => {
        // Close if backdrop clicked directly
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      {/* 400×390 Authentic Modal Frame */}
      <div
        id="password-dialog-box"
        style={{
          position: 'relative',
          width: '400px',
          height: '390px',
          backgroundImage: "url('/assets/lobby/dialogs/Bg.webp')",
          backgroundSize: '100% 100%',
          backgroundRepeat: 'no-repeat',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.9)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <form onSubmit={handleSubmit}>
          {/* Old Password Input Field */}
          <div
            id="old-pass-field"
            style={{
              position: 'absolute',
              left: '90px',
              top: '107.5px',
              width: '220px',
              height: '30px',
              backgroundImage:
                "url('/assets/lobby/dialogs/InputFieldBackground.webp')",
              backgroundSize: '100% 100%',
              backgroundRepeat: 'no-repeat',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <input
              ref={oldInputRef}
              id="input-old-password"
              name="oldPassword"
              type="password"
              placeholder="Enter Old Password..."
              disabled={status === 'SUBMITTING'}
              value={oldPassword}
              onChange={(e) => {
                setOldPassword(e.target.value);
                if (status === 'ERROR') setMessage('');
              }}
              style={{
                width: '100%',
                height: '100%',
                background: 'transparent',
                border: 'none',
                outline: 'none',
                padding: '0 10px',
                color: '#FFFFFF',
                fontFamily: "'HERMESC_20', sans-serif",
                fontSize: '15px',
              }}
            />
          </div>

          {/* New Password Input Field */}
          <div
            id="new-pass-field"
            style={{
              position: 'absolute',
              left: '90px',
              top: '177.5px',
              width: '220px',
              height: '30px',
              backgroundImage:
                "url('/assets/lobby/dialogs/InputFieldBackground.webp')",
              backgroundSize: '100% 100%',
              backgroundRepeat: 'no-repeat',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <input
              id="input-new-password"
              name="newPassword"
              type="password"
              placeholder="Enter New Password"
              disabled={status === 'SUBMITTING'}
              value={newPassword}
              onChange={(e) => {
                setNewPassword(e.target.value);
                if (status === 'ERROR') setMessage('');
              }}
              style={{
                width: '100%',
                height: '100%',
                background: 'transparent',
                border: 'none',
                outline: 'none',
                padding: '0 10px',
                color: '#FFFFFF',
                fontFamily: "'HERMESC_20', sans-serif",
                fontSize: '15px',
              }}
            />
          </div>

          {/* Confirm Password Input Field */}
          <div
            id="confirm-pass-field"
            style={{
              position: 'absolute',
              left: '90px',
              top: '250px',
              width: '220px',
              height: '30px',
              backgroundImage:
                "url('/assets/lobby/dialogs/InputFieldBackground.webp')",
              backgroundSize: '100% 100%',
              backgroundRepeat: 'no-repeat',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <input
              id="input-confirm-password"
              name="confirmPassword"
              type="password"
              placeholder="Confirm New Password"
              disabled={status === 'SUBMITTING'}
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                if (status === 'ERROR') setMessage('');
              }}
              style={{
                width: '100%',
                height: '100%',
                background: 'transparent',
                border: 'none',
                outline: 'none',
                padding: '0 10px',
                color: '#FFFFFF',
                fontFamily: "'HERMESC_20', sans-serif",
                fontSize: '15px',
              }}
            />
          </div>

          {/* Error / Status Text Banner */}
          {message && (
            <div
              id="password-dialog-message"
              style={{
                position: 'absolute',
                left: '20px',
                top: '292px',
                width: '360px',
                height: '24px',
                textAlign: 'center',
                color: status === 'SUCCESS' ? '#4ade80' : '#ef4444',
                fontFamily: "'HERMESC_20', sans-serif",
                fontSize: '13px',
                letterSpacing: '0.5px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {message}
            </div>
          )}

          {/* Change Submit Button */}
          <button
            type="submit"
            id="btn-password-submit"
            disabled={status === 'SUBMITTING'}
            onMouseEnter={() => setChangeHover(true)}
            onMouseLeave={() => setChangeHover(false)}
            style={{
              position: 'absolute',
              left: '61.5px',
              top: '332px',
              width: '133px',
              height: '33px',
              border: 'none',
              backgroundColor: 'transparent',
              backgroundImage: changeHover
                ? "url('/assets/lobby/dialogs/BTN0002.webp')"
                : "url('/assets/lobby/dialogs/BTN0001.webp')",
              backgroundSize: '100% 100%',
              backgroundRepeat: 'no-repeat',
              cursor: status === 'SUBMITTING' ? 'not-allowed' : 'pointer',
              outline: 'none',
            }}
            title="Change Password"
          />

          {/* Cancel Button */}
          <button
            type="button"
            id="btn-password-cancel"
            onClick={onClose}
            disabled={status === 'SUBMITTING'}
            onMouseEnter={() => setCancelHover(true)}
            onMouseLeave={() => setCancelHover(false)}
            style={{
              position: 'absolute',
              left: '205.5px',
              top: '332px',
              width: '133px',
              height: '33px',
              border: 'none',
              backgroundColor: 'transparent',
              backgroundImage: cancelHover
                ? "url('/assets/lobby/dialogs/wedcsdsd0002.webp')"
                : "url('/assets/lobby/dialogs/wedcsdsd0001.webp')",
              backgroundSize: '100% 100%',
              backgroundRepeat: 'no-repeat',
              cursor: status === 'SUBMITTING' ? 'not-allowed' : 'pointer',
              outline: 'none',
            }}
            title="Cancel"
          />
        </form>
      </div>
    </div>
  );
};
