import type { NextConfig } from "next";

// Export statique : tout le site est généré en HTML à la publication
// (hébergement gratuit sur Cloudflare Pages, voir docs/DECISIONS.md).
const config: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
  reactStrictMode: true,
  poweredByHeader: false,
};

export default config;
