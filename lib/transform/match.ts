import { STYLES } from "@/content/styles";
import { materialById } from "@/content/lookup";
import type { StyleTheme } from "@/content/types";
import { FAMILIES, PAINT_SHADES, familyById, makeRef, parseVariant, variantName, variantShop, type Opt } from "@/lib/showroom/catalog";
import { libModel, frenchName } from "@/lib/home3d/library";
import type { BoardItem } from "@/lib/board/state";
import type { RetailerKind } from "@/lib/retailers";

/**
 * « Transformer mon espace » : à partir des couleurs des inspirations, choisit un style, des teintes,
 * un sol, des tissus, des finitions et des objets, puis estime un budget par poste. Tout est calculé
 * dans le navigateur, à partir du catalogue du site : rien n'est inventé, chaque référence se retrouve chez les enseignes.
 */
export const ROOMS = ["Salon", "Chambre", "Cuisine", "Salle de bain", "Salle à manger", "Bureau", "Entrée"] as const;
export type Room = (typeof ROOMS)[number];
export const TIERS = { malin: "Malin", confort: "Confort", premium: "Premium", haut_de_gamme: "Haut de gamme" } as const;
export type Tier = keyof typeof TIERS;

type RGB = [number, number, number];
const rgb = (h: string): RGB => { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
/** Couleurs en espace Lab (distance perçue par l'œil). */
function lab(h: string): [number, number, number] {
  const f = (c: number) => { c /= 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
  const [r, g, b] = rgb(h).map(f) as RGB;
  const x = (r * 0.4124 + g * 0.3576 + b * 0.1805) / 0.95047, y = r * 0.2126 + g * 0.7152 + b * 0.0722, z = (r * 0.0193 + g * 0.1192 + b * 0.9505) / 1.08883;
  const t = (v: number) => (v > 0.008856 ? Math.cbrt(v) : 7.787 * v + 16 / 116);
  return [116 * t(y) - 16, 500 * (t(x) - t(y)), 200 * (t(y) - t(z))];
}
export const dist = (a: string, b: string) => { const p = lab(a), q = lab(b); return Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]); };
const L = (h: string) => lab(h)[0];
const chroma = (h: string) => { const [, a, b] = lab(h); return Math.hypot(a, b); };
const nearest = (hex: string, opts: Opt[]) => opts.reduce((best, o) => (o.hex && dist(hex, o.hex) < dist(hex, best.hex!) ? o : best), opts.find((o) => o.hex)!);

/** Palette commune de plusieurs images : regroupement des couleurs, puis 6 teintes bien distinctes. */
export function mergePalettes(palettes: string[][]): string[] {
  const all = palettes.flat();
  const out: string[] = [];
  const byFreq = [...all].sort((a, b) => all.filter((x) => dist(x, b) < 14).length - all.filter((x) => dist(x, a) < 14).length);
  for (const c of byFreq) { if (out.every((o) => dist(o, c) > 16)) out.push(c); if (out.length === 6) break; }
  for (const c of all) { if (out.length >= 6) break; if (!out.includes(c)) out.push(c); }
  return out.sort((a, b) => L(b) - L(a));
}

/** Style le plus proche des couleurs des inspirations. */
export function guessStyle(palette: string[]): StyleTheme {
  const interiors = STYLES.filter((s) => s.scope === "interieur");
  const score = (s: StyleTheme) => palette.reduce((sum, c) => sum + Math.min(...s.palette.map((p) => dist(c, p))), 0);
  return interiors.reduce((a, b) => (score(b) < score(a) ? b : a));
}

export interface Pick { ref: string; role: string; category: Category; name: string; shop: { q: string; kinds: RetailerKind[] } }
export type Category = "Murs" | "Sol" | "Textiles" | "Mobilier" | "Luminaires" | "Décoration" | "Finitions";

const sr = (fid: string, ids: string[]) => { const f = familyById.get(fid)!; return makeRef(f, f.axes.map((a, i) => a.options.find((o) => o.id === ids[i]) ?? a.options[0]!)); };
const S = (style: StyleTheme, ...ids: string[]) => ids.some((id) => style.id === id || style.materials.includes(id));

