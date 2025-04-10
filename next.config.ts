import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
  },
  // Disable server side rendering for static export
  trailingSlash: true,
};

export default nextConfig;
