import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'gold' | 'green' | 'danger' | 'secondary' | 'ghost' | 'chip-action';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  isLoading?: boolean;
}

/**
 * JITO INDIA Casino Action Button
 * Features metallic bevels, gold trims, and tactile active press effects.
 */
export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'gold',
  size = 'md',
  fullWidth = false,
  isLoading = false,
  disabled,
  className = '',
  ...props
}) => {
  const sizeClasses = {
    sm: 'px-3 py-1 text-xs font-bold rounded',
    md: 'px-5 py-2 text-sm font-extrabold rounded-md',
    lg: 'px-6 py-3 text-base font-black tracking-wide rounded-lg',
  }[size];

  const variantClasses = {
    gold: 'bg-gradient-to-b from-[#FFE57F] via-[#FFD700] to-[#B8860B] text-[#0A0A0F] border border-[#FFE57F] shadow-[0_3px_8px_rgba(184,134,11,0.5),inset_0_1px_0_rgba(255,255,255,0.7)] hover:brightness-110 active:translate-y-[1px]',
    green:
      'bg-gradient-to-b from-[#69F0AE] via-[#00C853] to-[#007E33] text-white border border-[#B9F6CA] shadow-[0_3px_8px_rgba(0,126,51,0.5),inset_0_1px_0_rgba(255,255,255,0.6)] hover:brightness-110 active:translate-y-[1px]',
    danger:
      'bg-gradient-to-b from-[#FF8A80] via-[#FF1744] to-[#C62828] text-white border border-[#FFCDD2] shadow-[0_3px_8px_rgba(198,40,40,0.5),inset_0_1px_0_rgba(255,255,255,0.6)] hover:brightness-110 active:translate-y-[1px]',
    secondary:
      'bg-[#1A1A2E] text-[#FFD700] border border-[#DAA520]/60 hover:bg-[#25253D] active:translate-y-[1px]',
    ghost:
      'bg-transparent text-gray-300 hover:text-white hover:bg-white/10 active:translate-y-[1px]',
    'chip-action':
      'bg-gradient-to-b from-[#A5D6A7] via-[#2E7D32] to-[#1B5E20] text-white border-2 border-[#FFE57F] rounded-lg shadow-[0_4px_10px_rgba(0,0,0,0.6),inset_0_1px_2px_rgba(255,255,255,0.7)] uppercase tracking-wider font-black hover:brightness-115 active:scale-95',
  }[variant];

  const disabledClass = disabled || isLoading
    ? 'opacity-50 cursor-not-allowed pointer-events-none filter grayscale-[40%]'
    : 'cursor-pointer';

  return (
    <button
      disabled={disabled || isLoading}
      className={`inline-flex items-center justify-center transition-all duration-150 select-none ${sizeClasses} ${variantClasses} ${disabledClass} ${
        fullWidth ? 'w-full' : ''
      } ${className}`}
      {...props}
    >
      {isLoading ? (
        <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
      ) : null}
      {children}
    </button>
  );
};
