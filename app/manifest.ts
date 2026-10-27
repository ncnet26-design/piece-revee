import type { MetadataRoute } from "next";

export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Pièce Rêvée", short_name: "Pièce Rêvée", description: "Votre intérieur rêvé, réellement faisable.",
    start_url: "/", display: "standalone", background_color: "#F7F5F0", theme_color: "#161512", lang: "fr",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }, { src: "/icon-192.png", sizes: "192x192", type: "image/png" }, { src: "/icon-512.png", sizes: "512x512", type: "image/png" }],
  };
}
