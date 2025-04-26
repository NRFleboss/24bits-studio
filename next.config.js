/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: { ignoreDuringBuilds: true },
  experimental: {
    serverActions: {
      // Allow larger request bodies (e.g., images >1MB)
      bodySizeLimit: '10mb',
    },
  },
};

module.exports = nextConfig;
