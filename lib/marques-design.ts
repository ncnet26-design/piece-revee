import { readdirSync, readFileSync } from "node:fs";

/**
 * Marques de design et de maison reconnues, vendues par nos enseignes (champ « marque » relevé sur leurs pages).
 * Liste choisie à la main : on écarte fournisseurs anonymes, usines et noms de designers seuls.
 * Clé : forme normalisée (sans accents, espaces ni ponctuation) ; valeur : nom affiché.
 */
const RECONNUES: Record<string, string> = {
  ethnicraft: "Ethnicraft", hay: "HAY", hkliving: "HKliving", serax: "Serax", woood: "WOOOD", zuiver: "Zuiver", karedesign: "Kare Design",
  kartell: "Kartell", bloomingville: "Bloomingville", housedoctor: "House Doctor", nordlux: "Nordlux", grohe: "Grohe", umanoff: "Umanoff",
  mustardmade: "Mustard Made", polspotten: "Pols Potten", vtwonen: "vtwonen", doinggoods: "Doing Goods", enostudio: "ENOstudio",
  leitmotiv: "Leitmotiv", epeda: "Épéda", housenordic: "House Nordic", normarchitects: "Norm Architects",
  goodhome: "GoodHome", fermliving: "Ferm Living", gubi: "GUBI", audocopenhagen: "Audo Copenhagen", menu: "Menu", muuto: "Muuto",
  vitra: "Vitra", andtradition: "&Tradition", normanncopenhagen: "Normann Copenhagen", fatboy: "Fatboy", flos: "Flos", artemide: "Artemide",
  louispoulsen: "Louis Poulsen", fritzhansen: "Fritz Hansen", tomdixon: "Tom Dixon", petitefriture: "Petite Friture", fermob: "Fermob",
  moustache: "Moustache", harto: "Hartô", bolia: "Bolia", boconcept: "BoConcept", madamstoltz: "Madam Stoltz", broste: "Broste Copenhagen",
  oyoy: "OYOY", hubsch: "Hübsch", tinekhome: "Tine K Home", nordal: "Nordal", stringfurniture: "String", carlhansen: "Carl Hansen & Søn",
  kettal: "Kettal", magis: "Magis", hermanmiller: "Herman Miller", knoll: "Knoll", cassina: "Cassina", ligneroset: "Ligne Roset",
  sentou: "Sentou", pomax: "Pomax", kave: "Kave Home", kavehome: "Kave Home", lexonhome: "Lexon", ikea: "IKEA", tediber: "Tediber",
  ambientdirect: "Ambiente", leklint: "Le Klint", umage: "UMAGE", nuura: "Nuura", hollandtwelve: "Holland Twelve", zeroundici: "Zeroundici",
  cremeatelier: "Crème Atelier", benuta: "benuta",
};
const cle = (s: string) => s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().replace(/[^a-z0-9]/g, "");

/** Marques reconnues présentes dans la boutique avec au moins `min` produits, hors enseignes déjà citées. */
export function marquesDesign(enseignes: string[], min = 3, dir = "public/boutique"): string[] {
  const n = new Map<string, number>();
  let fichiers: string[] = [];
  try { fichiers = readdirSync(dir).filter((f) => f.endsWith(".json") && f !== "index.json"); } catch { return []; }
  for (const f of fichiers) {
    for (const p of JSON.parse(readFileSync(`${dir}/${f}`, "utf8")) as Array<{ b?: string | null }>) {
      const nom = p.b ? RECONNUES[cle(p.b)] : undefined;
      if (nom) n.set(nom, (n.get(nom) ?? 0) + 1);
    }
  }
  const deja = new Set(enseignes.map(cle));
  return [...n].filter(([nom, k]) => k >= min && !deja.has(cle(nom))).map(([nom]) => nom).sort((a, b) => a.localeCompare(b, "fr"));
}
