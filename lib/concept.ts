import type { StyleTheme } from "@/content/types";
import { familyById, makeRef, parseVariant, variantName, variantShop, type Opt } from "@/lib/showroom/catalog";
import { dist, type Pick, type Room } from "@/lib/transform/match";

/**
 * « Générer un concept » : à partir d'une phrase et de l'image produite, choisit les matières assorties
 * (mots-clés de la phrase d'abord, couleurs de l'image ensuite) et rédige la fiche éditoriale.
 */
export const SUGGESTIONS = [
  "Salon lambrissé de noyer, canapé brun en velours et touches de bleu doux",
  "Salle de bain en pierre crème et marbre bordeaux, bois cannelé et laiton",
  "Chambre indigo, noyer, linge en lin et rayures noir et blanc",
  "Coin repas vert jardin, murs à la chaux rosée, banquette en cuir et tapis de jute",
  "Cuisine en zellige vert émeraude, chêne clair et plan en travertin",
];

const sr = (fid: string, ids: string[]) => { const f = familyById.get(fid)!; return makeRef(f, f.axes.map((a, i) => a.options.find((o) => o.id === ids[i]) ?? a.options[0]!)); };
const near = (fid: string, axis: number, hex: string) => {
  const opts = familyById.get(fid)!.axes[axis]!.options.filter((o: Opt) => o.hex);
  return opts.reduce((b, o) => (dist(hex, o.hex!) < dist(hex, b.hex!) ? o : b)).id;
};

export function guessRoom(text: string): Room {
  const t = text.toLowerCase();
  if (/salle de bain|bain|douche/.test(t)) return "Salle de bain";
  if (/cuisine/.test(t)) return "Cuisine";
  if (/chambre|lit\b/.test(t)) return "Chambre";
  if (/repas|salle à manger|dîner|diner/.test(t)) return "Salle à manger";
  if (/bureau/.test(t)) return "Bureau";
  if (/entrée|couloir/.test(t)) return "Entrée";
  return "Salon";
}

/** Matières citées dans la phrase, en priorité sur les couleurs de l'image. */
export function keywordPicks(text: string, palette: string[]): Array<{ ref: string; role: string }> {
  const t = text.toLowerCase(), out: Array<{ ref: string; role: string }> = [];
  const col = (fallback: string) => palette.find((c) => c) ?? fallback;
  const add = (ref: string, role: string) => { if (!out.some((o) => o.ref === ref)) out.push({ ref, role }); };
  if (/marbre/.test(t)) add(sr("marbre", [/bordeaux|rouge|viola|lie/.test(t) ? "viola" : /noir/.test(t) ? "nero" : /vert/.test(t) ? "verde" : /rose/.test(t) ? "rosa" : "calacatta", "poli"]), "Marbre");
  if (/travertin/.test(t)) add(sr("marbre", ["travertin", "adouci"]), "Plan");
  if (/zellige/.test(t)) add(sr("zellige", [/vert|émeraude/.test(t) ? "emeraude" : /bleu/.test(t) ? "majorelle" : /blanc/.test(t) ? "blanc" : near("zellige", 0, col("#2F6F62")), "metro", "brillant", "clair"]), "Crédence");
  if (/terrazzo/.test(t)) add(sr("terrazzo", ["blanc", "moyens", "multi"]), "Sol");
  if (/tomette|terre cuite/.test(t)) add(sr("tomette", ["nuancee", "hexagone", "ciree", "clair"]), "Sol");
  if (/béton|beton/.test(t)) add(sr("enduit", ["beton-cire", "gris-beton", "nuage"]), "Sol");
  if (/noyer/.test(t)) add(sr("parquet", ["noyer", /lambris|lambriss/.test(t) ? "larges" : "batons", "huile"]), /lambris|lambriss/.test(t) ? "Lambris" : "Sol");
  if (/chêne|chene/.test(t)) add(sr("parquet", [/clair|blond/.test(t) ? "chene-clair" : "chene", "larges", "huile"]), "Sol");
  if (/chaux/.test(t)) add(sr("enduit", ["chaux", /ros/.test(t) ? "rose-argile" : near("enduit", 1, palette[0] ?? "#ECE7DD"), "nuage"]), "Mur");
  if (/velours/.test(t)) add(sr("tissu", ["velours", near("tissu", 1, /brun|marron|chocolat/.test(t) ? "#4E3626" : /vert/.test(t) ? "#2F4A3D" : /bleu/.test(t) ? "#232F4A" : palette[2] ?? "#6B2430")]), "Canapé");
  if (/cuir/.test(t)) add(sr("cuir", ["pleine-fleur", /vert|olive/.test(t) ? "olive" : /noir/.test(t) ? "noir" : "cognac"]), "Assise");
  if (/lin\b|linge/.test(t)) add(sr("tissu", ["lin", near("tissu", 1, palette[0] ?? "#E9E2D3")]), "Linge");
  if (/bouclette|bouclé/.test(t)) add(sr("tissu", ["bouclette", "ecru"]), "Fauteuil");
  if (/jute|sisal/.test(t)) add(sr("tissu", ["jute", "sable"]), "Tapis");
  if (/laiton|doré|or\b/.test(t)) add(sr("metal", ["laiton", "brosse"]), "Laiton");
  if (/cuivre/.test(t)) add(sr("metal", ["cuivre", "brosse"]), "Cuivre");
  if (/acier|noir mat/.test(t)) add(sr("metal", ["acier-noir", "brosse"]), "Métal");
  if (/bleu/.test(t)) add(sr("peinture", [near("peinture", 0, /doux|clair|pâle/.test(t) ? "#A9B2C9" : "#2C4A8C"), "velours"]), "Touche de bleu");
  if (/vert/.test(t) && !/émeraude/.test(t)) add(sr("peinture", [near("peinture", 0, /jardin|sauge|doux/.test(t) ? "#7E9A8C" : "#2F4A3D"), "satin"]), "Boiseries");
  return out;
}

