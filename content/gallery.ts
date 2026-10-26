import { STYLES } from "./styles.ts";
import photos from "./data/gallery-photos.json" with { type: "json" };

/** Photo libre importée par scripts/import-images.ts (Unsplash, Pexels, Openverse, Wikimedia Commons). */
export interface FreePhoto {
  id: string;
  styleId: string;
  space: string;
  url: string;
  thumbUrl: string;
  width: number;
  height: number;
  alt: string;
  author: string;
  authorUrl: string | null;
  source: "Unsplash" | "Pexels" | "Openverse" | "Wikimedia Commons";
  sourceUrl: string;
  license: string;
  licenseUrl: string | null;
}

export interface GalleryItem {
  id: string;
  styleId: string;
  space: string;
  scope: "interieur" | "exterieur";
  title: string;
  seed: number;
  photo: FreePhoto | null;
}

export const GALLERY_SPACES = {
  interieur: ["Salon", "Chambre", "Cuisine", "Salle de bain", "Bureau", "Entrée"],
  exterieur: ["Jardin", "Terrasse", "Balcon", "Cour", "Abords de piscine"],
} as const;

const hash = (t: string) => { let h = 2166136261; for (const ch of t) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
const PHOTOS = photos as FreePhoto[];

/** Une entrée par style et par espace. Une photo libre la remplace dès qu'elle est importée ; sinon une illustration est dessinée. */
export const GALLERY: GalleryItem[] = STYLES.flatMap((s) =>
  GALLERY_SPACES[s.scope].map((space) => {
    const id = `g-${s.id}-${space.toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "").replace(/[^a-z]+/g, "-")}`;
    const photo = PHOTOS.find((p) => p.styleId === s.id && p.space === space) ?? null;
    const title = s.scope === "interieur" ? `${space} ${s.name.toLowerCase()}` : `${space} · ${s.name.toLowerCase()}`;
    return { id, styleId: s.id, space, scope: s.scope, title, seed: hash(id), photo };
  }),
);

/** Photos libres supplémentaires (au-delà d'une par combinaison), affichées en fin de galerie. */
export const EXTRA_PHOTOS: FreePhoto[] = PHOTOS.filter((p) => !GALLERY.some((g) => g.photo?.id === p.id));
