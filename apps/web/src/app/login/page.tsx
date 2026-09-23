'use client';

import { useRouter } from 'next/navigation';
import React, { useCallback } from 'react';

import { AuthStage } from '@/components/auth/AuthStage';

/**
 * Login Page Route (`/login`)
 *
 * Renders the full-screen AuthStage in login mode.
 * On successful authentication the user is redirected to the Lobby (`/lobby`).
 */
export default function LoginPage() {
  const router = useRouter();

  /** Redirect to the lobby screen after a successful login. */
  const handleAuthSuccess = useCallback(() => {
    router.push('/lobby');
  }, [router]);

  return <AuthStage initialScreen="login" onSuccess={handleAuthSuccess} />;
}
