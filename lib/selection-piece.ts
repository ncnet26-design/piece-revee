/**
 * Les vrais meubles de la pièce, choisis AVANT le dessin : pour chaque pièce, les emplacements qu'un architecte d'intérieur
 * meublerait (canapé, table basse, suspension…), et pour chacun le produit de la boutique le plus adapté au style et au budget.
 * L'IA dessine ensuite ces produits-là ; chaque point cliquable mène au produit exact, sans recherche au hasard.
 */
import { chercher, norm, type Famille, type ProduitCatalogue } from "@/lib/catalogue";

export type Gamme = "petit" | "moyen" | "haut";
export interface Emplacement { id: string; famille: Famille; requete: string; role: string; refus?: RegExp }
/** Le nom du produit doit commencer par le type de meuble (un « couvre-lit » n'est pas un lit), et coûter un prix réaliste. */
const TETES: Record<string, { mots: string[]; min: number }> = {
  canape: { mots: ["canape", "sofa"], min: 150 }, "table-basse": { mots: ["table basse", "coffee table"], min: 40 }, fauteuil: { mots: ["fauteuil", "lounge", "armchair"], min: 60 },
  tapis: { mots: ["tapis", "rug"], min: 30 }, suspension: { mots: ["suspension", "pendant", "lustre"], min: 20 }, lit: { mots: ["lit", "bed"], min: 120 },
  chevet: { mots: ["table de chevet", "chevet", "bout de lit"], min: 25 }, lampe: { mots: ["lampe", "lamp", "baladeuse"], min: 15 }, "meuble-vasque": { mots: ["meuble", "ensemble meuble", "plan vasque"], min: 80 },
  mitigeur: { mots: ["mitigeur", "robinet"], min: 20 }, miroir: { mots: ["miroir", "mirror"], min: 20 }, applique: { mots: ["applique", "wall"], min: 15 },
  tabouret: { mots: ["tabouret", "barstool", "bar stool"], min: 30 }, table: { mots: ["table a manger", "table de repas", "table extensible", "table ronde", "table ovale", "table rectangulaire", "table"], min: 100 },
  chaise: { mots: ["chaise", "chair"], min: 30 }, buffet: { mots: ["buffet", "enfilade", "sideboard"], min: 150 }, bureau: { mots: ["bureau", "desk"], min: 80 },
  bibliotheque: { mots: ["bibliotheque", "etagere", "bookcase"], min: 50 }, console: { mots: ["console"], min: 50 }, rangement: { mots: ["coffre", "rangement", "etagere", "meuble"], min: 30 },
};
const bonType = (e: { id: string }, nom: string, prix: number | null) => {
  const t = TETES[e.id]; if (!t) return true;
  const debut = norm(nom).split(" ").slice(0, 5).join(" ");
  return (prix ?? 0) >= t.min && t.mots.some((m) => debut.startsWith(m) || debut.includes(` ${m}`) || debut.split(" ").slice(0, 2).join(" ").includes(m));
};
export interface Choisi { emplacement: Emplacement; produit: ProduitCatalogue }

