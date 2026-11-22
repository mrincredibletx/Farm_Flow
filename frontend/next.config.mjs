/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  reactStrictMode: false, // Prevents Leaflet dual-render issues in dev mode
};

export default nextConfig;

