import type { NextConfig } from "next";
import { getSeoConfig } from "./lib/seo";

getSeoConfig();

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "upload.wikimedia.org" },
    ],
  },
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
      {
        source: "/:path(backend|cart|checkout|offline)/:rest*",
        headers: [{ key: "X-Robots-Tag", value: "noindex, follow" }],
      },
      {
        // Never let the browser HTTP-cache the service worker, so clients
        // always pick up a new version on the next visit.
        source: "/sw.js",
        headers: [
          {
            key: "Content-Type",
            value: "application/javascript; charset=utf-8",
          },
          {
            key: "Cache-Control",
            value: "no-cache, no-store, must-revalidate",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
