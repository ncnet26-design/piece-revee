/**
 * Visite 3D : plan de l'appartement d'exemple, catalogue d'objets modifiables et état sauvegardable.
 * Unités : mètres. Axe x vers la droite, axe z vers le bas du plan (sud), y vers le haut.
 */

import { ROOM_KINDS, exampleLayout, type Layout, type OpeningKind, type RoomDef, type RoomKind, type Side } from "./layout";
export { EYE_H, WALL_H, roomArea, roomAt, type Layout, type RoomDef, type RoomKind } from "./layout";

/* ——— Habillage des murs et des sols ——— */
export type WallFinish = { kind: "peinture"; hex: string } | { kind: "matiere"; id: string };

export const PAINTS: Array<{ name: string; hex: string }> = [
  { name: "Blanc cassé", hex: "#F1EEE7" }, { name: "Lin", hex: "#E6DCCB" }, { name: "Grège", hex: "#CFC5B5" }, { name: "Argile", hex: "#C9A385" },
  { name: "Terracotta", hex: "#B8694A" }, { name: "Ocre", hex: "#D2A24C" }, { name: "Sauge", hex: "#A8B39A" }, { name: "Vert sapin", hex: "#3E5B4C" },
  { name: "Bleu ardoise", hex: "#5B6E7E" }, { name: "Bleu nuit", hex: "#273449" }, { name: "Rose poudré", hex: "#E3C3B8" }, { name: "Gris perle", hex: "#C9CCCB" },
  { name: "Bordeaux", hex: "#6E2A2E" }, { name: "Noir doux", hex: "#2D2C2A" },
];
export const WALL_MATERIALS = ["m-chaux", "m-argile", "m-tadelakt", "m-beton", "m-brique", "m-metro", "m-zellige", "m-washi", "m-panoramique"];
export const FLOOR_MATERIALS_IN = ["m-chene", "m-chenefume", "m-noyer", "m-pin", "m-bambou", "m-stratifie", "m-liege", "m-travertin", "m-carrare", "m-verde", "m-ardoise", "m-bourgogne", "m-terrazzo", "m-ciment", "m-tomette", "m-terrecuite", "m-gres", "m-zellige", "m-beton", "m-microciment", "m-ceramique-frittee", "m-lino"];
/** Revêtements propres à la 3D, absents de la matériauthèque (pas de fiche). */
export const PSEUDO_MATERIALS: Record<string, { name: string; colors: string[]; texture: "gravel" }> = {
  "m-pelouse": { name: "Pelouse", colors: ["#7FA05A", "#6A8C4A", "#93B26B"], texture: "gravel" },
};
export const FLOOR_MATERIALS_OUT = ["m-pelouse", "m-teck", "m-pin", "m-composite", "m-chataignier", "m-travertin", "m-bourgogne", "m-ardoise", "m-gres", "m-tomette", "m-gravier", "m-pierre-seche"];
export const FABRICS = ["m-lin", "m-bouclette", "m-velours", "m-laine", "m-cuir", "m-feutre"];
export const STRUCTURES = ["m-chene", "m-noyer", "m-chenefume", "m-bouleau", "m-teck", "m-cannage", "m-acier", "m-laiton", "m-inox", "m-carrare", "m-travertin", "m-laque", "m-beton"];

export const COLORS: Array<{ name: string; hex: string }> = [
  { name: "Écru", hex: "#E9E2D3" }, { name: "Sable", hex: "#D6C3A3" }, { name: "Camel", hex: "#B9874F" }, { name: "Rouille", hex: "#A8552F" },
  { name: "Terracotta", hex: "#C0714F" }, { name: "Moutarde", hex: "#C99A2E" }, { name: "Olive", hex: "#7A7B4A" }, { name: "Sauge", hex: "#9DAA8C" },
  { name: "Vert forêt", hex: "#2F4A3D" }, { name: "Bleu canard", hex: "#24545C" }, { name: "Bleu nuit", hex: "#232F4A" }, { name: "Gris anthracite", hex: "#3B3D3F" },
  { name: "Gris clair", hex: "#BFC1BE" }, { name: "Rose poudré", hex: "#D9AFA2" }, { name: "Bordeaux", hex: "#6B2430" }, { name: "Blanc", hex: "#F3F1EC" },
];

