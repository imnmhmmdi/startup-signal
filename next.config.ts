import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";

const appRoot = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  turbopack: {
    root: appRoot,
  },
  async redirects() {
    return [
      { source: "/dashboard", destination: "/", permanent: true },
      { source: "/signal-hunter", destination: "/companies", permanent: true },
      { source: "/watchlist", destination: "/pipeline", permanent: true },
      { source: "/competitor-scan", destination: "/companies", permanent: true },
      { source: "/settings", destination: "/pipeline", permanent: true },
      { source: "/saved", destination: "/pipeline", permanent: true },
    ];
  },
};

export default nextConfig;
