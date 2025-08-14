
import type {NextConfig} from 'next';
import { IgnorePlugin } from 'webpack';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
  webpack: (config) => {
    config.plugins.push(
      new IgnorePlugin({
        resourceRegExp: /canvas/,
        contextRegExp: /jsdom$/,
      })
    );
    // The alias below is removed as it's not the correct way to handle
    // the pdf.js worker in recent Next.js versions and causes build failures.
    // The library handles its worker pathing correctly now with the new URL() import.
    return config;
  },
};

export default nextConfig;
