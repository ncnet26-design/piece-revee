/**
 * Robot catalogue : construit et met à jour automatiquement une grande base de produits réels (meubles, luminaires, déco, sols, peintures).
 *
 * Fonctionnement, poli et transparent :
 *  - lit le fichier robots.txt de chaque enseigne et ne visite jamais une adresse interdite ; respecte le délai demandé (2 s au minimum) ;
 *  - découvre les pages produits par les plans de site (sitemaps) publiés par l'enseigne ;
 *  - ne garde que les faits publiés par le vendeur dans sa page (schema.org Product : nom, marque, prix, disponibilité), avec la date du relevé ;
 *  - ne copie aucune photo ni aucun texte descriptif ; s'identifie comme « PieceReveeBot ».
 * Chaque passage visite de nouvelles pages et revérifie les plus anciennes (prix, disponibilité, lien encore valide).
 *
 * Sorties :
 *  - public/catalogue/<famille>.json : produits par famille (lus par le site) ; public/catalogue/index.json : compteurs ;
 *  - content/data/catalogue-etat.json : adresses connues, dernier passage, rapport par enseigne.
 * Usage : node --experimental-strip-types scripts/robot-catalogue.ts [--pages 150] [--minutes 40] [--enseignes ikea,laredoute]
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { gunzipSync } from "node:zlib";
import { parseProduct } from "../workers/ia/src/produit.ts";
import { famille, FAMILLES, type Famille, type IndexCatalogue, type ProduitCatalogue } from "../lib/catalogue.ts";

const UA = "Mozilla/5.0 (compatible; PieceReveeBot/1.0; +https://odd-bar-c583.ewanesteves26.workers.dev/legal/)";
const arg = (k: string, d: string) => { const i = process.argv.indexOf(`--${k}`); return i > 0 ? process.argv[i + 1]! : d; };
const PAGES = Number(arg("pages", "150")), MINUTES = Number(arg("minutes", "40")), ONLY = arg("enseignes", "").split(",").filter(Boolean);
const END = Date.now() + MINUTES * 60_000;
/** Adresses suivies au plus par enseigne (le fichier d'état reste raisonnable). */
const MAX_URLS = 4000;

