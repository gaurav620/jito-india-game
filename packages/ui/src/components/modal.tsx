'use client';

import React, { useEffect } from 'react';

import { OrnateFrame } from '../styles/ornate-frame';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
  showCloseButton?: boolean;
}

/**
 * Casino Ornate Modal
 * Recreates the centered gold filigree dialogs from the reference recordings.
 */
export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  children,
  className = '',
  showCloseButton = true,
}) => {
  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Dimmed backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-[2px] transition-opacity animate-fade-in"
        onClick={onClose}
      />

      {/* Modal Dialog with Ornate Gold Frame */}
      <div className={`relative z-10 max-w-2xl w-full mx-auto ${className}`}>
        <OrnateFrame variant="modal">
          {/* Circular Red Close Button with Gold Bevel */}
          {showCloseButton && (
            <button
              onClick={onClose}
              aria-label="Close dialog"
              className="absolute top-2 right-2 z-20 w-8 h-8 rounded-full bg-gradient-to-b from-[#FF5252] via-[#D50000] to-[#8B0000] text-white font-black text-sm border-2 border-[#FFE57F] shadow-[0_2px_6px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.7)] flex items-center justify-center hover:scale-110 active:scale-95 transition-transform"
            >
              ✕
            </button>
          )}

          {/* Inner Content Area */}
          <div className="p-4 text-[#1A1A1A]">{children}</div>
        </OrnateFrame>
      </div>
    </div>
  );
};
