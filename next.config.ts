import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: ['product-images', 'category-images'].map(bucket => ({
      protocol: 'https' as const,
      hostname: 'plamqblmcavrtioajopz.supabase.co',
      port: '',
      pathname: `/storage/v1/object/public/${bucket}/**`,
      search: '',
    })),
  },
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
