"use client";
import { KNOWLEDGE, searchLibrary, libraryById, type KnowledgeChunk, type LibraryEntry } from "@/content/index";
import { detectRiskyTopics, proNotice, isOffTopic } from "@core/guard.ts";
import { DEMO_MODE, SUPABASE_URL, SUPABASE_ANON_KEY } from "./site";
import { supabase } from "./supabase";
import type { ProduitCatalogue } from "./catalogue";
import { contexte, demanderCamilleIA, produitsPour } from "./camille-ia";

export interface ChatTurn { role: "user" | "assistant"; content: string; sources?: { title: string; url: string }[]; offline?: boolean; produits?: ProduitCatalogue[] }

const norm = (s: string) => s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
const STOP = new Set(["faire", "avec", "comment", "quelle", "quelles", "pourquoi", "dois", "veux", "voudrais", "le", "la", "les", "un", "une", "des", "de", "du", "et", "ou", "a", "au", "aux", "en", "dans", "pour", "par", "sur", "avec", "est", "sont", "je", "j", "mon", "ma", "mes", "quel", "quelle", "quels", "quelles", "comment", "que", "qui", "quoi", "il", "elle", "on", "ce", "cette", "ces", "faut", "peut", "puis", "plus", "moins", "tres", "bien", "mettre", "faire", "chez", "moi"]);

export function searchKnowledge(q: string, limit = 2): KnowledgeChunk[] {
  const terms = norm(q).split(/[^a-z0-9]+/).filter((t) => t.length > 2 && !STOP.has(t));
  if (!terms.length) return [];
  return KNOWLEDGE.map((k) => { const t = norm(k.title), b = norm(k.body); return { k, s: terms.reduce((a, w) => a + (t.includes(w) ? 4 : 0) + (b.includes(w) ? 1 : 0), 0) }; })
    .filter((x) => x.s >= 2).sort((a, b) => b.s - a.s).slice(0, limit).map((x) => x.k);
}

/** Réponse sans IA (mode démonstration ou enveloppe IA vide) : passages de la base de connaissances, toujours sourcés. */
export function offlineAnswer(question: string): ChatTurn {
  if (isOffTopic(question)) return { role: "assistant", offline: true, content: "Je suis spécialisée dans l'aménagement intérieur et le jardin. Posez-moi une question sur votre maison, votre déco ou vos plantes, je serai ravie d'aider." };
  const chunks = searchKnowledge(question);
  const keyTerms = norm(question).split(/[^a-z0-9]+/).filter((t) => t.length > 3 && !STOP.has(t)).join(" ");
  const terms = keyTerms.split(" ").filter(Boolean);
  // On ne suggère que des fiches dont le nom ou le texte contient au moins deux mots clés (ou un mot du nom).
  const lib = keyTerms ? searchLibrary(keyTerms, undefined, 8).filter((e) => { const n = norm(e.name), t = norm(e.text); const inName = terms.some((w) => n.includes(w)); const hits = terms.filter((w) => t.includes(w)).length; return inName || hits >= 2; }).slice(0, 4) : [];
  const risky = proNotice(detectRiskyTopics(question));
  const parts: string[] = [];
  if (chunks.length) for (const c of chunks) parts.push(`**${c.title}**\n${c.body}`);
  else parts.push("Je n'ai pas encore de fiche précise sur cette question dans ma base. Essayez avec d'autres mots (par exemple « éclairage salon », « haie voisin », « petite chambre »), ou lancez une étude sur la photo de votre pièce pour des conseils personnalisés.");
  if (lib.length) parts.push(`À voir aussi : ${lib.map((e) => `[[${e.id}]]`).join(" ")}`);
  if (risky) parts.push(risky);
  const sources = chunks.flatMap((c) => c.sources).filter((s, i, a) => a.findIndex((x) => x.title === s.title) === i).map(({ title, url }) => ({ title, url }));
  return { role: "assistant", content: parts.join("\n\n"), sources, offline: true };
}

/** Envoie un message à Camille (Edge Function, réponse en flux). Bascule sur la base de connaissances si l'IA n'est pas disponible. */
export async function askCamille(history: ChatTurn[], message: string, ctx: { projectId?: string; step?: string }, onDelta: (text: string) => void, signal?: AbortSignal): Promise<ChatTurn> {
  if (DEMO_MODE) return askCamilleGratuite(history, message, signal);
  const sb = supabase();
  const session = (await sb?.auth.getSession())?.data.session;
  const res = await fetch(`${SUPABASE_URL}/functions/v1/camille`, {
    method: "POST", signal,
    headers: { "content-type": "application/json", apikey: SUPABASE_ANON_KEY, authorization: `Bearer ${session?.access_token ?? SUPABASE_ANON_KEY}` },
    body: JSON.stringify({ threadId: null, message, imagePath: null, context: { projectId: ctx.projectId ?? null, step: ctx.step ?? null }, history: history.slice(-12).map(({ role, content }) => ({ role, content })) }),
  });
  if (res.status === 402 || res.status === 429) {
    const body = (await res.json().catch(() => ({}))) as { message?: string };
    return { role: "assistant", content: body.message ?? "Limite atteinte pour aujourd'hui.", offline: true };
  }
  if (!res.ok || !res.body) return offlineAnswer(message);
  const reader = res.body.getReader(); const dec = new TextDecoder(); let text = ""; let sources: ChatTurn["sources"] = []; let buf = "";
  for (;;) {
    const { done, value } = await reader.read(); if (done) break;
    buf += dec.decode(value, { stream: true });
    const lines = buf.split("\n"); buf = lines.pop() ?? "";
    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const ev = JSON.parse(line.slice(6)) as { type: "delta"; text: string } | { type: "sources"; sources: { title: string; url: string }[] } | { type: "done" };
      if (ev.type === "delta") { text += ev.text; onDelta(text); } else if (ev.type === "sources") sources = ev.sources;
    }
  }
  return { role: "assistant", content: text, sources };
}

/** Camille avec l'IA gratuite du service Cloudflare ; si elle est indisponible ou au plafond du jour, réponse par les fiches. */
async function askCamilleGratuite(history: ChatTurn[], message: string, signal?: AbortSignal): Promise<ChatTurn> {
  if (isOffTopic(message)) return offlineAnswer(message);
  const fiches = searchKnowledge(message, 3);
  const produits = await produitsPour(`${history.filter((t) => t.role === "user").slice(-1).map((t) => t.content).join(" ")} ${message}`).catch(() => []);
  const r = await demanderCamilleIA([...history.map(({ role, content }) => ({ role, content })), { role: "user", content: message }], contexte(location.pathname, fiches, produits), signal);
  if (!r.ok) {
    const off = offlineAnswer(message);
    return { ...off, content: r.message ? `${r.message}\n\n${off.content}` : off.content, produits: produits.slice(0, 3) };
  }
  const risky = proNotice(detectRiskyTopics(message));
  const sources = fiches.flatMap((c) => c.sources).filter((s, i, a) => a.findIndex((x) => x.title === s.title) === i).map(({ title, url }) => ({ title, url }));
  return { role: "assistant", content: risky ? `${r.texte}\n\n${risky}` : r.texte, sources, produits };
}

export function citation(id: string): LibraryEntry | undefined { return libraryById.get(id); }
