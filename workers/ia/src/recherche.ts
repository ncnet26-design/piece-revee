/**
 * Recherche de produits en vente sur internet pour un élément de la pièce (meuble, objet, tissu, peinture…).
 * 1. Gemini avec la recherche Google trouve des pages produits réelles (seules les pages issues de la recherche sont gardées).
 * 2. Le service ouvre chaque page et relève lui-même les données publiées par le vendeur (schema.org Product :
 *    nom, marque, prix, disponibilité). Un prix n'est affiché que s'il a été relevé sur la page.
 * Règles Google : résultats montrés uniquement à la personne qui a cherché, avec les suggestions de recherche Google ;
 * rien n'est stocké.
 */
import type { Env } from "./config";
import { fetchRetry, ProviderError } from "./providers";
import { TEXT_MODEL } from "./analyse";
/** Modèle de la recherche de produits (le modèle léger trouvait trop peu de pages : retiré le 5 novembre). */
export const SEARCH_MODEL = TEXT_MODEL;
/** Temps maximum passé à ouvrir les pages produits pour relever les prix (au-delà, le lien est montré sans prix). */
const DELAI_PAGES = 6000;
import { parseProduct } from "./produit";
export { parseProduct };

export interface Trouve {
  title: string; url: string; merchant: string;
  price: number | null; currency: string | null; availability: string | null; brand: string | null;
  checkedAt: string | null; source: "page" | "recherche";
  /** Image publiée par le vendeur (adresse seulement, affichée depuis son site). */
  image: string | null;
}
export interface Recherche { produits: Trouve[]; suggestions: string | null; requetes: string[]; etapes?: Record<string, unknown> }

const PROMPT = (q: string, label: string, pays: string) => [
  `Use Google Search now (at most 2 searches) to find up to 9 different products currently for sale online that look as close as possible to this item seen in an interior design image: "${label}". Shopping query (French): "${q}".`,
  "Match what matters for a buyer: the same kind of item, the same shape, the same main material and the same colour; size close if given.",
  `Shops must sell to ${pays === "FR" ? "France" : "Europe"}. Cover every budget for everyone: about 3 affordable (e.g. IKEA, Maisons du Monde, Leroy Merlin, La Redoute, Conforama, But, Alinéa, Castorama, Gifi, H&M Home, Zara Home, Sklum, Kave Home), about 3 mid-range (e.g. AM.PM, Habitat, Westwing, Made in Design, Fleux, Bobochic, Drawer) and about 3 premium design brands or editors (e.g. Roche Bobois, Ligne Roset, The Socialite Family, Sarah Lavoine, HAY, Ferm Living, Gubi, Selency for vintage).`,
  "Only list direct product pages (one product per page), never category pages, blogs or search pages. Never invent a URL: only pages you found with the search.",
  'Finish your answer with a JSON block: {"products":[{"title":"","url":"","merchant":""}]}.',
].join("\n");

const host = (u: string) => { try { return new URL(u).hostname.replace(/^www\./, ""); } catch { return ""; } };
const clean = (s: unknown, n: number) => (typeof s === "string" ? s.replace(/\s+/g, " ").trim().slice(0, n) : "");

/** Titre lisible tiré de l'adresse d'une page produit (quand la page ne peut pas être lue). */
export function slugTitle(u: string): string {
  try {
    const seg = new URL(u).pathname.split("/").filter(Boolean).map((x) => decodeURIComponent(x).replace(/\.(html?|php|aspx)$/i, "")).filter((x) => /[a-z]{3,}-[a-z]{3,}/i.test(x)).pop();
    if (!seg) return "";
    const t = seg.replace(/[-_]+/g, " ").split(" ").filter((w) => !/^(prod|produit|product|p|ref\w*|sku)$/i.test(w) && !/^(ref|sku|prod)?[a-z]?\d{5,}$/i.test(w)).join(" ").trim();
    return t.length > 6 ? t.charAt(0).toUpperCase() + t.slice(1, 120) : "";
  } catch { return ""; }
}