/* ——— Catalogue d'objets ——— */
export type ItemType =
  | "canape" | "fauteuil" | "table-basse" | "table" | "chaise" | "tabouret" | "lit" | "chevet" | "armoire" | "commode" | "bibliotheque"
  | "meuble-tv" | "bureau" | "tapis" | "lampadaire" | "suspension" | "plante" | "cuisine" | "ilot" | "refrigerateur" | "meuble-vasque"
  | "miroir" | "baignoire" | "douche" | "wc" | "tableau" | "console" | "porte-manteau" | "banc" | "salon-jardin" | "transat" | "parasol" | "jardiniere"
  | "canape-velours" | "fauteuil-velours" | "plante-reelle";

export type Category = "Salon" | "Repas" | "Chambre" | "Rangement" | "Cuisine" | "Salle de bain" | "Lumière et déco" | "Extérieur";

export interface CatalogEntry {
  label: string; category: Category;
  /** Couleur principale modifiable (tissu, façade, peinture). */
  color?: string;
  fabric?: string;
  structure?: string;
  variants?: string[];
  /** Objet que l'on traverse (tapis) ou fixé au mur ou au plafond. */
  walkThrough?: boolean;
  /** Hauteur de pose (objets muraux). */
  mount?: number;
  /** Intitulé du choix de variante (« Modèle » par défaut). */
  variantLabel?: string;
  /** Modèle 3D réaliste (fichier glTF sous licence libre). */
  realistic?: boolean;
}

export const CATALOG: Record<ItemType, CatalogEntry> = {
  "canape-velours": { label: "Canapé velours", category: "Salon", variants: ["Bleu nuit", "Champagne", "Gris", "Noir", "Rose pâle"], variantLabel: "Coloris", realistic: true },
  "fauteuil-velours": { label: "Fauteuil velours", category: "Salon", variants: ["Mangue", "Paon"], variantLabel: "Coloris", realistic: true },
  "plante-reelle": { label: "Plante en pot", category: "Lumière et déco", realistic: true },
  canape: { label: "Canapé", category: "Salon", color: "#D6C3A3", fabric: "m-lin", structure: "m-chene", variants: ["3 places", "2 places", "D'angle"] },
  fauteuil: { label: "Fauteuil", category: "Salon", color: "#B9874F", fabric: "m-bouclette", structure: "m-chene" },
  "table-basse": { label: "Table basse", category: "Salon", structure: "m-travertin", variants: ["Rectangulaire", "Ronde"] },
  "meuble-tv": { label: "Meuble TV", category: "Salon", structure: "m-chene", variants: ["Avec écran", "Sans écran"] },
  table: { label: "Table à manger", category: "Repas", structure: "m-chene", variants: ["4 personnes", "6 personnes", "Ronde"] },
  chaise: { label: "Chaise", category: "Repas", color: "#E9E2D3", fabric: "m-lin", structure: "m-chene" },
  tabouret: { label: "Tabouret de bar", category: "Repas", structure: "m-chene" },
  lit: { label: "Lit", category: "Chambre", color: "#D6C3A3", fabric: "m-lin", structure: "m-chene", variants: ["160 × 200", "140 × 190", "180 × 200"] },
  chevet: { label: "Table de chevet", category: "Chambre", structure: "m-chene" },
  bureau: { label: "Bureau", category: "Chambre", structure: "m-chene" },
  armoire: { label: "Armoire", category: "Rangement", color: "#E9E2D3", structure: "m-chene" },
  commode: { label: "Commode", category: "Rangement", color: "#E9E2D3", structure: "m-chene" },
  bibliotheque: { label: "Bibliothèque", category: "Rangement", structure: "m-chene" },
  console: { label: "Console", category: "Rangement", structure: "m-chene" },
  "porte-manteau": { label: "Porte-manteau", category: "Rangement", structure: "m-chene" },
  banc: { label: "Banc", category: "Rangement", color: "#D6C3A3", fabric: "m-lin", structure: "m-chene" },
  cuisine: { label: "Cuisine linéaire", category: "Cuisine", color: "#9DAA8C", structure: "m-carrare", variants: ["2,40 m", "3 m"] },
  ilot: { label: "Îlot central", category: "Cuisine", color: "#9DAA8C", structure: "m-carrare" },
  refrigerateur: { label: "Réfrigérateur", category: "Cuisine", color: "#D9D9D6" },
  "meuble-vasque": { label: "Meuble vasque", category: "Salle de bain", color: "#E9E2D3", structure: "m-carrare" },
  miroir: { label: "Miroir", category: "Salle de bain", structure: "m-laiton", variants: ["Rond", "Rectangulaire"], walkThrough: true, mount: 1.55 },
  baignoire: { label: "Baignoire", category: "Salle de bain" },
  douche: { label: "Douche à l'italienne", category: "Salle de bain" },
  wc: { label: "WC suspendu", category: "Salle de bain" },
  tapis: { label: "Tapis", category: "Lumière et déco", color: "#D6C3A3", fabric: "m-laine", variants: ["200 × 300", "160 × 230", "Rond"], walkThrough: true },
  lampadaire: { label: "Lampadaire", category: "Lumière et déco", color: "#F1EEE7", structure: "m-laiton" },
  suspension: { label: "Suspension", category: "Lumière et déco", color: "#F1EEE7", structure: "m-laiton", walkThrough: true, mount: 1.75 },
  plante: { label: "Plante", category: "Lumière et déco", color: "#C0714F", variants: ["Grande", "Petite", "Olivier"] },
  tableau: { label: "Tableau", category: "Lumière et déco", color: "#C0714F", structure: "m-chene", walkThrough: true, mount: 1.5 },
  "salon-jardin": { label: "Table de jardin", category: "Extérieur", color: "#E9E2D3", structure: "m-teck" },
  transat: { label: "Transat", category: "Extérieur", color: "#E9E2D3", structure: "m-teck" },
  parasol: { label: "Parasol", category: "Extérieur", color: "#E9E2D3", structure: "m-teck", walkThrough: true },
  jardiniere: { label: "Jardinière", category: "Extérieur", structure: "m-corten" },
};
export const CATEGORIES: Category[] = ["Salon", "Repas", "Chambre", "Rangement", "Cuisine", "Salle de bain", "Lumière et déco", "Extérieur"];