export interface ConceptCard { title: string; tagline: string; text: string; room: Room; style: StyleTheme; picks: Pick[] }

/** Assemble la fiche : jusqu'à 10 matières, les mots-clés d'abord, complétés par les choix tirés de la palette. */
export function buildConcept(prompt: string, palette: string[], style: StyleTheme, base: Pick[]): ConceptCard {
  const room = guessRoom(prompt);
  const kw = keywordPicks(prompt, palette).map((k) => { const v = parseVariant(k.ref)!; return { ref: k.ref, role: k.role, category: "Finitions" as const, name: variantName(v), shop: variantShop(v) }; });
  const ROLE: Record<string, string> = { Murs: "Mur", Sol: "Sol", Textiles: "Tissu", Finitions: "Finition", Mobilier: "Mobilier", Luminaires: "Lumière", Décoration: "Déco" };
  // Les choix tirés de l'image complètent la phrase sans doubler un rôle déjà pris (un seul sol, un seul canapé…).
  const rest = base.map((p) => ({ ...p, role: shortRole(p.role) || ROLE[p.category] || p.role }))
    .filter((p) => !kw.some((k) => k.role === p.role || (k.role === "Lambris" && p.role === "Mur")));
  const picks = [...kw, ...rest].filter((p, i, a) => a.findIndex((q) => q.ref === p.ref) === i).slice(0, 10);
  const lower = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);
  const names = picks.filter((p) => parseVariant(p.ref)).slice(0, 4).map((p) => lower(variantName(parseVariant(p.ref)!, true)));
  const title = titleOf(prompt, room);
  const tagline = style.summary.split(/[:.]/)[0]!.trim().replace(/\s+/g, " ") + ".";
  const text = `${room === "Salon" ? "Ce salon" : room === "Chambre" ? "Cette chambre" : room === "Cuisine" ? "Cette cuisine" : room === "Salle de bain" ? "Cette salle de bain" : `Cet espace`} réunit ${names.slice(0, -1).join(", ")}${names.length > 1 ? " et " : ""}${names.at(-1) ?? "des matières naturelles"}. ${style.keys.slice(0, 2).join(". ")}. Une ambiance ${lower(style.name)}, pensée pour durer et à composer pièce par pièce.`;
  return { title, tagline, text, room, style, picks };
}
function shortRole(r: string) {
  if (/teinte principale/.test(r)) return "Mur";
  if (/accent/.test(r)) return "Plafond";
  if (/Canapé/.test(r)) return "Canapé";
  if (/Rideaux/.test(r)) return "Rideaux";
  if (/Coussins/.test(r)) return "Coussins";
  if (/Poignées/.test(r)) return "Quincaillerie";
  if (/Plan de travail/.test(r)) return "Plan";
  if (/Crédence/.test(r)) return "Crédence";
  return "";
}
function titleOf(prompt: string, room: Room) {
  const t = prompt.toLowerCase();
  const adj = /indigo/.test(t) ? "indigo" : /\bvert|jardin|sauge/.test(t) ? "verdoyant" : /bordeaux|marbre/.test(t) ? "marbré" : /noyer|lambris|bois/.test(t) ? "boisé" : /bleu/.test(t) ? "bleuté" : /blanc|crème|creme/.test(t) ? "lumineux" : /noir/.test(t) ? "graphique" : "intemporel";
  const fem = room === "Chambre" || room === "Cuisine" || room === "Salle de bain" || room === "Salle à manger" || room === "Entrée";
  const a = !fem || adj === "indigo" || adj === "graphique" ? adj : adj.endsWith("é") ? `${adj}e` : adj === "lumineux" ? "lumineuse" : `${adj}e`;
  return `${room} ${a}`;
}