/** Adresse finale d'un lien de la recherche Google (redirection). */
async function resolve(u: string): Promise<string> {
  if (!/grounding-api-redirect/.test(u)) return u;
  try {
    const r = await fetch(u, { method: "HEAD", redirect: "manual", signal: AbortSignal.timeout(5000) });
    return r.headers.get("location") || u;
  } catch { return u; }
}

async function inspect(url: string): Promise<ReturnType<typeof parseProduct>> {
  try {
    const r = await fetch(url, { headers: { "user-agent": "Mozilla/5.0 (compatible; PieceReveeBot/1.0; +https://odd-bar-c583.ewanesteves26.workers.dev)", accept: "text/html", "accept-language": "fr-FR,fr;q=0.9" }, redirect: "follow", signal: AbortSignal.timeout(6000) });
    if (!r.ok || !(r.headers.get("content-type") ?? "").includes("html")) return null;
    const html = (await r.text()).slice(0, 1_500_000);
    return parseProduct(html);
  } catch { return null; }
}

/** Photo du meuble découpée dans l'image (facultative) : l'IA cherche ce qui lui ressemble vraiment. */
export interface PhotoMeuble { mime: string; b64: string }

/** Suivi en direct : les liens dès que l'IA les trouve, puis chaque fiche dès que sa page est lue. */
export interface Flux { liens?: (r: Recherche) => void; fiche?: (t: Trouve) => void }

