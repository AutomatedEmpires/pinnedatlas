/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'https', hostname: 'upload.wikimedia.org' },
    ],
  },
  // Canonicalize www -> apex so there is a single indexable origin.
  async redirects() {
    return [
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'www.pinnedatlas.com' }],
        destination: 'https://pinnedatlas.com/:path*',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
