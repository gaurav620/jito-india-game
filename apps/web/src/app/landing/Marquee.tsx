'use client';

import type { ReactNode } from 'react';

import styles from './landing.module.css';

interface MarqueeProps {
  children: ReactNode;
}

/**
 * Local replacement for the native `<marquee>` tag (not a valid JSX
 * intrinsic — TypeScript rejects it under `next build`'s type check).
 * Reproduces the same continuous right-to-left scroll via a CSS animation.
 */
export function Marquee({ children }: MarqueeProps) {
  return (
    <div className={styles.marquee}>
      <div className={styles.marqueeTrack}>{children}</div>
    </div>
  );
}
