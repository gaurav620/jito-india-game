'use client';

import { Button, Input, OrnateFrame } from '@jito/ui';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';

export default function RegisterPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(true);
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
      <div className="w-full max-w-md relative z-10 my-8">
        <div className="text-center mb-6">
          <Link href="/" className="inline-block">
            <h1 className="font-extrabold text-3xl tracking-tight text-[#FFE57F] uppercase drop-shadow">
              JITO INDIA <span className="text-white">GAMES</span>
            </h1>
          </Link>
          <p className="text-xs font-bold text-[#DAA520] tracking-widest uppercase mt-1">
            NEW PLAYER REGISTRATION • POINTS GAMING
          </p>
        </div>

        <OrnateFrame variant="modal">
          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div className="text-center border-b border-[#D4AF37]/30 pb-2.5 mb-3">
              <h2 className="font-black text-xl text-[#332200] uppercase tracking-wide">
                CREATE ACCOUNT
              </h2>
              <p className="text-xs text-gray-600 font-bold mt-0.5">
                Join JITO INDIA Games and start playing with demo points
              </p>
            </div>

            <Input
              label="Username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. Player772"
              required
            />

            <Input
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="player@example.com"
              required
            />

            <Input
              label="Phone Number"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 98765 43210"
              required
            />

            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min. 8 characters"
              required
            />

            <Input
              label="Confirm Password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repeat password"
              required
            />

            <div className="pt-1">
              <label className="flex items-start gap-2 text-xs font-bold text-[#332200] cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  required
                  className="rounded border-[#D4AF37] text-amber-600 focus:ring-amber-500 mt-0.5"
                />
                <span>
                  I confirm that I am 18+ and understand this platform operates for amusement only with points.
                </span>
              </label>
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                variant="gold"
                fullWidth
                size="lg"
                isLoading={isLoading}
              >
                CREATE MY ACCOUNT
              </Button>
            </div>

            <div className="text-center pt-3 border-t border-[#D4AF37]/30 text-xs font-bold text-[#332200]">
              Already registered?{' '}
              <Link href="/login" className="text-[#007E33] hover:underline font-black">
                Log In Instead
              </Link>
            </div>
          </form>
        </OrnateFrame>

        <div className="text-center mt-6">
          <Link href="/" className="text-xs text-gray-400 hover:text-white font-bold transition">
            ← Return to Homepage
          </Link>
        </div>
      </div>
    </div>
  );
}
