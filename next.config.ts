import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  basePath: "/tyre-retail-management-system",
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
