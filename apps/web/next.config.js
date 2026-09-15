/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@jito/ui', '@jito/game-core', '@jito/shared', '@jito/config', '@jito/types'],
};

module.exports = nextConfig;