/** Enseignes suivies : maison, déco, bricolage. Le robot découvre lui-même leurs plans de site. */
const ENSEIGNES: Array<{ id: string; nom: string; site: string; produit?: RegExp }> = [
  { id: "ikea", nom: "IKEA", site: "https://www.ikea.com", produit: /\/fr\/fr\/p\// },
  { id: "maisonsdumonde", nom: "Maisons du Monde", site: "https://www.maisonsdumonde.com", produit: /\/FR\/fr\/p\// },
  { id: "laredoute", nom: "La Redoute", site: "https://www.laredoute.fr", produit: /\/ppdp\/prod-/ },
  { id: "conforama", nom: "Conforama", site: "https://www.conforama.fr" },
  { id: "but", nom: "BUT", site: "https://www.but.fr" },
  { id: "westwing", nom: "Westwing", site: "https://www.westwing.fr" },
  { id: "kavehome", nom: "Kave Home", site: "https://kavehome.com", produit: /\/fr\// },
  { id: "sklum", nom: "Sklum", site: "https://www.sklum.com", produit: /\/fr\// },
  { id: "habitat", nom: "Habitat", site: "https://www.habitat.fr" },
  { id: "alinea", nom: "Alinéa", site: "https://www.alinea.com" },
  { id: "madeindesign", nom: "Made in Design", site: "https://www.madeindesign.com" },
  { id: "leroymerlin", nom: "Leroy Merlin", site: "https://www.leroymerlin.fr" },
  { id: "castorama", nom: "Castorama", site: "https://www.castorama.fr" },
  { id: "manomano", nom: "ManoMano", site: "https://www.manomano.fr" },
  { id: "selency", nom: "Selency", site: "https://www.selency.fr" },
  { id: "amazon", nom: "Amazon", site: "https://www.amazon.fr" },
];
/** Mots qui signalent un article de maison dans l'adresse d'une page (pour ne pas parcourir tout un catalogue généraliste). */
const MAISON = /canape|sofa|fauteuil|chaise|tabouret|table|buffet|commode|etagere|bibliotheque|armoire|console|enfilade|lit-|tete-de-lit|lampe|luminaire|suspension|applique|lampadaire|lustre|tapis|coussin|plaid|rideau|voilage|vase|miroir|cadre|bougeoir|jardiniere|cache-pot|pouf|banc|meuble|peinture|parquet|carrelage|robinet|mitigeur|vasque|poignee|decoration|deco/i;

interface Etat { maj: string; enseignes: Record<string, { robots: "ok" | "interdit" | "injoignable"; delai: number; sitemaps: number; urls: Record<string, string>; rapport: string }> }
const ETAT_F = "content/data/catalogue-etat.json";
const etat: Etat = existsSync(ETAT_F) ? JSON.parse(readFileSync(ETAT_F, "utf8")) : { maj: "", enseignes: {} };
const CAT_DIR = "public/catalogue";
mkdirSync(CAT_DIR, { recursive: true });
const catalogue = new Map<string, ProduitCatalogue & { f: Famille }>();
for (const f of Object.keys(FAMILLES) as Famille[]) {
  const file = `${CAT_DIR}/${f}.json`;
  if (existsSync(file)) for (const p of JSON.parse(readFileSync(file, "utf8")) as ProduitCatalogue[]) catalogue.set(p.u, { ...p, f });
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
async function get(url: string, timeout = 20_000): Promise<{ status: number; body: string } | null> {
  try {
    const r = await fetch(url, { headers: { "user-agent": UA, accept: "text/html,application/xml;q=0.9,*/*;q=0.8", "accept-language": "fr-FR,fr;q=0.9" }, redirect: "follow", signal: AbortSignal.timeout(timeout) });
    const buf = Buffer.from(await r.arrayBuffer());
    const body = url.endsWith(".gz") || buf[0] === 0x1f ? gunzipSync(buf).toString("utf8") : buf.toString("utf8");
    return { status: r.status, body };
  } catch { return null; }
}

/** Règles robots.txt applicables à notre robot (groupe « PieceReveeBot » s'il existe, sinon « * »). */
export function robots(txt: string) {
  const groups: Array<{ agents: string[]; rules: Array<[boolean, string]>; delay: number | null }> = [];
  let cur: (typeof groups)[number] | null = null, lastWasAgent = false;
  const sitemaps: string[] = [];
  for (const raw of txt.split(/\r?\n/)) {
    const line = raw.replace(/#.*/, "").trim(); if (!line) continue;
    const [k, ...v] = line.split(":"); const key = k!.trim().toLowerCase(), val = v.join(":").trim();
    if (key === "sitemap") { sitemaps.push(val); continue; }
    if (key === "user-agent") { if (!cur || !lastWasAgent) { cur = { agents: [], rules: [], delay: null }; groups.push(cur); } cur.agents.push(val.toLowerCase()); lastWasAgent = true; continue; }
    lastWasAgent = false;
    if (!cur) continue;
    if (key === "disallow" && val) cur.rules.push([false, val]);
    if (key === "allow" && val) cur.rules.push([true, val]);
    if (key === "crawl-delay") cur.delay = Number(val) || null;
  }
  const g = groups.find((x) => x.agents.some((a) => a.includes("piecereveebot"))) ?? groups.find((x) => x.agents.includes("*"));
  const toRe = (p: string) => new RegExp(`^${p.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*").replace(/\\\$$/, "$")}`);
  const allowed = (path: string) => {
    let best: [boolean, number] = [true, -1];
    for (const [ok, p] of g?.rules ?? []) if (toRe(p).test(path) && p.length > best[1]) best = [ok, p.length];
    return best[0];
  };
  return { allowed, delay: g?.delay ?? null, sitemaps, everything: !allowed("/") && !(g?.rules ?? []).some(([ok]) => ok) };
}

/** Adresses de pages produits trouvées dans les plans de site (index de plans parcourus en priorité sur les produits). */
async function sitemapUrls(start: string[], allowed: (p: string) => boolean, max = 20_000): Promise<{ urls: string[]; maps: number }> {
  const queue = [...start], out = new Set<string>(); let maps = 0;
  while (queue.length && maps < 40 && out.size < max && Date.now() < END) {
    const sm = queue.shift()!; maps++;
    const r = await get(sm, 40_000); if (!r || r.status >= 400) continue;
    const locs = [...r.body.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)].map((m) => m[1]!.replace(/&amp;/g, "&"));
    if (/<sitemapindex/i.test(r.body)) {
      const ranked = locs.sort((a, b) => Number(/produ|product|pdp|article|item/i.test(b)) - Number(/produ|product|pdp|article|item/i.test(a)));
      queue.push(...ranked.slice(0, 60));
    } else for (const u of locs) { try { if (allowed(new URL(u).pathname)) out.add(u); } catch { /* */ } }
    await sleep(1000);
  }
  return { urls: [...out], maps };
}

async function enseigne(e: (typeof ENSEIGNES)[number]) {
  const st = (etat.enseignes[e.id] ??= { robots: "ok", delai: 2, sitemaps: 0, urls: {}, rapport: "" });
  const rb = await get(`${e.site}/robots.txt`);
  if (!rb || rb.status >= 500) { st.robots = "injoignable"; st.rapport = "robots.txt injoignable : enseigne ignorée ce soir."; return; }
  const R = rb.status === 200 ? robots(rb.body) : { allowed: () => true, delay: null, sitemaps: [], everything: false };
  if (R.everything) { st.robots = "interdit"; st.rapport = "robots.txt interdit l'exploration : enseigne ignorée."; return; }
  st.robots = "ok"; st.delai = Math.max(2, Math.min(15, R.delay ?? 2));
  const start = R.sitemaps.length ? R.sitemaps : [`${e.site}/sitemap.xml`];
  // Découverte des nouvelles adresses (au plus une fois par semaine par enseigne).
  const known = Object.keys(st.urls).length, stale = !st.sitemaps || Date.now() - Date.parse(etat.maj || "2000-01-01") > 6 * 86400_000 || known < 50;
  if (stale) {
    const { urls, maps } = await sitemapUrls(start, R.allowed);
    st.sitemaps = maps;
    for (const u of urls) {
      if (Object.keys(st.urls).length >= MAX_URLS) break;
      if ((!e.produit || e.produit.test(u)) && MAISON.test(u) && !(u in st.urls)) st.urls[u] = "";
    }
  }
  // Pages à visiter : jamais vues d'abord, puis les plus anciennes.
  const todo = Object.entries(st.urls).sort((a, b) => (a[1] || "").localeCompare(b[1] || "")).slice(0, PAGES).map(([u]) => u);
  let vus = 0, gardes = 0, retires = 0;
  for (const u of todo) {
    if (Date.now() > END) break;
    try { if (!R.allowed(new URL(u).pathname)) { delete st.urls[u]; continue; } } catch { continue; }
    const r = await get(u); vus++;
    const today = new Date().toISOString().slice(0, 10);
    if (!r || r.status === 404 || r.status === 410) { delete st.urls[u]; if (catalogue.delete(u)) retires++; await sleep(st.delai * 1000); continue; }
    st.urls[u] = today;
    const d = r.status < 400 ? parseProduct(r.body) : null;
    const f = d ? famille(`${d.name} ${u}`) : null;
    if (d && f && d.name) {
      catalogue.set(u, { n: d.name, b: d.brand, m: e.nom, u, p: d.price, c: d.price ? d.currency ?? "EUR" : null, a: d.availability, d: today, f });
      gardes++;
    } else if (catalogue.delete(u)) retires++;
    await sleep(st.delai * 1000);
  }
  st.rapport = `${Object.keys(st.urls).length} pages produits connues ; ${vus} visitées ce soir ; ${gardes} produits relevés ; ${retires} retirés.`;
}

if (process.argv[1]?.endsWith("robot-catalogue.ts")) await main();

async function main() {
// Enseignes en parallèle (chacune respecte son propre délai).
await Promise.all(ENSEIGNES.filter((e) => !ONLY.length || ONLY.includes(e.id)).map((e) => enseigne(e).catch((err) => { (etat.enseignes[e.id] ??= { robots: "injoignable", delai: 2, sitemaps: 0, urls: {}, rapport: "" }).rapport = `Erreur : ${String(err).slice(0, 200)}`; })));

etat.maj = new Date().toISOString();
writeFileSync(ETAT_F, `${JSON.stringify(etat)}\n`);
const index: IndexCatalogue = { updatedAt: etat.maj, total: catalogue.size, familles: {}, vendeurs: {} };
for (const f of Object.keys(FAMILLES) as Famille[]) {
  const list = [...catalogue.values()].filter((p) => p.f === f).map((p) => ({ n: p.n, b: p.b, m: p.m, u: p.u, p: p.p, c: p.c, a: p.a, d: p.d })).sort((a, b) => a.n.localeCompare(b.n));
  writeFileSync(`${CAT_DIR}/${f}.json`, JSON.stringify(list));
  if (list.length) index.familles[f] = list.length;
}
for (const p of catalogue.values()) index.vendeurs[p.m] = (index.vendeurs[p.m] ?? 0) + 1;
writeFileSync(`${CAT_DIR}/index.json`, `${JSON.stringify(index, null, 1)}\n`);
console.log(`Catalogue : ${index.total} produits.`);
for (const [id, s] of Object.entries(etat.enseignes)) console.log(`${id} [${s.robots}] ${s.rapport}`);
}
