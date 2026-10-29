/**
 * Lecture des données produit publiées par un vendeur dans sa page (JSON-LD schema.org Product).
 * Module sans dépendance : utilisé par le service IA (recherche en ligne) et par le robot catalogue.
 */
const clean = (s: unknown, n: number) => (typeof s === "string" ? s.replace(/\s+/g, " ").trim().slice(0, n) : "");

/** Données produit publiées par le vendeur (JSON-LD schema.org), si la page en contient. */
export interface ProduitPage { name: string; brand: string | null; price: number | null; currency: string | null; availability: string | null }
export function parseProduct(html: string): ProduitPage | null {
  const blocks = [...html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)].map((m) => m[1]!);
  const all: Array<Record<string, unknown>> = [];
  const walk = (v: unknown) => {
    if (Array.isArray(v)) v.forEach(walk);
    else if (v && typeof v === "object") { const o = v as Record<string, unknown>; all.push(o); if (o["@graph"]) walk(o["@graph"]); }
  };
  for (const b of blocks) { try { walk(JSON.parse(b.trim())); } catch { /* bloc illisible */ } }
  const p = all.find((o) => { const t = o["@type"]; return t === "Product" || (Array.isArray(t) && t.includes("Product")); });
  if (!p) return null;
  const offers = (Array.isArray(p.offers) ? p.offers[0] : p.offers) as Record<string, unknown> | undefined;
  const agg = offers && (offers["@type"] === "AggregateOffer" ? offers : undefined);
  const raw = offers?.price ?? agg?.lowPrice ?? (offers?.priceSpecification as Record<string, unknown> | undefined)?.price;
  const price = raw !== undefined && Number.isFinite(Number(String(raw).replace(",", "."))) ? Number(String(raw).replace(",", ".")) : null;
  const brand = typeof p.brand === "string" ? p.brand : clean((p.brand as Record<string, unknown> | undefined)?.name, 60) || null;
  const av = clean(offers?.availability, 80).replace(/^https?:\/\/schema\.org\//, "") || null;
  return { name: clean(p.name, 160), brand, price: price && price > 0 ? price : null, currency: clean(offers?.priceCurrency, 3) || null, availability: av };
}

