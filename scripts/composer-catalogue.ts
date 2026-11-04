/**
 * Compose data/catalogue.json : une sélection de produits réels (relevés par le robot sur les pages des enseignes),
 * répartie entre les 8 styles, les pièces principales et les 3 gammes de prix.
 * Rien n'est inventé : matière, couleur et dimensions ne sont remplies que si le nom publié les mentionne ;
 * les styles sont déduits des matières et des formes (marqués « styles_deduits »).
 * Ensuite, le robot de vérification (scripts/verifier-catalogue.ts, GitHub Actions) ouvre chaque page et met à jour prix et date.
 * Usage : npx tsx scripts/composer-catalogue.ts
 */
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { estAccessoire, FAMILLES, famille as familleDe, nomProduit, norm, type Famille, type ProduitCatalogue } from "../lib/catalogue";

export const STYLES = ["japandi", "scandinave", "industriel", "haussmannien", "mid-century", "wabi-sabi", "boheme", "contemporain"] as const;
export type Style = (typeof STYLES)[number];
export const PIECES = ["salon", "chambre", "salle-a-manger", "salle-de-bain"] as const;
export type Piece = (typeof PIECES)[number];
export type Gamme = "petit" | "moyen" | "haut";

/** Indices de style dans le nom du produit (matières et formes typiques, d'après signatures-styles). */
const STYLE_RE: Record<Style, RegExp> = {
  japandi: /\b(japandi|japonais|chene clair|frene|bambou|papier|washi|futon|tatami|lin|gres|ceramique)\b/,
  scandinave: /\b(scandinave|nordique|bouleau|pin|hetre|peau de mouton|laine|spindle)\b/,
  industriel: /\b(industriel|industrielle|loft|metal|acier|fer|cuir|beton|brique|atelier|noir mat)\b/,
  haussmannien: /\b(haussmann\w*|moulure\w*|marbre|dore|doree|laiton|velours|miroir|cheminee|classique|louis|medaillon|capitonne)\b/,
  "mid-century": /\b(mid ?century|vintage|noyer|teck|annees ?(50|60|70)|compas|moutarde|olive|terrazzo|retro)\b/,
  "wabi-sabi": /\b(wabi|chaux|argile|brut|brute|terre|artisanal|artisanale|fait main|lin lave|froisse|bois flotte|gres)\b/,
  boheme: /\b(boheme|rotin|osier|cannage|jute|kilim|berbere|macrame|ethnique|tresse|tressee|franges|terracotta|seagrass|jonc)\b/,
  contemporain: /\b(contemporain\w*|travertin|bouclette|boucle|courbe|arrondi|sculptural|ovale|organique|marbre)\b/,
};
/** Hors sujet pour un catalogue de décoration : animaux, enfants, lots, petits accessoires et consommables. */
const EXCLU = /\b(chien|chat|animal|animaux|enfant|enfants|bebe|kids?|lot de \d+|lot \d+|affiches?|posters?|serviteur|colonne de douche|porte savon|distributeur|abattant|flexible|pommeau|douchette|tapis de bain|recharge|housse de couette|drap housse|oreiller|matelas)\b/;
/** Pièces par famille. */
const PIECES_DE: Partial<Record<Famille, Piece[]>> = {
  canape: ["salon"], fauteuil: ["salon", "chambre"], "table-basse": ["salon"], tapis: ["salon", "chambre"], lampadaire: ["salon"],
  luminaire: ["salon", "chambre", "salle-a-manger"], rideau: ["salon", "chambre"], deco: ["salon", "chambre"], rangement: ["salon", "chambre", "salle-a-manger"],
  lit: ["chambre"], "table-manger": ["salle-a-manger"], chaise: ["salle-a-manger"], "salle-de-bain": ["salle-de-bain"], robinetterie: ["salle-de-bain"],
};
const MATIERES: Array<[string, RegExp]> = [
  ["chêne", /\bchene\b/], ["noyer", /\bnoyer\b/], ["teck", /\bteck\b/], ["bouleau", /\bbouleau\b/], ["pin", /\bpin\b/], ["frêne", /\bfrene\b/], ["bambou", /\bbambou\b/],
  ["travertin", /\btravertin\b/], ["marbre", /\bmarbre\b/], ["terrazzo", /\bterrazzo\b/], ["béton", /\bbeton\b/], ["pierre", /\bpierre\b/],
  ["laiton", /\blaiton\b/], ["métal", /\b(metal|acier|fer)\b/], ["verre", /\bverre\b/], ["céramique", /\b(ceramique|gres|faience)\b/], ["terre cuite", /\bterre cuite\b/],
  ["lin", /\blin\b/], ["coton", /\bcoton\b/], ["velours", /\bvelours\b/], ["bouclette", /\b(bouclette|boucle)\b/], ["laine", /\blaine\b/], ["cuir", /\bcuir\b/],
  ["rotin", /\brotin\b/], ["osier", /\bosier\b/], ["cannage", /\bcannage\b/], ["jute", /\bjute\b/], ["papier", /\bpapier\b/],
];
const COULEURS: Array<[string, RegExp]> = [
  ["blanc", /\bblanc\w*\b/], ["écru", /\becru\b/], ["beige", /\bbeige\b/], ["sable", /\bsable\b/], ["naturel", /\bnaturel\w*\b/], ["gris", /\bgris\w*\b/], ["noir", /\bnoir\w*\b/],
  ["vert", /\bvert\w*\b/], ["bleu", /\bbleu\w*\b/], ["terracotta", /\bterracotta\b/], ["rouille", /\brouille\b/], ["moutarde", /\bmoutarde\b/], ["rose", /\brose\b/],
  ["marron", /\b(marron|brun|chocolat)\b/], ["doré", /\bdore\w*\b/],
];
/** Dimensions seulement si le nom publié les donne (« 130x65 cm », « 200 x 90 x 45 cm », « Ø 80 cm »). */
export function dimensionsDuNom(nom: string): string | null {
  const t = nom.replace(/,/g, ".");
  const m = /(\d{2,3}(?:\.\d)?)\s?[x×]\s?(\d{2,3}(?:\.\d)?)(?:\s?[x×]\s?(\d{2,3}(?:\.\d)?))?\s?cm/i.exec(t);
  if (m) return `${m[1]} × ${m[2]}${m[3] ? ` × ${m[3]}` : ""} cm`;
  const d = /(?:Ø|diam(?:\.|ètre)?)\s?(\d{2,3})\s?cm/i.exec(t);
  return d ? `Ø ${d[1]} cm` : null;
}

