'use client';

import React, { useCallback } from 'react';

import { SplashScreen } from '@/components/splash/SplashScreen';

/**
 * Splash Screen Route (`/splash`)
 *
 * Provides initial boot sequence, asset verification, and animated progress
 * matching reference-game (pr-project-2-main), transitioning seamlessly to /login.
 *
 * Navigation strategy: `window.location.replace` is used instead of Next.js
 * `router.push` because the splash fires `onComplete` very early in the page
 * lifecycle (before full client-side hydration completes), which can cause the
 * router to silently drop the navigation. A hard browser replace is guaranteed
 * to work in all timing scenarios and also prevents the splash from appearing
 * in the browser's back-button history.
 */
export default function SplashPage() {
  /** Navigate to the login screen, replacing the splash in history. */
  const handleComplete = useCallback(() => {
    window.location.replace('/login');
  }, []);

  return <SplashScreen onComplete={handleComplete} targetDurationMs={1800} />;
}
