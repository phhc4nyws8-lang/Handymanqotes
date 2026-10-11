import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: false,
  },
  images: {
    remotePatterns: [],
  },
  experimental: {
    // Server Actions default to a 1MB body limit, well under the 30MB photo
    // cap enforced in src/lib/uploads/storage.ts — full-resolution phone
    // camera photos can run 15-25MB+, so without this they get truncated
    // mid-upload ("Unexpected end of form") before that check ever runs.
    serverActions: {
      bodySizeLimit: "32mb",
    },
  },
};

export default nextConfig;
