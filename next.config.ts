import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Empty turbopack config — satisfies Next.js 16 Turbopack requirement.
  // @react-pdf/renderer is loaded client-side only (dynamic ssr:false),
  // so no canvas alias is needed.
  turbopack: {},
};

export default nextConfig;
