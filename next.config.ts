import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: process.cwd(),
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
