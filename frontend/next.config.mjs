/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false, // Prevents Leaflet dual-render issues in dev mode
  async rewrites() {
    return [
      {
        source: '/api/v1/:path*',
        destination: 'http://127.0.0.1:8000/api/v1/:path*',
      },
    ];
  },
};

export default nextConfig;

