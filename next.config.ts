import type { NextConfig } from "next";

const buckets = ['product-images', 'category-images'];
// Images come from the Supabase in SUPABASE_URL; a local one (dev server, or a local build) is served over loopback.
const supabaseUrl = process.env.SUPABASE_URL ? new URL(process.env.SUPABASE_URL) : null;
const localSupabase = supabaseUrl && ['localhost', '127.0.0.1'].includes(supabaseUrl.hostname) ? supabaseUrl : null;

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
      ...(localSupabase
        ? buckets.map(bucket => ({
            protocol: localSupabase.protocol === 'https:' ? 'https' as const : 'http' as const,
            hostname: localSupabase.hostname,
            port: localSupabase.port,
            pathname: `/storage/v1/object/public/${bucket}/**`,
            search: '',
          }))
        : []),
    ],
    // Next blocks image optimization from loopback addresses by default; only a local Supabase needs it.
    dangerouslyAllowLocalIP: Boolean(localSupabase),
  },
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
