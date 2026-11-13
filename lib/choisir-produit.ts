import { chercher, norm, type Famille, type ProduitCatalogue } from "@/lib/catalogue";
import { accord, attributs } from "@/lib/attributs";

export type Gamme = "petit" | "moyen" | "haut";
export type Trouves = Record<string, Partial<Record<Gamme, ProduitCatalogue>>>;
export type PieceDansImage = { id: string; label: string; famille: Famille; query: string; x: number; y: number; secondaire?: boolean };

/** Exclusions communes : accessoires, pièces détachées, imitations, articles pour animaux ou enfants… */
const HORS_SUJET = /salle de bain|pour chaise|batonnets|piece detachee|robinetterie|plomberie|raccord|cordon|douille|abat jour|douche|chaussures|tapis de bain|d entree|anti derapant|accoudoir|pliante|chien|chat|parure|bebe|enfant|synthetique|simili|tete de lit/;

/** Le produit le plus ressemblant d'une gamme : nom qui commence par le bon meuble, avec photo et prix. */
export function choisir<T extends ProduitCatalogue & { g?: Gamme }>(l: T[], query: string, g: Gamme, libelle = ""): T | undefined {
  const mots = norm(query).split(" "), nom = mots[0]!;
  // « table basse » ≠ « table d'appoint » : pour une table, le deuxième mot compte aussi.
  const qualif = nom === "table" && ["basse", "appoint", "manger", "chevet", "console"].includes(mots[1] ?? "") ? mots[1]! : null;
  // Aucune contradiction avec ce que montre l'image (matière, couleur, forme, dimensions) : « tapis rond » ≠ tapis 133 × 195 cm.
  const vu = attributs(`${libelle} ${query}`);
  const ok = l.filter((x) => x.g === g && x.i && x.p !== null && x.p >= 15 && norm(x.n).split(" ").slice(0, 3).includes(nom) && (!qualif || norm(x.n).split(" ").slice(0, 4).includes(qualif)) && !/module|meridienne seule|pouf seul/.test(norm(x.n)) && !HORS_SUJET.test(norm(x.n)) && accord(vu, `${x.n} ${x.b ?? ""}`).ok);
  const r = chercher(ok, query, 20).find((x) => x.score >= 100) ?? chercher(ok, query, 20).find((x) => x.score >= 67);
  if (!r) return undefined;
  const { score, ...x } = r; void score;
  return x as unknown as T;
}

