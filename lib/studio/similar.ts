import { PRODUCTS, TIERS, type Category, type Product } from "@/lib/products/schema";

/**
 * Moteur de produits similaires : compare un objet de la scène (forme, style, couleur, matières, dimensions)
 * aux produits de la base et explique chaque score. Les catalogues d'autres enseignes s'ajoutent dans
 * content/data/products.json (ou plus tard via une API autorisée) sans changer ce calcul.
 */
export interface ObjectFeatures {
  category: Category;
  style: string[]; silhouette: string[]; materials: string[];
  colors: string[];
  /** Dimensions en cm. */
  dims: { w: number; d: number; h: number } | null;
  /** Produit commercial vérifié correspondant exactement au modèle 3D (cas A), sinon null (cas B). */
  productId: string | null;
}
export interface Filters { maxPrice?: number | null; tiers?: Array<keyof typeof TIERS>; style?: string | null; maxWidth?: number | null; color?: string | null; material?: string | null; brand?: string | null; market?: "FR" | "EU" | null }
/** En dessous de ce score, un produit n'est pas assez ressemblant pour être proposé. */
export const MIN_SCORE = 45;
/** Matières visuellement proches (score partiel) : une imitation travertin ressemble à du travertin, sans en être. */
const AFFINITY: Record<string, Record<string, number>> = {
  travertin: { "travertin-effet": 0.7, pierre: 0.8, marbre: 0.5, ciment: 0.4 },
  "travertin-effet": { travertin: 0.7, pierre: 0.5 },
  pierre: { travertin: 0.8, marbre: 0.7, "travertin-effet": 0.5, ciment: 0.4 },
  marbre: { pierre: 0.7, travertin: 0.5 },
  velours: { boucle: 0.4 }, boucle: { velours: 0.4, laine: 0.6 }, laine: { boucle: 0.6 },
  laiton: { metal: 0.5 }, metal: { laiton: 0.5 },
  bois: {},
};
function materialMatch(want: string[], have: string[]): { score: number; label: string[] } {
  if (!want.length) return { score: 0.5, label: [] };
  let total = 0; const label: string[] = [];
  for (const w of want) {
    let best = have.includes(w) ? 1 : 0, hit = have.includes(w) ? w : "";
    for (const h of have) { const a = AFFINITY[w]?.[h] ?? 0; if (a > best) { best = a; hit = `${h.replace("-effet", " (effet)")}`; } }
    total += best; if (hit) label.push(hit);
  }
  return { score: total / want.length, label: [...new Set(label)] };
}
export interface Match { product: Product; score: number; exact: boolean; reasons: string[] }

/** Catégories voisines : un lampadaire peut remplacer un autre luminaire, etc. */
const RELATED: Partial<Record<Category, Category[]>> = { lampadaire: ["luminaire"], luminaire: ["lampadaire"], "table-basse": [], fauteuil: [], canape: [] };

const rgb = (h: string) => { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255] as const; };
/** Écart de couleur perçu (approximation « redmean »), 0 = identique, ~765 = opposé. */
export function colorDistance(a: string, b: string): number {
  const [r1, g1, b1] = rgb(a), [r2, g2, b2] = rgb(b), rm = (r1 + r2) / 2;
  return Math.sqrt((2 + rm / 256) * (r1 - r2) ** 2 + 4 * (g1 - g2) ** 2 + (2 + (255 - rm) / 256) * (b1 - b2) ** 2);
}
const overlap = (a: string[], b: string[]) => a.filter((x) => b.includes(x));
/** Prix converti approximativement en euros pour filtrer (taux indicatifs, pas d'affichage). */
const TO_EUR: Record<string, number> = { EUR: 1, GBP: 1.17, USD: 0.92, CHF: 1.05 };
export const priceEur = (p: Product) => (p.price?.amount != null ? p.price.amount * (TO_EUR[p.price.currency] ?? 1) : null);

