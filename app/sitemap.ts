import type { MetadataRoute } from "next";
import { FURNITURE, GUIDES, MATERIALS, PAIRINGS, PLACES, PLANTS, STYLES } from "@/content/index";
import { LEGAL } from "@/content/legal";
import { absoluteUrl } from "@/lib/site";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date("2026-10-26");
  const statics = ["/", "/galerie/", "/quiz/", "/tarifs/", "/explorer/", "/matieres/", "/accords/", "/mobilier/", "/lieux/", "/plantes/", "/styles/", "/guides/"];
  const dyn = [
    ...MATERIALS.map((x) => `/matieres/${x.slug}/`), ...PAIRINGS.map((x) => `/accords/${x.slug}/`), ...FURNITURE.map((x) => `/mobilier/${x.slug}/`),
    ...PLACES.map((x) => `/lieux/${x.slug}/`), ...PLANTS.map((x) => `/plantes/${x.slug}/`), ...STYLES.map((x) => `/styles/${x.slug}/`),
    ...GUIDES.map((x) => `/guides/${x.slug}/`), ...LEGAL.map((x) => `/legal/${x.slug}/`),
  ];
  return [...statics, ...dyn].map((p) => ({ url: absoluteUrl(p), lastModified: now, changeFrequency: p === "/" ? "weekly" : "monthly", priority: p === "/" ? 1 : statics.includes(p) ? 0.8 : 0.6 }));
}
