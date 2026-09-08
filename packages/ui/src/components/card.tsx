import React from 'react';

export interface CardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'dark' | 'gold' | 'glass';
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  variant = 'dark',
}) => {
  const variantClasses = {
    dark: 'bg-[#12121A] border border-[#DAA520]/30 shadow-lg',
    gold: 'bg-gradient-to-b from-[#1C1608] via-[#12121A] to-[#1C1608] border-2 border-[#FFD700]/40 shadow-[0_4px_20px_rgba(255,215,0,0.15)]',
    glass: 'bg-[#1A1A2E]/80 backdrop-blur-md border border-white/10 shadow-xl',
  }[variant];

  return (
    <div className={`rounded-xl p-5 ${variantClasses} ${className}`}>
      {children}
    </div>
  );
};
