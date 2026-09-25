/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@jito/ui', '@jito/game-core', '@jito/shared', '@jito/config', '@jito/types'],
  async rewrites() {
    return [
      {
        source: '/Builds/KheloJeeto.exe',
        destination: 'https://kheloindians.com/Builds/KheloIndia.exe',
      },
      {
        source: '/Builds/KheloJeeto-Print.exe',
        destination: 'https://kheloindians.com/Builds/KheloIndia-Print.exe',
      },
      {
        source: '/Builds/KheloJeeto.apk',
        destination: 'https://kheloindians.com/Builds/KheloIndia.apk',
      },
      {
        source: '/Builds/:path*',
        destination: 'https://kheloindians.com/Builds/:path*',
      },
    ];
  },
};

module.exports = nextConfig;
