/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },

  // This tells Next.js: "When someone visits '/', show them '/u/lionelyu' instead"
  async rewrites() {
    return [
      {
        source: '/',
        destination: '/u/lionelyu',
      },
    ];
  },
};

export default nextConfig