export interface Item {
  id: string; type: ItemType; x: number; z: number; rot: number;
  color?: string; fabric?: string; structure?: string; variant?: string;
}
export interface Note { id: string; roomId: string; x: number; y: number; z: number; text: string; at: string }
export interface RoomStyle { wall: WallFinish; floor: string }
export interface HomeState { v: 1; layout: Layout; rooms: Record<string, RoomStyle>; items: Item[]; notes: Note[] }

/** Habillage par défaut d'une nouvelle pièce, selon son type. */
export function defaultRoomStyle(kind: RoomKind, area = 0): RoomStyle {
  switch (kind) {
    case "cuisine": return { wall: { kind: "peinture", hex: "#F1EEE7" }, floor: "m-ciment" };
    case "chambre": return { wall: { kind: "peinture", hex: "#E6DCCB" }, floor: "m-chene" };
    case "sdb": return { wall: { kind: "matiere", id: "m-chaux" }, floor: "m-gres" };
    case "entree": return { wall: { kind: "peinture", hex: "#E6DCCB" }, floor: "m-tomette" };
    case "exterieur": return { wall: { kind: "peinture", hex: "#EDE6DA" }, floor: area >= 30 ? "m-pelouse" : "m-teck" };
    default: return { wall: { kind: "peinture", hex: "#F1EEE7" }, floor: "m-chene" };
  }
}
/** Complète les habillages manquants (pièces ajoutées) et retire ceux des pièces supprimées. */
export function syncRoomStyles(layout: Layout, rooms: Record<string, RoomStyle>): Record<string, RoomStyle> {
  return Object.fromEntries(layout.rooms.map((r) => [r.id, rooms[r.id] ?? defaultRoomStyle(r.kind, (r.x1 - r.x0) * (r.z1 - r.z0))]));
}

