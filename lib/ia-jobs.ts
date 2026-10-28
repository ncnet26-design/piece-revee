/**
 * Générations d'images par tâches (service « piece-revee-ia », routes /v2).
 * Le site n'a aucune clé : il crée une tâche, puis suit son état jusqu'à l'image.
 */
import { IA_URL, shrink } from "@/lib/ia";

export type JobStatus = "en_attente" | "en_cours" | "terminee" | "erreur";
export type Quality = "brouillon" | "standard" | "premium";
export interface IaJob {
  id: string; status: JobStatus; mode: "generate" | "transform"; provider: string; model: string; quality: Quality;
  brief: string; keep: string[]; width: number; height: number; createdAt: string; updatedAt: string; attempts: number;
  costUsd: number; imageUrl: string | null; error?: { message: string; retryable: boolean };
}
export interface JobRequest {
  mode: "generate" | "transform"; brief: string; photo?: string; references?: string[];
  keep?: string[]; keepFree?: string; materials?: string[]; products?: string[];
  quality?: Quality; width?: number; height?: number; fournisseur?: string;
}
export type Result<T> = { ok: true; value: T } | { ok: false; message: string };

/** Identifiant anonyme de l'appareil : sert au plafond de dépense par visiteur. */
export function visitorId(): string {
  try {
    let v = localStorage.getItem("pr_visiteur");
    if (!v || !/^[a-z0-9-]{8,64}$/.test(v)) { v = crypto.randomUUID(); localStorage.setItem("pr_visiteur", v); }
    return v;
  } catch { return "visiteur-sans-stockage"; }
}

async function call<T>(path: string, init?: RequestInit): Promise<Result<T>> {
  try {
    const r = await fetch(`${IA_URL}${path}`, init);
    const d = await r.json().catch(() => null) as (T & { erreur?: string }) | null;
    if (r.ok && d) return { ok: true, value: d };
    return { ok: false, message: d?.erreur ?? "Le service d'images n'a pas pu traiter la demande." };
  } catch {
    return { ok: false, message: "Le service d'images est injoignable. Vérifiez votre connexion et réessayez." };
  }
}

/** Crée la tâche (les images sont réduites avant l'envoi). */
export async function createJob(req: JobRequest): Promise<Result<IaJob>> {
  let width = req.width, height = req.height;
  const photo = req.photo ? await shrink(req.photo, 2048, 0.9) : undefined;
  if (photo) { const im = new Image(); im.src = photo; await im.decode(); width = im.naturalWidth; height = im.naturalHeight; }
  const references = await Promise.all((req.references ?? []).slice(0, 6).map((r) => shrink(r, 1024, 0.85)));
  const res = await call<IaJob>("/v2/jobs", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...req, photo, references, width, height, visiteur: visitorId() }) });
  if (res.ok) remember(res.value);
  return res;
}
export const getJob = (id: string) => call<IaJob>(`/v2/jobs/${id}`);
export async function retryJob(id: string): Promise<Result<IaJob>> {
  const res = await call<IaJob>(`/v2/jobs/${id}/retry`, { method: "POST" });
  if (res.ok) remember(res.value);
  return res;
}
export const usage = () => call<{ day: { images: number; max: number }; visitorDay: { images: number; max: number }; month: { usd: number; max: number }; visitorMonth: { usd: number; max: number }; fournisseurs: string[] }>(`/v2/usage?visiteur=${visitorId()}`);

/** Suit la tâche jusqu'à la fin (intervalle croissant de 2 à 6 s, 8 minutes au plus). */
export async function waitForJob(job: IaJob, onUpdate: (j: IaJob) => void, signal?: AbortSignal): Promise<IaJob> {
  let cur = job, delay = 2000;
  const end = Date.now() + 8 * 60_000;
  while ((cur.status === "en_cours" || cur.status === "en_attente") && Date.now() < end) {
    await new Promise((r) => setTimeout(r, delay));
    if (signal?.aborted) return cur;
    delay = Math.min(6000, delay * 1.4);
    const r = await getJob(cur.id);
    if (r.ok) { cur = r.value; onUpdate(cur); remember(cur); }
  }
  if (cur.status === "en_cours" || cur.status === "en_attente") cur = { ...cur, status: "erreur", error: { message: "La génération prend trop de temps. Réessayez.", retryable: true } };
  return cur;
}

/* ——— Historique sur l'appareil (les images restent stockées par le service) ——— */
const KEY = "pr_generations";
export interface Remembered { id: string; createdAt: string; mode: IaJob["mode"]; brief: string; status: JobStatus; imageUrl: string | null; provider: string }
export function history(): Remembered[] {
  try { return JSON.parse(localStorage.getItem(KEY) ?? "[]") as Remembered[]; } catch { return []; }
}
function remember(j: IaJob) {
  try {
    const list = history().filter((x) => x.id !== j.id);
    list.unshift({ id: j.id, createdAt: j.createdAt, mode: j.mode, brief: j.brief, status: j.status, imageUrl: j.imageUrl, provider: j.provider });
    localStorage.setItem(KEY, JSON.stringify(list.slice(0, 30)));
  } catch { /* stockage indisponible */ }
}