/** Matières de la matériauthèque (libellés du champ « matiere »). */
export const MATIERES_CLES = ["chêne", "noyer", "travertin", "marbre", "terrazzo", "béton", "lin", "bouclette", "velours", "cuir", "rotin", "céramique", "terre cuite", "pierre"];

export interface ProduitAchetable {
  id: string; nom: string; enseigne: string; marque: string | null; prix: number; devise: string; gamme: Gamme;
  styles: Style[]; styles_deduits: true; piece: Piece[]; famille: Famille; dimensions: string | null; matiere: string[]; couleur: string[];
  url: string; verifie_le: string; disponibilite: string | null; affiliate_url: string;
}

function charger(): Array<ProduitCatalogue & { f: Famille }> {
  const out: Array<ProduitCatalogue & { f: Famille }> = [];
  for (const f of Object.keys(FAMILLES) as Famille[]) {
    const p = `public/catalogue/${f}.json`; if (!existsSync(p)) continue;
    for (const x of JSON.parse(readFileSync(p, "utf8")) as ProduitCatalogue[]) out.push({ ...x, n: nomProduit(x.n, x.u), f });
  }
  return out;
}

/** Gamme par famille : tiers des prix observés (petit < 1er tiers ≤ moyen < 2e tiers ≤ haut). */
function seuils(l: Array<ProduitCatalogue & { f: Famille }>) {
  const s: Partial<Record<Famille, [number, number]>> = {};
  for (const f of Object.keys(FAMILLES) as Famille[]) {
    const p = l.filter((x) => x.f === f && x.p && (x.c ?? "EUR") === "EUR").map((x) => x.p!).sort((a, b) => a - b);
    if (p.length >= 9) s[f] = [p[Math.floor(p.length / 3)]!, p[Math.floor((2 * p.length) / 3)]!];
  }
  return s;
}