const R = Math.PI;
let n = 0;
const it = (type: ItemType, x: number, z: number, rot = 0, extra: Partial<Item> = {}): Item => ({ id: `i${++n}`, type, x, z, rot, ...extra });

/** Rotation : 0 = face vers le sud (+z), π = face vers le nord, π/2 = face vers l'est (+x), -π/2 = face vers l'ouest. */
export function defaultState(): HomeState {
  n = 0;
  return {
    v: 1,
    layout: exampleLayout(),
    rooms: {
      entree: { wall: { kind: "peinture", hex: "#E6DCCB" }, floor: "m-tomette" },
      salon: { wall: { kind: "peinture", hex: "#F1EEE7" }, floor: "m-chene" },
      cuisine: { wall: { kind: "peinture", hex: "#F1EEE7" }, floor: "m-ciment" },
      chambre: { wall: { kind: "peinture", hex: "#A8B39A" }, floor: "m-chene" },
      sdb: { wall: { kind: "matiere", id: "m-chaux" }, floor: "m-terrazzo" },
      terrasse: { wall: { kind: "peinture", hex: "#EDE6DA" }, floor: "m-teck" },
    },
    items: [
      // Salon
      it("tapis", 2.65, 3.7, 0, { color: "#D6C3A3" }),
      it("canape-velours", 4.6, 3.7, -R / 2, { variant: "Bleu nuit" }),
      it("table-basse", 2.95, 3.7, R / 2),
      it("meuble-tv", 0.3, 4.0, R / 2),
      it("fauteuil-velours", 1.35, 1.55, R / 4 + R / 2, { variant: "Mangue" }),
      it("lampadaire", 4.55, 4.8),
      it("bibliotheque", 2.9, 4.8, R),
      it("plante-reelle", 0.55, 0.55, 0),
      it("tableau", 6.93, 4.2, -R / 2, { color: "#B8694A" }),
      it("table", 5.65, 1.25, 0, { variant: "4 personnes" }),
      it("chaise", 5.3, 0.48, 0), it("chaise", 6.0, 0.48, 0), it("chaise", 5.3, 2.02, R), it("chaise", 6.0, 2.02, R),
      it("suspension", 5.65, 1.25),
      // Cuisine
      it("cuisine", 9.6, 4.65, R, { variant: "2,40 m" }),
      it("refrigerateur", 11.55, 4.62, R),
      it("ilot", 9.6, 2.55),
      it("tabouret", 9.0, 1.85), it("tabouret", 9.6, 1.85), it("tabouret", 10.2, 1.85),
      it("suspension", 9.3, 2.55), it("suspension", 9.9, 2.55),
      it("plante", 7.55, 0.55, 0, { variant: "Petite" }),
      // Entrée
      it("console", 0.27, 6.6, R / 2),
      it("miroir", 0.13, 6.6, R / 2, { variant: "Rond" }),
      it("porte-manteau", 2.75, 7.6, -R / 2),
      it("banc", 2.7, 6.4, -R / 2),
      it("plante", 0.5, 8.4, 0, { variant: "Petite" }),
      it("tapis", 1.5, 7.3, R / 2, { variant: "160 × 230", color: "#C0714F" }),
      // Chambre
      it("tapis", 4.4, 7.2, -R / 2, { variant: "160 × 230", color: "#E9E2D3", fabric: "m-laine" }),
      it("lit", 4.1, 7.2, R / 2, { variant: "160 × 200" }),
      it("chevet", 3.3, 6.1, R / 2), it("chevet", 3.3, 8.3, R / 2),
      it("armoire", 4.4, 5.36, 0),
      it("bureau", 7.0, 8.6, R),
      it("chaise", 7.0, 8.0, 0),
      it("plante-reelle", 7.5, 7.4, 0),
      it("tableau", 3.07, 7.2, R / 2, { color: "#3E5B4C" }),
      // Salle de bain
      it("baignoire", 10.85, 8.5),
      it("meuble-vasque", 9.9, 5.3, 0),
      it("miroir", 9.9, 5.07, 0, { variant: "Rectangulaire" }),
      it("wc", 11.62, 6.4, -R / 2),
      it("plante", 8.45, 8.5, 0, { variant: "Petite" }),
      // Terrasse
      it("salon-jardin", 9.2, -2.0),
      it("parasol", 9.2, -2.0),
      it("transat", 2.3, -2.4, R), it("transat", 3.6, -2.4, R),
      it("plante", 0.75, -0.65, 0, { variant: "Olivier" }),
      it("jardiniere", 6.3, -0.45), it("jardiniere", 11.1, -0.45),
    ],
    notes: [],
  };
}

