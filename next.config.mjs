/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
    ],
  },
  experimental: {
    // Keep server actions body limit generous for multi-photo metadata payloads.
    serverActions: { bodySizeLimit: '4mb' },
  },
};

export default nextConfig;
