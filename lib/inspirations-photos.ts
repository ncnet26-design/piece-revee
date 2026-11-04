import data from "@/content/data/inspirations-styles.json";
import type { Style } from "@/lib/catalogue-achetable";

/** Photo d'intérieur réelle choisie à la main (Unsplash : affichée depuis Unsplash, photographe crédité). */
export type PhotoStyle = { ref: string; src: string; largeur: number; hauteur: number; auteur: string; auteur_url: string; page: string; alt: string; source: string };

export const PHOTOS_STYLES = data as Record<Style, PhotoStyle[]>;

/** Ce qu'on doit reconnaître sur les photos de chaque style (d'après signatures-styles). */
export const SIGNATURE: Record<Style, string> = {
  japandi: "Bois clair, lignes basses, assises au sol, céramique artisanale, papier et lumière tamisée.",
  scandinave: "Murs blancs, bois blond, chaises en bois courbé, grandes fenêtres, poêle et textiles doux.",
  industriel: "Brique apparente, acier noir, verrières d'atelier, cuir patiné, ampoules nues.",
  haussmannien: "Moulures, parquet point de Hongrie, cheminée en marbre, grandes fenêtres et hauteur sous plafond.",
  "mid-century": "Noyer et teck, pieds compas, fauteuils iconiques, tons moutarde, olive et cognac.",
  "wabi-sabi": "Enduit à la chaux, voûtes et murs bruts, lin froissé, bois patiné, tons terre.",
  boheme: "Rotin, plantes partout, tapis superposés, motifs, objets chinés et murs habillés.",
  contemporain: "Travertin et pierre, canapés courbes, bouclette, tons neutres, lignes nettes.",
};

const utm = "utm_source=piece_revee&utm_medium=referral";
/** Lien vers le photographe ou la photo, avec le référent demandé par Unsplash. */
export const lienUnsplash = (url: string) => `${url}${url.includes("?") ? "&" : "?"}${utm}`;

/** Adresse redimensionnée par le service d'images d'Unsplash. */
export const tailleUnsplash = (src: string, w: number, fm: "avif" | "webp" | "jpg") => `${src}${src.includes("?") ? "&" : "?"}w=${w}&fm=${fm}&q=72&fit=max`;
export const LARGEURS = [640, 1280, 1920, 2560] as const;
export const srcsetUnsplash = (src: string, fm: "avif" | "webp") => LARGEURS.map((w) => `${tailleUnsplash(src, w, fm)} ${w}w`).join(", ");
