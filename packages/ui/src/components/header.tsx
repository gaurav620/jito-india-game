import React from 'react';

export interface CasinoTopBarProps {
  gameTitle?: string;
  gameId?: string;
  username?: string;
  pointsBalance?: number;
  onLobbyClick?: () => void;
  onMinimize?: () => void;
  onClose?: () => void;
  className?: string;
}

/**
 * Casino Desktop Game Application Top Bar
 * Recreates the exact information hierarchy observed in the reference videos:
 * LOBBY | Game Title Tab | FOR AMUSEMENT ONLY | Welcome, [USER] | POINTS BALANCE | window controls
 */
export const CasinoTopBar: React.FC<CasinoTopBarProps> = ({
  gameTitle = 'Triple Chance Timer',
  gameId = '736TC658',
  username = 'PINTU',
  pointsBalance = 64707.0,
  onLobbyClick,
  onMinimize,
  onClose,
  className = '',
}) => {
  return (
    <header
      className={`w-full bg-gradient-to-b from-[#2A2A38] via-[#161622] to-[#0A0A10] border-b-2 border-[#FFE57F]/40 px-3 py-1.5 flex items-center justify-between text-xs select-none shadow-[0_4px_12px_rgba(0,0,0,0.8)] ${className}`}
    >
      {/* Left Zone: LOBBY button + Game Tab + Game ID */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onLobbyClick}
          className="px-3 py-1 rounded bg-gradient-to-b from-[#3E3E50] to-[#1E1E28] hover:from-[#4E4E62] hover:to-[#2A2A36] text-gray-200 font-extrabold text-[11px] tracking-wider uppercase border border-gray-600 shadow transition-all active:scale-95"
        >
          LOBBY
        </button>

        {/* Active Game Red Tab */}
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-t bg-gradient-to-b from-[#E53935] to-[#B71C1C] border border-[#FF8A80] text-white font-extrabold text-[11px] shadow">
          <span>{gameTitle}</span>
          <button
            type="button"
            onClick={onClose}
            className="w-3.5 h-3.5 rounded-full bg-black/40 hover:bg-black/70 flex items-center justify-center text-[9px] ml-1"
          >
            ✕
          </button>
        </div>

        {/* Game ID Badge */}
        {gameId && (
          <span className="hidden md:inline-block font-mono font-bold text-[11px] text-[#00E676] tracking-wide ml-2">
            GAME ID <span className="text-white">{gameId}</span>
          </span>
        )}
      </div>

      {/* Center Zone: Amusement Badge */}
      <div className="hidden lg:flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#12121A] border border-[#DAA520]/50 text-[#FFD700] text-[10px] font-black uppercase tracking-wider shadow-inner">
        <span>🔑</span>
        <span>FOR AMUSEMENT ONLY</span>
      </div>

      {/* Right Zone: User Greeting + Points Balance + Window Controls */}
      <div className="flex items-center gap-2">
        <div className="px-3 py-1 rounded bg-[#101018] border border-gray-700 text-gray-200 font-bold text-[11px]">
          Welcome, <span className="text-[#FFD700] font-black">{username}</span>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1 rounded bg-black border border-[#FFD700]/60 shadow-[0_0_8px_rgba(255,215,0,0.3)]">
          <span className="text-[10px] font-black text-[#DAA520] uppercase tracking-wider">
            POINTS BALANCE
          </span>
          <span className="font-mono font-black text-sm text-[#00E676]">
            {pointsBalance.toLocaleString('en-IN', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </span>
        </div>

        {/* Window controls */}
        <div className="flex items-center gap-1 ml-1">
          <button
            type="button"
            onClick={onMinimize}
            className="w-6 h-5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-black flex items-center justify-center border border-emerald-400 text-xs shadow"
            title="Minimize"
          >
            –
          </button>
          <button
            type="button"
            onClick={onClose}
            className="w-6 h-5 rounded bg-red-600 hover:bg-red-500 text-white font-black flex items-center justify-center border border-red-400 text-xs shadow"
            title="Close"
          >
            ✕
          </button>
        </div>
      </div>
    </header>
  );
};

export interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  subtitle,
  action,
  className = '',
}) => {
  return (
    <div className={`flex items-center justify-between border-b border-white/10 pb-4 mb-6 ${className}`}>
      <div>
        <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
          <span className="w-2 h-5 bg-gradient-to-b from-[#FFE57F] to-[#B8860B] rounded-sm" />
          {title}
        </h2>
        {subtitle && <p className="text-xs text-gray-400 mt-1 font-medium">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
};
