import { materialById } from "@/content/lookup";
import { libModel } from "@/lib/home3d/library";
import { COLORS } from "@/lib/home3d/plan";
import { parseVariant, variantName } from "@/lib/showroom/catalog";

/**
 * Planche de matières 3D : de vrais échantillons (bois, pierre, tissu, peinture), des objets 3D et des photos
 * posés sur un fond, éclairés comme sur une table d'atelier. Coordonnées en mètres, origine au centre de la planche.
 */
export type Shape = "carre" | "rond" | "lame" | "drape" | "nuancier" | "objet" | "photo" | "etiquette";
export interface BoardItem {
  id: string;
  /** Matière (« m-chene »), teinte (« #D8C9B4 »), modèle 3D (« Ottoman_01 ») ou photo importée (« up-… »). */
  ref: string;
  shape: Shape;
  x: number;
  z: number;
  /** Rotation en degrés autour de la verticale. */
  rot: number;
  /** Échelle (1 = taille d'échantillon standard). */
  s: number;
}
export interface Board { v: 1; title: string; bg: string; items: BoardItem[] }

export const BOARD_W = 1.2;
export const BOARD_D = 0.8;
export const SCALE_MIN = 0.5;
export const SCALE_MAX = 2.2;

/** Fonds proposés : enduits et bois réels, ou teintes unies d'atelier. */
export const BACKGROUNDS: Array<{ id: string; name: string }> = [
  { id: "#EFEBE3", name: "Papier ivoire" }, { id: "#F7F6F2", name: "Blanc gallery" }, { id: "#D8D2C6", name: "Lin grège" },
  { id: "#2B2925", name: "Ardoise nuit" }, { id: "m-chaux", name: "Enduit à la chaux" }, { id: "m-beton", name: "Béton ciré" },
  { id: "m-bouleau", name: "Contreplaqué" }, { id: "m-travertin", name: "Travertin" },
];

/** Formes d'échantillon possibles selon la famille de la matière. */
export function shapesFor(ref: string): Shape[] {
  if (ref.startsWith("t:")) return ["etiquette"];
  if (ref.startsWith("#")) return ["nuancier", "carre", "rond"];
  const v = parseVariant(ref);
  if (v) {
    switch (v.family.gen) {
      case "paint": return ["nuancier", "carre", "rond"];
      case "fabric": case "leather": return ["drape", "carre", "rond"];
      case "wood": return ["carre", "lame", "rond"];
      case "metal": return ["rond", "carre", "lame"];
      default: return ["carre", "rond", "lame"];
    }
  }
  const m = materialById.get(ref);
  if (m) {
    if (m.family === "Textile" || (m.family === "Fibre" && m.texture !== "cane")) return ["drape", "carre", "rond"];
    if (m.family === "Bois" || m.texture === "planks") return ["lame", "carre", "rond"];
    return ["carre", "rond", "lame"];
  }
  return ref.startsWith("up-") ? ["photo"] : ["objet"];
}
export const defaultShape = (ref: string): Shape => shapesFor(ref)[0]!;

/** Nom lisible d'un élément. */
/** Étiquette de texte : « t:Votre texte » (sans caractère de contrôle, 40 caractères au plus). */
export const labelRef = (text: string) => `t:${text.replace(/[\u0000-\u001f\u007f]/g, "").trim().slice(0, 40) || "Étiquette"}`;
export function itemName(ref: string): string {
  if (ref.startsWith("t:")) return `Étiquette « ${ref.slice(2)} »`;
  const v = parseVariant(ref); if (v) return variantName(v);
  if (ref.startsWith("#")) { const c = COLORS.find((x) => x.hex.toLowerCase() === ref.toLowerCase()); return c ? `Peinture ${c.name.toLowerCase()}` : `Peinture ${ref.toUpperCase()}`; }
  const m = materialById.get(ref); if (m) return m.name;
  if (ref.startsWith("up-")) return "Photo importée";
  return libModel(ref)?.name.replace(/_/g, " ") ?? ref;
}

const ID = /^[\w-]{1,60}$/;
const HEX = /^#[0-9a-fA-F]{6}$/;
const SHAPES: Shape[] = ["carre", "rond", "lame", "drape", "nuancier", "objet", "photo", "etiquette"];
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

/** Valide une planche venue du stockage local ou d'un lien partagé (rien n'est exécuté, tout est borné). */
export function parseBoard(raw: unknown): Board | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  if (!Array.isArray(r.items)) return null;
  const items: BoardItem[] = [];
  for (const it of r.items.slice(0, 80) as Array<Record<string, unknown>>) {
    if (!it || typeof it !== "object") continue;
    const ref = String(it.ref ?? ""), shape = String(it.shape ?? "") as Shape;
    if (ref.startsWith("t:")) {
      if (shape !== "etiquette") continue;
      const n = (k: string, d: number) => (typeof it[k] === "number" && Number.isFinite(it[k]) ? (it[k] as number) : d);
      items.push({ id: ID.test(String(it.id)) ? String(it.id) : uid(), ref: labelRef(ref.slice(2)), shape, x: clamp(n("x", 0), -BOARD_W / 2, BOARD_W / 2), z: clamp(n("z", 0), -BOARD_D / 2, BOARD_D / 2), rot: n("rot", 0) % 360, s: clamp(n("s", 1), SCALE_MIN, SCALE_MAX) });
      continue;
    }
    const variant = ref.startsWith("sr:") ? parseVariant(ref) : null;
    if (!(HEX.test(ref) || ID.test(ref) || variant) || !SHAPES.includes(shape)) continue;
    if (!HEX.test(ref) && !variant && !ref.startsWith("up-") && !materialById.get(ref) && !libModel(ref)) continue;
    const n = (k: string, d: number) => (typeof it[k] === "number" && Number.isFinite(it[k]) ? (it[k] as number) : d);
    items.push({ id: ID.test(String(it.id)) ? String(it.id) : uid(), ref: variant ? variant.ref : ref, shape, x: clamp(n("x", 0), -BOARD_W / 2, BOARD_W / 2), z: clamp(n("z", 0), -BOARD_D / 2, BOARD_D / 2), rot: n("rot", 0) % 360, s: clamp(n("s", 1), SCALE_MIN, SCALE_MAX) });
  }
  const bg = String(r.bg ?? "");
  return { v: 1, title: String(r.title ?? "Ma planche").slice(0, 80), bg: HEX.test(bg) || materialById.get(bg) ? bg : "#EFEBE3", items };
}

