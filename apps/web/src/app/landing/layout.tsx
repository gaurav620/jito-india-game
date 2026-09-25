import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Welcome to khelojeeto.com',
  description: 'Welcome to khelojeeto.com - Entertainment Only',
};

export default function LandingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
