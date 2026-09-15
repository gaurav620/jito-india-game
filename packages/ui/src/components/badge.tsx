import React from 'react';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'gold' | 'green' | 'red' | 'blue' | 'gray';
  size?: 'sm' | 'md';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'gold',
  size = 'md',
  className = '',
}) => {
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-[10px]',
    md: 'px-2.5 py-1 text-xs',
  }[size];

  const variantClasses = {
    gold: 'bg-[#FFD700]/20 text-[#FFD700] border border-[#FFD700]/40',
    green: 'bg-[#00C853]/20 text-[#00E676] border border-[#00C853]/40',
    red: 'bg-[#D50000]/20 text-[#FF5252] border border-[#D50000]/40',
    blue: 'bg-[#2979FF]/20 text-[#82B1FF] border border-[#2979FF]/40',
    gray: 'bg-white/10 text-gray-300 border border-white/20',
  }[variant];

  return (
    <span
      className={`inline-flex items-center font-extrabold uppercase tracking-wider rounded-full ${sizeClasses} ${variantClasses} ${className}`}
    >
      {children}
    </span>
  );
};
