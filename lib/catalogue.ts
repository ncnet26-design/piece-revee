// Import relatif avec extension : ce fichier sert aussi au robot (node --experimental-strip-types).
import { decodeEntites } from "../workers/ia/src/produit.ts";
/**
 * Catalogue de produits collecté automatiquement par le robot (scripts/robot-catalogue.ts) :
 * classement par famille, normalisation du texte et recherche par ressemblance de description.
 * Module sans dépendance (utilisé par le robot sous Node et par le site).
 */
export const FAMILLES = {
  canape: "Canapés", fauteuil: "Fauteuils", chaise: "Chaises et tabourets", "table-basse": "Tables basses et d'appoint",
  "table-manger": "Tables à manger", rangement: "Rangements", luminaire: "Luminaires", lampadaire: "Lampadaires",
  tapis: "Tapis", lit: "Lits", deco: "Décoration", rideau: "Rideaux et voilages", poignee: "Poignées",
  robinetterie: "Robinetterie", "salle-de-bain": "Salle de bain", peinture: "Peintures", sol: "Sols",
} as const;
export type Famille = keyof typeof FAMILLES;

/** Produit tel qu'enregistré par le robot : uniquement des faits publiés par le vendeur, avec leur date de relevé. */
export interface ProduitCatalogue {
  /** nom */ n: string; /** marque */ b: string | null; /** vendeur */ m: string; /** adresse */ u: string;
  /** prix */ p: number | null; /** devise */ c: string | null; /** disponibilité */ a: string | null; /** relevé le (AAAA-MM-JJ) */ d: string;
  /** zone de vente : France, Europe ou États-Unis */ z?: "FR" | "EU" | "US";
  /** adresse de l'image publiée par l'enseigne (affichée depuis son site, jamais copiée) */ i?: string | null;
}
/** Sélection de la boutique : références d'exception, à tous les prix (voir scripts/selection-boutique.ts). */
/** Maisons qui ne publient pas leurs prix en ligne : gardées sans prix, en haut de gamme. */
export const SANS_PRIX = new Set(["Roche Bobois"]);
/** Enseignes écartées de la boutique : données mal relevées (prix en dollars ou faux), tant que le robot n'est pas corrigé. */
export const ENSEIGNES_ECARTEES = new Set(["GUBI", "Caravane"]);
/** La boutique est pour tout le monde : toutes les enseignes relevées, à tous les prix, sauf données fausses. */
export const enseigneRetenue = (m: string) => !ENSEIGNES_ECARTEES.has(m);

export interface IndexCatalogue { updatedAt: string; total: number; familles: Partial<Record<Famille, number>>; vendeurs: Record<string, number> }

/** Nom lisible d'un produit : entités décodées ; nom vide ou erreur de tableur (« #REF! ») remplacé par le titre tiré de l'adresse. */
export function nomProduit(name: string, url: string): string {
  const n = decodeEntites(name ?? "").replace(/\s+/g, " ").trim();
  if (/[a-zà-ÿ]{3,}/i.test(n) && !/^#(ref|n\/a|value|name)!?/i.test(n)) return n;
  try {
    const seg = new URL(url).pathname.split("/").filter(Boolean).map((x) => decodeURIComponent(x).replace(/\.(html?|php|aspx)$/i, "")).filter((x) => /[a-z]{3,}-[a-z]{3,}/i.test(x)).pop() ?? "";
    const t = seg.replace(/[-_]+/g, " ").split(" ").filter((w) => !/^(p|prod|produit|product|ref\w*|sku)$/i.test(w) && !/^[a-z]?\d{4,}$/i.test(w)).join(" ").trim();
    return t ? t.charAt(0).toUpperCase() + t.slice(1, 140) : n;
  } catch { return n; }
}

export const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, " ").trim();

