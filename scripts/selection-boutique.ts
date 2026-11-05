/**
 * Sélection de la boutique : à partir de tout ce que le robot relève (public/catalogue), ne garde que des références
 * d'exception, à tous les prix, et écrit public/boutique/<famille>.json + index.json.
 *
 * Règles (aucune donnée inventée, seulement un tri) :
 *  - toutes les enseignes relevées, pour tous les budgets (sauf données mal relevées : voir ENSEIGNES_ECARTEES) ;
 *  - vendus en France ou en Europe, en euros, prix relevé, photo publiée par l'enseigne, pas épuisé ;
 *  - pas de lots, packs, housses, pièces détachées, ni d'imitations (« effet », « aspect »…) ;
 *  - une seule déclinaison par modèle (couleurs et tailles regroupées) ;
 *  - au plus 40 modèles par enseigne et par famille, répartis sur toute la gamme de prix de l'enseigne ;
 *  - gamme (petit, moyen, haut de gamme) calculée par famille sur les tiers de prix de la sélection ;
 *  - exception : Roche Bobois ne publie pas ses prix en ligne ; ses pièces sont gardées en haut de gamme, « prix sur le site ».
 * Lancé à chaque publication du site (prebuild).
 * Usage : node --experimental-strip-types scripts/selection-boutique.ts
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { enseigneRetenue, estAccessoire, FAMILLES, norm, SANS_PRIX, type Famille, type IndexCatalogue, type ProduitCatalogue } from "../lib/catalogue.ts";




const EXCLU = / (lot de|lot|pack|set de \d|kit|housse|housses|recharge|piece detachee|pieces detachees|pied de remplacement|pieds de remplacement|echantillon|nuancier|carte cadeau|effet|aspect|imitation|facon|simili|look) /;
const MAX_PAR_ENSEIGNE = 40;

type Sel = ProduitCatalogue & { g: "petit" | "moyen" | "haut" };
const imageOk = (u?: string | null) => Boolean(u && /^https:\/\//.test(u) && !/no[-_]?image|placeholder|default[-_]image/i.test(u));
/** Clé d'un modèle : enseigne + nom sans les précisions de couleur, taille ou finition (après « - », « , », « | » ou « ( »). */
const modele = (p: ProduitCatalogue) => `${p.m}|${norm(p.n.split(/\s[-–|]\s|,|\(/)[0] ?? p.n).split(" ").slice(0, 6).join(" ")}`;

const dir = "public/catalogue", out = "public/boutique";
if (!existsSync(`${dir}/index.json`)) { console.log("Pas de catalogue relevé : sélection non construite."); process.exit(0); }
const idx = JSON.parse(readFileSync(`${dir}/index.json`, "utf8")) as IndexCatalogue;
mkdirSync(out, { recursive: true });
const familles: IndexCatalogue["familles"] = {}, vendeurs: Record<string, number> = {};
let avant = 0;
for (const f of Object.keys(FAMILLES) as Famille[]) {
  const src = `${dir}/${f}.json`;
  const tous = existsSync(src) ? (JSON.parse(readFileSync(src, "utf8")) as ProduitCatalogue[]) : [];
  avant += tous.length;
  const ok = tous.filter((p) => enseigneRetenue(p.m) && (p.z ?? "FR") !== "US" && (SANS_PRIX.has(p.m) ? p.p === null : (p.c ?? "EUR") === "EUR" && p.p !== null && p.p > 0)
    && imageOk(p.i) && p.a !== "OutOfStock" && !estAccessoire(p.n) && !EXCLU.test(` ${norm(p.n)} `));
  // Une déclinaison par modèle : on garde la moins chère (le client choisit la couleur chez l'enseigne).
  const parModele = new Map<string, ProduitCatalogue>();
  for (const p of ok) { const k = modele(p), d = parModele.get(k); if (!d || (p.p ?? 0) < (d.p ?? 0)) parModele.set(k, p); }
  // Au plus 40 modèles par enseigne, pris à intervalles réguliers sur sa gamme de prix (du plus accessible au plus cher).
  const parEnseigne = new Map<string, ProduitCatalogue[]>();
  for (const p of parModele.values()) (parEnseigne.get(p.m) ?? parEnseigne.set(p.m, []).get(p.m)!).push(p);
  const retenus: ProduitCatalogue[] = [];
  for (const l of parEnseigne.values()) {
    l.sort((a, b) => (a.p ?? 0) - (b.p ?? 0) || a.u.localeCompare(b.u));
    if (l.length <= MAX_PAR_ENSEIGNE) retenus.push(...l);
    else for (let i = 0; i < MAX_PAR_ENSEIGNE; i++) retenus.push(l[Math.round((i * (l.length - 1)) / (MAX_PAR_ENSEIGNE - 1))]!);
  }
  // Gamme par famille : tiers de prix de la sélection.
  const prix = retenus.filter((p) => p.p !== null).map((p) => p.p!).sort((a, b) => a - b);
  const t1 = prix[Math.floor(prix.length / 3)] ?? 0, t2 = prix[Math.floor((2 * prix.length) / 3)] ?? 0;
  const sel: Sel[] = retenus.map((p) => ({ ...p, g: p.p === null ? "haut" : p.p < t1 ? "petit" : p.p < t2 ? "moyen" : "haut" }));
  sel.sort((a, b) => a.n.localeCompare(b.n, "fr"));
  writeFileSync(`${out}/${f}.json`, JSON.stringify(sel));
  familles[f] = sel.length;
  for (const p of sel) vendeurs[p.m] = (vendeurs[p.m] ?? 0) + 1;
}
const total = Object.values(familles).reduce((a, b) => a + (b ?? 0), 0);
writeFileSync(`${out}/index.json`, JSON.stringify({ updatedAt: idx.updatedAt, total, familles, vendeurs }));
console.log(`Sélection de la boutique : ${avant} produits relevés → ${total} retenus, ${Object.keys(vendeurs).length} enseignes`);
