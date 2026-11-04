/**
 * Lecture des données produit publiées par un vendeur dans sa page (JSON-LD schema.org Product).
 * Module sans dépendance : utilisé par le service IA (recherche en ligne) et par le robot catalogue.
 */
const clean = (s: unknown, n: number) => (typeof s === "string" ? s.replace(/\s+/g, " ").trim().slice(0, n) : "");

/** Données produit publiées par le vendeur (JSON-LD schema.org), si la page en contient. */
/** Décode les entités HTML courantes (&#39;, &amp;, &eacute;…) laissées dans les noms publiés. */
const ENT: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", eacute: "é", egrave: "è", ecirc: "ê", agrave: "à", acirc: "â", ccedil: "ç", ocirc: "ô", ucirc: "û", icirc: "î", iuml: "ï", euml: "ë", rsquo: "’", lsquo: "‘", laquo: "«", raquo: "»", hellip: "…", ndash: "–", mdash: "—", deg: "°", times: "×", oelig: "œ" };
export const decodeEntites = (s: string) => s.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (m, e: string) => {
  if (e[0] === "#") { const n = e[1] === "x" || e[1] === "X" ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10); return Number.isFinite(n) && n > 0 && n < 0x110000 ? String.fromCodePoint(n) : m; }
  return ENT[e.toLowerCase()] ?? m;
});

export interface ProduitPage { name: string; brand: string | null; price: number | null; currency: string | null; availability: string | null; image: string | null }
export function parseProduct(html: string): ProduitPage | null {
  const blocks = [...html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)].map((m) => m[1]!);
  const all: Array<Record<string, unknown>> = [];
  const walk = (v: unknown) => {
    if (Array.isArray(v)) v.forEach(walk);
    else if (v && typeof v === "object") { const o = v as Record<string, unknown>; all.push(o); if (o["@graph"]) walk(o["@graph"]); }
  };
  for (const b of blocks) { try { walk(JSON.parse(b.trim())); } catch { /* bloc illisible */ } }
  const isProduct = (o: Record<string, unknown>) => { const t = o["@type"]; return ["Product", "ProductGroup", "IndividualProduct"].some((k) => t === k || (Array.isArray(t) && t.includes(k))); };
  for (const o of [...all]) if (o.mainEntity && typeof o.mainEntity === "object") walk(o.mainEntity);
  const p = all.find(isProduct) ?? metaProduct(html);
  if (!p) return null;
  const variant = Array.isArray(p.hasVariant) ? (p.hasVariant[0] as Record<string, unknown>) : undefined;
  const rawOffers = p.offers ?? variant?.offers;
  const offers = (Array.isArray(rawOffers) ? rawOffers[0] : rawOffers) as Record<string, unknown> | undefined;
  const agg = offers && (offers["@type"] === "AggregateOffer" ? offers : undefined);
  const raw = offers?.price ?? agg?.lowPrice ?? (offers?.priceSpecification as Record<string, unknown> | undefined)?.price;
  const price = raw !== undefined && Number.isFinite(Number(String(raw).replace(",", "."))) ? Number(String(raw).replace(",", ".")) : null;
  const brand = typeof p.brand === "string" ? clean(p.brand, 60) || null : clean((p.brand as Record<string, unknown> | undefined)?.name, 60) || null;
  const av = clean(offers?.availability, 80).replace(/^https?:\/\/schema\.org\//, "") || null;
  // Image publiée par le vendeur (JSON-LD image, sinon og:image) : adresse seulement, l'image n'est jamais copiée.
  const pickImg = (v: unknown): string | null => {
    if (typeof v === "string") return v;
    if (Array.isArray(v)) return pickImg(v[0]);
    if (v && typeof v === "object") { const o = v as Record<string, unknown>; return pickImg(o.contentUrl ?? o.url); }
    return null;
  };
  const og = /<meta[^>]+(?:property|name)=["']og:image(?::secure_url)?["'][^>]+content=["']([^"']+)["']/i.exec(html)?.[1] ?? /<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']og:image["']/i.exec(html)?.[1] ?? null;
  const image = (pickImg(p.image ?? variant?.image) ?? og)?.replace(/&amp;/g, "&").trim() || null;
  return { name: decodeEntites(clean(p.name, 200)).slice(0, 160), brand: brand ? decodeEntites(brand) : null, price: price && price > 0 ? price : null, currency: clean(offers?.priceCurrency, 3) || null, availability: av, image: image && image.length < 1000 ? image : null };
}


/** Repli : balises Open Graph produit (og:title, product:price:amount) quand la page n'a pas de JSON-LD. */
function metaProduct(html: string): Record<string, unknown> | null {
  const meta = (prop: string) => new RegExp(`<meta[^>]+(?:property|name)=["']${prop}["'][^>]+content=["']([^"']+)["']`, "i").exec(html)?.[1]
    ?? new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${prop}["']`, "i").exec(html)?.[1];
  const type = meta("og:type"), price = meta("product:price:amount") ?? meta("og:price:amount");
  if (!price || (type && !/product/i.test(type))) return null;
  return { "@type": "Product", name: meta("og:title") ?? "", brand: meta("product:brand") ?? undefined, offers: { price, priceCurrency: meta("product:price:currency") ?? meta("og:price:currency") ?? "EUR", availability: meta("product:availability") ?? undefined } };
}
