import { chercher, norm, type Famille, type ProduitCatalogue } from "@/lib/catalogue";

export type Gamme = "petit" | "moyen" | "haut";
export type Trouves = Record<string, Partial<Record<Gamme, ProduitCatalogue>>>;
export type PieceDansImage = { id: string; label: string; famille: Famille; query: string; x: number; y: number; secondaire?: boolean };

/** Exclusions communes : accessoires, pièces détachées, imitations, articles pour animaux ou enfants… */
const HORS_SUJET = /salle de bain|pour chaise|batonnets|piece detachee|robinetterie|plomberie|raccord|cordon|douille|abat jour|douche|chaussures|tapis de bain|d entree|anti derapant|accoudoir|pliante|chien|chat|parure|bebe|enfant|synthetique|simili|tete de lit/;

/** Le produit le plus ressemblant d'une gamme : nom qui commence par le bon meuble, avec photo et prix. */
export function choisir<T extends ProduitCatalogue & { g?: Gamme }>(l: T[], query: string, g: Gamme): T | undefined {
  const nom = norm(query.split(" ")[0]!);
  const ok = l.filter((x) => x.g === g && x.i && x.p !== null && x.p >= 15 && norm(x.n).split(" ").slice(0, 3).includes(nom) && !HORS_SUJET.test(norm(x.n)));
  const r = chercher(ok, query, 20).find((x) => x.score >= 100) ?? chercher(ok, query, 20).find((x) => x.score >= 67);
  if (!r) return undefined;
  const { score, ...x } = r; void score;
  return x as unknown as T;
}

