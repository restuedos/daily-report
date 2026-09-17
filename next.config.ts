import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow Cloudflare quick tunnels (and similar) to load /_next assets in `next dev`
  allowedDevOrigins: ["*.trycloudflare.com"],
  serverExternalPackages: ["puppeteer", "@prisma/client", "prisma", "html-to-docx"],
};

export default nextConfig;
