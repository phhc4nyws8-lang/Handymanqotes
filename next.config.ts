import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: false,
  },
  images: {
    remotePatterns: [],
  },
  experimental: {
    // Server Actions default to a 1MB body limit, well under the 10MB photo
    // cap enforced in src/lib/uploads/storage.ts — phone camera photos
    // routinely exceed 1MB, so without this they get truncated mid-upload
    // ("Unexpected end of form") before that check ever runs.
    serverActions: {
      bodySizeLimit: "12mb",
    },
  },
};

export default nextConfig;
