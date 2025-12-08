/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },

  // Rewrites for cleaner URLs
  async rewrites() {
    return [
      // Root goes to your profile
      {
        source: '/',
        destination: '/u/lionelyu',
      },
      // /:username maps to /u/:username (excluding reserved paths)
      {
        source: '/:username((?!admin|login|signup|api|_next|u|favicon).*)',
        destination: '/u/:username',
      },
    ];
  },
};

export default nextConfig