export function composer(parCase = 2) {
  const tous = charger();
  const S = seuils(tous);
  const candidats: ProduitAchetable[] = [];
  for (const x of tous) {
    if (!x.p || (x.c ?? "EUR") !== "EUR" || (x.z ?? "FR") === "US" || estAccessoire(x.n) || x.a === "OutOfStock") continue;
    if (familleDe(`${x.n} ${x.u}`) !== x.f) continue; // classement confirmé par le nom
    const pieces = PIECES_DE[x.f]; const sx = S[x.f];
    if (!pieces || !sx) continue;
    // « aspect lin », « effet marbre », « imitation cuir », « look béton » : ce n'est pas la matière.
    const t = ` ${norm(x.n)} `.replace(/\b(aspect|effet|imitation|facon|look|type|style)\s+\w+((\s(de|du|d|et|ou))+\s\w+)*/g, " ");
    // Imitations (« effet chêne », « aspect lin », « imitation marbre ») : écartées, la matière annoncée n'est pas la vraie.
    if (/\b(aspect|effet|imitation|facon|look|simili)\b/.test(` ${norm(x.n)} `)) continue;
    if (EXCLU.test(t) || x.p < (x.f === "deco" ? 20 : 30)) continue;
    // Styles : ceux qui ont le plus d'indices dans le nom (deux au plus) ; un nom de style explicite compte triple.
    const sc = STYLES.map((s) => [s, (t.match(new RegExp(STYLE_RE[s].source, "g")) ?? []).length + (new RegExp(`\\b${s.replace("-", " ?")}`).test(t) ? 2 : 0)] as const).filter(([, n]) => n > 0);
    const top = Math.max(0, ...sc.map(([, n]) => n));
    const styles = sc.filter(([, n]) => n === top).map(([s]) => s).slice(0, 2);
    if (!styles.length) continue;
    const gamme: Gamme = x.p < sx[0] ? "petit" : x.p < sx[1] ? "moyen" : "haut";
    candidats.push({
      id: createHash("sha1").update(x.u).digest("hex").slice(0, 12), nom: x.n, enseigne: x.m, marque: x.b && x.b !== x.m ? x.b : null,
      prix: x.p, devise: "EUR", gamme, styles, styles_deduits: true, piece: pieces, famille: x.f, dimensions: dimensionsDuNom(x.n),
      matiere: MATIERES.filter(([, re]) => re.test(t)).map(([m]) => m), couleur: COULEURS.filter(([, re]) => re.test(t)).map(([c]) => c),
      url: x.u, verifie_le: x.d, disponibilite: x.a ?? null, affiliate_url: "",
    });
  }
  // Répartition : pour chaque style × pièce × gamme, quelques produits, en variant familles et enseignes ; un produit n'est pris qu'une fois.
  const pris = new Map<string, ProduitAchetable>(), parEnseigne = new Map<string, number>();
  const score = (p: ProduitAchetable) => (p.matiere.length ? 2 : 0) + (p.dimensions ? 1 : 0) + (p.couleur.length ? 0.5 : 0) - (parEnseigne.get(p.enseigne) ?? 0) * 0.35;
  for (const s of STYLES) for (const pc of PIECES) for (const g of ["petit", "moyen", "haut"] as Gamme[]) {
    const familles = new Set<Famille>();
    const l = candidats.filter((p) => p.styles.includes(s) && p.piece.includes(pc) && p.gamme === g && !pris.has(p.id));
    for (let k = 0; k < parCase; k++) {
      const best = l.filter((p) => !pris.has(p.id) && !familles.has(p.famille)).sort((a, b) => score(b) - score(a) || a.prix - b.prix)[0];
      if (!best) break;
      pris.set(best.id, best); familles.add(best.famille); parEnseigne.set(best.enseigne, (parEnseigne.get(best.enseigne) ?? 0) + 1);
    }
  }
  // Chaque matière de la matériauthèque : au moins un produit par gamme (petit, moyen, haut de gamme).
  for (const m of MATIERES_CLES) for (const g of ["petit", "moyen", "haut"] as Gamme[]) {
    if ([...pris.values()].some((p) => p.gamme === g && p.matiere.includes(m))) continue;
    const best = candidats.filter((p) => p.gamme === g && p.matiere.includes(m) && !pris.has(p.id)).sort((a, b) => score(b) - score(a) || a.prix - b.prix)[0];
    if (best) { pris.set(best.id, best); parEnseigne.set(best.enseigne, (parEnseigne.get(best.enseigne) ?? 0) + 1); }
  }
  return { produits: [...pris.values()], candidats: candidats.length };
}

if (process.argv[1]?.endsWith("composer-catalogue.ts")) {
  const { produits, candidats } = composer(Number(process.env.PAR_CASE ?? 2));
  mkdirSync("data", { recursive: true });
  writeFileSync("data/catalogue.json", JSON.stringify({ genere_le: new Date().toISOString().slice(0, 10), source: "Robot catalogue (pages des enseignes, schema.org), puis vérification page par page", produits }, null, 1));
  const c = (k: (p: ProduitAchetable) => string[]) => produits.reduce<Record<string, number>>((a, p) => { for (const v of k(p)) a[v] = (a[v] ?? 0) + 1; return a; }, {});
  console.log(`${produits.length} produits retenus sur ${candidats} candidats`);
  console.log("styles", c((p) => p.styles)); console.log("pièces", c((p) => p.piece)); console.log("gammes", c((p) => [p.gamme])); console.log("enseignes", c((p) => [p.enseigne]));
}
