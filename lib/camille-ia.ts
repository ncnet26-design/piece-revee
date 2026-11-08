"use client";
/**
 * Camille avec l'IA (gratuite, service Cloudflare) : on lui envoie la page en cours, les fiches conseils utiles
 * et de vrais produits de notre boutique ; elle ne cite que ceux-là. Les produits sont aussi montrés en cartes cliquables.
 */
import { chercher, famille, type Famille, type ProduitCatalogue } from "@/lib/catalogue";
import { familleBoutique } from "@/lib/boutique-client";
import { IA_URL } from "@/lib/ia";
import { visitorId } from "@/lib/ia-jobs";
import { guideFor } from "@/lib/camille-guide";
import type { KnowledgeChunk } from "@/content/index";

type P = ProduitCatalogue & { g?: "petit" | "moyen" | "haut" };
const NOM_GAMME = { petit: "petit budget", moyen: "budget moyen", haut: "haut de gamme" } as const;
const norm = (s: string) => s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
/** Pièce citée sans meuble précis : la famille de meubles la plus utile à proposer. */
const PIECE: Array<[RegExp, Famille]> = [[/salon|sejour/, "canape"], [/chambre/, "lit"], [/salle a manger/, "table-manger"], [/cuisine/, "chaise"], [/entree|couloir/, "rangement"], [/bureau/, "luminaire"], [/salle de bain/, "salle-de-bain"]];

/** Jusqu'à 6 produits réels de la boutique en rapport avec la question, répartis sur les trois budgets. */
export async function produitsPour(question: string): Promise<P[]> {
  const q = norm(question);
  const f = famille(q) ?? PIECE.find(([re]) => re.test(q))?.[1] ?? null;
  if (!f) return [];
  const l = await familleBoutique(f);
  const trouves = chercher(l.filter((p) => p.i && p.p !== null), question, 60).filter((p) => p.score >= 34) as Array<P & { score: number }>;
  const base = trouves.length ? trouves : (l.filter((p) => p.i && p.p !== null) as P[]).map((p) => ({ ...p, score: 0 }));
  const res: P[] = [];
  for (const g of ["petit", "moyen", "haut"] as const) res.push(...base.filter((p) => p.g === g).slice(0, 2));
  return res.slice(0, 6).map(({ ...p }) => { delete (p as { score?: number }).score; return p; });
}

const prix = (p: ProduitCatalogue) => (p.p === null ? "prix sur le site" : `${p.p.toLocaleString("fr-FR")} €`);
export function contexte(path: string, fiches: KnowledgeChunk[], produits: P[]): string {
  const g = guideFor(path);
  const parts = [`Page en cours : ${path}${g ? ` (${g.tip})` : ""}`];
  if (fiches.length) parts.push(`Fiches :\n${fiches.map((f) => `• ${f.title} : ${f.body.slice(0, 700)}`).join("\n")}`);
  parts.push(produits.length ? `Produits de la boutique :\n${produits.map((p) => `• ${p.n} — ${p.m} — ${prix(p)}${p.g ? ` (${NOM_GAMME[p.g]})` : ""}`).join("\n")}` : "Produits de la boutique : aucun pour cette question.");
  return parts.join("\n\n");
}

export type ReponseIA = { ok: true; texte: string } | { ok: false; message?: string };
export async function demanderCamilleIA(historique: Array<{ role: "user" | "assistant"; content: string }>, ctx: string, signal?: AbortSignal): Promise<ReponseIA> {
  try {
    const r = await fetch(`${IA_URL}/v2/camille`, { method: "POST", signal, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messages: historique.slice(-10), contexte: ctx, visiteur: visitorId() }) });
    const j = await r.json().catch(() => ({})) as { reponse?: string; erreur?: string };
    if (r.ok && j.reponse) return { ok: true, texte: j.reponse };
    return { ok: false, message: r.status === 429 ? j.erreur : undefined };
  } catch (e) {
    if ((e as Error).name === "AbortError") throw e;
    return { ok: false };
  }
}
