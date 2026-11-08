/**
 * Tâches de génération : fiche de suivi (KV), images produites (R2 si disponible, sinon KV 30 jours)
 * et budget (images par jour, dollars par mois, au total et par visiteur).
 */
import { limits, PRICE_ESTIMATE, type Env, type Quality } from "./config";
import type { ImgIn, Provider } from "./providers";
import type { Mode } from "./prompts";

export type JobStatus = "en_attente" | "en_cours" | "terminee" | "erreur";
export interface Job {
  id: string; status: JobStatus; mode: Mode; provider: Provider["id"]; model: string; quality: Quality;
  brief: string; keep: string[]; width: number; height: number;
  createdAt: string; updatedAt: string; attempts: number;
  ref?: string; image?: { key: string; mime: string; bytes: number };
  error?: { message: string; retryable: boolean; detail?: string };
  costUsd: number; visitor: string; ipHash: string;
}
export interface JobInput { prompt: string; photo?: ImgIn; references: ImgIn[]; mask?: ImgIn; petites?: { photo?: ImgIn; references: ImgIn[] } }

const DAY = 86400;
export const today = () => new Date().toISOString().slice(0, 10);
export const month = () => new Date().toISOString().slice(0, 7);

export async function sha(s: string): Promise<string> {
  const d = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return [...new Uint8Array(d)].slice(0, 12).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export const saveJob = (env: Env, j: Job) => env.QUOTA!.put(`job:${j.id}`, JSON.stringify(j), { expirationTtl: 90 * DAY });
export async function loadJob(env: Env, id: string): Promise<Job | null> {
  if (!/^[0-9a-f-]{36}$/.test(id)) return null;
  const s = await env.QUOTA!.get(`job:${id}`);
  return s ? (JSON.parse(s) as Job) : null;
}
export const saveInput = (env: Env, id: string, input: JobInput) => env.QUOTA!.put(`in:${id}`, JSON.stringify(input), { expirationTtl: 2 * DAY });
export async function loadInput(env: Env, id: string): Promise<JobInput | null> {
  const s = await env.QUOTA!.get(`in:${id}`);
  return s ? (JSON.parse(s) as JobInput) : null;
}

export async function storeImage(env: Env, key: string, bytes: Uint8Array, mime: string) {
  if (env.IMAGES) await env.IMAGES.put(key, bytes, { httpMetadata: { contentType: mime } });
  else await env.QUOTA!.put(`img:${key}`, bytes, { expirationTtl: 30 * DAY, metadata: { mime } });
}
export async function readImage(env: Env, key: string, mime: string): Promise<{ body: ArrayBuffer; mime: string } | null> {
  if (env.IMAGES) {
    const o = await env.IMAGES.get(key);
    if (o) return { body: await o.arrayBuffer(), mime: o.httpMetadata?.contentType ?? mime };
  }
  const b = await env.QUOTA!.get(`img:${key}`, "arrayBuffer");
  return b ? { body: b, mime } : null;
}

/* ——— Budget ——— */
const n = async (env: Env, k: string) => Number(await env.QUOTA!.get(k)) || 0;
const add = (env: Env, k: string, v: number, ttl: number) => n(env, k).then((cur) => env.QUOTA!.put(k, String(Math.round((cur + v) * 10000) / 10000), { expirationTtl: ttl }));

export interface Usage { day: { images: number; max: number }; visitorDay: { images: number; max: number }; month: { usd: number; max: number }; visitorMonth: { usd: number; max: number } }
export async function usage(env: Env, visitor: string, ip: string): Promise<Usage> {
  const L = limits(env), d = today(), m = month();
  const [dayImg, ipImg, vImg, mUsd, vUsd, ipUsd] = await Promise.all([n(env, `total:${d}`), n(env, `ip:${d}:${ip}`), n(env, `v:${d}:${visitor}`), n(env, `usd:${m}`), n(env, `usd:${m}:v:${visitor}`), n(env, `usd:${m}:ip:${ip}`)]);
  return { day: { images: dayImg, max: L.dayImages }, visitorDay: { images: Math.max(ipImg, vImg), max: L.visitorDayImages }, month: { usd: mUsd, max: L.monthUsd }, visitorMonth: { usd: Math.max(vUsd, ipUsd), max: L.visitorMonthUsd } };
}
/** Refus motivé si la nouvelle image dépasserait un plafond ; sinon null. */
export function overLimit(u: Usage, estimate: number): string | null {
  if (u.day.images >= u.day.max) return "Le nombre d'images du jour est atteint. Revenez demain.";
  if (u.visitorDay.images >= u.visitorDay.max) return `Vous avez utilisé vos ${u.visitorDay.max} images du jour. Revenez demain.`;
  if (u.month.usd + estimate > u.month.max) return "Le budget d'images du mois est atteint.";
  if (u.visitorMonth.usd + estimate > u.visitorMonth.max) return "Vous avez atteint votre budget d'images du mois.";
  return null;
}
export const estimate = (provider: Provider["id"], quality: Quality) => PRICE_ESTIMATE[provider]?.[quality] ?? 0.2;
/** Réserve le coût estimé AVANT l'appel (un échec chez le fournisseur reste compté, par prudence). */
export async function reserve(env: Env, visitor: string, ip: string, usd: number) {
  const d = today(), m = month();
  await Promise.all([add(env, `total:${d}`, 1, 2 * DAY), add(env, `ip:${d}:${ip}`, 1, 2 * DAY), add(env, `v:${d}:${visitor}`, 1, 2 * DAY), add(env, `usd:${m}`, usd, 62 * DAY), add(env, `usd:${m}:v:${visitor}`, usd, 62 * DAY), add(env, `usd:${m}:ip:${ip}`, usd, 62 * DAY)]);
}
/* ——— Images gratuites (IA de Cloudflare) : compteur à part, sans dépense ——— */
/**
 * Part gratuite de l'IA de Cloudflare : 10 000 « neurones » par jour pour tout le compte (images ET Camille).
 * Un seul compteur commun, réservé AVANT chaque appel avec une estimation prudente ; on s'arrête bien avant la limite.
 */
export const NEURONES = { image: 160, camille: 130 } as const;
export const neuronesRestants = async (env: Env) => limits(env).freeNeurons - (await n(env, `neurones:${today()}`));
export async function reserverNeurones(env: Env, cout: number): Promise<boolean> {
  if ((await neuronesRestants(env)) < cout) return false;
  await add(env, `neurones:${today()}`, cout, 2 * DAY);
  return true;
}
export const freeLeft = async (env: Env) => Math.min(limits(env).freeDayImages - (await n(env, `gratuit:${today()}`)), Math.floor((await neuronesRestants(env)) / NEURONES.image));
export async function reserveFree(env: Env, visitor: string, ip: string) {
  const d = today();
  await Promise.all([add(env, `neurones:${d}`, NEURONES.image, 2 * DAY), add(env, `gratuit:${d}`, 1, 2 * DAY), add(env, `ip:${d}:${ip}`, 1, 2 * DAY), add(env, `v:${d}:${visitor}`, 1, 2 * DAY)]);
}
/** Corrige la réservation quand le coût réel est connu. */
export async function settle(env: Env, visitor: string, ip: string, delta: number) {
  if (!delta) return;
  const m = month();
  await Promise.all([add(env, `usd:${m}`, delta, 62 * DAY), add(env, `usd:${m}:v:${visitor}`, delta, 62 * DAY), add(env, `usd:${m}:ip:${ip}`, delta, 62 * DAY)]);
}