export function scoreProduct(o: ObjectFeatures, p: Product): Match | null {
  const exact = o.productId === p.id;
  if (!exact && p.category !== o.category && !(RELATED[o.category] ?? []).includes(p.category)) return null;
  const reasons: string[] = [];
  let s = 0;
  const sil = overlap(o.silhouette, p.silhouette);
  s += Math.min(1, sil.length / Math.max(1, Math.min(2, o.silhouette.length))) * 30;
  if (!sil.length && o.silhouette.length) reasons.push("Silhouette différente");
  if (sil.length) reasons.push(`Silhouette : ${sil.join(", ").replace(/-/g, " ")}`);
  const st = overlap(o.style, p.style);
  s += Math.min(1, st.length) * 15;
  if (st.length) reasons.push(`Style ${st.join(", ").replace(/-/g, " ")}`);
  const mm = materialMatch(o.materials, p.materials);
  s += mm.score * 25;
  if (mm.label.length) reasons.push(`Matière : ${mm.label.join(", ")}`);
  const cd = Math.min(...o.colors.flatMap((c) => p.colors.map((pc) => colorDistance(c, pc.hex))), 765);
  const colorScore = Math.max(0, 1 - cd / 300);
  s += colorScore * 20;
  if (colorScore > 0.6) reasons.push(`Couleur proche (${p.colors[0]?.name.toLowerCase()})`);
  const pd = p.dimensions;
  if (o.dims && pd && (pd.w || pd.h)) {
    const ratios = [pd.w && o.dims.w ? pd.w / o.dims.w : null, pd.h && o.dims.h ? pd.h / o.dims.h : null].filter((x): x is number => x !== null);
    const worst = Math.max(...ratios.map((r) => Math.abs(Math.log(r))));
    const dimScore = Math.max(0, 1 - worst / Math.log(1.8));
    s += dimScore * 10;
    if (dimScore > 0.6) reasons.push("Dimensions comparables");
  } else s += 4;
  if (exact) { reasons.unshift("Produit exact représenté par le modèle 3D"); s = 100; }
  return { product: p, score: Math.round(s), exact, reasons };
}

export function findSimilar(o: ObjectFeatures, f: Filters = {}, catalog: Product[] = PRODUCTS, minScore = MIN_SCORE): Match[] {
  return catalog
    .map((p) => scoreProduct(o, p))
    .filter((m): m is Match => m !== null && (m.exact || m.score >= minScore))
    .filter((m) => m.exact || ((f.maxPrice == null || (priceEur(m.product) ?? 0) <= f.maxPrice)
      && (!f.tiers?.length || f.tiers.includes(m.product.tier))
      && (!f.style || m.product.style.includes(f.style))
      && (f.maxWidth == null || (m.product.dimensions?.w ?? 0) <= f.maxWidth)
      && (!f.color || m.product.colors.some((c) => colorDistance(c.hex, f.color!) < 160))
      && (!f.material || m.product.materials.some((x) => x === f.material || (AFFINITY[f.material!]?.[x] ?? 0) >= 0.7))
      && (!f.brand || m.product.brand === f.brand)
      && (!f.market || (f.market === "FR" ? m.product.market === "FR" : ["FR", "EU"].includes(m.product.market)))))
    .sort((a, b) => Number(b.exact) - Number(a.exact) || b.score - a.score);
}

/** Fusionne les traits demandés (« plus sculptural », « en velours ») avec ceux de l'objet : ils priment. */
export function withWants(o: ObjectFeatures, w: { silhouette: string[]; style: string[]; materials: string[]; colors: Array<{ hex: string }> }): ObjectFeatures {
  return { ...o, silhouette: w.silhouette.length ? w.silhouette : o.silhouette, style: w.style.length ? w.style : o.style, materials: w.materials.length ? w.materials : o.materials, colors: w.colors.length ? w.colors.map((c) => c.hex) : o.colors };
}

/** Meilleure proposition par gamme (économique, intermédiaire, premium). */
export function byTier(matches: Match[]): Record<keyof typeof TIERS, Match[]> {
  return { economique: matches.filter((m) => m.product.tier === "economique"), intermediaire: matches.filter((m) => m.product.tier === "intermediaire"), premium: matches.filter((m) => m.product.tier === "premium") };
}
