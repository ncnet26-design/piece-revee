import { normalInto, type Surface } from "./generate";

/**
 * Accès aux surfaces du showroom : calcul en arrière-plan (2 à 3 travailleurs), mis en cache,
 * avec repli dans la page si les travailleurs ne sont pas disponibles.
 */
type Job = { resolve: (s: Surface | null) => void; reject: (e: Error) => void };
let pool: Worker[] | null | undefined;
const jobs = new Map<number, Job>();
let seq = 0, rr = 0;

function workers(): Worker[] | null {
  if (pool !== undefined) return pool;
  if (typeof Worker === "undefined" || typeof OffscreenCanvas === "undefined") return (pool = null);
  try {
    const n = Math.max(2, Math.min(3, (navigator.hardwareConcurrency || 4) - 1));
    pool = Array.from({ length: n }, () => {
      // Fichier compilé à part (scripts/build-worker.mjs) ; chemin en variable pour que le bundler ne le touche pas.
      const url = "/workers/surface.js";
      const w = new Worker(url, { type: "module" });
      w.onmessage = (e: MessageEvent<{ id: number; s?: Surface | null; error?: string }>) => {
        const j = jobs.get(e.data.id); if (!j) return;
        jobs.delete(e.data.id);
        if (e.data.error) j.reject(new Error(e.data.error)); else j.resolve(e.data.s ?? null);
      };
      return w;
    });
  } catch { pool = null; }
  return pool;
}

const cache = new Map<string, Promise<Surface | null>>();
/** Surface d'une déclinaison (mise en cache par référence et taille). */
export function surfaceFor(ref: string, size = 512): Promise<Surface | null> {
  const key = `${ref}|${size}`;
  let p = cache.get(key);
  if (!p) {
    const ws = workers();
    p = ws
      ? new Promise<Surface | null>((resolve, reject) => { const id = ++seq; jobs.set(id, { resolve, reject }); ws[rr++ % ws.length]!.postMessage({ id, ref, size }); })
        .catch(async () => (await import("./generate")).generateSurface(ref, size))
      : import("./generate").then((m) => m.generateSurface(ref, size));
    cache.set(key, p);
    p.catch(() => cache.delete(key));
    if (cache.size > 120) cache.delete(cache.keys().next().value!);
  }
  return p;
}

/** Cartes en toiles (couleur, relief, rugosité, normales calculées en virgule flottante). */
export function toCanvases(s: Surface): { diff: HTMLCanvasElement; height: HTMLCanvasElement; rough: HTMLCanvasElement; normal: HTMLCanvasElement } {
  const mk = (fill: (d: Uint8ClampedArray) => void) => {
    const c = document.createElement("canvas"); c.width = c.height = s.size;
    const x = c.getContext("2d")!; const im = x.createImageData(s.size, s.size); fill(im.data); x.putImageData(im, 0, 0); return c;
  };
  return {
    diff: mk((d) => d.set(s.color)),
    height: mk((d) => { for (let i = 0; i < s.height.length; i++) { const v = s.height[i]! * 255; d[i * 4] = d[i * 4 + 1] = d[i * 4 + 2] = v; d[i * 4 + 3] = 255; } }),
    rough: mk((d) => { for (let i = 0; i < s.rough.length; i++) { const v = s.rough[i]! * 255; d[i * 4] = d[i * 4 + 1] = d[i * 4 + 2] = v; d[i * 4 + 3] = 255; } }),
    normal: mk((d) => normalInto(s, d)),
  };
}
