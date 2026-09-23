'use client';

import React from 'react';

import { AuthStage } from '@/components/auth/AuthStage';

export default function RegisterPage() {
  return <AuthStage initialScreen="register" />;
}
