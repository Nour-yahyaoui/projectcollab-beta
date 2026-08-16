/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
    ],
  },
  // Every /api/* route below is deployed as an individual serverless
  // function automatically when this app is deployed on Vercel.

  async headers() {
    // Applied to every response. Google Fonts is the only external
    // resource this app loads, so the CSP is otherwise locked to 'self'.
    const csp = [
      "default-src 'self'",
      // Next.js needs 'unsafe-inline' for its hydration bootstrap script
      // and 'unsafe-eval' in dev (fast refresh); tighten further with a
      // nonce-based policy if you add third-party scripts later.
      "script-src 'self' 'unsafe-inline'" + (process.env.NODE_ENV !== "production" ? " 'unsafe-eval'" : ""),
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: https://avatars.githubusercontent.com https://lh3.googleusercontent.com",
      "connect-src 'self'",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; ");

    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: csp },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          // HSTS: only meaningful over HTTPS, and Vercel/Neon-style hosts
          // already terminate TLS in front of the app — safe to always send.
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
