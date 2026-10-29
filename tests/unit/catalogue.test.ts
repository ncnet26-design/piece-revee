import { describe, expect, it } from "vitest";
import { chercher, famille, familleDe, type ProduitCatalogue } from "@/lib/catalogue";
import { robots } from "@/scripts/robot-catalogue";

describe("robot catalogue", () => {
  it("respecte robots.txt : groupe dédié ou « * », règle la plus précise, délai et plans de site", () => {
    const r = robots(["User-agent: *", "Disallow: /checkout", "Disallow: /*?sort=", "Allow: /checkout/aide", "Crawl-delay: 5", "", "User-agent: GPTBot", "Disallow: /", "Sitemap: https://x.fr/sitemap.xml"].join("\n"));
    expect(r.allowed("/p/canape-123")).toBe(true);
    expect(r.allowed("/checkout/panier")).toBe(false);
    expect(r.allowed("/checkout/aide")).toBe(true);
    expect(r.allowed("/liste?sort=prix")).toBe(false);
    expect(r.delay).toBe(5);
    expect(r.sitemaps).toEqual(["https://x.fr/sitemap.xml"]);
    expect(r.everything).toBe(false);
    expect(robots("User-agent: *\nDisallow: /").everything).toBe(true);
    expect(robots("User-agent: PieceReveeBot\nDisallow: /\n\nUser-agent: *\nAllow: /").everything).toBe(true);
  });

  it("classe les produits par famille d'après leur nom", () => {
    expect(famille("Table basse ronde en travertin Ø 90 cm")).toBe("table-basse");
    expect(famille("Canapé 3 places en bouclé")).toBe("canape");
    expect(famille("Suspension en papier blanc")).toBe("luminaire");
    expect(famille("Lampadaire arc laiton")).toBe("lampadaire");
    expect(famille("Housse de coussin en lin")).toBe("deco");
    expect(famille("Peinture murale mate blanc cassé 2,5 L")).toBe("peinture");
    expect(famille("Tournevis cruciforme")).toBeNull();
    expect(familleDe("deco", "Vase en grès")).toBe("deco");
  });

  it("retrouve les produits les plus ressemblants à une description", () => {
    const P = (n: string, p: number | null): ProduitCatalogue => ({ n, b: null, m: "Boutique", u: `https://b.fr/${encodeURIComponent(n)}`, p, c: p ? "EUR" : null, a: null, d: "2026-10-29" });
    const list = [P("Vase en grès beige mat 30 cm", 39), P("Vase en verre fumé", 25), P("Coussin en lin naturel", 19), P("Vase grès émaillé beige", 29)];
    const r = chercher(list, "vase en grès beige mat");
    expect(r.map((x) => x.n)).toEqual(["Vase en grès beige mat 30 cm", "Vase grès émaillé beige"]);
    expect(chercher(list, "lampe")).toEqual([]);
  });
});

describe("lecture des fiches produit", () => {
  it("lit ProductGroup avec variantes, mainEntity et balises Open Graph", async () => {
    const { parseProduct } = await import("@/workers/ia/src/produit");
    expect(parseProduct(`<script type="application/ld+json">{"@type":"ProductGroup","name":"Canapé Lola","hasVariant":[{"@type":"Product","offers":{"price":"899.00","priceCurrency":"EUR"}}]}</script>`)).toMatchObject({ name: "Canapé Lola", price: 899 });
    expect(parseProduct(`<script type="application/ld+json">{"@type":"WebPage","mainEntity":{"@type":"Product","name":"Lampe Arc","offers":{"price":129,"priceCurrency":"EUR"}}}</script>`)).toMatchObject({ name: "Lampe Arc", price: 129 });
    expect(parseProduct(`<meta property="og:type" content="product"><meta property="og:title" content="Vase grès"><meta property="product:price:amount" content="24.90"><meta property="product:price:currency" content="EUR">`)).toMatchObject({ name: "Vase grès", price: 24.9, currency: "EUR" });
  });
});
