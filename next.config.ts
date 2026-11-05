import type { NextConfig } from "next";

const buckets = ['product-images', 'category-images'];
const isDev = process.env.NODE_ENV === 'development';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      ...buckets.map(bucket => ({
        protocol: 'https' as const,
        hostname: 'plamqblmcavrtioajopz.supabase.co',
        port: '',
        pathname: `/storage/v1/object/public/${bucket}/**`,
        search: '',
      })),
      // The dev server reads images from the local Supabase Storage started by `supabase start`.
      // Same hosts as the dev guard in readSupabaseEnv.
      ...(isDev
        ? ['127.0.0.1', 'localhost'].flatMap(hostname => buckets.map(bucket => ({
            protocol: 'http' as const,
            hostname,
            port: '54321',
            pathname: `/storage/v1/object/public/${bucket}/**`,
            search: '',
          })))
        : []),
    ],
    // Next blocks image optimization from loopback addresses by default; only the dev server needs it.
    dangerouslyAllowLocalIP: isDev,
  },
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
