import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        // Never let a CDN/browser cache serve a stale service worker —
        // the SW's own Cache API (public/sw.js) already handles asset
        // versioning; this header is just about the request for the
        // script file itself always reaching the server to check for a
        // new version, so an update actually gets picked up.
        source: "/sw.js",
        headers: [{ key: "Cache-Control", value: "no-cache, no-store, must-revalidate" }],
      },
    ];
  },
};

export default nextConfig;
