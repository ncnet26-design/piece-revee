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
}
export interface IndexCatalogue { updatedAt: string; total: number; familles: Partial<Record<Famille, number>>; vendeurs: Record<string, number> }

export const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, " ").trim();

// L'ordre compte : les familles les plus précises d'abord.
const RULES: Array<[Famille, RegExp]> = [
  ["robinetterie", /\b(robinet|mitigeur|colonne de douche|faucet)\b/],
  ["salle-de-bain", /\b(vasque|lavabo|meuble sous vasque|meuble de salle de bain)\b/],
  ["poignee", /\b(poignee|bouton de meuble|bouton de porte)\b/],
  ["peinture", /\b(peinture|lasure|vernis)\b/],
  ["sol", /\b(parquet|carrelage|carreau|stratifie|sol vinyle|moquette|tomette|dalle)\b/],
  ["rideau", /\b(rideau|rideaux|voilage|store|curtains?|drapes?|curtain panel)\b/],
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
export function famille(name: string): Famille | null {
  const t = ` ${norm(name)} `;
  for (const [f, re] of RULES) if (re.test(t)) return f;
  return null;
}

const STOP = new Set(["de", "du", "des", "la", "le", "les", "en", "et", "a", "au", "aux", "avec", "pour", "un", "une", "cm", "x", "l", "d", "sur"]);
export const tokens = (s: string) => norm(s).split(" ").filter((w) => w.length > 1 && !STOP.has(w));

/** Classement par ressemblance de description (mots communs, mots rares valant plus), puis prix relevé. */
export function chercher(list: ProduitCatalogue[], query: string, n = 6): Array<ProduitCatalogue & { score: number }> {
  const q = [...new Set(tokens(query))];
  if (!q.length) return [];
  return list.map((p) => {
    const t = new Set(tokens(`${p.n} ${p.b ?? ""}`));
    const hits = q.filter((w) => t.has(w) || [...t].some((x) => x.length > 4 && (x.startsWith(w) || w.startsWith(x))));
    return { ...p, score: Math.round((100 * hits.length) / q.length) };
  }).filter((p) => p.score >= 34).sort((a, b) => b.score - a.score || (a.p ?? 1e9) - (b.p ?? 1e9)).slice(0, n);
}

/** Famille du catalogue correspondant à un élément repéré dans l'image. */
export function familleDe(type: string, label = ""): Famille | null {
  if (type in FAMILLES) return type as Famille;
  return famille(`${type} ${label}`);
}