/** Ce qu'on meuble dans chaque pièce, du plus important au moins important (au plus 5 meubles dessinés). */
export const EMPLACEMENTS: Record<string, Emplacement[]> = {
  salon: [
    { id: "canape", famille: "canape", requete: "canapé 3 places", role: "sofa", refus: /angle|convertible|lit|housse/ },
    { id: "table-basse", famille: "table-basse", requete: "table basse", role: "coffee table", refus: /appoint|chevet|bout/ },
    { id: "fauteuil", famille: "fauteuil", requete: "fauteuil", role: "armchair", refus: /bureau|gaming|enfant|jardin/ },
    { id: "tapis", famille: "tapis", requete: "tapis salon", role: "rug", refus: /bain|enfant|entree|exterieur/ },
    { id: "suspension", famille: "luminaire", requete: "suspension", role: "pendant light", refus: /ampoule|cordon|abat|applique/ },
  ],
  chambre: [
    { id: "lit", famille: "lit", requete: "lit 160", role: "bed", refus: /enfant|bebe|superpose|matelas|sommier|tete de lit/ },
    { id: "chevet", famille: "rangement", requete: "table de chevet", role: "bedside table" },
    { id: "lampe", famille: "luminaire", requete: "lampe a poser", role: "bedside lamp", refus: /ampoule|abat/ },
    { id: "tapis", famille: "tapis", requete: "tapis", role: "rug", refus: /bain|enfant|exterieur/ },
    { id: "fauteuil", famille: "fauteuil", requete: "fauteuil", role: "armchair", refus: /bureau|gaming|jardin/ },
  ],
  "salle-de-bain": [
    { id: "meuble-vasque", famille: "salle-de-bain", requete: "meuble vasque", role: "vanity unit with washbasin" },
    { id: "mitigeur", famille: "robinetterie", requete: "mitigeur lavabo", role: "washbasin mixer tap", refus: /cuisine|douche|bain/ },
    { id: "miroir", famille: "deco", requete: "miroir", role: "wall mirror", refus: /sol|psyche/ },
    { id: "applique", famille: "luminaire", requete: "applique", role: "wall light", refus: /ampoule/ },
  ],
  cuisine: [
    { id: "tabouret", famille: "chaise", requete: "tabouret de bar", role: "bar stools (two, side by side at the counter)" },
    { id: "suspension", famille: "luminaire", requete: "suspension", role: "pendant light above the worktop or island", refus: /ampoule|cordon/ },
    { id: "mitigeur", famille: "robinetterie", requete: "mitigeur cuisine", role: "kitchen mixer tap", refus: /lavabo|douche|bain/ },
    { id: "table", famille: "table-manger", requete: "table a manger", role: "dining table", refus: /jardin|exterieur/ },
  ],
  "salle-a-manger": [
    { id: "table", famille: "table-manger", requete: "table a manger", role: "dining table", refus: /jardin|exterieur/ },
    { id: "chaise", famille: "chaise", requete: "chaise", role: "dining chairs (same model around the table)", refus: /bar|bureau|enfant|jardin/ },
    { id: "suspension", famille: "luminaire", requete: "suspension", role: "pendant light above the table", refus: /ampoule|cordon/ },
    { id: "buffet", famille: "rangement", requete: "buffet enfilade", role: "sideboard" },
    { id: "tapis", famille: "tapis", requete: "tapis", role: "rug under the table", refus: /bain|enfant/ },
  ],
  bureau: [
    { id: "bureau", famille: "table-manger", requete: "bureau", role: "desk" },
    { id: "chaise", famille: "chaise", requete: "chaise de bureau", role: "desk chair" },
    { id: "bibliotheque", famille: "rangement", requete: "bibliotheque etagere", role: "bookcase" },
    { id: "lampe", famille: "luminaire", requete: "lampe de bureau", role: "desk lamp", refus: /ampoule/ },
    { id: "tapis", famille: "tapis", requete: "tapis", role: "rug", refus: /bain|enfant/ },
  ],
  entree: [
    { id: "console", famille: "rangement", requete: "console", role: "console table" },
    { id: "miroir", famille: "deco", requete: "miroir", role: "wall mirror above the console" },
    { id: "applique", famille: "luminaire", requete: "applique", role: "wall light", refus: /ampoule/ },
    { id: "tapis", famille: "tapis", requete: "tapis couloir", role: "runner rug", refus: /bain/ },
  ],
  enfant: [
    { id: "lit", famille: "lit", requete: "lit enfant", role: "child's bed" },
    { id: "rangement", famille: "rangement", requete: "rangement jouets", role: "toy storage" },
    { id: "tapis", famille: "tapis", requete: "tapis enfant", role: "rug" },
    { id: "lampe", famille: "luminaire", requete: "suspension enfant", role: "pendant light", refus: /ampoule/ },
  ],
  wc: [
    { id: "miroir", famille: "deco", requete: "miroir", role: "small wall mirror" },
    { id: "applique", famille: "luminaire", requete: "applique", role: "wall light", refus: /ampoule/ },
    { id: "mitigeur", famille: "robinetterie", requete: "robinet lave-mains", role: "hand-basin tap" },
  ],
};

