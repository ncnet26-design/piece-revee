"use client";
import { useSyncExternalStore } from "react";
import { BriefSchema, isExterior, type Brief, type StudyResult } from "@core/schemas/study.ts";
import { styleById } from "@/content/index";
import { DEMO_EXTERIOR, DEMO_INTERIOR } from "./demo-studies";
import { DEMO_MODE } from "./site";
import { KEYS, local } from "./storage";
import { callFunction, supabase } from "./supabase";

export type JobStep = "upload" | "analyse" | "etude" | "catalogue" | "rendus" | "termine" | "erreur";
export interface RenderImage { id: string; url: string | null; variant: number; width: number; height: number; aiGenerated: true; watermark: boolean }
export interface StudyVersion { version: number; instruction: string | null; createdAt: string; result: StudyResult }
export interface Project {
  id: string;
  title: string;
  homeId: string | null;
  brief: Brief;
  photoUrl: string | null;
  status: JobStep;
  error: string | null;
  versions: StudyVersion[];
  renders: RenderImage[];
  isPublic: boolean;
  shareSlug: string | null;
  checklist: string[];
  createdAt: string;
  demo: boolean;
}

export const STEP_LABELS: Record<Exclude<JobStep, "termine" | "erreur">, string> = {
  upload: "Envoi et vérification de la photo",
  analyse: "Lecture de la photo, des volumes et de la lumière",
  etude: "Conception : palette, zones, besoins, tutos",
  catalogue: "Recherche dans le catalogue des enseignes",
  rendus: "Rendus de votre espace transformé",
};

/* ——— Stockage local (mode démonstration et brouillons) ——— */
type L = () => void;
const listeners = new Set<L>();
let cache: Project[] | null = null;
const EMPTY: Project[] = [];
const read = () => (cache ??= local.get<Project[]>(KEYS.projects, []));
const write = (p: Project[]) => { cache = p; local.set(KEYS.projects, p); listeners.forEach((l) => l()); };
const subscribe = (l: L) => { listeners.add(l); return () => { listeners.delete(l); }; };

export function useLocalProjects(): Project[] { return useSyncExternalStore(subscribe, read, () => EMPTY); }
export function getLocalProject(id: string): Project | undefined { return read().find((p) => p.id === id); }
export function updateLocalProject(id: string, patch: Partial<Project>) { write(read().map((p) => (p.id === id ? { ...p, ...patch } : p))); }
export function deleteLocalProject(id: string) { write(read().filter((p) => p.id !== id)); }