export const uid = () => Math.random().toString(36).slice(2, 10);

/** Lien de partage : la planche tient dans l'adresse (les photos importées restent sur l'appareil). */
export function encodeBoard(b: Board): string {
  const slim = { ...b, items: b.items.filter((i) => !i.ref.startsWith("up-")).map((i) => ({ ...i, x: +i.x.toFixed(3), z: +i.z.toFixed(3), rot: Math.round(i.rot), s: +i.s.toFixed(2) })) };
  return btoa(unescape(encodeURIComponent(JSON.stringify(slim)))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
export function decodeBoard(s: string): Board | null {
  try { return parseBoard(JSON.parse(decodeURIComponent(escape(atob(s.replace(/-/g, "+").replace(/_/g, "/")))))); } catch { return null; }
}

const it = (ref: string, x: number, z: number, rot = 0, s = 1, shape?: Shape): BoardItem => ({ id: uid(), ref, shape: shape ?? defaultShape(ref), x, z, rot, s });

/** Planches de départ : uniquement des matières, teintes et modèles réellement présents sur le site. */
export const TEMPLATES: Array<{ id: string; name: string; text: string; board: () => Board }> = [
  {
    id: "atelier", name: "Chêne, lin et travertin", text: "Douceur naturelle, tons sable et bois blond.",
    board: () => ({ v: 1, title: "Chêne, lin et travertin", bg: "#EFEBE3", items: [
      it("m-chaux", -0.4, 0.14, 6, 1.2), it("m-travertin", -0.2, -0.07, -7, 1.5), it("m-lin", 0.13, -0.1, 9, 1.3), it("m-chene", -0.08, 0.18, 11, 1.15),
      it("m-jute", 0.17, 0.2, 0, 1.15, "rond"), it("#D6C3A3", 0.39, 0.1, -9, 1.15), it("#B9874F", 0.43, -0.2, 12, 1), it("potted_plant_04", 0.3, -0.08, 0, 1.1),
    ] }),
  },
  {
    id: "mediterranee", name: "Terre cuite et tadelakt", text: "Tomettes, enduit ocre et teck huilé.",
    board: () => ({ v: 1, title: "Terre cuite et tadelakt", bg: "#F7F6F2", items: [
      it("m-tadelakt", 0.04, -0.12, -6, 1.5), it("m-tomette", -0.26, -0.05, 9, 1.5), it("m-teck", -0.04, 0.19, 84, 1.1), it("m-lin", 0.3, 0.12, -8, 1.15),
      it("m-terrazzo", 0.3, -0.17, 0, 1.15, "rond"), it("#C0714F", -0.44, 0.2, -10, 1.1), it("Lantern_01", 0.47, 0.0, 0, 1.2),
    ] }),
  },
  {
    id: "industriel", name: "Béton, brique et chêne fumé", text: "Contrastes francs, acier patiné et bois sombre.",
    board: () => ({ v: 1, title: "Béton, brique et chêne fumé", bg: "#2B2925", items: [
      it("m-velours", -0.4, 0.14, 6, 1.15), it("m-beton", -0.22, -0.07, -6, 1.5), it("m-brique", 0.07, -0.14, 8, 1.3), it("m-chenefume", -0.03, 0.19, 96, 1.1),
      it("m-corten", 0.32, 0.08, -12, 1.1), it("#3B3D3F", 0.43, -0.19, 4, 1.05), it("m-ardoise", 0.19, 0.25, 0, 1, "rond"),
    ] }),
  },
];
export const emptyBoard = (): Board => ({ v: 1, title: "Ma planche", bg: "#EFEBE3", items: [] });

const STORE = "pr_planche";
/** Ajoute un élément à la planche enregistrée sur l'appareil (depuis le showroom, une fiche…). */
export function addToStoredBoard(ref: string): number {
  let b: Board | null = null;
  try { const r = localStorage.getItem(STORE); b = r ? parseBoard(JSON.parse(r)) : null; } catch { b = null; }
  b ??= emptyBoard();
  const n = b.items.length, ang = n * 2.4;
  b.items.push({ id: uid(), ref, shape: defaultShape(ref), x: Math.max(-0.5, Math.min(0.5, Math.cos(ang) * 0.12 * Math.sqrt(n))), z: Math.max(-0.32, Math.min(0.32, Math.sin(ang) * 0.09 * Math.sqrt(n))), rot: Math.round((Math.random() - 0.5) * 14), s: 1.2 });
  b.items = b.items.slice(-80);
  try { localStorage.setItem(STORE, JSON.stringify(b)); } catch { /* stockage plein */ }
  window.dispatchEvent(new Event("pr-planche"));
  return b.items.length;
}
