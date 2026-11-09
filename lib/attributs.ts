/**
 * Correspondance stricte entre un meuble repéré sur l'image et un produit : matière, couleur et forme.
 * Une contradiction (noyer contre chêne, vert contre bleu, rond contre carré) écarte le produit ;
 * chaque point commun est montré au client (« noyer ✓ », « vert ✓ »), pour qu'il voie pourquoi le produit est proposé.
 */
import { norm } from "@/lib/catalogue";

type Groupe = { nom: string; famille: string; mots: string[] };

/** Matières : deux matières d'une même famille se contredisent (un chêne n'est pas un noyer). */
const MATIERES: Groupe[] = [
  ["noyer", "bois", "noyer walnut"], ["chêne", "bois", "chene oak"], ["teck", "bois", "teck teak"], ["acacia", "bois", "acacia"], ["frêne", "bois", "frene ash"],
  ["hêtre", "bois", "hetre beech"], ["pin", "bois", "pin pine"], ["manguier", "bois", "manguier mango"], ["bambou", "bois", "bambou bamboo"], ["sapin", "bois", "sapin"],
  ["marbre", "pierre", "marbre marble"], ["travertin", "pierre", "travertin travertine"], ["granit", "pierre", "granit granite"], ["terrazzo", "pierre", "terrazzo"], ["béton", "pierre", "beton concrete"],
  ["velours", "tissu", "velours velvet"], ["lin", "tissu", "lin linen"], ["bouclette", "tissu", "bouclette boucle"], ["coton", "tissu", "coton cotton"], ["cuir", "tissu", "cuir leather"], ["laine", "tissu", "laine wool"], ["jute", "tissu", "jute"], ["chenille", "tissu", "chenille"],
  ["rotin", "fibre", "rotin rattan cannage cannee osier wicker"], ["laiton", "metal", "laiton brass"], ["chrome", "metal", "chrome chrome"], ["acier", "metal", "acier steel inox"], ["fer forgé", "metal", "fer forge"], ["aluminium", "metal", "aluminium aluminum"],
  ["verre", "verre", "verre glass"], ["céramique", "ceramique", "ceramique ceramic gres stoneware faience"], ["papier", "papier", "papier paper washi"], ["plastique", "synthetique", "plastique plastic polypropylene"],
].map(([nom, famille, mots]) => ({ nom: nom!, famille: famille!, mots: mots!.split(" ") }));

/** Couleurs : groupes de teintes proches ; deux groupes différents se contredisent. */
const COULEURS: Groupe[] = [
  ["blanc", "c", "blanc blanche white ivoire ivory"], ["beige", "c", "beige creme ecru sable naturel taupe greige"], ["gris", "c", "gris grise grey gray anthracite"],
  ["noir", "c", "noir noire black"], ["marron", "c", "marron brun brune cognac caramel chocolat camel"], ["vert", "c", "vert verte green sauge olive kaki emeraude"],
  ["bleu", "c", "bleu bleue blue marine navy petrole indigo"], ["rouge", "c", "rouge red bordeaux"], ["terracotta", "c", "terracotta rouille rust brique orange"],
  ["jaune", "c", "jaune yellow moutarde ocre"], ["rose", "c", "rose pink poudre blush"], ["doré", "c", "dore doree gold"], ["violet", "c", "violet mauve prune"],
].map(([nom, famille, mots]) => ({ nom: nom!, famille: famille!, mots: mots!.split(" ") }));

const FORMES: Groupe[] = [
  ["rond", "f", "rond ronde round circulaire"], ["ovale", "f", "ovale oval"], ["carré", "f", "carre carree square"], ["rectangulaire", "f", "rectangulaire rectangle"], ["courbe", "f", "courbe curved arrondi arrondie organique"],
].map(([nom, famille, mots]) => ({ nom: nom!, famille: famille!, mots: mots!.split(" ") }));

const trouver = (texte: string, groupes: Groupe[]) => {
  const t = new Set(norm(texte).split(" "));
  return groupes.filter((g) => g.mots.some((m) => (m.includes(" ") ? norm(texte).includes(m) : t.has(m))));
};

export interface Attributs { matieres: Groupe[]; couleurs: Groupe[]; formes: Groupe[] }
export function attributs(texte: string): Attributs {
  return { matieres: trouver(texte, MATIERES), couleurs: trouver(texte, COULEURS), formes: trouver(texte, FORMES) };
}
/** Attributs d'un meuble repéré par l'IA (libellé, matières, couleurs, forme). */
export function attributsObjet(o: { label: string; materials?: string[]; colors?: Array<{ name: string }>; shape?: string[] }): Attributs {
  return attributs([o.label, ...(o.materials ?? []), ...(o.colors ?? []).map((c) => c.name), ...(o.shape ?? [])].join(" "));
}

export interface Accord { ok: boolean; communs: string[]; bonus: number }
/** Le produit contredit-il le meuble ? Sinon, quels points communs ? */
export function accord(objet: Attributs, produitTexte: string): Accord {
  const p = attributs(produitTexte), communs: string[] = [];
  let ok = true, bonus = 0;
  const comparer = (a: Groupe[], b: Groupe[], parFamille: boolean) => {
    for (const x of b) {
      const memes = a.filter((y) => (parFamille ? y.famille === x.famille : true));
      if (!memes.length) continue;
      if (memes.some((y) => y.nom === x.nom)) { if (!communs.includes(x.nom)) { communs.push(x.nom); bonus += 25; } }
      // Le produit annonce une autre matière de la même famille, une autre couleur ou une autre forme : il ne correspond pas.
      else if (!b.some((z) => memes.some((y) => y.nom === z.nom))) ok = false;
    }
  };
  comparer(objet.matieres, p.matieres, true);
  comparer(objet.couleurs, p.couleurs, false);
  comparer(objet.formes, p.formes, false);
  return { ok, communs, bonus };
}
