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
  /** Les références sont les inspirations du client (style à transposer), pas des matières à copier. */
  inspirations?: boolean;
  keep?: string[]; keepFree?: string; materials?: string[]; products?: string[];
  quality?: Quality; width?: number; height?: number; fournisseur?: string;
  /** Type de pièce (imposé au modèle) et ampleur des changements : leger | equilibre | complet. */
  piece?: string; niveau?: string;
  /** Édition localisée : masque PNG (zones transparentes = à modifier) et zone décrite. */
  mask?: string; onlyZone?: { label: string; x: number; y: number; w: number; h: number };
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
  // Petites versions (512 px) pour l'IA gratuite de Cloudflare, essayée en premier par le service.
  const petites = { photo: req.photo ? await shrink(req.photo, 512, 0.9) : undefined, references: await Promise.all((req.references ?? []).slice(0, 3).map((r) => shrink(r, 512, 0.85))) };
  const res = await call<IaJob>("/v2/jobs", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...req, photo, references, petites, width, height, visiteur: visitorId() }) });
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

/** Masque PNG aux dimensions de l'image : la zone (en %) est transparente, donc modifiable ; le reste est protégé. */
export async function maskFor(src: string, z: { x: number; y: number; w: number; h: number }, margin = 4): Promise<{ image: string; mask: string }> {
  const img = await shrink(src, 2048, 0.92);
  const im = new Image(); im.src = img; await im.decode();
  const c = document.createElement("canvas"); c.width = im.naturalWidth; c.height = im.naturalHeight;
  const x = c.getContext("2d")!; x.fillStyle = "#000"; x.fillRect(0, 0, c.width, c.height);
  const px = (v: number, total: number) => (v / 100) * total;
  x.clearRect(px(Math.max(0, z.x - margin), c.width), px(Math.max(0, z.y - margin), c.height), px(Math.min(100, z.w + 2 * margin), c.width), px(Math.min(100, z.h + 2 * margin), c.height));
  return { image: img, mask: c.toDataURL("image/png") };
}
/** Surface d'une pièce repérée par l'analyse (mur, sol, rideaux…), zone en % de l'image. */
export interface Surface { id: string; kind: string; label: string; colors: Array<{ name: string; hex: string }>; material: string; finish: string; zone: { x: number; y: number; w: number; h: number } }
/** Meubles et surfaces visibles d'une image (zones et traits visuels), par le service d'analyse. */
export async function analyseImage(src: string) {
  return call<{ objects: unknown[]; surfaces?: Surface[] }>("/v2/analyse", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ image: await shrink(src, 1536, 0.88), visiteur: visitorId() }) });
}

/** Moodboard des inspirations du client : style, palette, matières (identifiants du catalogue), objets clés et consigne. */
export interface Moodboard { style: string; summary: string; palette: Array<{ name: string; hex: string }>; materials: string[]; objects: Array<{ type: string; label: string; materials: string[]; colors: Array<{ name: string; hex: string }>; shape: string[] }>; brief_fr: string; brief_en: string }
export async function moodboardFrom(inspirations: string[], catalog: Array<{ id: string; name: string }>) {
  const imgs = await Promise.all(inspirations.slice(0, 6).map((s) => shrink(s, 1024, 0.85)));
  return call<Moodboard>("/v2/moodboard", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ inspirations: imgs, matieres: catalog, visiteur: visitorId() }) });
}

