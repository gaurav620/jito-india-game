import React from 'react';

export interface ToastProps {
  type?: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  message: string;
  onClose?: () => void;
  className?: string;
}

export const Toast: React.FC<ToastProps> = ({
  type = 'info',
  title,
  message,
  onClose,
  className = '',
}) => {
  const borderClass = {
    success: 'border-l-4 border-l-[#00E676]',
    error: 'border-l-4 border-l-[#FF5252]',
    warning: 'border-l-4 border-l-[#FFAB00]',
    info: 'border-l-4 border-l-[#448AFF]',
  }[type];

  return (
    <div
      className={`rounded-lg bg-[#1A1A2E] border border-white/10 p-4 shadow-2xl flex items-start justify-between gap-3 max-w-sm ${borderClass} ${className}`}
    >
      <div>
        {title && <h4 className="font-extrabold text-sm text-white">{title}</h4>}
        <p className="text-xs text-gray-300 mt-0.5">{message}</p>
      </div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="text-gray-400 hover:text-white text-xs font-bold"
        >
          ✕
        </button>
      )}
    </div>
  );
};

export interface LoaderProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  className?: string;
}

export const Loader: React.FC<LoaderProps> = ({
  size = 'md',
  text,
  className = '',
}) => {
  const sizeClasses = {
    sm: 'w-5 h-5 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4',
  }[size];

  return (
    <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
      <div
        className={`rounded-full border-[#FFD700]/20 border-t-[#FFD700] animate-spin ${sizeClasses}`}
      />
      {text && (
        <span className="text-xs font-bold uppercase tracking-wider text-[#DAA520]">
          {text}
        </span>
      )}
    </div>
  );
};

export interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Something went wrong',
  message = 'Unable to complete your request. Please try again.',
  onRetry,
  className = '',
}) => {
  return (
    <div
      className={`rounded-xl border border-red-500/30 bg-red-950/20 p-8 text-center flex flex-col items-center justify-center max-w-md mx-auto ${className}`}
    >
      <div className="w-12 h-12 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center font-black text-xl mb-3">
        !
      </div>
      <h3 className="font-extrabold text-lg text-white">{title}</h3>
      <p className="text-xs text-gray-300 mt-1 max-w-xs">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 px-4 py-1.5 rounded bg-red-600 hover:bg-red-500 text-white font-bold text-xs uppercase tracking-wider transition"
        >
          Try Again
        </button>
      )}
    </div>
  );
};

export interface EmptyStateProps {
  title?: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'No Data Available',
  message = 'There are currently no items to display.',
  actionLabel,
  onAction,
  className = '',
}) => {
  return (
    <div
      className={`rounded-xl border border-white/10 bg-[#12121A] p-8 text-center flex flex-col items-center justify-center max-w-md mx-auto ${className}`}
    >
      <div className="w-12 h-12 rounded-full bg-white/5 text-gray-400 flex items-center justify-center font-bold text-xl mb-3">
        ∅
      </div>
      <h3 className="font-extrabold text-base text-gray-200">{title}</h3>
      <p className="text-xs text-gray-400 mt-1 max-w-xs">{message}</p>
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-4 px-4 py-1.5 rounded border border-[#DAA520] text-[#FFD700] hover:bg-[#FFD700]/10 font-bold text-xs uppercase tracking-wider transition"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};
