import type { NextConfig } from 'next';
const nextConfig: NextConfig = { transpilePackages:['@repo/api-client','@repo/schemas','@repo/types'] };
export default nextConfig;
