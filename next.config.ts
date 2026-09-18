import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Cloudflare quick tunnels change hostname each run; allow HMR/websockets from them
  // so Enter/state updates don't force a full page reload in the browser.
  allowedDevOrigins: ["**.trycloudflare.com"],
  serverExternalPackages: [
    "puppeteer",
    "@prisma/client",
    "prisma",
    "html-to-docx",
    "jszip",
    "@xmldom/xmldom",
  ],
};

export default nextConfig;
