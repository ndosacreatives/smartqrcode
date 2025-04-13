const { loadEnvConfig } = require('@next/env');

// Load environment variables from .env.* files
const projectDir = process.cwd();
loadEnvConfig(projectDir);

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Add your Next.js configuration options here

  // Make environment variables available (optional if already working, but good practice)
  env: {
    NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    NEXT_PUBLIC_FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
    // ADMIN_JWT_SECRET should NOT be listed here as it's server-side only
  },

  // Static export settings - only for production builds
  ...(process.env.NODE_ENV === 'production' ? {
    output: 'export',
    images: {
      unoptimized: true,
    },
    trailingSlash: true,
  } : {}),

  experimental: {
    // Add any experimental features you might be using
  },

  // Add other config options as needed
};

module.exports = nextConfig; 