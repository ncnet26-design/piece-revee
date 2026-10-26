"use client";
/**
 * Préparation des photos dans le navigateur : vérification du type réel, redimensionnement,
 * suppression des métadonnées (le ré-encodage canvas ne conserve pas l'EXIF, donc pas de GPS),
 * et contrôle de qualité (trop sombre, floue). Le serveur refait ces contrôles : on ne fait jamais confiance au client.
 */
export const MAX_BYTES = 20 * 1024 * 1024;
const ACCEPTED = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"];

async function sniff(file: File): Promise<string | null> {
  const b = new Uint8Array(await file.slice(0, 16).arrayBuffer());
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "image/jpeg";
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return "image/png";
  if (b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 && b[8] === 0x57 && b[9] === 0x45) return "image/webp";
  const brand = String.fromCharCode(...b.slice(4, 12));
  if (brand.startsWith("ftyp") && /heic|heix|mif1|msf1|heif/.test(brand.slice(4))) return "image/heic";
  return null;
}

export interface PreparedPhoto { blob: Blob; dataUrl: string; width: number; height: number; quality: { tooDark: boolean; blurry: boolean; luminance: number; sharpness: number } }
export type PhotoCheck = { ok: true; photo: PreparedPhoto } | { ok: false; message: string; heicNeedsServer?: boolean };

export async function preparePhoto(file: File, maxSide = 2048): Promise<PhotoCheck> {
  if (file.size > MAX_BYTES) return { ok: false, message: "Cette photo dépasse 20 Mo. Choisissez une version plus légère." };
  const type = await sniff(file);
  if (!type || !ACCEPTED.includes(type)) return { ok: false, message: "Ce fichier n'est pas une photo reconnue. Formats acceptés : JPG, PNG, WebP, HEIC." };
  let bitmap: ImageBitmap;
  try { bitmap = await createImageBitmap(file); }
  catch { return type === "image/heic" ? { ok: false, heicNeedsServer: true, message: "Votre navigateur ne sait pas afficher les photos HEIC. Elle sera convertie sur nos serveurs, ou exportez-la en JPG depuis votre téléphone." } : { ok: false, message: "Impossible de lire cette photo. Essayez un autre fichier." }; }
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale), h = Math.round(bitmap.height * scale);
  const cv = document.createElement("canvas"); cv.width = w; cv.height = h;
  const x = cv.getContext("2d", { willReadFrequently: true }); if (!x) return { ok: false, message: "Votre navigateur ne permet pas de préparer la photo." };
  x.drawImage(bitmap, 0, 0, w, h);
  const quality = measure(x, w, h);
  const blob = await new Promise<Blob | null>((r) => cv.toBlob(r, "image/jpeg", 0.88));
  if (!blob) return { ok: false, message: "La photo n'a pas pu être préparée." };
  // Aperçu léger pour l'affichage et le mode démonstration.
  const pv = document.createElement("canvas"); const ps = Math.min(1, 1024 / Math.max(w, h)); pv.width = Math.round(w * ps); pv.height = Math.round(h * ps);
  pv.getContext("2d")?.drawImage(cv, 0, 0, pv.width, pv.height);
  return { ok: true, photo: { blob, dataUrl: pv.toDataURL("image/jpeg", 0.8), width: w, height: h, quality } };
}

/** Luminance moyenne et netteté (variance du laplacien) sur une version réduite. */
function measure(x: CanvasRenderingContext2D, w: number, h: number) {
  const s = 256, cv = document.createElement("canvas"); const k = Math.min(1, s / Math.max(w, h)); cv.width = Math.max(8, Math.round(w * k)); cv.height = Math.max(8, Math.round(h * k));
  const c = cv.getContext("2d", { willReadFrequently: true })!; c.drawImage(x.canvas, 0, 0, cv.width, cv.height);
  const d = c.getImageData(0, 0, cv.width, cv.height).data; const W = cv.width, H = cv.height; const g = new Float32Array(W * H);
  let sum = 0; for (let i = 0; i < W * H; i++) { const v = 0.2126 * d[i * 4]! + 0.7152 * d[i * 4 + 1]! + 0.0722 * d[i * 4 + 2]!; g[i] = v; sum += v; }
  const luminance = sum / (W * H);
  let m = 0, m2 = 0, n = 0;
  for (let y = 1; y < H - 1; y++) for (let xx = 1; xx < W - 1; xx++) { const i = y * W + xx; const l = 4 * g[i]! - g[i - 1]! - g[i + 1]! - g[i - W]! - g[i + W]!; m += l; m2 += l * l; n++; }
  const sharpness = n ? m2 / n - (m / n) ** 2 : 0;
  return { tooDark: luminance < 55, blurry: sharpness < 60, luminance: Math.round(luminance), sharpness: Math.round(sharpness) };
}

/** Palette dominante d'une image (k-moyennes sur 4 couleurs), pour le moodboard. */
export async function extractPalette(src: string, k = 5): Promise<string[]> {
  const img = new Image(); img.decoding = "async"; img.src = src; await img.decode();
  const cv = document.createElement("canvas"); cv.width = 64; cv.height = 64; const c = cv.getContext("2d", { willReadFrequently: true })!; c.drawImage(img, 0, 0, 64, 64);
  const d = c.getImageData(0, 0, 64, 64).data; const px: [number, number, number][] = [];
  for (let i = 0; i < d.length; i += 16) px.push([d[i]!, d[i + 1]!, d[i + 2]!]);
  let centers = px.filter((_, i) => i % Math.max(1, Math.floor(px.length / k)) === 0).slice(0, k);
  for (let it = 0; it < 8; it++) {
    const acc = centers.map(() => [0, 0, 0, 0]);
    for (const p of px) { let bi = 0, bd = Infinity; centers.forEach((cc, ci) => { const dd = (p[0] - cc[0]) ** 2 + (p[1] - cc[1]) ** 2 + (p[2] - cc[2]) ** 2; if (dd < bd) { bd = dd; bi = ci; } }); const a = acc[bi]!; a[0]! += p[0]; a[1]! += p[1]; a[2]! += p[2]; a[3]! += 1; }
    centers = acc.map((a, i) => (a[3] ? [a[0]! / a[3], a[1]! / a[3], a[2]! / a[3]] : centers[i]!) as [number, number, number]);
  }
  return centers.map(([r, g, b]) => `#${[r, g, b].map((v) => Math.round(v).toString(16).padStart(2, "0")).join("")}`.toUpperCase());
}
