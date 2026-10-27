/**
 * Normalisation des flux produits d'affiliation (CSV ou XML déjà converti en lignes clé → valeur).
 * Rien n'est inventé : un produit sans prix, sans lien https ou sans image est rejeté.
 */
import type { Category } from "./schemas/catalog-types.ts";

export interface FeedMapping {
  /** Nom de la colonne pour chaque champ (les réseaux n'utilisent pas les mêmes noms). */
  id: string; title: string; price: string; deepLink: string; productUrl?: string; image: string;
  brand?: string; gtin?: string; category?: string; colour?: string; inStock?: string; description?: string; dimensions?: string;
}

/** Correspondances par réseau (noms de colonnes publiés par les réseaux, à confirmer avec chaque flux réel). */
export const MAPPINGS: Record<string, FeedMapping> = {
  awin: { id: "aw_product_id", title: "product_name", price: "search_price", deepLink: "aw_deep_link", productUrl: "merchant_deep_link", image: "merchant_image_url", brand: "brand_name", gtin: "ean", category: "merchant_category", colour: "colour", inStock: "in_stock", description: "description", dimensions: "dimensions" },
  effiliation: { id: "id", title: "nom", price: "prix", deepLink: "url", image: "url_image", brand: "marque", gtin: "ean", category: "categorie", colour: "couleur", inStock: "stock", description: "description" },
  generic: { id: "id", title: "title", price: "price", deepLink: "link", image: "image_link", brand: "brand", gtin: "gtin", category: "product_type", colour: "color", inStock: "availability", description: "description" },
};