// L'ordre compte : les familles les plus précises d'abord.
const RULES: Array<[Famille, RegExp]> = [
  ["robinetterie", /\b(robinet|mitigeur|colonne de douche|faucet)\b/],
  ["salle-de-bain", /\b(vasque|lavabo|meuble sous vasque|meuble de salle de bain)\b/],
  ["poignee", /\b(poignee|bouton de meuble|bouton de porte)\b/],
  // Peinture : seulement les produits à appliquer (pot avec contenance, lasure, sous-couche, peinture murale…), pas les tableaux ni les meubles vernis.
  ["peinture", /\b(lasure|sous couche|peinture (murale|mur|murs|plafond|boiseries?|bois|sol|facade|radiateur|carrelage|meubles?|multi ?supports?|interieure|exterieure|de renovation|a la chaux|chaux)|(peinture|vernis)\b.*\b(\d+([.,]\d+)? ?(l|litres?|ml)|\d+l\d+))\b|^ peinture (?!a l huile|.*\btube\b)/],
  ["sol", /\b(parquet|carrelage|carreau|stratifie|sol vinyle|moquette|tomette|dalle)\b/],
  ["rideau", /\b(rideau|rideaux|voilage|store|curtains?|drapes?|curtain panel)\b/],
  // Bougeoirs et photophores : de la décoration, même rangés dans le rayon « luminaires » d'une enseigne.
  ["deco", /\b(bougeoirs?|photophores?|bougies?|candle holders?)\b/],
  ["lampadaire", /\b(lampadaire|floor lamps?)\b/],
  ["luminaire", /\b(suspension|applique|lustre|lampe|plafonnier|baladeuse|liseuse|pendant|sconce|chandelier|table lamp|lamps?|flush mount)\b/],
  ["tapis", /\b(tapis|rugs?)\b/],
  ["table-basse", /\b(table basse|tables basses|bout de canape|table d appoint|gueridon|coffee tables?|side tables?|end tables?|accent tables?)\b/],
  ["table-manger", /\b(table a manger|table de salle a manger|table extensible|dining tables?|table de repas)\b/],
  ["canape", /\b(canape|sofas?|banquette|meridienne|sectionals?|loveseats?)\b/],
  ["fauteuil", /\b(fauteuil|bergere|armchairs?|chauffeuse|accent chairs?|lounge chairs?)\b/],
  ["chaise", /\b(chaise|chaises|tabouret|stools?|chairs?)\b/],
  ["lit", /\b(lit|tete de lit|sommier|beds?|headboards?)\b/],
  ["rangement", /\b(buffet|commode|etagere|bibliotheque|armoire|meuble tv|console|enfilade|vaisselier|caisson|chiffonnier|vitrine|desserte|dressers?|sideboards?|credenzas?|bookcases?|bookshelf|shelves|cabinets?|nightstands?|media console)\b/],
  ["deco", /\b(vase|coussin|housse de coussin|plaid|miroir|cadre|affiche|bougeoir|bougie|plante|cache pot|pot|jardiniere|corbeille|panier|plateau|sculpture|horloge|nappe|bol|carafe|photophore|statue|objet|pillows?|throws?|vases?|mirrors?|planters?|candles?|candleholders?|trays?|baskets?|bowls?)\b/],
];
/** Accessoires et consommables : pas des pièces qu'on choisit pour composer une pièce. */
const ACCESSOIRE = /\b(anneaux?|tringles?|embouts?|supports?|fixations?|crochets?|visserie|vis|chevilles?|kit|kits|recharges?|ampoules?|piles?|cables?|rallonge|housse de protection|pieds? de rechange|patins?|joints?|adaptateur|entretoise|equerres?|rail|rails|glissiere|charniere|serre cable|echantillon|nuancier|testeur|lot de \d+ (anneaux|crochets))\b/;
/** Outils et fournitures (rouleaux, pinceaux, disques, toiles à peindre…) : ce ne sont pas des produits de décoration. */
const OUTIL = /\b(manchons?|rouleaux? (a|de|pour) peinture|pinceaux?|brosses? (a|de) peinture|disques?|meuleuse|ponceuse|abrasif|toiles? (a|de) peindre|toiles? de peinture|bac a peinture|additifs?|acetone|nettoyants?|diluants?|white spirit|traceur|spatules?|couteaux? a enduire|ruban de masquage|baches?|grattoirs?|decapants?|chevalet)\b/;
export const estAccessoire = (name: string) => { const t = ` ${norm(name)} `; return ACCESSOIRE.test(t) || OUTIL.test(t); };

