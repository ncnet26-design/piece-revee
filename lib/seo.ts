import type { Metadata } from "next";
import { SITE, absoluteUrl } from "./site";

export function meta(o: { title: string; description: string; path: string; image?: string; noindex?: boolean }): Metadata {
  const url = absoluteUrl(o.path);
  return {
    title: o.title,
    description: o.description,
    alternates: { canonical: url },
    openGraph: { title: o.title, description: o.description, url, siteName: SITE.name, locale: SITE.locale, type: "website", images: [{ url: absoluteUrl(o.image ?? "/og.png"), width: 1200, height: 630 }] },
    twitter: { card: "summary_large_image", title: o.title, description: o.description },
    robots: o.noindex ? { index: false, follow: true } : undefined,
  };
}
