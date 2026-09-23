'use client';

import React from 'react';

export interface TotalPlayTooltipProps {
  totalPlay: number;
  /** 'left' uses Pop_Pixel_Icon_2 (tail on bottom-left); 'right' uses TotalinfoR (tail on bottom-right) */
  direction?: 'left' | 'right';
  style?: React.CSSProperties;
}

export const TotalPlayTooltip: React.FC<TotalPlayTooltipProps> = ({
  totalPlay,
  direction = 'right',
  style,
}) => {
  const isLeft = direction === 'left';

  return (
    <div
      style={{
        position: 'absolute',
        width: '82px',
        height: '84px',
        pointerEvents: 'none',
        zIndex: 50,
        filter: 'drop-shadow(0 2px 5px rgba(0, 0, 0, 0.5))',
        ...style,
      }}
    >
      {/* Background sprite (mirrored when direction is left so tail points left) */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: "url('/assets/tc/TotalinfoR.webp')",
          backgroundSize: '100% 100%',
          backgroundRepeat: 'no-repeat',
          transform: isLeft ? 'scaleX(-1)' : 'none',
        }}
      />

      {/* Top Header: "Total Play" */}
      <span
        style={{
          position: 'absolute',
          top: '12px',
          left: isLeft ? '8px' : '0px',
          width: '74px',
          textAlign: 'center',
          fontFamily: "'HERMESC_20', 'Century Gothic', sans-serif",
          fontSize: '13px',
          fontWeight: 'normal',
          color: '#FFFFFF',
          lineHeight: '1.2',
          letterSpacing: '0.2px',
          userSelect: 'none',
        }}
      >
        Total Play
      </span>

      {/* Bottom Value: e.g. "0" */}
      <span
        style={{
          position: 'absolute',
          top: '40px',
          left: isLeft ? '8px' : '0px',
          width: '74px',
          textAlign: 'center',
          fontFamily: "'HERMESC_20', 'Century Gothic', sans-serif",
          fontSize: '19px',
          fontWeight: 'normal',
          color: '#382006',
          lineHeight: '1',
          userSelect: 'none',
        }}
      >
        {totalPlay}
      </span>
    </div>
  );
};