export function chooseReferences(palette: string[], room: Room, style: StyleTheme): Pick[] {
  const picks: Pick[] = [];
  const add = (ref: string, role: string, category: Category) => {
    if (picks.some((p) => p.ref === ref)) {
      // Même référence déjà choisie : on prend la teinte voisine pour varier.
      const v0 = parseVariant(ref); if (!v0) return;
      const ax = v0.family.axes.findIndex((a) => a.options.some((o) => o.hex)); if (ax < 0) return;
      const opts = v0.family.axes[ax]!.options, cur = v0.opts[ax]!;
      const alt = [...opts].filter((o) => o.id !== cur.id && o.hex).sort((a, b) => dist(a.hex!, cur.hex!) - dist(b.hex!, cur.hex!))[0];
      if (!alt) return;
      const o2 = [...v0.opts]; o2[ax] = alt; ref = makeRef(v0.family, o2);
      if (picks.some((p) => p.ref === ref)) return;
    }
    const v = parseVariant(ref), lm = libModel(ref);
    picks.push({ ref, role, category, name: v ? variantName(v) : lm ? frenchName(lm) : ref, shop: v ? variantShop(v) : lm ? { q: frenchName(lm).toLowerCase().replace(/ \(modèle \d+\)/, ""), kinds: ["meuble", "deco"] } : { q: "", kinds: [] } });
  };
  const light = palette.filter((c) => L(c) > 62), mids = palette.filter((c) => L(c) > 25 && L(c) <= 75);
  const wall = nearest(light[0] ?? palette[0]!, PAINT_SHADES);
  const accentSrc = [...palette].sort((a, b) => chroma(b) - chroma(a))[0]!;
  const accent = nearest(accentSrc, PAINT_SHADES.filter((o) => o.id !== wall.id));
  add(sr("peinture", [wall.id, "mat"]), "Murs, teinte principale", "Murs");
  add(sr("peinture", [accent.id, "velours"]), "Pan de mur ou boiserie, teinte d'accent", "Murs");

  // Sol : selon la pièce et l'esprit du style.
  const warm = palette.find((c) => { const [, a, b] = lab(c); return b > 12 && a > 2 && L(c) > 30 && L(c) < 75; });
  const essence = nearest(warm ?? "#B98C5E", familyById.get("parquet")!.axes[0]!.options.map((o) => ({ ...o, hex: o.colors![1] })));
  if (room === "Salle de bain" || room === "Cuisine") {
    if (S(style, "m-zellige", "boheme", "marocain")) add(sr("zellige", [nearest(accentSrc, familyById.get("zellige")!.axes[0]!.options).id, "metro", "brillant", "clair"]), "Crédence ou murs humides", "Murs");
    else add(sr("faience", [nearest(light[1] ?? wall.hex!, familyById.get("faience")!.axes[0]!.options).id, "metro", "brillant", "clair"]), "Crédence ou murs humides", "Murs");
    if (S(style, "m-tomette", "mediterraneen")) add(sr("tomette", ["nuancee", "hexagone", "ciree", "clair"]), "Sol", "Sol");
    else if (S(style, "m-terrazzo")) add(sr("terrazzo", ["blanc", "moyens", "multi"]), "Sol", "Sol");
    else add(sr("ciment", [style.id === "art-deco" ? "etoile" : "losange", nearest(accentSrc, familyById.get("ciment")!.axes[1]!.options).id]), "Sol", "Sol");
  } else if (S(style, "m-tomette")) add(sr("tomette", ["nuancee", "hexagone", "ciree", "clair"]), "Sol", "Sol");
  else if (S(style, "m-beton", "industriel")) add(sr("enduit", ["beton-cire", nearest(palette[2] ?? "#9F9C95", familyById.get("enduit")!.axes[1]!.options).id, "nuage"]), "Sol", "Sol");
  else add(sr("parquet", [essence.id, style.id === "art-deco" || style.id === "classique" ? "hongrie" : style.id === "japandi" || style.id === "scandinave" ? "larges" : "batons", "huile"]), "Sol", "Sol");

  // Textiles : la matière dépend du style, la couleur des inspirations.
  const fabricColors = familyById.get("tissu")!.axes[1]!.options;
  const fabric = style.materials.includes("m-velours") || style.id === "art-deco" ? "velours" : style.materials.includes("m-laine") ? "laine" : style.id === "japandi" || style.id === "contemporain" ? "bouclette" : "lin";
  add(sr("tissu", [fabric, nearest(mids[0] ?? palette[1]!, fabricColors).id]), "Canapé, fauteuil ou tête de lit", "Textiles");
  add(sr("tissu", ["lin", nearest(light[1] ?? palette[0]!, fabricColors).id]), "Rideaux et linge", "Textiles");
  add(sr("tissu", [fabric === "velours" ? "lin" : "velours", nearest(accentSrc, fabricColors).id]), "Coussins", "Textiles");

  // Finitions : métal et pierre.
  const metal = style.materials.includes("m-laiton") || style.id === "art-deco" || style.id === "classique" ? "laiton" : style.id === "industriel" ? "acier-noir" : style.id === "scandinave" || style.id === "japandi" ? "inox" : "bronze";
  add(sr("metal", [metal, "brosse"]), "Poignées, luminaires, pieds", "Finitions");
  if (room === "Cuisine" || room === "Salle de bain" || style.id === "art-deco") add(sr("marbre", [style.id === "art-deco" ? "calacatta" : S(style, "mediterraneen", "japandi") ? "travertin" : "carrare", "adouci"]), "Plan de travail ou tablette", "Finitions");

  // Objets 3D réels, selon la pièce.
  const OBJ: Record<Room, string[]> = {
    Salon: ["sofa_02", "ArmChair_01", "potted_plant_04", "Chandelier_01"],
    Chambre: ["Ottoman_01", "potted_plant_01", "modern_ceiling_lamp_01"],
    Cuisine: ["round_wooden_table_01", "GreenChair_01", "potted_plant_04"],
    "Salle de bain": ["ornate_mirror_01", "potted_plant_04"],
    "Salle à manger": ["gallinera_table", "gallinera_chair", "Chandelier_02"],
    Bureau: ["modern_arm_chair_01", "book_encyclopedia_set_01", "potted_plant_04"],
    Entrée: ["ClassicConsole_01", "ornate_mirror_01", "brass_vase_03"],
  };
  for (const id of OBJ[room]) if (libModel(id)) add(id, /lamp|chandelier|lantern/i.test(id) ? "Lumière" : /plant/i.test(id) ? "Végétal" : "Mobilier", /lamp|chandelier|lantern/i.test(id) ? "Luminaires" : /plant|book|mirror|lantern/i.test(id) ? "Décoration" : "Mobilier");
  return picks;
}

