import { MATERIALS } from "./materials.ts";
import { PAIRINGS } from "./pairings.ts";
import { FURNITURE } from "./furniture.ts";
import { PLACES } from "./places.ts";
import { PLANTS } from "./plants.ts";
import { STYLES } from "./styles.ts";
import { KNOWLEDGE } from "./knowledge.ts";
import { GUIDES, PROJECT_STEPS } from "./guides.ts";
import { GALLERY, EXTRA_PHOTOS, GALLERY_SPACES, type FreePhoto } from "./gallery.ts";
import placePhotos from "./data/place-photos.json" with { type: "json" };

export { MATERIALS, PAIRINGS, FURNITURE, PLACES, PLANTS, STYLES, KNOWLEDGE, GUIDES, PROJECT_STEPS, GALLERY, EXTRA_PHOTOS, GALLERY_SPACES };
export type * from "./types.ts";

/** Photos libres des lieux (Wikimedia Commons), importées par scripts/import-images.ts. */
export const PLACE_PHOTOS = placePhotos as Record<string, FreePhoto[]>;

export const materialById = new Map(MATERIALS.map((m) => [m.id, m]));
export const placeById = new Map(PLACES.map((p) => [p.id, p]));
export const styleById = new Map(STYLES.map((s) => [s.id, s]));
export const plantById = new Map(PLANTS.map((p) => [p.id, p]));

export type LibraryKind = "matiere" | "accord" | "meuble" | "lieu" | "plante" | "style" | "guide";
export interface LibraryEntry { id: string; kind: LibraryKind; name: string; href: string; text: string }

/** Index unique de la bibliothèque : recherche, citations de Camille ([[id]]), moodboard. */
export const LIBRARY: LibraryEntry[] = [
  ...MATERIALS.map((m) => ({ id: m.id, kind: "matiere" as const, name: m.name, href: `/matieres/${m.slug}/`, text: `${m.name} ${m.family} ${m.summary} ${m.uses.join(" ")}` })),
  ...PAIRINGS.map((p) => ({ id: p.id, kind: "accord" as const, name: p.name, href: `/accords/${p.slug}/`, text: `${p.name} ${p.mood} ${p.why} ${p.rooms.join(" ")}` })),
  ...FURNITURE.map((f) => ({ id: f.id, kind: "meuble" as const, name: f.name, href: `/mobilier/${f.slug}/`, text: `${f.name} ${f.designer} ${f.editor} ${f.category} ${f.story}` })),
  ...PLACES.map((p) => ({ id: p.id, kind: "lieu" as const, name: p.name, href: `/lieux/${p.slug}/`, text: `${p.name} ${p.author} ${p.location} ${p.theme} ${p.lessons.join(" ")}` })),
  ...PLANTS.map((p) => ({ id: p.id, kind: "plante" as const, name: p.name, href: `/plantes/${p.slug}/`, text: `${p.name} ${p.latin} ${p.type} ${p.uses.join(" ")} ${p.notes}` })),
  ...STYLES.map((s) => ({ id: `s-${s.id}`, kind: "style" as const, name: s.name, href: `/styles/${s.slug}/`, text: `${s.name} ${s.summary} ${s.keys.join(" ")}` })),
  ...GUIDES.map((g) => ({ id: g.id, kind: "guide" as const, name: g.title, href: `/guides/${g.slug}/`, text: `${g.title} ${g.summary}` })),
];
export const libraryById = new Map(LIBRARY.map((e) => [e.id, e]));

const norm = (s: string) => s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
/** Recherche plein texte simple (côté client et dans les tests). La recherche sémantique se fait côté serveur. */
export function searchLibrary(query: string, kind?: LibraryKind, limit = 20): LibraryEntry[] {
  const terms = norm(query).split(/\s+/).filter((t) => t.length > 1);
  if (!terms.length) return [];
  return LIBRARY.filter((e) => !kind || e.kind === kind)
    .map((e) => { const n = norm(e.text); const nn = norm(e.name); return { e, s: terms.reduce((acc, t) => acc + (nn.includes(t) ? 3 : 0) + (n.includes(t) ? 1 : 0), 0) }; })
    .filter((x) => x.s > 0).sort((a, b) => b.s - a.s).slice(0, limit).map((x) => x.e);
}