/** Le site ne traite plus l'extérieur : jardin, terrasse, balcon, piscine, façade… sont écartés du catalogue. */
const EXTERIEUR = / (jardin|jardins|exterieur|exterieure|exterieurs|exterieures|outdoor|outdoors|parasol|parasols|transat|transats|bain de soleil|bains de soleil|garden|patio|terrasse|terrasses|balcon|balcons|barbecue|barbecues|plancha|hamac|hamacs|pergola|pergolas|tonnelle|tonnelles|piscine|piscines|potager|arrosoir|tondeuse|resine tressee|facade|facades) /;
export const estExterieur = (name: string) => EXTERIEUR.test(` ${norm(name)} `);

export function famille(name: string): Famille | null {
  const t = ` ${norm(name)} `;
  if (ACCESSOIRE.test(t) || OUTIL.test(t) || EXTERIEUR.test(t)) return null;
  for (const [f, re] of RULES) if (re.test(t)) return f;
  return null;
}

const STOP = new Set(["de", "du", "des", "la", "le", "les", "en", "et", "a", "au", "aux", "avec", "pour", "un", "une", "cm", "x", "l", "d", "sur"]);
export const tokens = (s: string) => norm(s).split(" ").filter((w) => w.length > 1 && !STOP.has(w));

/** Matières : un produit d'une autre matière n'est pas « ressemblant » (une table en acacia ne remplace pas une table en travertin). */
const MATIERES: Record<string, string[]> = {
  travertin: ["travertin", "travertine"], marbre: ["marbre", "marble"], pierre: ["pierre", "stone", "travertin", "marbre"], bois: ["bois", "wood", "chene", "noyer", "oak", "walnut", "teck", "acacia", "frene", "hetre"],
  chene: ["chene", "oak"], noyer: ["noyer", "walnut"], boucle: ["boucle", "bouclette", "boucle"], velours: ["velours", "velvet"], lin: ["lin", "linen"],
  laiton: ["laiton", "brass", "dore"], verre: ["verre", "glass"], ceramique: ["ceramique", "ceramic", "gres", "stoneware", "terre"], gres: ["gres", "stoneware", "ceramique"],
  cuir: ["cuir", "leather"], rotin: ["rotin", "rattan", "cannage", "osier"], laine: ["laine", "wool"], metal: ["metal", "acier", "fer", "steel"], beton: ["beton", "concrete"],
};
/** Classement par ressemblance de description (mots communs, matière exigée si elle est demandée), puis prix relevé. */
export function chercher(list: ProduitCatalogue[], query: string, n = 6): Array<ProduitCatalogue & { score: number }> {
  const q = [...new Set(tokens(query))];
  if (!q.length) return [];
  const mats = q.filter((w) => w in MATIERES);
  return list.map((p) => {
    const t = new Set(tokens(`${p.n} ${p.b ?? ""}`));
    const has = (w: string) => t.has(w) || [...t].some((x) => x.length > 4 && (x.startsWith(w) || w.startsWith(x)));
    const hits = q.filter(has);
    let score = Math.round((100 * hits.length) / q.length);
    if (mats.length && !mats.some((m) => MATIERES[m]!.some(has))) score = Math.round(score * 0.4);
    return { ...p, score };
  }).filter((p) => p.score >= 34).sort((a, b) => b.score - a.score || (a.p ?? 1e9) - (b.p ?? 1e9)).slice(0, n);
}

/** Famille du catalogue correspondant à un élément repéré dans l'image. */
export function familleDe(type: string, label = ""): Famille | null {
  if (type in FAMILLES) return type as Famille;
  return famille(`${type} ${label}`);
}

/** Ordre « sélection » : familles et enseignes alternées, stable d'un jour à l'autre (pas de classement payé). */
export function selection<T extends ProduitCatalogue & { f?: string }>(list: T[]): T[] {
  const h = (s: string) => { let x = 2166136261; for (let i = 0; i < s.length; i++) x = Math.imul(x ^ s.charCodeAt(i), 16777619); return x >>> 0; };
  const groups = new Map<string, T[]>();
  for (const p of list) { const k = `${p.f ?? ""}|${p.m}`; (groups.get(k) ?? groups.set(k, []).get(k)!).push(p); }
  const gs = [...groups.values()].map((g) => g.sort((a, b) => Number(b.p !== null) - Number(a.p !== null) || h(a.u) - h(b.u))).sort((a, b) => h(a[0]!.u) - h(b[0]!.u));
  const out: T[] = [];
  for (let i = 0; out.length < list.length; i++) for (const g of gs) if (g[i]) out.push(g[i]!);
  return out;
}
