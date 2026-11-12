import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        // Guitar samples rarely change. Let browsers and the CDN keep them for a
        // week and refresh in the background, so switching guitars on a return
        // visit doesn't re-download them. Not `immutable`: file names carry no hash.
        source: "/audio/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=604800, stale-while-revalidate=86400" }],
      },
    ];
  },
};

export default nextConfig;
