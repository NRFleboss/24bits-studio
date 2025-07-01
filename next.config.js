/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: { ignoreDuringBuilds: true },
  images: {
    domains: [
      "i.scdn.co",
      "image-cdn-ak.spotifycdn.com", 
      "image-cdn-fa.spotifycdn.com",
      "mosaic.scdn.co",
      "lineup-images.scdn.co",
      "thisis-images.scdn.co",
      "e-cdns-images.dzcdn.net",
      "cdns-images.dzcdn.net",
      "e-cdn-images.dzcdn.net",
      "is1-ssl.mzstatic.com",
      "is2-ssl.mzstatic.com",
      "is3-ssl.mzstatic.com",
      "is4-ssl.mzstatic.com",
      "is5-ssl.mzstatic.com",
      "m.media-amazon.com"
    ],
  },
  experimental: {
    serverActions: {
      // Allow larger request bodies (e.g., images >1MB)
      bodySizeLimit: '10mb',
    },
  },
  // Add headers for FFmpeg.wasm
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'require-corp',
          },
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
