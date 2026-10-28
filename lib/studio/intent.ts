import type { Category } from "@/lib/products/schema";

/**
 * Compréhension d'une demande en français (« Remplace uniquement la table basse par quelque chose de plus sculptural,
 * pour moins de 400 €, et garde tout le reste »), sans appel à un service payant : objet visé, budget, traits recherchés.
 * Un modèle de langage pourra remplacer ce module plus tard en gardant la même sortie.
 */
export interface Intent {
  action: "remplacer" | "trouver" | "couleur" | "inconnu";
  category: Category | null;
  maxPrice: number | null;
  minPrice: number | null;
  wants: { silhouette: string[]; style: string[]; materials: string[]; colors: Array<{ name: string; hex: string }> };
  keepRest: boolean;
  /** Ce qui a été compris, en clair, pour le montrer à l'utilisateur. */
  summary: string[];
}

const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[’']/g, " ");
const CATS: Array<[RegExp, Category, string]> = [
  [/\btables? basses?\b|\bcoffee table\b/, "table-basse", "la table basse"],
  [/\bcanape|\bsofa\b/, "canape", "le canapé"],
  [/\bfauteuil|\bchauffeuse|\bbergere\b/, "fauteuil", "le fauteuil"],
  [/\blampadaire|\blampe sur pied\b/, "lampadaire", "le lampadaire"],
  [/\bsuspension|\blustre|\bplafonnier/, "luminaire", "le luminaire"],
  [/\bbuffet|\bconsole|\benfilade|\bcommode|\bmeuble (tv|bas)\b|\brangement/, "rangement", "le rangement"],
  [/\bpoignee|\bbouton de meuble/, "poignee", "les poignées"],
  [/\btapis\b/, "tapis", "le tapis"],
  [/\bplante|\bvase\b|\bdeco/, "deco", "la décoration"],
  [/\bchaise/, "chaise", "les chaises"],
  [/\brobinet|\bmitigeur/, "robinetterie", "la robinetterie"],
];
const TRAITS: Array<[RegExp, Partial<Intent["wants"]>, string]> = [
  [/sculptur|organique|galbe|courbe|arrondi|rond\b|ronde\b/, { silhouette: ["organique", "arrondi", "ronde", "massive"] }, "forme sculpturale ou arrondie"],
  [/minimal|epure|sobre/, { style: ["minimal"] }, "style épuré"],
  [/seventies|annees 70|vintage|retro/, { style: ["seventies", "vintage"] }, "esprit vintage"],
  [/scandinave|nordique/, { style: ["scandinave"] }, "style scandinave"],
  [/classique|haussmann/, { style: ["classique"] }, "style classique"],
  [/art deco/, { style: ["art-deco"] }, "Art déco"],
  [/iconique|design|signature/, { style: ["design-iconique"] }, "pièce de designer"],
  [/\bbas\b|basse\b/, { silhouette: ["basse", "tres-bas"] }, "silhouette basse"],
  [/velours/, { materials: ["velours"] }, "velours"],
  [/boucle|bouclette/, { materials: ["boucle"] }, "bouclette"],
  [/cuir/, { materials: ["cuir"] }, "cuir"],
  [/marbre/, { materials: ["marbre", "pierre"] }, "marbre"],
  [/travertin|pierre/, { materials: ["travertin", "pierre"] }, "pierre ou travertin"],
  [/laiton|dore/, { materials: ["laiton"] }, "laiton"],
  [/\bbois|chene|noyer/, { materials: ["bois"] }, "bois"],
  [/verre|opalin/, { materials: ["verre"] }, "verre"],
];
const COLORS: Array<[RegExp, string, string]> = [
  [/\bvert/, "vert", "#2F4A3D"], [/\bbleu/, "bleu", "#24345A"], [/\bnoir/, "noir", "#1E1E20"], [/\bblanc|\becru|\bcreme/, "blanc cassé", "#EEE8DC"],
  [/\bbeige|\bsable/, "beige", "#D6C3A3"], [/\brose/, "rose", "#D8A79A"], [/\bterracotta|\brouille/, "terracotta", "#B35A3B"], [/\bgris/, "gris", "#8E8E8A"], [/\bjaune|\bmoutarde/, "moutarde", "#C99A2E"],
];

export function parseIntent(text: string): Intent {
  const t = norm(text);
  const out: Intent = { action: "inconnu", category: null, maxPrice: null, minPrice: null, wants: { silhouette: [], style: [], materials: [], colors: [] }, keepRest: /uniquement|seulement|garde|conserve|le reste|tout le reste/.test(t), summary: [] };
  if (/remplac|change|echange|autre|plutot|swap/.test(t)) out.action = "remplacer";
  else if (/trouve|cherche|achet|ou acheter|propos/.test(t)) out.action = "trouver";
  else if (/couleur|teinte|repein/.test(t)) out.action = "couleur";
  // L'objet visé est le premier cité (« remplace la table basse par … » : pas l'objet de comparaison).
  let best: { i: number; cat: Category; label: string } | null = null;
  for (const [re, cat, label] of CATS) { const m = re.exec(t); if (m && (best === null || m.index < best.i)) best = { i: m.index, cat, label }; }
  if (best) { out.category = best.cat; out.summary.push(`Objet : ${best.label}`); }
  const num = (s: string) => Number(s.replace(/\s/g, "").replace(",", "."));
  const max = /(?:moins de|max(?:imum)?|sous|budget(?: de)?|jusqu a|<)\s*(\d[\d\s]*(?:[.,]\d+)?)\s*(?:k\b)?\s*(?:€|euros?|eur)?/.exec(t);
  if (max) { out.maxPrice = num(max[1]!) * (/\d\s*k\b/.test(max[0]) ? 1000 : 1); out.summary.push(`Budget : moins de ${out.maxPrice.toLocaleString("fr-FR")} €`); }
  const min = /(?:plus de|au moins|minimum|>)\s*(\d[\d\s]*)\s*(?:€|euros?)/.exec(t);
  if (min) { out.minPrice = num(min[1]!); out.summary.push(`À partir de ${out.minPrice.toLocaleString("fr-FR")} €`); }
  // Les traits ne portent que sur ce qui suit l'objet visé (« … par quelque chose de plus sculptural »).
  const tail = best ? t.slice(best.i + 4) : t;
  for (const [re, w, label] of TRAITS) if (re.test(tail)) {
    for (const k of Object.keys(w) as Array<keyof Intent["wants"]>) (out.wants[k] as string[]).push(...((w[k] as string[]) ?? []));
    out.summary.push(label);
  }
  for (const [re, name, hex] of COLORS) if (re.test(tail)) { out.wants.colors.push({ name, hex }); out.summary.push(`couleur ${name}`); }
  if (out.keepRest) out.summary.push("le reste de la pièce est conservé");
  return out;
}
