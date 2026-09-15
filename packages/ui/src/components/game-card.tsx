import React from 'react';

import { Button } from './button';

export interface GameCardProps {
  id: string;
  title: string;
  category: string;
  description: string;
  badge?: string;
  activePlayers?: number;
  imageUrl?: string;
  onPlay?: (id: string) => void;
  className?: string;
}

/**
 * Lobby Game Card
 * Displays game variant information, active players, and launch action.
 */
export const GameCard: React.FC<GameCardProps> = ({
  id,
  title,
  category,
  description,
  badge = 'HOT',
  activePlayers = 142,
  imageUrl,
  onPlay,
  className = '',
}) => {
  return (
    <div
      className={`group relative rounded-2xl overflow-hidden bg-gradient-to-b from-[#1C1608] via-[#12121A] to-[#0A0A0F] border-2 border-[#DAA520]/50 hover:border-[#FFD700] transition-all duration-200 shadow-[0_8px_25px_rgba(0,0,0,0.8)] hover:shadow-[0_12px_35px_rgba(255,215,0,0.3)] flex flex-col ${className}`}
    >
      {/* Top Banner / Graphic Preview */}
      <div className="relative h-44 w-full bg-gradient-to-tr from-[#3E2723] via-[#7D5A12] to-[#B71C1C] flex items-center justify-center overflow-hidden">
        {imageUrl ? (
          <img src={imageUrl} alt={title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className="relative flex flex-col items-center justify-center p-4 text-center">
            {/* Decorative Gold Circular Emblems */}
            <div className="w-20 h-20 rounded-full border-4 border-[#FFE57F] bg-gradient-to-b from-[#FFD700] via-[#B8860B] to-[#7D5A12] flex items-center justify-center shadow-lg group-hover:rotate-12 transition-transform duration-300">
              <span className="font-mono font-black text-2xl text-black">772</span>
            </div>
            <div className="mt-2 text-xs font-black uppercase tracking-widest text-[#FFE57F] drop-shadow">
              3-Ring Wheel Draw
            </div>
          </div>
        )}

        {/* Badge */}
        {badge && (
          <div className="absolute top-3 right-3 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-red-600 to-amber-500 text-white font-black text-[10px] tracking-wider uppercase border border-amber-300 shadow">
            {badge}
          </div>
        )}

        {/* Category Pill */}
        <div className="absolute top-3 left-3 px-2.5 py-0.5 rounded-full bg-black/70 backdrop-blur-sm text-[#FFD700] font-bold text-[10px] tracking-wide uppercase border border-[#FFD700]/30">
          {category}
        </div>
      </div>

      {/* Content Area */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="font-extrabold text-xl text-white group-hover:text-[#FFD700] transition-colors">
            {title}
          </h3>
          <p className="mt-1 text-xs text-gray-400 line-clamp-2 leading-relaxed">
            {description}
          </p>

          <div className="mt-4 flex items-center justify-between text-xs font-bold text-gray-400 border-t border-white/5 pt-3">
            <span className="flex items-center gap-1.5 text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              {activePlayers} Playing Now
            </span>
            <span className="text-[#DAA520]">Server Synced</span>
          </div>
        </div>

        <div className="mt-5">
          <Button
            variant="gold"
            fullWidth
            onClick={() => onPlay?.(id)}
            className="tracking-wider"
          >
            PLAY NOW
          </Button>
        </div>
      </div>
    </div>
  );
};
