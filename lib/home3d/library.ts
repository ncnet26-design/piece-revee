import data from "@/content/data/models.json";

/** Bibliothèque de meubles et objets 3D réalistes (Poly Haven, CC0), récupérée par le robot de ressources. */
export interface LibModel { id: string; name: string; categories: string[]; tags: string[]; file: string; url: string; authors: string[]; license: string; dims?: { w: number; d: number; h: number } }
export const LIBRARY_MODELS = (data as LibModel[]).filter((m) => m.dims);

const WORDS: Array<[RegExp, string]> = [
  [/\bcoffee table\b/i, "table basse"], [/\bside table\b/i, "bout de canapé"], [/\bnight ?stand\b|\bbedside\b/i, "table de chevet"], [/\bdining table\b/i, "table à manger"],
  [/\barm ?chair\b/i, "fauteuil"], [/\bsofa\b|\bcouch\b/i, "canapé"], [/\bchair\b/i, "chaise"], [/\bstool\b/i, "tabouret"], [/\bbench\b/i, "banc"], [/\bottoman\b|\bpouf\b/i, "pouf"],
  [/\bfloor lamp\b/i, "lampadaire"], [/\bdesk lamp\b|\btable lamp\b/i, "lampe à poser"], [/\bchandelier\b/i, "lustre"], [/\bpendant\b/i, "suspension"], [/\blamp\b/i, "lampe"], [/\blantern\b/i, "lanterne"], [/\bcandle\w*\b/i, "bougeoir"],
  [/\bbookshelf\b|\bbookcase\b/i, "bibliothèque"], [/\bshel(f|ves)\b/i, "étagère"], [/\bcabinet\b|\bsideboard\b|\bdresser\b/i, "meuble de rangement"], [/\bwardrobe\b/i, "armoire"], [/\bdrawer\w*\b/i, "commode"],
  [/\bdesk\b/i, "bureau"], [/\btable\b/i, "table"], [/\bbed\b/i, "lit"], [/\bmirror\b/i, "miroir"], [/\bclock\b/i, "horloge"], [/\bvase\b/i, "vase"], [/\bpot(ted)?\b|\bplanter\b/i, "pot"],
  [/\bplant\b|\bfern\b|\bficus\b|\bmonstera\b|\bpalm\b/i, "plante"], [/\bbooks?\b/i, "livres"], [/\brug\b|\bcarpet\b/i, "tapis"], [/\bcushion\b|\bpillow\b/i, "coussin"], [/\bbasket\b/i, "panier"],
  [/\bbarrel\b/i, "tonneau"], [/\bcrate\b/i, "caisse"], [/\bbox\b/i, "boîte"], [/\btv\b|\btelevision\b/i, "télévision"], [/\bradio\b/i, "radio"], [/\bfan\b/i, "ventilateur"], [/\bpiano\b/i, "piano"],
];
const ADJ: Array<[RegExp, string]> = [[/\bwooden\b|\bwood\b/i, "en bois"], [/\bmetal\b|\biron\b/i, "en métal"], [/\bleather\b/i, "en cuir"], [/\bvintage\b|\bold\b|\bantique\b/i, "ancien"], [/\bmodern\b/i, "moderne"], [/\brattan\b|\bwicker\b/i, "en rotin"], [/\bmarble\b/i, "en marbre"], [/\bvelvet\b/i, "en velours"], [/\bglass\b/i, "en verre"]];

/** Nom français lisible (« Fauteuil en cuir ancien »), à partir du nom anglais du modèle. */
export function frenchName(m: Pick<LibModel, "name">): string {
  const noun = WORDS.find(([re]) => re.test(m.name))?.[1];
  if (!noun) return m.name.replace(/[_\d]+/g, " ").replace(/\s+/g, " ").trim();
  const adj = ADJ.filter(([re]) => re.test(m.name)).map(([, a]) => a).slice(0, 2);
  const num = /\b0?(\d{1,2})\b/.exec(m.name)?.[1];
  const label = [noun, ...adj].join(" ");
  return `${label.charAt(0).toUpperCase()}${label.slice(1)}${num && Number(num) > 1 ? ` (modèle ${num})` : ""}`;
}
/** Hauteur de pose par défaut : lustres au plafond, cadres et miroirs au mur, petits objets sur un meuble. */
export function defaultY(m: LibModel, ceiling = 2.6): number {
  const d = m.dims; if (!d) return 0;
  if (/chandelier|ceiling/i.test(m.name)) return Math.max(0, Math.round((ceiling - d.h - 0.02) * 100) / 100);
  if (/frame|mirror|painting/i.test(m.name)) return Math.round((1.5 - d.h / 2) * 100) / 100;
  if (d.h < 0.35 && d.w < 0.6 && d.d < 0.6) return 0.75;
  return 0;
}
export const libModel = (id: string | undefined) => (id ? LIBRARY_MODELS.find((m) => m.id === id) : undefined);
/** Rubrique du catalogue selon les catégories Poly Haven. */
export function libGroup(m: LibModel): string {
  const c = m.categories.map((x) => x.toLowerCase()).join(" ");
  if (/seating/.test(c) || /chair|sofa|stool|bench|ottoman/i.test(m.name)) return "Assises";
  if (/table/.test(c) || /table|desk/i.test(m.name)) return "Tables";
  if (/lighting/.test(c) || /lamp|lantern|chandelier/i.test(m.name)) return "Luminaires";
  if (/plant/.test(c) || /plant|pot|fern|palm/i.test(m.name)) return "Plantes";
  if (/shelving|storage/.test(c) || /shelf|cabinet|drawer|wardrobe/i.test(m.name)) return "Rangements";
  return "Déco et objets";
}
