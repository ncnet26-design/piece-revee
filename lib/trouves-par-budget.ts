import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { Famille, ProduitCatalogue } from "@/lib/catalogue";
import { choisir, type Gamme, type PieceDansImage, type Trouves } from "@/lib/choisir-produit";
export type { Gamme, PieceDansImage, Trouves };

/**
 * Pour chaque meuble d'une image, un vrai produit par budget, cherché à la publication dans la sélection de la boutique.
 * Le nom du produit doit commencer par le bon meuble (premier mot de la recherche), et ressembler à la recherche.
 */
export function trouverParBudget(pieces: PieceDansImage[]): Trouves {
  const trouves: Trouves = {};
  const cache = new Map<Famille, Array<ProduitCatalogue & { g: Gamme }>>();
  for (const p of pieces) {
    if (!cache.has(p.famille)) {
      try { cache.set(p.famille, JSON.parse(readFileSync(join(process.cwd(), "public/boutique", `${p.famille}.json`), "utf8"))); } catch { cache.set(p.famille, []); }
    }
    const l = cache.get(p.famille)!;
    trouves[p.id] = {};
    for (const g of ["petit", "moyen", "haut"] as Gamme[]) { const x = choisir(l, p.query, g, p.label); if (x) trouves[p.id]![g] = x; }
  }
  return trouves;
}
