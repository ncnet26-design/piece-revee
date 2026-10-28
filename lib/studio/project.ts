"use client";
import { useSyncExternalStore } from "react";
import type { StudioScene } from "./scene";

/**
 * Projet du Studio, enregistré sur l'appareil : le brief, les versions (propositions IA et états de la scène 3D),
 * la liste d'achats et son budget. Partage par lien (sans les photos personnelles).
 */
export type RoomType = "salon" | "chambre" | "cuisine" | "salle-de-bain" | "entree" | "bureau";
export interface Brief {
  room: RoomType | null;
  style: string | null;
  palette: string[];
  budget: number | null;
  keep: string[];
  keepFree: string;
  notes: string;
  /** Photo de la pièce et inspirations, réduites (data URL). */
  photo: string | null;
  inspirations: string[];
}
export interface Version {
  id: string; createdAt: string; label: string;
  kind: "ia" | "scene";
  imageUrl: string | null;
  jobId?: string;
  scene?: StudioScene;
  instruction?: string;
  provider?: string;
}
export interface ListItem { productId: string; qty: number; forObject?: string }
export interface Project { v: 1; title: string; brief: Brief; versions: Version[]; list: ListItem[] }

export const EMPTY_BRIEF: Brief = { room: null, style: null, palette: [], budget: null, keep: ["fenetres", "portes", "murs", "plafond"], keepFree: "", notes: "", photo: null, inspirations: [] };
const KEY = "pr_studio_projet";
const fresh = (): Project => ({ v: 1, title: "Mon projet", brief: { ...EMPTY_BRIEF }, versions: [], list: [] });

let cache: Project | null = null;
const listeners = new Set<() => void>();
function read(): Project {
  if (cache) return cache;
  try { const p = JSON.parse(localStorage.getItem(KEY) ?? "null") as Project | null; cache = p?.v === 1 ? p : fresh(); } catch { cache = fresh(); }
  return cache;
}
export function saveProject(p: Project): { ok: boolean } {
  cache = p; listeners.forEach((l) => l());
  try { localStorage.setItem(KEY, JSON.stringify(p)); return { ok: true }; }
  catch {
    // Mémoire de l'appareil pleine : on garde le projet sans les photos.
    try { localStorage.setItem(KEY, JSON.stringify({ ...p, brief: { ...p.brief, photo: null, inspirations: [] } })); } catch { /* rien */ }
    return { ok: false };
  }
}
export const updateProject = (f: (p: Project) => Project) => saveProject(f(read()));
export function useProject(): Project {
  return useSyncExternalStore((l) => { listeners.add(l); return () => listeners.delete(l); }, read, fresh);
}
export const uid = () => Math.random().toString(36).slice(2, 10);

/* ——— Partage ——— */
const b64url = (s: string) => btoa(unescape(encodeURIComponent(s))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const fromB64url = (s: string) => decodeURIComponent(escape(atob(s.replace(/-/g, "+").replace(/_/g, "/"))));
/** Lien de partage : titre, brief sans photos, versions (images hébergées seulement), liste d'achats. */
export function shareLink(p: Project, origin: string): string {
  const light = { ...p, brief: { ...p.brief, photo: null, inspirations: [] }, versions: p.versions.filter((v) => !v.imageUrl?.startsWith("data:")).slice(0, 8) };
  return `${origin}/studio/#p=${b64url(JSON.stringify(light))}`;
}
export function readShared(hash: string): Project | null {
  const m = /#p=([A-Za-z0-9_-]+)/.exec(hash);
  if (!m) return null;
  try { const p = JSON.parse(fromB64url(m[1]!)) as Project; return p.v === 1 ? p : null; } catch { return null; }
}
