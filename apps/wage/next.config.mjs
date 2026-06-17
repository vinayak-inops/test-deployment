/** @type {import('next').NextConfig} */

// ✅ Read comma-separated origins from env
const rawAllowedOrigins =
  process.env.NEXT_PUBLIC_NEXTAUTH_URL?.split(',') || [];

// ✅ Normalize function
/** @param {string} value @returns {string} */
const normalizeOrigin = (value) => {
  if (!value) return '';

  try {
    const url = new URL(value.trim());

    // Allow only http/https
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return '';
    }

    return url.origin;
  } catch {
    return '';
  }
};

// ✅ Normalize + filter invalid values
/** @type {string[]} */
const allowedOrigins = rawAllowedOrigins
  .map(normalizeOrigin)
  .filter(Boolean);

// ✅ Pick first origin as fallback for CORS
/** @type {string | null} */
const primaryOrigin =
  allowedOrigins.length > 0 ? allowedOrigins[0] : null;

const nextConfig = {
  // Base path for wages app
  basePath: '/wages',
  assetPrefix: '/wages',

  // Configure rewrites for internal routing
  async rewrites() {
    return {
      beforeFiles: [
        // Handle internal API routes
        {
          source: '/wages/api/:path*',
          destination: '/api/:path*',
        },
        // Handle static files
        {
          source: '/wages/_next/:path*',
          destination: '/_next/:path*',
        },
      ],
    };
  },

  // Headers (CORS + Security)
  async headers() {
    const headers = [
      { key: 'Access-Control-Allow-Credentials', value: 'true' },
      {
        key: 'Access-Control-Allow-Methods',
        value: 'GET,OPTIONS,PATCH,DELETE,POST,PUT',
      },
      {
        key: 'Access-Control-Allow-Headers',
        value:
          'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization',
      },
      { key: 'Vary', value: 'Origin' },
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      {
        key: 'Referrer-Policy',
        value: 'strict-origin-when-cross-origin',
      },
    ];

    if (allowedOrigins.length > 0) {
      // ⚠️ CORS allows only ONE origin
      headers.push({
        key: 'Access-Control-Allow-Origin',
        value: primaryOrigin || '',
      });

      // ✅ CSP allows multiple
      headers.push({
        key: 'Content-Security-Policy',
        value: `frame-ancestors 'self' ${allowedOrigins.join(' ')}`,
      });
    } else {
      headers.push({
        key: 'Content-Security-Policy',
        value: "frame-ancestors 'none'",
      });
    }

    return [
      {
        source: '/:path*',
        headers,
      },
    ];
  },

  reactStrictMode: true,

  webpack: (config) => {
    return config;
  },
};

export default nextConfig;
