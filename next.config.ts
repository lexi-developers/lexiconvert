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
    return config;
  },
};

export default nextConfig;
