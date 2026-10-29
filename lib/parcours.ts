/**
 * Outils du parcours « ma pièce + mes inspirations → pièce transformée cliquable ».
 * Tout ici est local (aucun appel réseau) : repérage du clic, teintes et matières proches, liens de recherche.
 */
import { MATERIALS, type Material } from "@/lib/materials/schema";
import { PAINTS } from "@/lib/home3d/plan";
import type { Surface } from "@/lib/ia-jobs";
import type { AiObject } from "@/lib/studio/showcase";

export type Zone = { x: number; y: number; w: number; h: number };
export const inZone = (z: Zone, x: number, y: number) => x >= z.x && x <= z.x + z.w && y >= z.y && y <= z.y + z.h;
const area = (z: Zone) => z.w * z.h;

/** Élément sous le clic : d'abord le plus petit objet qui le contient, sinon la plus petite surface, sinon rien. */
export function hit(x: number, y: number, objects: AiObject[], surfaces: Surface[]): { kind: "objet"; o: AiObject } | { kind: "surface"; s: Surface } | null {
  const o = objects.filter((v) => inZone(v.zone, x, y)).sort((a, b) => area(a.zone) - area(b.zone))[0];
  if (o) return { kind: "objet", o };
  const s = surfaces.filter((v) => inZone(v.zone, x, y)).sort((a, b) => area(a.zone) - area(b.zone))[0];
  return s ? { kind: "surface", s } : null;
}

const rgb = (hex: string) => { const n = parseInt(hex.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255] as const; };
/** Distance perceptive simple (pondération « redmean »). */
export function colorDistance(a: string, b: string) {
  const [r1, g1, b1] = rgb(a), [r2, g2, b2] = rgb(b), rm = (r1 + r2) / 2;
  return Math.sqrt((2 + rm / 256) * (r1 - r2) ** 2 + 4 * (g1 - g2) ** 2 + (2 + (255 - rm) / 256) * (b1 - b2) ** 2);
}
/** Nom de teinte usuel le plus proche (nuancier générique, sans marque). */
export const nearestPaint = (hex: string) => [...PAINTS].sort((a, b) => colorDistance(hex, a.hex) - colorDistance(hex, b.hex))[0]!;

/** Familles de matières pertinentes selon la surface cliquée. */
const FAMILIES: Record<string, Material["category"][]> = {
  mur: ["Peinture", "Enduit", "Céramique"], plafond: ["Peinture", "Enduit"], credence: ["Céramique", "Pierre"],
  sol: ["Sol", "Bois", "Pierre"], rideaux: ["Textile"], porte: ["Bois", "Peinture"], fenetre: ["Métal", "Bois"],
};
/** Matières de la bibliothèque les plus proches d'une couleur (et de la famille de la surface si connue). */
export function nearestMaterials(hex: string, kind?: string, n = 3): Material[] {
  const fam = kind ? FAMILIES[kind] : undefined;
  return MATERIALS.filter((m) => !fam || fam.includes(m.category)).sort((a, b) => colorDistance(hex, a.baseColor) - colorDistance(hex, b.baseColor)).slice(0, n);
}

/** Requête de recherche chez les enseignes pour une surface ou une couleur. */
export function surfaceQuery(kind: string | undefined, colorName: string, material?: string, finish?: string): { q: string; kinds: Array<"meuble" | "deco" | "bricolage" | "jardin"> } {
  const c = colorName.toLowerCase();
  if (kind === "sol") return { q: [material || "revêtement de sol", c].join(" "), kinds: ["bricolage"] };
  if (kind === "rideaux") return { q: `rideau ${material || "lin"} ${c}`.trim(), kinds: ["deco", "meuble"] };
  if (kind === "credence") return { q: `crédence ${material || "carrelage"} ${c}`, kinds: ["bricolage"] };
  if (material && /enduit|chaux|tadelakt|béton/i.test(material)) return { q: `${material} ${c}`, kinds: ["bricolage"] };
  return { q: `peinture murale ${c} ${finish || "mate"}`.trim(), kinds: ["bricolage"] };
}

/** Recherche Google Lens à partir d'une image publique (l'image entière ; on y sélectionne l'objet). */
export const lensUrl = (imageUrl: string) => `https://lens.google.com/uploadbyurl?url=${encodeURIComponent(imageUrl)}`;

/** Couleur d'un point de l'image (moyenne d'un petit carré), ou null si l'image n'est pas lisible. */
export function sampleColor(img: HTMLImageElement, x: number, y: number): string | null {
  try {
    const c = document.createElement("canvas"); c.width = c.height = 9;
    const ctx = c.getContext("2d", { willReadFrequently: true })!;
    const px = (x / 100) * img.naturalWidth, py = (y / 100) * img.naturalHeight, s = Math.max(6, img.naturalWidth / 120);
    ctx.drawImage(img, px - s / 2, py - s / 2, s, s, 0, 0, 9, 9);
    const d = ctx.getImageData(0, 0, 9, 9).data; let r = 0, g = 0, b = 0;
    for (let i = 0; i < d.length; i += 4) { r += d[i]!; g += d[i + 1]!; b += d[i + 2]!; }
    const k = d.length / 4;
    return `#${[r, g, b].map((v) => Math.round(v / k).toString(16).padStart(2, "0")).join("")}`.toUpperCase();
  } catch { return null; }
}
