import { readFileSync } from "node:fs";
import { join } from "node:path";
import { chercher, norm, type Famille, type ProduitCatalogue } from "@/lib/catalogue";

export type Gamme = "petit" | "moyen" | "haut";
export type Trouves = Record<string, Partial<Record<Gamme, ProduitCatalogue>>>;
export type PieceDansImage = { id: string; label: string; famille: Famille; query: string; x: number; y: number; secondaire?: boolean };

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
    const nom = norm(p.query.split(" ")[0]!);
    for (const g of ["petit", "moyen", "haut"] as Gamme[]) {
      const ok = l.filter((x) => x.g === g && x.i && x.p !== null && x.p >= 15 && norm(x.n).split(" ").slice(0, 3).includes(nom)
        && !/salle de bain|pour chaise|batonnets|piece detachee|robinetterie|plomberie|raccord|cordon|douille|abat jour|douche|chaussures|tapis de bain|d entree|anti derapant|accoudoir|pliante|chien|chat|parure|bebe|enfant|synthetique|simili|tete de lit/.test(norm(x.n)));
      const r = chercher(ok, p.query, 20).find((x) => x.score >= 100) ?? chercher(ok, p.query, 20).find((x) => x.score >= 67);
      if (r) { const { score, ...x } = r; void score; trouves[p.id]![g] = x; }
    }
  }
  return trouves;
}