const CATEGORY_RULES: [Category, RegExp][] = [
  ["Peinture", /\b(peinture|lasure|vernis|laque)\b/i],
  ["Revêtement mural", /\b(papier peint|panoramique|lambris|revêtement mural)\b/i],
  ["Carrelage", /\b(carrelage|faïence|zellige|mosaïque|carreau)\b/i],
  ["Sol", /\b(parquet|stratifié|vinyle|lino|moquette|sol)\b/i],
  ["Tapis", /\btapis\b/i],
  ["Luminaire", /\b(suspension|lampe|lampadaire|applique|luminaire|plafonnier|liseuse)\b/i],
  ["Éclairage extérieur", /\b(borne|guirlande|spot extérieur|éclairage extérieur|solaire)\b/i],
  ["Mobilier extérieur", /\b(salon de jardin|table de jardin|chaise de jardin|transat|bain de soleil|hamac)\b/i],
  ["Ombrage", /\b(parasol|voile d'ombrage|pergola|tonnelle|store banne)\b/i],
  ["Pot", /\b(pot|jardinière|bac|cache-pot)\b/i],
  ["Plante", /\b(plante|arbuste|vivace|graminée|rosier|olivier)\b/i],
  ["Arrosage", /\b(arrosage|goutte-à-goutte|tuyau|arrosoir|récupérateur)\b/i],
  ["Robinetterie", /\b(robinet|mitigeur|douchette|colonne de douche)\b/i],
  ["Lit", /\b(lit|tête de lit|sommier|matelas)\b/i],
  ["Assise", /\b(canapé|fauteuil|chaise|tabouret|banc|pouf|méridienne)\b/i],
  ["Table", /\b(table|bureau|console|guéridon)\b/i],
  ["Rangement", /\b(étagère|bibliothèque|buffet|commode|armoire|vitrine|meuble tv|dressing|caisson)\b/i],
  ["Textile", /\b(rideau|voilage|coussin|plaid|housse|linge de lit|nappe)\b/i],
  ["Décoration", /\b(miroir|vase|cadre|affiche|bougie|panier|horloge)\b/i],
];

export function categorize(text: string): Category | null {
  for (const [cat, re] of CATEGORY_RULES) if (re.test(text)) return cat;
  return null;
}

const COLORS = ["blanc", "noir", "gris", "beige", "sable", "naturel", "bois", "vert", "sauge", "bleu", "terracotta", "rouge", "rose", "jaune", "moutarde", "orange", "marron", "doré", "laiton", "argent"];
const MATERIALS = ["chêne", "noyer", "teck", "bambou", "rotin", "osier", "lin", "coton", "laine", "jute", "velours", "bouclette", "cuir", "marbre", "travertin", "terrazzo", "céramique", "terre cuite", "verre", "métal", "acier", "laiton", "aluminium", "béton", "papier"];

export function parsePrice(raw: string | undefined): number | null {
  if (!raw) return null;
  const n = Number(raw.replace(/[^\d,.-]/g, "").replace(/\.(?=\d{3}(\D|$))/g, "").replace(",", "."));
  return Number.isFinite(n) && n > 0 ? Math.round(n * 100) : null;
}

export function parseDims(raw: string | undefined): { w: number | null; d: number | null; h: number | null } {
  const empty = { w: null, d: null, h: null };
  if (!raw) return empty;
  const m = raw.replace(/,/g, ".").match(/(\d+(?:\.\d+)?)\s*(?:cm)?\s*[x×]\s*[a-zé]*\s*(\d+(?:\.\d+)?)\s*(?:cm)?(?:\s*[x×]\s*[a-zé]*\s*(\d+(?:\.\d+)?))?/i);
  if (!m) return empty;
  return { w: Number(m[1]), d: Number(m[2]), h: m[3] ? Number(m[3]) : null };
}

export interface NormalizedProduct {
  externalId: string; title: string; brand: string | null; gtin: string | null; category: Category;
  colors: string[]; materials: string[]; dimsCm: { w: number | null; d: number | null; h: number | null };
  priceCents: number; inStock: boolean; imageUrl: string; productUrl: string; affiliateUrl: string;
}

export type NormalizeResult = { ok: true; product: NormalizedProduct } | { ok: false; reason: string };

export function normalizeRow(row: Record<string, string>, map: FeedMapping): NormalizeResult {
  const get = (k?: string) => (k ? (row[k] ?? "").trim() : "");
  const id = get(map.id), title = get(map.title), aff = get(map.deepLink), img = get(map.image);
  if (!id || !title) return { ok: false, reason: "identifiant ou titre manquant" };
  const price = parsePrice(get(map.price));
  if (!price) return { ok: false, reason: "prix manquant" };
  if (!/^https:\/\//.test(aff)) return { ok: false, reason: "lien affilié non https" };
  if (!/^https:\/\//.test(img)) return { ok: false, reason: "image non https" };
  const text = `${title} ${get(map.category)} ${get(map.description)}`.toLowerCase();
  const category = categorize(`${get(map.category)} ${title}`);
  if (!category) return { ok: false, reason: "catégorie non reconnue" };
  const stock = get(map.inStock).toLowerCase();
  return { ok: true, product: {
    externalId: id, title: title.slice(0, 300), brand: get(map.brand) || null, gtin: /^\d{8,14}$/.test(get(map.gtin)) ? get(map.gtin) : null, category,
    colors: COLORS.filter((c) => text.includes(c) || get(map.colour).toLowerCase().includes(c)), materials: MATERIALS.filter((m) => text.includes(m)),
    dimsCm: parseDims(get(map.dimensions) || title), priceCents: price, inStock: !["0", "false", "non", "out of stock", "rupture"].includes(stock),
    imageUrl: img, productUrl: /^https:\/\//.test(get(map.productUrl)) ? get(map.productUrl) : aff, affiliateUrl: aff,
  } };
}

/** Déduplication : même GTIN, ou même marque + titre normalisé. */
export function dedupKey(p: NormalizedProduct): string {
  return p.gtin ? `gtin:${p.gtin}` : `t:${(p.brand ?? "").toLowerCase()}:${p.title.toLowerCase().normalize("NFD").replace(/[^a-z0-9]+/g, "")}`;
}

/** Lecture CSV robuste (guillemets, séparateur virgule, point-virgule ou tabulation détecté). */
export function parseCsv(text: string): Record<string, string>[] {
  const firstLine = text.slice(0, text.indexOf("\n") > 0 ? text.indexOf("\n") : text.length);
  const sep = [",", ";", "\t", "|"].sort((a, b) => firstLine.split(b).length - firstLine.split(a).length)[0]!;
  const rows: string[][] = []; let row: string[] = []; let cur = ""; let q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i]!;
    if (q) { if (c === '"') { if (text[i + 1] === '"') { cur += '"'; i++; } else q = false; } else cur += c; continue; }
    if (c === '"') q = true; else if (c === sep) { row.push(cur); cur = ""; } else if (c === "\n" || c === "\r") { if (c === "\r" && text[i + 1] === "\n") i++; row.push(cur); rows.push(row); row = []; cur = ""; } else cur += c;
  }
  if (cur || row.length) { row.push(cur); rows.push(row); }
  const [head, ...body] = rows.filter((r) => r.some((x) => x.trim()));
  if (!head) return [];
  return body.map((r) => Object.fromEntries(head.map((h, i) => [h.trim(), r[i] ?? ""])));
}
