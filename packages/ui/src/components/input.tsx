import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

/**
 * Casino High-Contrast Text/Number Input
 */
export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, leftIcon, rightIcon, className = '', id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-bold uppercase tracking-wider text-[#DAA520] mb-1.5"
          >
            {label}
          </label>
        )}
        <div className="relative rounded-md shadow-sm">
          {leftIcon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={`block w-full rounded-md bg-[#0D0D14] border border-[#DAA520]/40 text-white placeholder-gray-500 font-medium text-sm focus:border-[#FFD700] focus:ring-1 focus:ring-[#FFD700] focus:outline-none transition-colors duration-150 ${
              leftIcon ? 'pl-10' : 'pl-3'
            } ${rightIcon ? 'pr-10' : 'pr-3'} py-2.5 ${
              error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''
            } ${className}`}
            {...props}
          />
          {rightIcon && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400">
              {rightIcon}
            </div>
          )}
        </div>
        {error && <p className="mt-1 text-xs text-red-400 font-semibold">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