/** Produit en vente trouvé sur internet ; le prix n'est présent que s'il a été relevé sur la page du vendeur. */
export interface Trouve { title: string; url: string; merchant: string; price: number | null; currency: string | null; availability: string | null; brand: string | null; checkedAt: string | null; source: "page" | "recherche"; image?: string | null }
export interface RechercheEnLigne { produits: Trouve[]; suggestions: string | null; requetes: string[] }
const found = new Map<string, RechercheEnLigne>();
/** Recherche de produits en vente sur internet (mémorisée pendant la visite, pour ne pas payer deux fois la même recherche). */
const pending = new Map<string, Promise<Result<RechercheEnLigne>>>();
/** Mémoire dans le navigateur du visiteur (24 h) : un meuble déjà cherché s'affiche aussitôt, sans nouvel appel payant. */
const MEMOIRE = "pr_recherche_v1", DUREE = 24 * 3600_000;
function lireMemoire(k: string): RechercheEnLigne | null {
  try { const m = JSON.parse(localStorage.getItem(MEMOIRE) ?? "{}") as Record<string, { t: number; v: RechercheEnLigne }>; const x = m[k]; return x && Date.now() - x.t < DUREE ? x.v : null; } catch { return null; }
}
function ecrireMemoire(k: string, v: RechercheEnLigne) {
  try {
    const m = JSON.parse(localStorage.getItem(MEMOIRE) ?? "{}") as Record<string, { t: number; v: RechercheEnLigne }>;
    m[k] = { t: Date.now(), v };
    const garde = Object.entries(m).filter(([, x]) => Date.now() - x.t < DUREE).sort((a, b) => b[1].t - a[1].t).slice(0, 40);
    localStorage.setItem(MEMOIRE, JSON.stringify(Object.fromEntries(garde)));
  } catch { /* stockage indisponible */ }
}
const suiveurs = new Map<string, Set<(r: RechercheEnLigne) => void>>();
/**
 * Recherche de produits en ligne, affichée au fil de l'eau : `progres` reçoit les produits dès que l'IA les trouve,
 * puis à chaque prix relevé. Résultat mémorisé pendant la visite (aucune recherche payée deux fois).
 */
export async function searchOnline(query: string, label: string, photo?: string, progres?: (r: RechercheEnLigne) => void): Promise<Result<RechercheEnLigne>> {
  const k = query.toLowerCase();
  const hit = found.get(k) ?? lireMemoire(k); if (hit) { found.set(k, hit); return { ok: true, value: hit }; }
  if (progres) (suiveurs.get(k) ?? suiveurs.set(k, new Set()).get(k)!).add(progres);
  // Une recherche déjà en cours pour le même élément est partagée (pas de second appel payant).
  const enCours = pending.get(k); if (enCours) return enCours;
  const diffuser = (r: RechercheEnLigne) => { for (const f of suiveurs.get(k) ?? []) f(r); };
  const p = (async (): Promise<Result<RechercheEnLigne>> => {
    try {
      const r = await fetch(`${IA_URL}/v2/recherche`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ query, label, visiteur: visitorId(), flux: true, ...(photo ? { photo } : {}) }) });
      if (!r.ok || !r.body || !(r.headers.get("content-type") ?? "").includes("ndjson")) {
        const d = await r.json().catch(() => null) as (RechercheEnLigne & { erreur?: string }) | null;
        return r.ok && d ? { ok: true, value: d } : { ok: false, message: d?.erreur ?? "La recherche en ligne n'a pas abouti." };
      }
      const lecteur = r.body.pipeThrough(new TextDecoderStream()).getReader();
      let tampon = "", courant: RechercheEnLigne = { produits: [], suggestions: null, requetes: [] };
      for (;;) {
        const { value, done } = await lecteur.read();
        if (done) break;
        tampon += value;
        let i: number;
        while ((i = tampon.indexOf("\n")) >= 0) {
          const l = tampon.slice(0, i); tampon = tampon.slice(i + 1);
          if (!l.trim()) continue;
          const m = JSON.parse(l) as { type: string; erreur?: string; produit?: Trouve } & Partial<RechercheEnLigne>;
          if (m.type === "erreur") return { ok: false, message: m.erreur ?? "Recherche impossible." };
          if (m.type === "liens") courant = { produits: m.produits ?? [], suggestions: m.suggestions ?? null, requetes: m.requetes ?? [] };
          if (m.type === "fiche" && m.produit) courant = { ...courant, produits: courant.produits.map((x) => (x.url === m.produit!.url ? m.produit! : x)) };
          if (m.type === "fin") return { ok: true, value: { produits: m.produits ?? [], suggestions: m.suggestions ?? null, requetes: m.requetes ?? [] } };
          diffuser(courant);
        }
      }
      return courant.produits.length ? { ok: true, value: courant } : { ok: false, message: "La recherche en ligne a été interrompue." };
    } catch {
      return { ok: false, message: "Le service de recherche est injoignable. Vérifiez votre connexion et réessayez." };
    }
  })().then((r) => { if (r.ok && r.value.produits.length) { found.set(k, r.value); ecrireMemoire(k, r.value); } pending.delete(k); suiveurs.delete(k); return r; });
  pending.set(k, p);
  return p;
}

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
