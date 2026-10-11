import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [{
      protocol: "https",
      hostname: "design-graduation-image.s3.ap-northeast-2.amazonaws.com",
      port: "",
      pathname: "/archive/*.webp",
      search: "",
    }],
  },
};

export default nextConfig;
