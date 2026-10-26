import type { ProductNeed } from "./schemas/study.ts";
import type { Product } from "./schemas/catalog.ts";

export interface Candidate { product: Product; similarity: number }
export interface MatchResult {
  needId: string;
  status: "trouve" | "a_chercher";
  principal: Product | null;
  alternatives: Product[];
  /** Nombre total de produits compatibles, pour « Voir toutes les alternatives ». */
  totalCompatible: number;
  /** Critères de recherche affichés quand rien ne correspond. */
  criteria: string[];
}

const norm = (s: string) => s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
const overlap = (a: string[], b: string[]) => {
  if (!a.length) return 0.5;
  const B = new Set(b.map(norm));
  return a.filter((x) => B.has(norm(x))).length / a.length;
};

function fitsDims(need: ProductNeed, p: Product): boolean {
  const m = need.maxDimensionsCm;
  return (m.w === null || p.dimsCm.w === null || p.dimsCm.w <= m.w)
    && (m.d === null || p.dimsCm.d === null || p.dimsCm.d <= m.d)
    && (m.h === null || p.dimsCm.h === null || p.dimsCm.h <= m.h);
}

/** Filtre dur : seuls des produits réels, actifs, en stock, de la bonne catégorie, dans les dimensions et un prix raisonnable. */
export function isCompatible(need: ProductNeed, p: Product): boolean {
  const maxPrice = need.priceRange.max * 100 * 1.6; // tolérance pour l'alternative haut de gamme
  return p.removedAt === null && p.inStock && p.category === need.category && fitsDims(need, p) && p.priceCents <= Math.max(maxPrice, 500);
}

/** Score hybride : similarité sémantique (pgvector) + attributs. */
export function score(need: ProductNeed, c: Candidate): number {
  const p = c.product;
  const priceMid = ((need.priceRange.min + need.priceRange.max) / 2) * 100;
  const priceFit = priceMid > 0 ? Math.max(0, 1 - Math.abs(p.priceCents - priceMid) / priceMid) : 0.5;
  return 0.5 * c.similarity + 0.15 * overlap(need.colors, p.colors) + 0.15 * overlap(need.materials, p.materials) + 0.1 * overlap(need.style, p.styles) + 0.1 * priceFit;
}

/** Un choix principal (meilleur score dans la fourchette) et deux alternatives : une plus accessible, une plus haut de gamme. */
export function matchNeed(need: ProductNeed, candidates: Candidate[]): MatchResult {
  const ok = candidates.filter((c) => isCompatible(need, c.product)).map((c) => ({ ...c, s: score(need, c) }));
  const criteria = [
    need.category, need.description,
    need.colors.length ? `Couleurs : ${need.colors.join(", ")}` : "",
    need.materials.length ? `Matières : ${need.materials.join(", ")}` : "",
    `Budget : ${need.priceRange.min} à ${need.priceRange.max} €`,
  ].filter(Boolean);
  if (!ok.length) return { needId: need.id, status: "a_chercher", principal: null, alternatives: [], totalCompatible: 0, criteria };
  const inRange = ok.filter((c) => c.product.priceCents >= need.priceRange.min * 100 && c.product.priceCents <= need.priceRange.max * 100);
  const pool = (inRange.length ? inRange : ok).sort((a, b) => b.s - a.s);
  const principal = pool[0]!.product;
  const rest = ok.filter((c) => c.product.id !== principal.id).sort((a, b) => b.s - a.s);
  const cheaper = rest.filter((c) => c.product.priceCents < principal.priceCents)[0]?.product;
  const pricier = rest.filter((c) => c.product.priceCents > principal.priceCents && c.product.id !== cheaper?.id)[0]?.product;
  const alternatives = [cheaper, pricier].filter((p): p is Product => Boolean(p));
  return { needId: need.id, status: "trouve", principal, alternatives, totalCompatible: ok.length, criteria };
}
