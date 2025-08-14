
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
  webpack: (config, { isServer }) => {
    config.plugins.push(
      new IgnorePlugin({
        resourceRegExp: /canvas/,
        contextRegExp: /jsdom$/,
      })
    );
    
    // Required for gif.js to work
    config.module.rules.push({
      test: /\.worker\.js$/,
      use: { loader: 'worker-loader' },
    });

    // The alias below is removed as it's not the correct way to handle
    // the pdf.js worker in recent Next.js versions and causes build failures.
    // The library handles its worker pathing correctly now with the new URL() import.
    return config;
  },
};

export default nextConfig;
