import Image from 'next/image';
import React from 'react';

export interface JitoLogoProps {
  width?: number;
  height?: number;
  priority?: boolean;
  className?: string;
}

/**
 * Official JITO INDIA GAMES Logo Component
 *
 * Centralizes rendering of the authentic brand logo (`/jito-india-logo.png`)
 * across all pages and views with optimal Next.js Image handling.
 */
export const JitoLogo: React.FC<JitoLogoProps> = ({
  width = 360,
  height = 214,
  priority = true,
  className = '',
}) => {
  return (
    <Image
      src="/jito-india-logo.png"
      alt="JITO INDIA GAMES"
      width={width}
      height={height}
      priority={priority}
      className={`object-contain pointer-events-none ${className}`}
    />
  );
};
