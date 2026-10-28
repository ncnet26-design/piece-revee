import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Camille } from "@/components/Camille";
import { CookieBanner, Footer, Header, TabBar, ThemeInit } from "@/components/Chrome";
import { JsonLd } from "@/components/JsonLd";
import { SITE, absoluteUrl } from "@/lib/site";

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: { default: `${SITE.name} · ${SITE.tagline}`, template: `%s · ${SITE.name}` },
  description: SITE.description,
  applicationName: SITE.name,
  manifest: "/manifest.webmanifest",
  icons: { icon: "/icon.svg", apple: "/apple-icon.png" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: "device-width", initialScale: 1, viewportFit: "cover",
  themeColor: [{ media: "(prefers-color-scheme: light)", color: "#F4F4EF" }, { media: "(prefers-color-scheme: dark)", color: "#0F110F" }],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <link rel="preload" href="/fonts/onest-latin.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
      </head>
      <body>
        <a href="#contenu" className="skip">Aller au contenu</a>
        <ThemeInit />
        <Header />
        <main id="contenu" className="wrap pt-7">{children}</main>
        <Footer />
        <TabBar />
        <Camille />
        <CookieBanner />
        <JsonLd data={{ "@context": "https://schema.org", "@type": "WebSite", name: SITE.name, url: absoluteUrl("/"), inLanguage: "fr-FR",
          potentialAction: { "@type": "SearchAction", target: `${absoluteUrl("/explorer/")}?q={q}`, "query-input": "required name=q" } }} />
      </body>
    </html>
  );
}
