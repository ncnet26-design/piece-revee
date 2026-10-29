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

export interface Trouve {
  title: string; url: string; merchant: string;
  price: number | null; currency: string | null; availability: string | null; brand: string | null;
  checkedAt: string | null; source: "page" | "recherche";
}
export interface Recherche { produits: Trouve[]; suggestions: string | null; requetes: string[] }

const PROMPT = (q: string, label: string, pays: string) => [
  `Find up to 8 different products currently for sale online that closely match this item seen in an interior design image: "${label}". Shopping query (French): "${q}".`,
  `Search the web. Prefer online shops that deliver to ${pays === "FR" ? "France" : "Europe"} (any shop: marketplaces, furniture and decor retailers, DIY stores, design brands), with a range of prices from affordable to premium.`,
  "Only return direct product pages (one product per page), never category pages, blogs or search pages.",
  'Answer with JSON only: {"products":[{"title":"","url":"","merchant":""}]}. Never invent a URL: use only pages found by the search.',
].join("\n");

const host = (u: string) => { try { return new URL(u).hostname.replace(/^www\./, ""); } catch { return ""; } };
const clean = (s: unknown, n: number) => (typeof s === "string" ? s.replace(/\s+/g, " ").trim().slice(0, n) : "");

/** Données produit publiées par le vendeur (JSON-LD schema.org), si la page en contient. */
export function parseProduct(html: string): { name: string; brand: string | null; price: number | null; currency: string | null; availability: string | null } | null {
  const blocks = [...html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)].map((m) => m[1]!);
  const all: Array<Record<string, unknown>> = [];
  const walk = (v: unknown) => {
    if (Array.isArray(v)) v.forEach(walk);
    else if (v && typeof v === "object") { const o = v as Record<string, unknown>; all.push(o); if (o["@graph"]) walk(o["@graph"]); }
  };
  for (const b of blocks) { try { walk(JSON.parse(b.trim())); } catch { /* bloc illisible */ } }
  const p = all.find((o) => { const t = o["@type"]; return t === "Product" || (Array.isArray(t) && t.includes("Product")); });
  if (!p) return null;
  const offers = (Array.isArray(p.offers) ? p.offers[0] : p.offers) as Record<string, unknown> | undefined;
  const agg = offers && (offers["@type"] === "AggregateOffer" ? offers : undefined);
  const raw = offers?.price ?? agg?.lowPrice ?? (offers?.priceSpecification as Record<string, unknown> | undefined)?.price;
  const price = raw !== undefined && Number.isFinite(Number(String(raw).replace(",", "."))) ? Number(String(raw).replace(",", ".")) : null;
  const brand = typeof p.brand === "string" ? p.brand : clean((p.brand as Record<string, unknown> | undefined)?.name, 60) || null;
  const av = clean(offers?.availability, 80).replace(/^https?:\/\/schema\.org\//, "") || null;
  return { name: clean(p.name, 160), brand, price: price && price > 0 ? price : null, currency: clean(offers?.priceCurrency, 3) || null, availability: av };
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
    const r = await fetch(url, { headers: { "user-agent": "Mozilla/5.0 (compatible; PieceReveeBot/1.0; +https://odd-bar-c583.ewanesteves26.workers.dev)", accept: "text/html", "accept-language": "fr-FR,fr;q=0.9" }, redirect: "follow", signal: AbortSignal.timeout(7000) });
    if (!r.ok || !(r.headers.get("content-type") ?? "").includes("html")) return null;
    const html = (await r.text()).slice(0, 1_500_000);
    return parseProduct(html);
  } catch { return null; }
}

export async function rechercher(env: Env, q: string, label: string, pays = "FR"): Promise<Recherche> {
  if (!env.GEMINI_API_KEY) throw new ProviderError("La recherche sur internet n'est pas configurée (clé manquante).", false);
  const model = env.GEMINI_SEARCH_MODEL || env.GEMINI_TEXT_MODEL || TEXT_MODEL;
  const r = await fetchRetry(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
    method: "POST", headers: { "content-type": "application/json", "x-goog-api-key": env.GEMINI_API_KEY },
    body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: PROMPT(q, label, pays) }] }], tools: [{ google_search: {} }], generationConfig: { temperature: 0.1 } }),
  });
  if (!r.ok) throw new ProviderError("La recherche sur internet a échoué.", r.status >= 500 || r.status === 429, `HTTP ${r.status}`);
  const j = await r.json() as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> }; groundingMetadata?: { groundingChunks?: Array<{ web?: { uri?: string; title?: string } }>; searchEntryPoint?: { renderedContent?: string }; webSearchQueries?: string[] } }> };
  const c = j.candidates?.[0];
  const meta = c?.groundingMetadata;
  const txt = c?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";
  let listed: Array<{ title?: unknown; url?: unknown; merchant?: unknown }> = [];
  try { listed = (JSON.parse(txt.slice(txt.indexOf("{"), txt.lastIndexOf("}") + 1)) as { products?: typeof listed }).products ?? []; } catch { /* réponse libre */ }

  // Seules les pages réellement trouvées par la recherche Google sont gardées.
  const chunks = (meta?.groundingChunks ?? []).map((g) => g.web).filter((w): w is { uri: string; title?: string } => typeof w?.uri === "string");
  const resolved = await Promise.all(chunks.slice(0, 12).map(async (w) => ({ url: await resolve(w.uri), title: w.title ?? "" })));
  const domains = new Set(resolved.map((w) => host(w.url)).concat(chunks.map((w) => (w.title ?? "").replace(/^www\./, ""))).filter(Boolean));
  const fromModel = listed.map((p) => ({ url: clean(p.url, 600), title: clean(p.title, 160), merchant: clean(p.merchant, 60) }))
    .filter((p) => /^https:\/\//.test(p.url) && domains.has(host(p.url)));
  const candidates = [...fromModel, ...resolved.filter((w) => /^https:\/\//.test(w.url) && !/grounding-api-redirect/.test(w.url)).map((w) => ({ url: w.url, title: "", merchant: "" }))];
  const seen = new Set<string>(), unique = candidates.filter((p) => { const k = p.url.split("#")[0]!.split("?")[0]!; if (seen.has(k)) return false; seen.add(k); return true; }).slice(0, 10);

  const now = new Date().toISOString();
  const produits = (await Promise.all(unique.map(async (p): Promise<Trouve | null> => {
    const d = await inspect(p.url);
    if (!d && !p.title) return null; // page ni lisible ni décrite : rien à montrer
    return {
      title: d?.name || p.title, url: p.url, merchant: p.merchant || host(p.url),
      price: d?.price ?? null, currency: d?.price ? d.currency ?? "EUR" : null, availability: d?.availability ?? null, brand: d?.brand ?? null,
      checkedAt: d ? now : null, source: d ? "page" : "recherche",
    };
  }))).filter((x): x is Trouve => x !== null && x.title.length > 2);
  // Pages produits vérifiées d'abord, puis du moins cher au plus cher.
  produits.sort((a, b) => (a.source === b.source ? (a.price ?? 1e9) - (b.price ?? 1e9) : a.source === "page" ? -1 : 1));
  return { produits: produits.slice(0, 8), suggestions: meta?.searchEntryPoint?.renderedContent ?? null, requetes: (meta?.webSearchQueries ?? []).slice(0, 5) };
}