/* ——— Sauvegarde et partage ——— */
export const STORAGE_KEY = "pr_home3d_v1";

export const isObj = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null;
/** Valide un état venant du stockage local ou d'un lien partagé (données non fiables). */
export function parseState(raw: unknown): HomeState | null {
  if (!isObj(raw) || raw.v !== 1 || !isObj(raw.rooms) || !Array.isArray(raw.items)) return null;
  const hex = (v: unknown) => (typeof v === "string" && /^#[0-9a-fA-F]{6}$/.test(v) ? v : undefined);
  const id = (v: unknown) => (typeof v === "string" && /^m-[a-z-]{2,30}$/.test(v) ? v : undefined);
  const num = (v: unknown, lo: number, hi: number) => (typeof v === "number" && Number.isFinite(v) ? Math.min(hi, Math.max(lo, v)) : null);
  const base = defaultState();
  const layout = parseLayout(raw.layout) ?? base.layout;
  const rooms: Record<string, RoomStyle> = syncRoomStyles(layout, base.rooms);
  for (const r of layout.rooms) {
    const src = raw.rooms[r.id];
    if (!isObj(src)) continue;
    const w = src.wall; let wall = rooms[r.id]!.wall;
    if (isObj(w) && w.kind === "peinture" && hex(w.hex)) wall = { kind: "peinture", hex: hex(w.hex)! };
    if (isObj(w) && w.kind === "matiere" && id(w.id)) wall = { kind: "matiere", id: id(w.id)! };
    rooms[r.id] = { wall, floor: id(src.floor) ?? rooms[r.id]!.floor };
  }
  const items: Item[] = [];
  for (const s of raw.items.slice(0, 300)) {
    if (!isObj(s) || typeof s.type !== "string" || !(s.type in CATALOG)) continue;
    const x = num(s.x, -61, 61), z = num(s.z, -61, 61), rot = num(s.rot, -10, 10);
    if (x === null || z === null || rot === null) continue;
    const entry = CATALOG[s.type as ItemType];
    items.push({
      id: typeof s.id === "string" && s.id.length < 40 ? s.id : `i${items.length + 1}-${Date.now().toString(36)}`, type: s.type as ItemType, x, z, rot,
      color: hex(s.color), fabric: id(s.fabric), structure: id(s.structure),
      variant: typeof s.variant === "string" && entry.variants?.includes(s.variant) ? s.variant : undefined,
    });
  }
  const notes: Note[] = [];
  if (Array.isArray(raw.notes)) for (const s of raw.notes.slice(0, 100)) {
    if (!isObj(s) || typeof s.text !== "string" || typeof s.roomId !== "string") continue;
    const x = num(s.x, -61, 61), y = num(s.y, 0, 3), z = num(s.z, -61, 61);
    if (x === null || y === null || z === null) continue;
    notes.push({ id: typeof s.id === "string" ? s.id.slice(0, 40) : `n${notes.length}`, roomId: s.roomId.slice(0, 20), x, y, z, text: s.text.slice(0, 500), at: typeof s.at === "string" ? s.at.slice(0, 30) : new Date().toISOString() });
  }
  return { v: 1, layout, rooms, items, notes };
}

const KINDS = new Set<string>(ROOM_KINDS.map((k) => k.kind));
const OKINDS = new Set<string>(["porte", "passage", "fenetre", "baie", "porte-entree"]);
/** Valide un plan venant d'un lien ou du stockage (données non fiables). */
export function parseLayout(raw: unknown): Layout | null {
  if (!isObj(raw) || !Array.isArray(raw.rooms) || !Array.isArray(raw.openings)) return null;
  const n = (v: unknown, lo: number, hi: number) => (typeof v === "number" && Number.isFinite(v) ? Math.min(hi, Math.max(lo, Math.round(v * 100) / 100)) : null);
  const rooms: RoomDef[] = [];
  for (const r of raw.rooms.slice(0, 40)) {
    if (!isObj(r) || typeof r.id !== "string" || !/^[\w-]{1,24}$/.test(r.id) || typeof r.kind !== "string" || !KINDS.has(r.kind)) continue;
    const x0 = n(r.x0, -60, 60), z0 = n(r.z0, -60, 60), x1 = n(r.x1, -60, 60), z1 = n(r.z1, -60, 60);
    if (x0 === null || z0 === null || x1 === null || z1 === null || x1 - x0 < 0.8 || z1 - z0 < 0.8 || rooms.some((o) => o.id === r.id)) continue;
    const pt = (v: unknown): [number, number] | undefined => (Array.isArray(v) && v.length === 2 && v.every((c) => typeof c === "number" && Number.isFinite(c)) ? [v[0] as number, v[1] as number] : undefined);
    const spawn = pt(r.spawn), look = pt(r.look);
    rooms.push({ id: r.id, name: typeof r.name === "string" && r.name.trim() ? r.name.trim().slice(0, 40) : "Pièce", kind: r.kind as RoomKind, x0, z0, x1, z1, ...(spawn && look ? { spawn, look } : {}) });
  }
  if (!rooms.length) return null;
  const openings: Layout["openings"] = [];
  for (const o of raw.openings.slice(0, 200)) {
    if (!isObj(o) || typeof o.roomId !== "string" || !rooms.some((r) => r.id === o.roomId) || typeof o.kind !== "string" || !OKINDS.has(o.kind)) continue;
    if (o.side !== "n" && o.side !== "s" && o.side !== "e" && o.side !== "w") continue;
    const offset = n(o.offset, 0, 60), width = n(o.width, 0.3, 6), height = n(o.height, 0.3, 2.5), sill = n(o.sill, 0, 2);
    if (offset === null || width === null || height === null || sill === null) continue;
    openings.push({ id: typeof o.id === "string" ? o.id.slice(0, 24) : `o${openings.length}`, roomId: o.roomId, side: o.side as Side, offset, width, height, sill, kind: o.kind as OpeningKind });
  }
  return { rooms, openings };
}

async function pipe(bytes: Uint8Array, stream: CompressionStream | DecompressionStream): Promise<Uint8Array> {
  const out = new Response(new Blob([new Uint8Array(bytes)]).stream().pipeThrough(stream));
  return new Uint8Array(await out.arrayBuffer());
}
const b64url = (b: Uint8Array) => btoa(String.fromCharCode(...b)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const fromB64url = (s: string) => Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/")), (c) => c.charCodeAt(0));

/** Encode le plan dans un lien (compressé, sans serveur). */
export async function encodeState(s: HomeState): Promise<string> {
  const json = new TextEncoder().encode(JSON.stringify(s));
  if (typeof CompressionStream === "undefined") return `j.${b64url(json)}`;
  return `z.${b64url(await pipe(json, new CompressionStream("deflate-raw")))}`;
}
export async function decodeState(code: string): Promise<HomeState | null> {
  try {
    const [kind, data] = [code.slice(0, 1), code.slice(2)];
    const bytes = fromB64url(data);
    const json = kind === "z" ? await pipe(bytes, new DecompressionStream("deflate-raw")) : bytes;
    return parseState(JSON.parse(new TextDecoder().decode(json)));
  } catch { return null; }
}

/** Dimensions hors tout (largeur, profondeur, hauteur en m) de chaque objet, selon le modèle choisi. */
export function itemDims(it: Pick<Item, "type" | "variant">): { w: number; d: number; h: number } {
  const v = it.variant;
  switch (it.type) {
    case "canape": return v === "2 places" ? { w: 1.6, d: 0.92, h: 0.86 } : v === "D'angle" ? { w: 2.6, d: 1.65, h: 0.86 } : { w: 2.1, d: 0.92, h: 0.86 };
    case "fauteuil": return { w: 0.78, d: 0.78, h: 0.95 };
    case "table-basse": return v === "Ronde" ? { w: 0.84, d: 0.84, h: 0.38 } : { w: 1.1, d: 0.6, h: 0.38 };
    case "meuble-tv": return { w: 1.6, d: 0.4, h: v === "Sans écran" ? 0.48 : 1.31 };
    case "table": return v === "Ronde" ? { w: 1.1, d: 1.1, h: 0.75 } : v === "6 personnes" ? { w: 1.8, d: 0.9, h: 0.75 } : { w: 1.4, d: 0.85, h: 0.75 };
    case "chaise": return { w: 0.44, d: 0.46, h: 0.87 };
    case "tabouret": return { w: 0.36, d: 0.36, h: 0.68 };
    case "lit": return v === "140 × 190" ? { w: 1.54, d: 2.0, h: 1.1 } : v === "180 × 200" ? { w: 1.94, d: 2.1, h: 1.1 } : { w: 1.74, d: 2.1, h: 1.1 };
    case "chevet": return { w: 0.45, d: 0.4, h: 0.85 };
    case "bureau": return { w: 1.2, d: 0.6, h: 0.76 };
    case "armoire": return { w: 1.2, d: 0.6, h: 2.2 };
    case "commode": return { w: 1.0, d: 0.5, h: 0.85 };
    case "bibliotheque": return { w: 1.2, d: 0.35, h: 2.0 };
    case "console": return { w: 1.0, d: 0.35, h: 0.82 };
    case "porte-manteau": return { w: 0.9, d: 0.25, h: 1.7 };
    case "banc": return { w: 1.0, d: 0.38, h: 0.49 };
    case "cuisine": return { w: v === "3 m" ? 3.0 : 2.4, d: 0.62, h: 2.17 };
    case "ilot": return { w: 1.95, d: 1.05, h: 0.92 };
    case "refrigerateur": return { w: 0.6, d: 0.65, h: 1.85 };
    case "meuble-vasque": return { w: 0.82, d: 0.48, h: 0.95 };
    case "miroir": return v === "Rectangulaire" ? { w: 0.72, d: 0.02, h: 0.92 } : { w: 0.7, d: 0.02, h: 0.7 };
    case "baignoire": return { w: 1.7, d: 0.75, h: 0.56 };
    case "douche": return { w: 0.9, d: 0.9, h: 2.05 };
    case "wc": return { w: 0.5, d: 0.6, h: 1.1 };
    case "tapis": return v === "Rond" ? { w: 2.0, d: 2.0, h: 0.015 } : v === "160 × 230" ? { w: 2.3, d: 1.6, h: 0.015 } : { w: 3.0, d: 2.0, h: 0.015 };
    case "lampadaire": return { w: 0.44, d: 0.44, h: 1.7 };
    case "suspension": return { w: 0.4, d: 0.4, h: 0.3 };
    case "plante": return v === "Olivier" ? { w: 1.2, d: 1.2, h: 2.2 } : v === "Petite" ? { w: 0.4, d: 0.4, h: 0.55 } : { w: 0.7, d: 0.7, h: 1.6 };
    case "tableau": return { w: 0.84, d: 0.03, h: 0.64 };
    case "salon-jardin": return { w: 1.6, d: 2.0, h: 0.88 };
    case "transat": return { w: 0.68, d: 1.9, h: 0.75 };
    case "parasol": return { w: 2.9, d: 2.9, h: 2.46 };
    case "jardiniere": return { w: 1.2, d: 0.42, h: 0.7 };
    case "canape-velours": return { w: 2.19, d: 1.02, h: 0.79 };
    case "fauteuil-velours": return { w: 0.83, d: 0.57, h: 0.69 };
    case "plante-reelle": return { w: 0.7, d: 0.66, h: 0.84 };
  }
}