/** Disposition harmonieuse des références sur une planche (les grands formats derrière, les objets devant). */
export function composeBoard(picks: Pick[]): BoardItem[] {
  const spots: Array<[number, number, number, number]> = [
    [-0.25, -0.1, -6, 1.35], [0.07, -0.16, 7, 1.2], [-0.05, 0.13, 10, 1.05], [0.3, 0.08, -9, 1], [-0.45, 0.16, 5, 0.95],
    [0.2, 0.26, 0, 0.9], [0.45, -0.2, 12, 0.9], [-0.44, -0.24, -4, 0.9], [0.0, 0.3, 4, 0.85], [0.49, 0.22, 0, 0.85], [-0.22, 0.31, 0, 0.85], [0.3, -0.27, 0, 0.85],
  ];
  const order = [...picks].sort((a, b) => rank(a) - rank(b));
  return order.slice(0, spots.length).map((p, i) => {
    const [x, z, rot, s] = spots[i]!;
    const v = parseVariant(p.ref);
    const shape = libModel(p.ref) ? "objet" : v?.family.gen === "paint" ? "nuancier" : v?.family.gen === "fabric" ? "drape" : v?.family.gen === "metal" ? "rond" : v?.family.gen === "wood" ? "lame" : "carre";
    return { id: `t${i}`, ref: p.ref, shape, x, z, rot, s } as BoardItem;
  });
}
const rank = (p: Pick) => ({ Sol: 0, Murs: 1, Finitions: 2, Textiles: 3, Mobilier: 4, Décoration: 5, Luminaires: 6 })[p.category];

