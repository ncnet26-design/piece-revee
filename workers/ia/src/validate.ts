/** Validation des demandes reçues par le service (sans dépendance, pour garder le fichier léger). */
import { KEEP } from "./prompts";

const DATA_URL = /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/;
export const isDataUrl = (v: unknown): v is string => typeof v === "string" && v.length <= 9_000_000 && DATA_URL.test(v);
/** Petites versions (512 px) pour l'IA gratuite de Cloudflare. */
const isSmall = (v: unknown): v is string => isDataUrl(v) && v.length <= 600_000;
const QUALITIES = ["brouillon", "standard", "premium"] as const;
const FOURNISSEURS = ["openai", "gemini", "fal", "replicate"] as const;
export interface JobBody { inspirations: boolean; mask?: string; onlyZone?: { label: string; x: number; y: number; w: number; h: number }; mode: "generate" | "transform"; brief: string; photo?: string; references: string[]; keep: string[]; keepFree?: string; materials: string[]; products: string[]; quality: (typeof QUALITIES)[number]; width: number; height: number; visiteur: string; fournisseur?: (typeof FOURNISSEURS)[number]; petites?: { photo?: string; references: string[] } }
/** Validation de la demande (sans dépendance, pour garder le service léger). */
export function parseJobBody(raw: unknown): JobBody | null {
  if (!raw || typeof raw !== "object") return null;
  const b = raw as Record<string, unknown>;
  const str = (v: unknown, max: number) => (typeof v === "string" ? v.replace(/[\u0000-\u001f\u007f]/g, " ").trim().slice(0, max) : "");
  const strs = (v: unknown, n: number, max: number) => (Array.isArray(v) ? v.filter((x) => typeof x === "string").slice(0, n).map((x) => str(x, max)).filter(Boolean) : []);
  const int = (v: unknown, d: number) => (typeof v === "number" && Number.isInteger(v) && v >= 256 && v <= 8000 ? v : d);
  if (b.mode !== "generate" && b.mode !== "transform") return null;
  const brief = str(b.brief, 2000);
  if (brief.length < 3) return null;
  if (typeof b.visiteur !== "string" || !/^[a-z0-9-]{8,64}$/.test(b.visiteur)) return null;
  if (b.photo !== undefined && !isDataUrl(b.photo)) return null;
  if (b.mode === "transform" && !b.photo) return null;
  const refs = Array.isArray(b.references) ? b.references : [];
  if (refs.length > 6 || !refs.every(isDataUrl)) return null;
  if (b.mask !== undefined && !(isDataUrl(b.mask) && (b.mask as string).startsWith("data:image/png"))) return null;
  const pt = b.petites as { photo?: unknown; references?: unknown } | undefined;
  const ptRefs = Array.isArray(pt?.references) ? pt.references : [];
  const petites = pt && typeof pt === "object" && (pt.photo === undefined || isSmall(pt.photo)) && ptRefs.length <= 3 && ptRefs.every(isSmall) && (b.mode === "generate" || pt.photo !== undefined)
    ? { photo: pt.photo as string | undefined, references: ptRefs as string[] } : undefined;
  const z = b.onlyZone as Record<string, unknown> | undefined;
  const pct = (v: unknown) => typeof v === "number" && v >= 0 && v <= 100;
  const onlyZone = z && typeof z.label === "string" && pct(z.x) && pct(z.y) && pct(z.w) && pct(z.h) ? { label: str(z.label, 80), x: z.x as number, y: z.y as number, w: z.w as number, h: z.h as number } : undefined;
  return {
    inspirations: b.inspirations === true, mask: b.mask as string | undefined, onlyZone,
    mode: b.mode, brief, photo: b.photo as string | undefined, references: refs as string[],
    keep: strs(b.keep, 12, 20).filter((k) => k in KEEP), keepFree: str(b.keepFree, 300) || undefined,
    materials: strs(b.materials, 10, 160), products: strs(b.products, 6, 160),
    quality: QUALITIES.includes(b.quality as never) ? (b.quality as JobBody["quality"]) : "standard",
    width: int(b.width, 1536), height: int(b.height, 1024), visiteur: b.visiteur,
    petites,
    fournisseur: FOURNISSEURS.includes(b.fournisseur as never) ? (b.fournisseur as JobBody["fournisseur"]) : undefined,
  };
}

