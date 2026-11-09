/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },

  // Ultimate Pianist's door (https://musical.bio/?from=ultimatepianist) goes to the
  // "create your Musical Bio from your Ultimate Pianist account?" prompt instead of
  // the bio page at `/`. Redirects run before middleware, so the bio A/B test never
  // sees these requests. Off until the Ultimate Pianist sign-in is configured.
  async redirects() {
    const upEnabled = !!(process.env.AUTH_ULTIMATEPIANIST_ID?.trim() && process.env.AUTH_ULTIMATEPIANIST_SECRET?.trim());
    if (!upEnabled) return [];
    return [
      {
        source: '/',
        has: [{ type: 'query', key: 'from', value: 'ultimatepianist' }],
        destination: '/signup?from=ultimatepianist',
        permanent: false,
      },
    ];
  },

  // Rewrites for cleaner URLs
  async rewrites() {
    return [
      // Root goes to your profile
      {
        source: '/',
        destination: '/u/lionelyu',
      },
      // Story page
      {
        source: '/:username/story',
        destination: '/u/:username/story',
      },
      // /:username maps to /u/:username, excluding reserved first segments.
      // Reserved names are matched as whole segments, so "ursula" or "apiary" still
      // resolve; favicon stays a prefix (favicon.ico, favicon-32x32.png, ...).
      {
        source: '/:username((?!(?:admin|login|signup|api|_next|u)(?:/|$)|favicon).*)',
        destination: '/u/:username',
      },
    ];
  },
};

export default nextConfig