export async function rechercher(env: Env, q: string, label: string, pays = "FR", photo?: PhotoMeuble, flux?: Flux): Promise<Recherche> {
  if (!env.GEMINI_API_KEY) throw new ProviderError("La recherche sur internet n'est pas configurée (clé manquante).", false);
  const appel = (model: string) => fetchRetry(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
    method: "POST", headers: { "content-type": "application/json", "x-goog-api-key": env.GEMINI_API_KEY! },
    body: JSON.stringify({ contents: [{ role: "user", parts: [
      { text: PROMPT(q, label, pays) + (photo ? "\nThe attached photo shows the exact item: above all, match its look (silhouette, material, colour, details)." : "") },
      ...(photo ? [{ inline_data: { mime_type: photo.mime, data: photo.b64 } }] : []),
    ] }], tools: [{ google_search: {} }] }),
  }, 2);
  const r = await appel(env.GEMINI_SEARCH_MODEL || SEARCH_MODEL);
  if (!r.ok) throw new ProviderError("La recherche sur internet a échoué.", r.status >= 500 || r.status === 429, `HTTP ${r.status}`);
  const j = await r.json() as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> }; groundingMetadata?: { groundingChunks?: Array<{ web?: { uri?: string; title?: string } }>; searchEntryPoint?: { renderedContent?: string }; webSearchQueries?: string[] } }> };
  const c = j.candidates?.[0];
  const meta = c?.groundingMetadata;
  const txt = c?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";
  let listed: Array<{ title?: unknown; url?: unknown; merchant?: unknown }> = [];
  try { listed = (JSON.parse(txt.slice(txt.indexOf('{"products"'), txt.lastIndexOf("}") + 1)) as { products?: typeof listed }).products ?? []; } catch { /* réponse libre */ }
  // Liens écrits dans le texte (si le bloc JSON manque), avec le texte du lien comme titre.
  for (const m of txt.matchAll(/\[([^\]]{3,160})\]\((https:\/\/[^\s)]+)\)/g)) listed.push({ title: m[1], url: m[2], merchant: "" });
  for (const m of txt.matchAll(/https:\/\/[^\s)"'<>\]]+/g)) if (!listed.some((p) => p.url === m[0])) listed.push({ title: "", url: m[0], merchant: "" });

  // Seules les pages réellement trouvées par la recherche Google sont gardées (liens de redirection de Google suivis jusqu'à la page).
  const chunks = (meta?.groundingChunks ?? []).map((g) => g.web).filter((w): w is { uri: string; title?: string } => typeof w?.uri === "string");
  const isRedirect = (u: string) => /grounding-api-redirect/.test(u);
  const viaModel = listed.map((p) => ({ url: clean(p.url, 1200), title: clean(p.title, 160), merchant: clean(p.merchant, 60) })).filter((p) => /^https?:\/\//.test(p.url));
  const toResolve = [...viaModel.filter((p) => isRedirect(p.url)), ...chunks.map((w) => ({ url: w.uri, title: "", merchant: "" }))].slice(0, 16);
  const resolved = await Promise.all(toResolve.map(async (p) => ({ ...p, url: await resolve(p.url) })));
  const domains = new Set([...resolved.map((w) => host(w.url)), ...chunks.map((w) => (w.title ?? "").replace(/^www\./, ""))].filter(Boolean));
  const direct = viaModel.filter((p) => !isRedirect(p.url) && domains.has(host(p.url)));
  const isPage = (u: string) => { try { const x = new URL(u); return x.protocol === "https:" && x.pathname.length > 1 && !/\.(jpe?g|png|webp|gif|avif|svg|pdf)$/i.test(x.pathname) && !/\/(cdn|wp-content\/uploads|media\/catalog)\//i.test(x.pathname); } catch { return false; } };
  const key = (u: string) => u.split("#")[0]!.split("?")[0]!;
  const named = new Map([...resolved, ...direct].filter((p) => p.title).map((p) => [key(p.url), p] as const));
  const candidates = [...resolved, ...direct].filter((p) => !isRedirect(p.url) && isPage(p.url)).map((p) => ({ ...p, title: p.title || named.get(key(p.url))?.title || "", merchant: p.merchant || named.get(key(p.url))?.merchant || "" }));
  const seen = new Set<string>(), unique = candidates.filter((p) => { const k = p.url.split("#")[0]!.split("?")[0]!; if (seen.has(k)) return false; seen.add(k); return true; }).slice(0, 12);

  const now = new Date().toISOString();
  const suggestions = meta?.searchEntryPoint?.renderedContent ?? null, requetes = (meta?.webSearchQueries ?? []).slice(0, 5);
  // Affichage immédiat : les produits trouvés, sans prix, pendant que les pages sont lues.
  flux?.liens?.({ produits: unique.map((p) => ({ title: p.title || slugTitle(p.url) || `Modèle chez ${p.merchant || host(p.url)}`, url: p.url, merchant: p.merchant || host(p.url), price: null, currency: null, availability: null, brand: null, checkedAt: null, source: "recherche" as const, image: null })).filter((t) => t.title.length > 2).slice(0, 12), suggestions, requetes });
  const limite = new Promise<null>((ok) => setTimeout(() => ok(null), DELAI_PAGES));
  const produits = (await Promise.all(unique.map(async (p): Promise<Trouve | null> => {
    const d = await Promise.race([inspect(p.url), limite]);
    // Page non lue à temps : le lien trouvé par Google reste montré, sans prix.
    const title = d?.name || p.title || slugTitle(p.url) || `Modèle chez ${p.merchant || host(p.url)}`;
    const t: Trouve = {
      title, url: p.url, merchant: p.merchant || host(p.url),
      price: d?.price ?? null, currency: d?.price ? d.currency ?? "EUR" : null, availability: d?.availability ?? null, brand: d?.brand ?? null,
      checkedAt: d ? now : null, source: d ? "page" : "recherche",
      image: (() => { try { const x = d?.image ? new URL(d.image, p.url) : null; return x && x.protocol === "https:" ? x.href : null; } catch { return null; } })(),
    };
    if (d) flux?.fiche?.(t);
    return t;
  }))).filter((x): x is Trouve => x !== null && x.title.length > 2);
  // Pages produits vérifiées d'abord, puis du moins cher au plus cher.
  produits.sort((a, b) => (a.source === b.source ? (a.price ?? 1e9) - (b.price ?? 1e9) : a.source === "page" ? -1 : 1));
  // Compteurs (aucune donnée personnelle) : aident à comprendre une recherche vide.
  const etapes = { listes: listed.length, sources: chunks.length, redirections: resolved.filter((p) => !isRedirect(p.url)).length, candidats: unique.length, pagesLues: produits.filter((p) => p.source === "page").length, exemples: unique.slice(0, 3).map((p) => host(p.url)) };
  return { produits: produits.slice(0, 9), suggestions, requetes, etapes };
}
