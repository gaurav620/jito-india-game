import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'JITO INDIA GAMES — Modern Gaming Platform',
  description:
    'Experience premier casino-style draw games: Triple Chance Timer and Triple Chance Pro Timer. Fast, lag-free desktop and mobile gaming for amusement only.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@500;700;800&family=Kaushan+Script&family=Oswald:wght@400;500;600;700&family=Outfit:wght@700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-[#0A0A0F] text-gray-100 antialiased selection:bg-[#FFD700] selection:text-black">
        {children}
      </body>
    </html>
  );
}