/** Matières et mots signatures de chaque style (skill signatures-styles), et ce qui le contredit. */
const STYLES: Array<{ cle: RegExp; mots: string; contre: RegExp }> = [
  { cle: /japandi/, mots: "chene clair lin papier ceramique gres bois naturel bas", contre: /louis|baroque|dore|chrome|velours rose/ },
  { cle: /scandinave|scandi|nordique/, mots: "chene clair bois blanc laine lin naturel", contre: /louis|baroque|dore/ },
  { cle: /mid.?century|vintage|annees 50|annees 60|seventies/, mots: "noyer teck vintage scandinave compas velours moutarde olive laiton", contre: /louis|xvii|xviii|baroque|empire|napoleon/ },
  { cle: /industriel|loft/, mots: "metal noir acier fer cuir bois brut", contre: /louis|baroque|rose|pastel/ },
  { cle: /haussmann|classique|parisien/, mots: "velours laiton marbre moulure noyer louis", contre: /plastique|neon/ },
  { cle: /wabi|sabi/, mots: "lin terre cuite pierre bois brut gres argile", contre: /chrome|laque|brillant|neon/ },
  { cle: /boheme|boho|ethnique/, mots: "rotin osier jute cannage berbere coton macrame", contre: /chrome|laque/ },
  { cle: /contemporain|moderne|minimal/, mots: "bouclette travertin courbe arrondi beige marbre", contre: /louis|baroque|rustique/ },
];
/** Mots du style (« Japandi chaleureux », matières du moodboard) qui orientent le choix, et ceux qui l'écartent. */
const motsStyle = (style: string) => {
  const n = norm(style), s = STYLES.find((x) => x.cle.test(n));
  return { mots: [...n.split(" ").filter((w) => w.length > 2), ...(s?.mots.split(" ") ?? [])], contre: s?.contre };
};

/**
 * Pour chaque emplacement : le produit du budget demandé, avec photo et prix, le plus proche de l'emplacement et du style.
 * `charger` lit une famille de la boutique (navigateur : /boutique/<famille>.json).
 */
export async function choisirMeubles(piece: string, style: string, gamme: Gamme, charger: (f: Famille) => Promise<Array<ProduitCatalogue & { g?: Gamme }>>, n = 5): Promise<Choisi[]> {
  const emplacements = (EMPLACEMENTS[piece] ?? EMPLACEMENTS.salon!).slice(0, n);
  const st = motsStyle(style), style2 = st.mots.join(" ");
  const choisis = await Promise.all(emplacements.map(async (e) => {
    // Jamais de lot, d'ensemble ni de pièce détachée : un seul meuble, celui qui sera dessiné.
    const l = (await charger(e.famille).catch(() => [])).filter((p) => p.i && p.p !== null && (p.g ?? gamme) === gamme && !/ensemble|lot de|\+|pack|set de|couvre|housse|souris|tapis de jeu|tapis mural|tapisserie/.test(norm(p.n)) && (piece === "enfant" || !/enfant|bebe/.test(norm(p.n))) && !(st.contre?.test(norm(p.n)) ?? false) && !(e.refus?.test(norm(p.n)) ?? false) && bonType(e, p.n, p.p));
    // D'abord l'emplacement (c'est bien une table basse), puis le style pour départager.
    const pourEmplacement = chercher(l, e.requete, 80);
    if (!pourEmplacement.length) return null;
    // Le style départage parmi les bons types de meubles : on compte les mots du style présents dans le nom.
    const mots = new Set(st.mots), nb = (n: string) => norm(n).split(" ").filter((w) => mots.has(w)).length;
    const avecStyle = style2 ? [...pourEmplacement].sort((a, b) => nb(b.n) - nb(a.n) || b.score - a.score)[0] : undefined;
    const p = avecStyle ?? pourEmplacement[0]!;
    const { score, ...produit } = p; void score;
    return { emplacement: e, produit: produit as ProduitCatalogue };
  }));
  return choisis.filter((x): x is Choisi => x !== null);
}

/** Ligne de consigne pour l'IA : rôle du meuble + nom exact du produit réel (le modèle le dessine fidèlement). */
export const consigneProduit = (c: Choisi) => `${c.emplacement.role}: the real product "${c.produit.n.slice(0, 90)}" (${c.produit.m})`.slice(0, 160);
