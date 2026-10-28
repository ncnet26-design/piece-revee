/** Validation des demandes reçues par le service (sans dépendance, pour garder le fichier léger). */
import { KEEP } from "./prompts";

const DATA_URL = /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/;
export const isDataUrl = (v: unknown): v is string => typeof v === "string" && v.length <= 9_000_000 && DATA_URL.test(v);
const QUALITIES = ["brouillon", "standard", "premium"] as const;
const FOURNISSEURS = ["openai", "gemini", "fal", "replicate"] as const;
export interface JobBody { mode: "generate" | "transform"; brief: string; photo?: string; references: string[]; keep: string[]; keepFree?: string; materials: string[]; products: string[]; quality: (typeof QUALITIES)[number]; width: number; height: number; visiteur: string; fournisseur?: (typeof FOURNISSEURS)[number] }
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
  return {
    mode: b.mode, brief, photo: b.photo as string | undefined, references: refs as string[],
    keep: strs(b.keep, 12, 20).filter((k) => k in KEEP), keepFree: str(b.keepFree, 300) || undefined,
    materials: strs(b.materials, 10, 160), products: strs(b.products, 6, 160),
    quality: QUALITIES.includes(b.quality as never) ? (b.quality as JobBody["quality"]) : "standard",
    width: int(b.width, 1536), height: int(b.height, 1024), visiteur: b.visiteur,
    fournisseur: FOURNISSEURS.includes(b.fournisseur as never) ? (b.fournisseur as JobBody["fournisseur"]) : undefined,
  };
}