/* ——— Budget par poste ——— */
export interface BudgetLine { category: Category; label: string; low: number; high: number; detail: string }
const TIER_K: Record<Tier, number> = { malin: 0.6, confort: 1, premium: 1.9, haut_de_gamme: 3.4 };
function priceOf(materialId: string | undefined): [number, number] | null {
  const pr = materialId ? materialById.get(materialId)?.priceRange : undefined;
  const m = pr?.replace(/\s/g, "").match(/(\d+)[–-](\d+)/);
  return m ? [Number(m[1]), Number(m[2])] : null;
}
/** Ordres de grandeur indicatifs par poste (jamais des prix de produits), modulés par le niveau de gamme. */
export function estimateBudget(picks: Pick[], room: Room, surface: number, tier: Tier): BudgetLine[] {
  const k = TIER_K[tier], lines: BudgetLine[] = [], walls = Math.round(Math.sqrt(surface) * 4 * 2.5 * 0.85);
  const r = (n: number) => Math.round(n / 10) * 10;
  const paint = picks.filter((p) => p.category === "Murs" && parseVariant(p.ref)?.family.id === "peinture");
  if (paint.length) { const litres = Math.ceil((walls * 2) / 10); lines.push({ category: "Murs", label: "Peinture (2 couches)", low: r(litres * 12 * k), high: r(litres * 28 * k), detail: `≈ ${walls} m² de murs, ${litres} L` }); }
  const wet = picks.find((p) => p.category === "Murs" && parseVariant(p.ref)?.family.gen === "tile");
  if (wet) { const pr = priceOf(parseVariant(wet.ref)!.family.materialId) ?? [40, 120]; lines.push({ category: "Murs", label: "Carrelage mural", low: r(4 * pr[0]), high: r(4 * pr[1]), detail: "≈ 4 m², hors pose" }); }
  const floor = picks.find((p) => p.category === "Sol");
  if (floor) { const pr = priceOf(parseVariant(floor.ref)?.family.materialId) ?? [40, 120], m2 = Math.ceil(surface * 1.1); lines.push({ category: "Sol", label: "Revêtement de sol", low: r(m2 * pr[0]), high: r(m2 * pr[1]), detail: `${m2} m² (surface + 10 % de coupes), hors pose` }); }
  const T: Partial<Record<Room, Array<[Category, string, number, number]>>> = {
    Salon: [["Mobilier", "Canapé", 500, 1800], ["Mobilier", "Fauteuil", 200, 800], ["Mobilier", "Table basse", 100, 450], ["Textiles", "Tapis", 100, 500], ["Textiles", "Rideaux, coussins, plaid", 80, 350], ["Luminaires", "Suspension et lampes", 100, 500], ["Décoration", "Plantes et objets", 60, 300]],
    Chambre: [["Mobilier", "Tête de lit et chevets", 200, 900], ["Textiles", "Linge de lit et rideaux", 120, 450], ["Textiles", "Tapis", 80, 400], ["Luminaires", "Lampes de chevet et plafonnier", 80, 400], ["Décoration", "Plantes et objets", 50, 250]],
    Cuisine: [["Mobilier", "Table et chaises", 250, 1200], ["Finitions", "Poignées et robinetterie", 150, 700], ["Luminaires", "Suspensions", 100, 450], ["Décoration", "Plantes et objets", 40, 200]],
    "Salle de bain": [["Finitions", "Robinetterie et accessoires", 200, 900], ["Décoration", "Miroir", 60, 350], ["Textiles", "Linge de bain", 50, 200], ["Luminaires", "Appliques", 60, 300]],
    "Salle à manger": [["Mobilier", "Table", 250, 1200], ["Mobilier", "Chaises", 200, 900], ["Luminaires", "Suspension", 100, 600], ["Textiles", "Tapis", 100, 450]],
    Bureau: [["Mobilier", "Bureau et fauteuil", 250, 1100], ["Mobilier", "Rangements", 100, 600], ["Luminaires", "Lampe de bureau", 40, 250], ["Décoration", "Plantes et objets", 40, 200]],
    Entrée: [["Mobilier", "Console et rangements", 120, 600], ["Décoration", "Miroir", 60, 350], ["Luminaires", "Applique ou suspension", 60, 300], ["Textiles", "Tapis", 40, 200]],
  };
  for (const [category, label, lo, hi] of T[room] ?? []) lines.push({ category, label, low: r(lo * k), high: r(hi * k), detail: `Gamme ${TIERS[tier].toLowerCase()}` });
  return lines;
}
export const FAMILY_COUNT = FAMILIES.length;
