/**
 * Planche « à partir d'une image » : la photo du client (ou une inspiration) est posée en tirage,
 * puis les matières du showroom les plus proches de ses couleurs sont composées autour, façon planche d'architecte.
 */
import { extractPalette } from "@/lib/photo";
import { dist } from "@/lib/transform/match";
import { familyById, makeRef, type Opt } from "@/lib/showroom/catalog";
import { uid, type Board, type BoardItem, type Shape } from "./state";

const lum = (h: string) => { const n = parseInt(h.slice(1), 16); return (0.3 * ((n >> 16) & 255) + 0.59 * ((n >> 8) & 255) + 0.11 * (n & 255)) / 255; };
const chroma = (h: string) => { const n = parseInt(h.slice(1), 16), r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255; return (Math.max(r, g, b) - Math.min(r, g, b)) / 255; };
function nearestOpt(fid: string, axis: string, hex: string, key: "hex" | "c0" | "c1" = "hex"): Opt {
  const a = familyById.get(fid)!.axes.find((x) => x.id === axis)!;
  const col = (o: Opt) => (key === "hex" ? o.hex : o.colors?.[key === "c0" ? 0 : 1]) ?? "#888888";
  return a.options.filter((o) => o.hex || o.colors?.length).reduce((b, o) => (dist(hex, col(o)) < dist(hex, col(b)) ? o : b));
}
function ref(fid: string, picks: Record<string, Opt | string>): string {
  const f = familyById.get(fid)!;
  return makeRef(f, f.axes.map((a) => { const p = picks[a.id]; return typeof p === "string" ? a.options.find((o) => o.id === p) ?? a.options[0]! : p ?? a.options[0]!; }));
}

/** Les références tirées d'une palette, rôle par rôle. */
export function refsFromPalette(palette: string[]) {
  const byLum = [...palette].sort((a, b) => lum(b) - lum(a)), light = byLum[0] ?? "#EDE6DA", dark = byLum[byLum.length - 1] ?? "#5A4334";
  const accent = [...palette].sort((a, b) => chroma(b) - chroma(a))[0] ?? palette[0] ?? "#C0714F";
  const mid = byLum[Math.floor(byLum.length / 2)] ?? accent;
  const warm = palette.some((h) => { const n = parseInt(h.slice(1), 16); return ((n >> 16) & 255) > (n & 255) + 20; });
  return {
    wood: ref("parquet", { essence: nearestOpt("parquet", "essence", mid, "c1"), pose: "larges", finition: "huile" }),
    stone: ref("marbre", { pierre: nearestOpt("marbre", "pierre", light, "c0"), finition: "adouci" }),
    paint: ref("peinture", { teinte: nearestOpt("peinture", "teinte", accent), finition: "brillant" }),
    fabric1: ref("tissu", { matiere: "velours", couleur: nearestOpt("tissu", "couleur", accent) }),
    fabric2: ref("tissu", { matiere: "lin", couleur: nearestOpt("tissu", "couleur", light) }),
    fabric3: ref("tissu", { matiere: "bouclette", couleur: nearestOpt("tissu", "couleur", mid) }),
    wall: ref("papier-peint", { motif: chroma(accent) > 0.25 ? "feuillage" : "uni", coloris: nearestOpt("papier-peint", "coloris", accent, "c1") }),
    leather: ref("cuir", { type: "pleine-fleur", couleur: nearestOpt("cuir", "couleur", dark) }),
    metal: ref("quincaillerie", { modele: "pastille", metal: warm ? "laiton" : "inox", finition: "brosse" }),
    handle: ref("quincaillerie", { modele: warm ? "barre-moletee" : "bouton-strie", metal: warm ? "bronze" : "acier-noir", finition: "brosse" }),
    styling: ref("stylisme", { objet: chroma(accent) > 0.3 ? "tulipe" : "branche", nuance: nearestOpt("stylisme", "nuance", accent) }),
  };
}

/** Composition façon planche d'architecte : grands fonds, tissus crantés, tirage photo, petits objets par-dessus. */
export function composeFromPalette(palette: string[], photoRef: string | null, title = "Ma planche inspirée"): Board {
  const r = refsFromPalette(palette);
  const it = (ref: string, shape: Shape, x: number, z: number, rot: number, s: number): BoardItem => ({ id: uid(), ref, shape, x, z, rot, s });
  const items: BoardItem[] = [
    it(r.wood, "lame", 0.05, -0.02, 90, 1.5),
    it(r.stone, "carre", 0.2, -0.16, 0, 1.25),
    it(r.wall, "dechire", -0.12, 0.17, 0, 1.25),
    it(r.fabric1, "drape", 0.36, -0.08, 4, 1.05),
    it(r.fabric2, "drape", 0.42, 0.14, -6, 0.95),
    it(r.leather, "carre", 0.16, 0.22, 0, 0.75),
    it(r.fabric3, "drape", -0.02, 0.2, 8, 0.75),
    ...(photoRef ? [it(photoRef, "photo", -0.34, -0.1, -2, 1.55)] : [it(r.fabric3, "carre", -0.34, -0.1, 0, 1.3)]),
    it(r.paint, "goutte", 0.1, 0.06, 0, 1.6),
    it(r.metal, "piece", 0.27, 0.06, 0, 1.6),
    it(r.handle, "piece", 0.48, -0.25, 90, 1.3),
    it(r.styling, "piece", 0.0, -0.02, 35, 1.25),
  ];
  return { v: 1, title, bg: "#F2F0EC", items };
}

/** Image (data URL ou adresse du site) → planche composée, et la photo à mémoriser sur l'appareil. */
export async function boardFromImage(src: string, title?: string): Promise<{ board: Board; photoId: string; dataUrl: string }> {
  const img = new Image(); img.crossOrigin = "anonymous"; img.src = src; await img.decode();
  const k = Math.min(1, 1400 / Math.max(img.naturalWidth, img.naturalHeight)), c = document.createElement("canvas");
  c.width = Math.round(img.naturalWidth * k); c.height = Math.round(img.naturalHeight * k); c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
  const dataUrl = c.toDataURL("image/jpeg", 0.86);
  const palette = await extractPalette(dataUrl, 6);
  const photoId = `up-${uid()}`;
  return { board: composeFromPalette(palette, photoId, title), photoId, dataUrl };
}

/** Enregistre la planche et sa photo sur l'appareil (ouverte ensuite par la page Planche). */
export function storeBoardWithPhoto(board: Board, photoId: string, dataUrl: string) {
  try {
    const raw = localStorage.getItem("pr_planche_photos"), list = (raw ? JSON.parse(raw) : []) as Array<[string, string]>;
    localStorage.setItem("pr_planche_photos", JSON.stringify([...list, [photoId, dataUrl]].slice(-8)));
  } catch { /* mémoire pleine : la planche s'ouvre sans la photo */ }
  try { localStorage.setItem("pr_planche", JSON.stringify(board)); } catch { /* idem */ }
}
