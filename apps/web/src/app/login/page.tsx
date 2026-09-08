'use client';

import { Button, Input, OrnateFrame } from '@jito/ui';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('PINTU');
  const [password, setPassword] = useState('••••••••');
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      router.push('/games/triple-chance');
    }, 600);
  };

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-gray-100 flex flex-col items-center justify-center p-4 selection:bg-[#FFD700] selection:text-black">
      {/* Background radial glow */}
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_center,rgba(218,165,32,0.15)_0%,transparent_70%)] pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <Link href="/" className="inline-block">
            <h1 className="font-extrabold text-3xl tracking-tight text-[#FFE57F] uppercase drop-shadow">
              JITO INDIA <span className="text-white">GAMES</span>
            </h1>
          </Link>
          <p className="text-xs font-bold text-[#DAA520] tracking-widest uppercase mt-1">
            MEMBER LOGIN PORTAL • FOR AMUSEMENT ONLY
          </p>
        </div>

        {/* Ornate Gold Framed Form */}
        <OrnateFrame variant="modal">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="text-center border-b border-[#D4AF37]/30 pb-3 mb-4">
              <h2 className="font-black text-xl text-[#332200] uppercase tracking-wide">
                PLAYER SIGN IN
              </h2>
              <p className="text-xs text-gray-600 font-bold mt-0.5">
                Enter your credentials to access your points account
              </p>
            </div>

            <Input
              label="Username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username"
              required
            />

            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              required
            />

            <div className="flex items-center justify-between text-xs font-bold text-[#332200]">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-[#D4AF37] text-amber-600 focus:ring-amber-500"
                />
                <span>Remember Me</span>
              </label>

              <span className="text-amber-800 hover:underline cursor-pointer">
                Forgot password?
              </span>
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                variant="green"
                fullWidth
                size="lg"
                isLoading={isLoading}
              >
                LOG IN TO PLAY
              </Button>
            </div>

            <div className="text-center pt-3 border-t border-[#D4AF37]/30 text-xs font-bold text-[#332200]">
              Don&apos;t have an account?{' '}
              <Link href="/register" className="text-[#007E33] hover:underline font-black">
                Register New User
              </Link>
            </div>
          </form>
        </OrnateFrame>

        {/* Return home link */}
        <div className="text-center mt-6">
          <Link href="/" className="text-xs text-gray-400 hover:text-white font-bold transition">
            ← Return to Homepage
          </Link>
        </div>
      </div>
    </div>
  );
}
