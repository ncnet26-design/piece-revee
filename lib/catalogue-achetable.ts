/**
 * Catalogue achetable (data/catalogue.json) : libellés, gammes, vignettes de matière et filtres.
 * Les produits viennent des pages des enseignes (robot + vérification page par page) ; rien n'est inventé.
 */
export const STYLES = ["japandi", "scandinave", "industriel", "haussmannien", "mid-century", "wabi-sabi", "boheme", "contemporain"] as const;
export type Style = (typeof STYLES)[number];
export const PIECES = ["salon", "chambre", "salle-a-manger", "salle-de-bain"] as const;
export type Piece = (typeof PIECES)[number];
export const GAMMES = ["petit", "moyen", "haut"] as const;
export type Gamme = (typeof GAMMES)[number];

export const NOM_STYLE: Record<Style, string> = {
  japandi: "Japandi", scandinave: "Scandinave", industriel: "Industriel", haussmannien: "Haussmannien",
  "mid-century": "Mid-century", "wabi-sabi": "Wabi-sabi", boheme: "Bohème", contemporain: "Contemporain",
};
export const NOM_PIECE: Record<Piece, string> = { salon: "Salon", chambre: "Chambre", "salle-a-manger": "Salle à manger", "salle-de-bain": "Salle de bain" };
export const NOM_GAMME: Record<Gamme, string> = { petit: "Petit budget", moyen: "Budget moyen", haut: "Haut de gamme" };

export interface ProduitAchetable {
  id: string; nom: string; enseigne: string; marque: string | null; prix: number; devise: string; gamme: Gamme;
  styles: Style[]; styles_deduits: boolean; piece: Piece[]; famille: string; dimensions: string | null; matiere: string[]; couleur: string[];
  url: string; verifie_le: string; disponibilite: string | null; affiliate_url: string; verification?: string;
}

/** Matière d'un produit → dossier de texture réelle (public/matieres/<slug>), quand elle existe. */
export const TEXTURE_DE: Record<string, string> = {
  chêne: "chene-huile", noyer: "noyer", teck: "noyer", travertin: "travertin", marbre: "marbre-carrare", terrazzo: "terrazzo", béton: "beton-cire",
  pierre: "pierre-calcaire", lin: "lin-lave", velours: "velours", bouclette: "bouclette", cuir: "cuir", rotin: "rotin", osier: "rotin", cannage: "rotin",
  "terre cuite": "terre-cuite", céramique: "terre-cuite-emaillee",
};
/** Couleurs nommées dans les fiches → teinte de la vignette quand il n'y a pas de texture. */
export const TEINTE: Record<string, string> = {
  blanc: "#EEEBE4", écru: "#E9E1D2", beige: "#D9CBB4", sable: "#D6C3A1", naturel: "#CDB28E", gris: "#9A978F", noir: "#2A2826", vert: "#5E6E55",
  bleu: "#55697C", terracotta: "#B8653F", rouille: "#9C4F2B", moutarde: "#C49A3A", rose: "#D7A9A0", marron: "#6B4C36", doré: "#B8954F",
};
export const BOIS = new Set(["chêne", "noyer", "teck", "bouleau", "pin", "frêne", "bambou"]);

/** Vignette d'un produit : texture réelle de sa matière, sinon sa couleur, sinon un fond neutre. */
export function vignette(p: ProduitAchetable, texturesDispo: ReadonlySet<string>): { texture: string | null; teinte: string; legende: string } {
  const m = p.matiere.find((x) => TEXTURE_DE[x] && texturesDispo.has(TEXTURE_DE[x]!));
  const c = p.couleur.find((x) => TEINTE[x]);
  return { texture: m ? TEXTURE_DE[m]! : null, teinte: c ? TEINTE[c]! : BOIS.has(p.matiere[0] ?? "") ? "#B08A60" : "#E6E0D6", legende: m ?? c ?? p.matiere[0] ?? "" };
}

export interface Filtres { style: Style | ""; piece: Piece | ""; gamme: Gamme | ""; matiere: string }
export function filtrer(l: ProduitAchetable[], f: Filtres) {
  return l.filter((p) => (!f.style || p.styles.includes(f.style)) && (!f.piece || p.piece.includes(f.piece)) && (!f.gamme || p.gamme === f.gamme) && (!f.matiere || p.matiere.includes(f.matiere)));
}

/** Trois produits pour une matière, un par gamme quand c'est possible (le moins cher de chaque gamme). */
export function troisParGamme(l: ProduitAchetable[], matiere: string): Partial<Record<Gamme, ProduitAchetable>> {
  const out: Partial<Record<Gamme, ProduitAchetable>> = {};
  for (const g of GAMMES) { const c = l.filter((p) => p.gamme === g && p.matiere.includes(matiere)).sort((a, b) => a.prix - b.prix); if (c[0]) out[g] = c[0]; }
  return out;
}
