/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@cenfer/shared', '@cenfer/supabase'],
  experimental: { serverActions: { bodySizeLimit: '5mb' } },
};
export default nextConfig;
