import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
