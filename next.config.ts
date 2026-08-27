import path from "node:path";
import type { NextConfig } from "next";
import { SECURITY_HEADERS } from "./lib/security-headers";
import { assertProductionSiteUrl } from "./lib/site-config";

assertProductionSiteUrl();

const nextConfig: NextConfig = {
  compiler: {
    styledComponents: true,
  },
  outputFileTracingRoot: path.join(__dirname),
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [...SECURITY_HEADERS],
      },
    ];
  },
};

export default nextConfig;
