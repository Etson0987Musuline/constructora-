import type { NextConfig } from "next";
const nextConfig: NextConfig = {
 output: "standalone",
 turbopack: { root: process.cwd() },
 async rewrites() {
  const backend = process.env.API_BACKEND_URL;
  return { beforeFiles: backend ? [{ source:"/api/:path*", destination:`${backend}/api/:path*` }] : [], afterFiles:[], fallback:[] };
 },
};
export default nextConfig;
