import archi from "@/content/data/architecture-photos.json";
import gallery from "@/content/data/gallery-photos.json";
import type { FreePhoto } from "@/content/gallery";

/** Photos libres de droits importées par le robot (auteur, source et licence toujours conservés). */
export type ArchiPhoto = FreePhoto & { collection: string };
export const ARCHI_PHOTOS = archi as ArchiPhoto[];
export const GALLERY_PHOTOS = gallery as FreePhoto[];

export const COLLECTIONS: Array<{ id: string; label: string; blurb: string }> = [
  { id: "interieurs", label: "Intérieurs d'architecte", blurb: "Volumes, lumière et matières : ce qui fait un intérieur réussi." },
  { id: "chateaux", label: "Châteaux et demeures", blurb: "Boiseries, moulures, parquets anciens : le patrimoine comme source d'inspiration." },
  { id: "gites", label: "Gîtes et maisons de campagne", blurb: "Pierre, bois brut, chaux : le charme des maisons de caractère." },
  { id: "haussmann", label: "Appartements haussmanniens", blurb: "Moulures, cheminées et parquet en point de Hongrie." },
  { id: "lofts", label: "Lofts et ateliers", blurb: "Grands volumes, verrières, métal et brique." },
  { id: "villas", label: "Villas contemporaines", blurb: "Lignes épurées, baies vitrées, dedans-dehors." },
  { id: "cuisines", label: "Cuisines", blurb: "Îlots, plans en pierre, façades mates." },
  { id: "bains", label: "Salles de bain", blurb: "Zellige, marbre, douches à l'italienne." },
  { id: "jardins", label: "Jardins et terrasses", blurb: "Jardins à la française, terrasses, jardins secs." },
];

export const byCollection = (id: string) => ARCHI_PHOTOS.filter((p) => p.collection === id);
/** Photo la plus adaptée à un grand format (paysage, haute définition). */
export function bestLandscape(list: FreePhoto[]): FreePhoto | undefined {
  return [...list].filter((p) => p.width >= p.height * 1.25).sort((a, b) => b.width - a.width)[0] ?? list[0];
}