const uid = () => (typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`);

/** Adapte l'étude d'exemple au brief (titre, palette du style choisi) pour la démonstration. */
function demoStudyFor(brief: Brief): StudyResult {
  const base = structuredClone(isExterior(brief.space) ? DEMO_EXTERIOR : DEMO_INTERIOR);
  const style = brief.styles[0] ? [...styleById.values()].find((s) => s.name === brief.styles[0] || s.id === brief.styles[0]) : undefined;
  if (style) {
    base.concept.title = `${brief.space} ${style.name.toLowerCase()}`;
    base.concept.mood = style.summary;
    base.palette = base.palette.map((p, i) => ({ ...p, hex: style.palette[i % style.palette.length] ?? p.hex }));
  } else base.concept.title = `${brief.space} : ${base.concept.title.toLowerCase()}`;
  return base;
}

export interface CreateInput { brief: Brief; photo: { blob: Blob; dataUrl: string } | null; inspirations: Blob[]; homeId: string | null }

/** Crée un projet et lance l'étude. Côté serveur : upload privé, file de tâches ; ici en démonstration : étude d'exemple. */
export async function createProject(input: CreateInput): Promise<{ ok: true; id: string } | { ok: false; message: string }> {
  const brief = BriefSchema.safeParse(input.brief);
  if (!brief.success) return { ok: false, message: "Certaines informations du formulaire sont incomplètes." };
  if (DEMO_MODE) {
    const id = uid();
    const p: Project = { id, title: `${brief.data.space}`, homeId: input.homeId, brief: brief.data, photoUrl: input.photo?.dataUrl ?? null, status: "upload", error: null,
      versions: [], renders: [], isPublic: false, shareSlug: null, checklist: [], createdAt: new Date().toISOString(), demo: true };
    try { write([p, ...read()]); } catch { return { ok: false, message: "L'espace de stockage de votre navigateur est plein. Supprimez un ancien projet et réessayez." }; }
    return { ok: true, id };
  }
  const sb = supabase()!;
  const { data: auth } = await sb.auth.getUser();
  if (!auth.user) return { ok: false, message: "Connectez-vous pour lancer une étude : la première est offerte." };
  const projectId = uid();
  const paths: string[] = [];
  const all = [...(input.photo ? [input.photo.blob] : []), ...input.inspirations];
  for (const [i, blob] of all.entries()) {
    const path = `${auth.user.id}/${projectId}/${i === 0 ? "piece" : `inspiration-${i}`}.jpg`;
    const { error } = await sb.storage.from("photos").upload(path, blob, { contentType: "image/jpeg", upsert: false });
    if (error) return { ok: false, message: "L'envoi de la photo a échoué. Vérifiez votre connexion et réessayez." };
    paths.push(path);
  }
  try {
    const r = await callFunction<{ projectId: string } | { error: string; message: string }>("study-start", { projectId, brief: brief.data, photoPaths: paths, homeId: input.homeId });
    if ("error" in r) return { ok: false, message: r.message };
    return { ok: true, id: r.projectId };
  } catch { return { ok: false, message: "L'étude n'a pas pu démarrer. Réessayez dans un instant." }; }
}

/** Démonstration : simule l'avancement de l'étude, puis enregistre l'étude d'exemple adaptée. */
export function runDemoPipeline(id: string, onStep: (s: JobStep) => void): () => void {
  const steps: JobStep[] = ["upload", "analyse", "etude", "catalogue", "rendus", "termine"];
  let i = 0; let stopped = false;
  const tick = () => {
    if (stopped) return;
    const step = steps[i]!; onStep(step);
    const p = getLocalProject(id);
    if (!p) return;
    if (step === "termine") {
      const result = demoStudyFor(p.brief);
      updateLocalProject(id, { status: "termine", title: result.concept.title, versions: [{ version: 1, instruction: null, createdAt: new Date().toISOString(), result }],
        renders: [0, 1, 2].map((v) => ({ id: `${id}-r${v}`, url: null, variant: v, width: 1024, height: 768, aiGenerated: true, watermark: true })) });
      return;
    }
    updateLocalProject(id, { status: step });
    i++; setTimeout(tick, step === "upload" ? 700 : 1300);
  };
  tick();
  return () => { stopped = true; };
}

/** Affiner : nouvelle version de l'étude avec historique. En démonstration, la consigne est enregistrée et Camille propose ses conseils. */
export async function refineStudy(p: Project, instruction: string): Promise<{ ok: true } | { ok: false; message: string }> {
  const last = p.versions.at(-1); if (!last) return { ok: false, message: "Aucune étude à affiner." };
  if (p.demo) {
    const result = structuredClone(last.result);
    const lower = instruction.toLowerCase();
    if (/lumin|clair/.test(lower)) result.palette = result.palette.map((c, i) => (i === 0 ? { ...c, name: `${c.name}, plus clair`, hex: lighten(c.hex, 14) } : c));
    if (/budget|moins cher|divis/.test(lower)) result.needs = result.needs.map((n) => ({ ...n, gamme: "accessible", priceRange: { min: Math.round(n.priceRange.min / 2), max: Math.max(Math.round(n.priceRange.max / 2), Math.round(n.priceRange.min / 2)) } }));
    updateLocalProject(p.id, { versions: [...p.versions, { version: last.version + 1, instruction, createdAt: new Date().toISOString(), result }] });
    return { ok: true };
  }
  try { await callFunction("study-refine", { projectId: p.id, instruction }); return { ok: true }; }
  catch { return { ok: false, message: "L'affinage n'a pas pu être lancé. Réessayez." }; }
}

function lighten(hex: string, amt: number) { const n = parseInt(hex.slice(1), 16); const c = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => Math.min(255, v + amt)); return `#${c.map((v) => v.toString(16).padStart(2, "0")).join("")}`.toUpperCase(); }

/** Projets du compte (mode connecté). */
export async function fetchRemoteProjects(): Promise<Project[]> {
  const sb = supabase(); if (!sb) return [];
  const { data, error } = await sb.from("projects_view").select("*").order("created_at", { ascending: false });
  if (error || !data) return [];
  return data as unknown as Project[];
}
export async function fetchRemoteProject(id: string): Promise<Project | null> {
  const sb = supabase(); if (!sb) return null;
  const { data } = await sb.from("projects_view").select("*").eq("id", id).maybeSingle();
  return (data as unknown as Project) ?? null;
}
