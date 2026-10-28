/**
 * Images photoréalistes par IA, via le service « piece-revee-ia » (Cloudflare Worker).
 * La clé Google reste côté serveur ; le site n'envoie que les images et le texte du projet.
 */
export const IA_URL = (process.env.NEXT_PUBLIC_IA_URL || "https://piece-revee-ia.ewanesteves26.workers.dev").replace(/\/$/, "");

/** Réduit une image avant l'envoi (moins de données, réponse plus rapide). */
export async function shrink(src: string, maxSide: number, quality = 0.86): Promise<string> {
  const img = new Image(); img.decoding = "async"; img.src = src; await img.decode();
  const k = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight));
  const c = document.createElement("canvas"); c.width = Math.round(img.naturalWidth * k); c.height = Math.round(img.naturalHeight * k);
  c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
  return c.toDataURL("image/jpeg", quality);
}
/** Rapport largeur/hauteur le plus proche parmi ceux que le service accepte. */
export function nearestAspect(w: number, h: number): string {
  const opts: Array<[string, number]> = [["1:1", 1], ["4:3", 4 / 3], ["3:4", 3 / 4], ["3:2", 1.5], ["2:3", 2 / 3], ["16:9", 16 / 9], ["9:16", 9 / 16], ["4:5", 0.8], ["5:4", 1.25]];
  const r = w / h;
  return opts.reduce((a, b) => (Math.abs(Math.log(b[1] / r)) < Math.abs(Math.log(a[1] / r)) ? b : a))[0];
}

export type IaResult = { ok: true; image: string; left: number } | { ok: false; message: string };
async function call(path: string, payload: unknown): Promise<IaResult> {
  try {
    const r = await fetch(`${IA_URL}${path}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const d = (await r.json().catch(() => null)) as { image?: string; restant?: number; erreur?: string } | null;
    if (r.ok && d?.image) return { ok: true, image: d.image, left: d.restant ?? 0 };
    return { ok: false, message: d?.erreur ?? "Le rendu n'a pas pu être créé." };
  } catch {
    return { ok: false, message: "Le service d'images est injoignable. Vérifiez votre connexion et réessayez." };
  }
}
/** La pièce de la photo, réaménagée selon le projet. */
export async function redesignRoom(photo: string, inspirations: string[], brief: string): Promise<IaResult> {
  const img = new Image(); img.src = photo; await img.decode();
  return call("/redesign", {
    photo: await shrink(photo, 1536),
    inspirations: await Promise.all(inspirations.slice(0, 3).map((x) => shrink(x, 768, 0.8))),
    brief, aspect: nearestAspect(img.naturalWidth, img.naturalHeight),
  });
}
/** Une image d'ambiance à partir d'un texte. */
export const conceptImage = (brief: string, aspect = "4:3") => call("/concept", { brief, aspect });
