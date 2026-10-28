import type { RetailerKind } from "@/lib/retailers";

/**
 * Showroom : chaque matière dans ses déclinaisons (teintes, formats, finitions, joints).
 * Une déclinaison s'écrit « sr:famille:option1:option2… » dans l'ordre des axes de la famille.
 * Aucune référence de marque : ce sont des teintes et formats génériques, cherchés ensuite chez les enseignes.
 */
export interface Opt { id: string; label: string; hex?: string; colors?: string[] }
export interface Axis { id: string; label: string; options: Opt[] }
export type Generator = "tile" | "cement" | "marble" | "terrazzo" | "wood" | "paint" | "plaster" | "fabric" | "leather" | "metal" | "fluted" | "hardware" | "wallpaper" | "carpet" | "cane" | "object" | "lighting" | "electric" | "sofa" | "rug" | "art" | "mosaic" | "styling";
export interface Family {
  id: string;
  name: string;
  /** Mot de recherche chez les enseignes (« zellige », « peinture »…). */
  shop: string;
  kinds: RetailerKind[];
  gen: Generator;
  group: "Carrelages" | "Pierres" | "Bois" | "Murs" | "Textiles" | "Métaux" | "Objets";
  /** Code court de la référence (« ZEL » → PR-ZEL-…). */
  code: string;
  intro: string;
  /** Fiche de la matériauthèque liée (prix indicatif, entretien, pose). */
  materialId?: string;
  axes: Axis[];
}

const o = (id: string, label: string, hex?: string): Opt => ({ id, label, hex });
const pal = (id: string, label: string, colors: string[]): Opt => ({ id, label, hex: colors[1] ?? colors[0], colors });

export const PAINT_FAMILIES: Array<{ name: string; shades: Opt[] }> = [
  { name: "Blancs", shades: [o("blanc-pur", "Blanc pur", "#F6F5F1"), o("blanc-lin", "Blanc de lin", "#F1ECE2"), o("blanc-coquille", "Blanc coquille", "#EFE9DD"), o("blanc-craie", "Blanc craie", "#ECE8DF"), o("blanc-casse", "Blanc cassé", "#EAE3D4"), o("ivoire", "Ivoire", "#EDE3CC"), o("blanc-chaud", "Blanc chaud", "#F2E9D8"), o("blanc-gris", "Blanc grisé", "#E6E4DE"), o("albatre", "Albâtre", "#EEEAE1"), o("porcelaine", "Porcelaine", "#E9ECEA")] },
  { name: "Beiges et lins", shades: [o("lin", "Lin", "#DDD2BE"), o("sable", "Sable", "#D6C3A3"), o("grege", "Grège", "#CFC4B1"), o("mastic", "Mastic", "#C8B79A"), o("ficelle", "Ficelle", "#C9B48F"), o("pierre-caen", "Pierre blonde", "#D8CDB6"), o("biscuit", "Biscuit", "#DCC6A2"), o("chanvre", "Chanvre", "#BFAE8E"), o("seigle", "Seigle", "#B9A486"), o("noisette", "Noisette", "#A88A68")] },
  { name: "Greiges et taupes", shades: [o("greige-clair", "Greige clair", "#D3CCC1"), o("greige", "Greige", "#BDB4A7"), o("taupe-clair", "Taupe clair", "#B2A698"), o("taupe", "Taupe", "#8F8273"), o("mastic-fume", "Mastic fumé", "#A39886"), o("argile-grise", "Argile grise", "#9E948A"), o("galet", "Galet", "#ADA59A"), o("taupe-profond", "Taupe profond", "#6E6359")] },
  { name: "Gris", shades: [o("gris-perle", "Gris perle", "#D6D6D2"), o("gris-brume", "Gris brume", "#C7CACA"), o("gris-ciment", "Gris ciment", "#A9AAA6"), o("gris-souris", "Gris souris", "#8E8F8C"), o("gris-orage", "Gris orage", "#6F7275"), o("gris-ardoise", "Gris ardoise", "#4F5559"), o("anthracite", "Anthracite", "#3B3D3F"), o("gris-bleute", "Gris bleuté", "#9AA3A8"), o("gris-vert", "Gris vert", "#A3A89C"), o("gris-plomb", "Gris plomb", "#5C6063")] },
  { name: "Noirs", shades: [o("noir-vigne", "Noir de vigne", "#2A2A28"), o("noir-bleute", "Noir bleuté", "#23272D"), o("noir-brun", "Noir brun", "#2E2723"), o("graphite", "Graphite", "#34363A"), o("encre", "Encre", "#1F2228")] },
  { name: "Terres et ocres", shades: [o("ocre-jaune", "Ocre jaune", "#C99A45"), o("ocre-rouge", "Ocre rouge", "#A8553A"), o("terracotta", "Terracotta", "#C0714F"), o("terre-cuite", "Terre cuite", "#B5603E"), o("rouille", "Rouille", "#A8552F"), o("brique", "Brique", "#9C4A36"), o("argile", "Argile", "#C08A6A"), o("cannelle", "Cannelle", "#9A5B3A"), o("caramel", "Caramel", "#B9874F"), o("camel", "Camel", "#BE8A57"), o("tabac", "Tabac", "#8A5B36"), o("terre-ombre", "Terre d'ombre", "#6B4F3A")] },
  { name: "Roses", shades: [o("rose-poudre", "Rose poudré", "#D9AFA2"), o("rose-the", "Rose thé", "#E3C1B4"), o("nude", "Nude", "#D9B8A3"), o("vieux-rose", "Vieux rose", "#B98580"), o("rose-argile", "Rose argile", "#C99A8A"), o("bois-rose", "Bois de rose", "#A86F68"), o("corail-doux", "Corail doux", "#E39A84"), o("rose-pale", "Rose pâle", "#EED8CF"), o("peche", "Pêche", "#EDC2A5"), o("framboise", "Framboise sourde", "#8E4A55")] },
  { name: "Rouges et bordeaux", shades: [o("garance", "Rouge garance", "#9E2F2A"), o("pompei", "Rouge pompéien", "#A23B2E"), o("bordeaux", "Bordeaux", "#6B2430"), o("lie-de-vin", "Lie de vin", "#5A2A33"), o("cerise-noire", "Cerise noire", "#4A1E25"), o("vermillon", "Vermillon doux", "#C2483A")] },
  { name: "Jaunes", shades: [o("paille", "Jaune paille", "#E8D49A"), o("moutarde", "Moutarde", "#C99A2E"), o("safran", "Safran", "#D49A3A"), o("miel", "Miel", "#D1A055"), o("naples", "Jaune de Naples", "#EBCB8B"), o("citron-pale", "Citron pâle", "#EDE3A6"), o("ocre-dore", "Ocre doré", "#B98A33"), o("curry", "Curry", "#B88A2E")] },
  { name: "Verts", shades: [o("sauge", "Vert sauge", "#9DAA8C"), o("sauge-pale", "Sauge pâle", "#C3CBB5"), o("vert-de-gris", "Vert-de-gris", "#8FA39A"), o("eucalyptus", "Eucalyptus", "#7E9A8C"), o("amande", "Vert amande", "#C9D3B4"), o("olive", "Olive", "#7A7B4A"), o("kaki", "Kaki", "#6E6A44"), o("lichen", "Lichen", "#A3A77E"), o("vert-eau", "Vert d'eau", "#BFD3CC"), o("celadon", "Céladon", "#AFC4B0"), o("vert-foret", "Vert forêt", "#2F4A3D"), o("vert-anglais", "Vert anglais", "#233D33"), o("vert-bouteille", "Vert bouteille", "#1F3B30"), o("emeraude", "Vert émeraude", "#1E6B55"), o("tilleul", "Tilleul", "#C7CC8E"), o("mousse", "Vert mousse", "#5E6B3F")] },
  { name: "Bleus", shades: [o("canard", "Bleu canard", "#24545C"), o("petrole", "Bleu pétrole", "#1F4A57"), o("bleu-nuit", "Bleu nuit", "#232F4A"), o("marine", "Bleu marine", "#1D2A44"), o("prusse", "Bleu de Prusse", "#22385A"), o("bleu-ardoise", "Bleu ardoise", "#4C6070"), o("bleu-orage", "Bleu orage", "#5A6E7E"), o("bleu-gris", "Bleu gris", "#8296A3"), o("bleu-lavande", "Bleu lavande", "#A9B2C9"), o("bleu-ciel", "Bleu ciel pâle", "#C9D8E2"), o("bleu-poudre", "Bleu poudre", "#B6C6D3"), o("majorelle", "Bleu Majorelle", "#3E4FA8"), o("cobalt", "Bleu cobalt", "#2C4A8C"), o("outremer", "Outremer", "#1F3FA0"), o("turquoise", "Turquoise", "#3C8C8A"), o("aqua", "Aqua", "#8CC3BE")] },
  { name: "Violets", shades: [o("lavande", "Lavande", "#B9A9C9"), o("lilas", "Lilas", "#C7B4C9"), o("prune", "Prune", "#5B3A4A"), o("aubergine", "Aubergine", "#45303D"), o("mauve-grise", "Mauve grisé", "#9B8895")] },
];
export const PAINT_SHADES: Opt[] = PAINT_FAMILIES.flatMap((f) => f.shades);

const JOINTS: Axis = { id: "joint", label: "Joint", options: [o("clair", "Joint clair", "#D9D4C8"), o("gris", "Joint gris", "#9C9890"), o("assorti", "Joint assorti"), o("fonce", "Joint foncé", "#4A4642")] };
const FABRIC_COLORS: Opt[] = [
  o("ecru", "Écru", "#E9E2D3"), o("blanc", "Blanc", "#F2EFE8"), o("sable", "Sable", "#D6C3A3"), o("lin", "Lin naturel", "#CFC3AE"), o("camel", "Camel", "#B9874F"), o("terracotta", "Terracotta", "#C0714F"),
  o("rouille", "Rouille", "#A8552F"), o("moutarde", "Moutarde", "#C99A2E"), o("ocre", "Ocre", "#C99A45"), o("olive", "Olive", "#7A7B4A"), o("sauge", "Sauge", "#9DAA8C"), o("vert-foret", "Vert forêt", "#2F4A3D"),
  o("canard", "Bleu canard", "#24545C"), o("bleu-nuit", "Bleu nuit", "#232F4A"), o("bleu-gris", "Bleu gris", "#8296A3"), o("gris-clair", "Gris clair", "#BFC1BE"), o("anthracite", "Anthracite", "#3B3D3F"), o("noir", "Noir", "#222222"),
  o("rose-poudre", "Rose poudré", "#D9AFA2"), o("vieux-rose", "Vieux rose", "#B98580"), o("bordeaux", "Bordeaux", "#6B2430"), o("chocolat", "Chocolat", "#4E3626"), o("taupe", "Taupe", "#8F8273"), o("lavande", "Lavande", "#B9A9C9"),
];
const PLASTER_COLORS: Opt[] = [
  o("blanc", "Blanc", "#ECE7DD"), o("lin", "Lin", "#DCD2C0"), o("sable", "Sable", "#D2BF9E"), o("grege", "Grège", "#C6BBA9"), o("gris-clair", "Gris clair", "#C4C2BC"), o("gris-beton", "Gris béton", "#9F9C95"),
  o("anthracite", "Anthracite", "#4B4C4C"), o("ocre", "Ocre", "#C79A5C"), o("terracotta", "Terracotta", "#B9714F"), o("rose-argile", "Rose argile", "#C99A8A"), o("sauge", "Vert sauge", "#9DAA8C"), o("bleu-gris", "Bleu gris", "#8C9BA4"), o("taupe", "Taupe", "#8F8273"), o("noir", "Noir", "#2E2D2B"),
];

export const FAMILIES: Family[] = [
  {
    id: "zellige", code: "ZEL", name: "Zellige", shop: "zellige", kinds: ["bricolage", "deco"], gen: "tile", group: "Carrelages", materialId: "m-zellige",
    intro: "Carreaux de terre émaillée façonnés à la main : chaque pièce a sa nuance, son relief et ses bords irréguliers.",
    axes: [
      { id: "teinte", label: "Teinte", options: [o("blanc", "Blanc naturel", "#EDE8DC"), o("blanc-casse", "Blanc cassé", "#E3DBC9"), o("gris-perle", "Gris perle", "#C9C8C2"), o("noir", "Noir", "#1E1F1F"), o("emeraude", "Vert émeraude", "#1E6B55"), o("sapin", "Vert sapin", "#234A3A"), o("vert-eau", "Vert d'eau", "#A9C9BE"), o("olive", "Vert olive", "#6E7344"), o("majorelle", "Bleu Majorelle", "#2E46A8"), o("bleu-nuit", "Bleu nuit", "#1C2B4A"), o("bleu-ciel", "Bleu ciel", "#8DB6CF"), o("turquoise", "Turquoise", "#2F8C8A"), o("terracotta", "Terracotta", "#B35A3B"), o("rose", "Rose poudré", "#D8A79A"), o("ocre", "Ocre jaune", "#C99A3E"), o("miel", "Miel", "#C98F45"), o("brique", "Rouge brique", "#8E3A2C")] },
      { id: "format", label: "Format", options: [o("carre10", "Carré 10 × 10"), o("carre5", "Carré 5 × 5"), o("metro", "Rectangle 5 × 15"), o("chevron", "Chevrons 5 × 15"), o("losange", "Losange"), o("hexagone", "Hexagone"), o("ecaille", "Écaille")] },
      { id: "finition", label: "Finition", options: [o("brillant", "Émail brillant"), o("satine", "Émail satiné")] },
      JOINTS,
    ],
  },
  {
    id: "faience", code: "FAI", name: "Faïence et métro", shop: "faïence", kinds: ["bricolage", "deco"], gen: "tile", group: "Carrelages", materialId: "m-metro",
    intro: "Carreaux émaillés réguliers, plats ou biseautés, pour la cuisine et la salle de bain.",
    axes: [
      { id: "teinte", label: "Teinte", options: [o("blanc", "Blanc", "#F3F2EE"), o("blanc-casse", "Blanc cassé", "#EAE5DA"), o("creme", "Crème", "#E9DFC8"), o("gris-clair", "Gris clair", "#CFD0CC"), o("anthracite", "Anthracite", "#45484A"), o("noir", "Noir", "#1E1F21"), o("sauge", "Vert sauge", "#9FAE96"), o("bouteille", "Vert bouteille", "#24443A"), o("vert-eau", "Vert d'eau", "#B8D1C8"), o("canard", "Bleu canard", "#24545C"), o("bleu-nuit", "Bleu nuit", "#233150"), o("rose", "Rose poudré", "#DDB3A6"), o("terracotta", "Terracotta", "#B8674A"), o("moutarde", "Moutarde", "#C99A2E")] },
      { id: "format", label: "Format", options: [o("metro", "Métro 7,5 × 15 décalé"), o("metro-biseau", "Métro biseauté 7,5 × 15"), o("chevron", "Chevrons 7,5 × 15"), o("baguette", "Baguette 7,5 × 30"), o("carre10", "Carré 10 × 10"), o("hexagone", "Hexagone")] },
      { id: "finition", label: "Finition", options: [o("brillant", "Brillant"), o("mat", "Mat")] },
      JOINTS,
    ],
  },
  {
    id: "tomette", code: "TOM", name: "Tomettes et terre cuite", shop: "tomette", kinds: ["bricolage"], gen: "tile", group: "Carrelages", materialId: "m-tomette",
    intro: "Terre cuite de Provence ou de Bourgogne, hexagonale ou carrée, qui se patine avec les années.",
    axes: [
      { id: "teinte", label: "Teinte", options: [o("rouge", "Rouge", "#B5603E"), o("rose", "Rose", "#C98468"), o("nuancee", "Nuancée", "#B9714F"), o("ocre", "Ocre", "#C9924F"), o("blanchie", "Blanchie", "#D9BFA5")] },
      { id: "format", label: "Format", options: [o("hexagone", "Hexagonale"), o("carre", "Carrée 16 × 16"), o("octogone", "Octogone et cabochon")] },
      { id: "finition", label: "Finition", options: [o("brute", "Brute"), o("ciree", "Cirée")] },
      JOINTS,
    ],
  },
  {
    id: "ciment", code: "CIM", name: "Carreaux de ciment", shop: "carreau ciment", kinds: ["bricolage", "deco"], gen: "cement", group: "Carrelages", materialId: "m-ciment",
    intro: "Motifs coulés dans la masse, mats et veloutés : le charme des sols de 1900.",
    axes: [
      { id: "motif", label: "Motif", options: [o("etoile", "Étoile"), o("rosace", "Rosace"), o("losange", "Losange"), o("sablier", "Sablier"), o("arabesque", "Arabesque"), o("ecaille", "Écailles"), o("damier", "Damier"), o("uni", "Uni")] },
      { id: "coloris", label: "Coloris", options: [pal("bleu", "Bleu et blanc", ["#EDE6D8", "#2E4A6B", "#9FB3C8"]), pal("noir", "Noir et blanc", ["#EEEAE2", "#1F1F1F", "#8E8E8A"]), pal("vert", "Vert et sable", ["#E6DCC8", "#2F5A47", "#C9A87A"]), pal("terracotta", "Terracotta", ["#EDE3D2", "#B5603E", "#2F3B44"]), pal("rose", "Rose et gris", ["#EFE3DC", "#D49A8E", "#8E8F8C"]), pal("moutarde", "Moutarde", ["#EDE3CC", "#C99A2E", "#2B2B2B"]), pal("gris", "Gris et blanc", ["#EDEBE6", "#9A9A96", "#5C5E60"]), pal("canard", "Bleu canard", ["#E8E2D4", "#24545C", "#C27B4E"])] },
    ],
  },
  {
    id: "mosaique", code: "MOS", name: "Mosaïques de marbre", shop: "mosaïque marbre", kinds: ["bricolage", "deco"], gen: "mosaic", group: "Carrelages",
    intro: "Triangles cerclés de vert, hexagones à cabochons, chevrons et écailles : des mosaïques de marbre assemblées pièce à pièce.",
    axes: [
      { id: "motif", label: "Motif", options: [o("triangles", "Triangles cerclés"), o("hexagones", "Hexagones à cabochons"), o("chevrons", "Chevrons"), o("ecailles", "Écailles"), o("damier", "Damier en diagonale")] },
      { id: "palette", label: "Marbres", options: [pal("vert-noir", "Blanc, noir et vert", ["#F1EFEA", "#1C1C1D", "#1F4A3A"]), pal("laiton", "Blanc, travertin et laiton", ["#F1EFEA", "#D9C3A0", "#B88A45"]), pal("rose", "Blanc, rose et terre", ["#F1EFEA", "#D8A99A", "#9C4A36"]), pal("bleu", "Blanc, bleu et gris", ["#F1EFEA", "#24345A", "#9AA3A8"])] },
    ],
  },
  {
    id: "terrazzo", code: "TER", name: "Terrazzo", shop: "terrazzo", kinds: ["bricolage", "deco"], gen: "terrazzo", group: "Carrelages", materialId: "m-terrazzo",
    intro: "Éclats de marbre pris dans un liant, poncés et polis : vénitien à l'origine, graphique aujourd'hui.",
    axes: [
      { id: "fond", label: "Fond", options: [o("blanc", "Blanc", "#ECE7DE"), o("sable", "Sable", "#E0D3BC"), o("gris", "Gris", "#B9B7B1"), o("rose", "Rose", "#E6C9BE"), o("sauge", "Vert sauge", "#B9C2AE"), o("terracotta", "Terracotta", "#C98668"), o("noir", "Noir", "#2B2B2A"), o("ambre", "Résine ambre", "#C9A26A")] },
      { id: "eclats", label: "Éclats", options: [o("fins", "Fins"), o("moyens", "Moyens"), o("gros", "Gros")] },
      { id: "palette", label: "Couleur des éclats", options: [pal("multi", "Multicolore", ["#B6553A", "#3E5B4C", "#C9B08A", "#2C2C2C", "#D9C9B0"]), pal("ton", "Ton sur ton", []), pal("nb", "Noir et blanc", ["#1F1F1F", "#F2F0EB", "#8E8E8A"]), pal("terre", "Terres", ["#B5603E", "#C9924F", "#7A4A33", "#E3CBB0"])] },
    ],
  },
  {
    id: "marbre", code: "PIE", name: "Marbres et pierres", shop: "marbre", kinds: ["bricolage", "deco"], gen: "marble", group: "Pierres", materialId: "m-carrare",
    intro: "Des grands marbres italiens aux pierres de Bourgogne, polis, adoucis ou vieillis.",
    axes: [
      { id: "pierre", label: "Pierre", options: [pal("carrare", "Marbre de Carrare", ["#EDEDEA", "#8E9396"]), pal("calacatta", "Calacatta", ["#F3F1EC", "#A08A66"]), pal("viola", "Calacatta Viola", ["#F1ECE8", "#7E4352"]), pal("nero", "Nero Marquina", ["#1C1C1D", "#E4E2DE"]), pal("verde", "Vert des Alpes", ["#1F3B30", "#D7E2DA"]), pal("rosa", "Rose du Portugal", ["#E7CFC4", "#B98577"]), pal("emperador", "Emperador", ["#5A4334", "#D9C2A2"]), pal("travertin", "Travertin", ["#E1D1B5", "#B49C78"]), pal("bourgogne", "Pierre de Bourgogne", ["#E2D8C3", "#BFB295"]), pal("ardoise", "Ardoise", ["#3F4448", "#5C6367"])] },
      { id: "finition", label: "Finition", options: [o("poli", "Poli brillant"), o("adouci", "Adouci mat"), o("vieilli", "Vieilli brossé")] },
    ],
  },
  {
    id: "parquet", code: "PAR", name: "Parquets", shop: "parquet", kinds: ["bricolage"], gen: "wood", group: "Bois", materialId: "m-chene",
    intro: "Essences, poses et finitions : des lames à l'anglaise au point de Hongrie.",
    axes: [
      { id: "essence", label: "Essence", options: [pal("chene", "Chêne naturel", ["#8A6239", "#D6B07A"]), pal("chene-clair", "Chêne blanchi", ["#B3A086", "#ECE2D1"]), pal("chene-miel", "Chêne miel", ["#86592F", "#D9A866"]), pal("chene-fume", "Chêne fumé", ["#3B2A1E", "#7E5E44"]), pal("noyer", "Noyer", ["#3D2A1F", "#8A6448"]), pal("teck", "Teck", ["#6B4524", "#B57F4A"]), pal("frene", "Frêne", ["#B5A184", "#EFE4CF"]), pal("pin", "Pin", ["#B98B55", "#ECD3A4"])] },
      { id: "pose", label: "Pose", options: [o("anglaise", "Lames à l'anglaise"), o("larges", "Lames larges"), o("batons", "Bâtons rompus"), o("hongrie", "Point de Hongrie"), o("damier", "Damier (vannerie)")] },
      { id: "finition", label: "Finition", options: [o("huile", "Huilé mat"), o("vitrifie", "Vitrifié satiné"), o("brut", "Brut brossé")] },
    ],
  },
  {
    id: "peinture", code: "PEI", name: "Peintures", shop: "peinture", kinds: ["bricolage", "deco"], gen: "paint", group: "Murs", materialId: "m-chaux",
    intro: `${PAINT_SHADES.length} teintes, de mat profond à brillant laqué. Demandez toujours un échantillon réel avant de peindre.`,
    axes: [
      { id: "teinte", label: "Teinte", options: PAINT_SHADES },
      { id: "finition", label: "Finition", options: [o("mat", "Mat profond"), o("velours", "Velours"), o("satin", "Satin"), o("brillant", "Brillant laqué")] },
    ],
  },
  {
    id: "enduit", code: "END", name: "Enduits décoratifs", shop: "enduit décoratif", kinds: ["bricolage"], gen: "plaster", group: "Murs", materialId: "m-tadelakt",
    intro: "Chaux, tadelakt, béton ciré, stuc : des murs et des sols minéraux, nuancés à la main.",
    axes: [
      { id: "type", label: "Enduit", options: [o("chaux", "Badigeon de chaux"), o("tadelakt", "Tadelakt"), o("beton-cire", "Béton ciré"), o("microciment", "Microciment"), o("stuc", "Stuc vénitien"), o("argile", "Enduit d'argile")] },
      { id: "teinte", label: "Teinte", options: PLASTER_COLORS },
      { id: "aspect", label: "Aspect", options: [o("nuage", "Nuagé"), o("lisse", "Lisse"), o("brosse", "Brossé")] },
    ],
  },
  {
    id: "tissu", code: "TIS", name: "Tissus", shop: "tissu", kinds: ["deco", "meuble"], gen: "fabric", group: "Textiles", materialId: "m-lin",
    intro: "Lin, coton, velours, bouclette, laine : de vraies trames photographiées, dans vingt-quatre couleurs.",
    axes: [
      { id: "matiere", label: "Tissu", options: [o("lin", "Lin lavé"), o("coton", "Coton"), o("velours", "Velours"), o("cotele", "Velours côtelé"), o("bouclette", "Bouclette"), o("laine", "Laine à chevrons"), o("chine", "Laine chinée"), o("jute", "Toile de jute")] },
      { id: "couleur", label: "Couleur", options: FABRIC_COLORS },
    ],
  },
  {
    id: "cuir", code: "CUI", name: "Cuirs", shop: "cuir", kinds: ["deco", "meuble"], gen: "leather", group: "Textiles", materialId: "m-cuir",
    intro: "Pleine fleur, vieilli, nubuck ou tressé, pour l'assise, la poignée, le détail.",
    axes: [
      { id: "type", label: "Cuir", options: [o("pleine-fleur", "Pleine fleur"), o("vieilli", "Vieilli"), o("nubuck", "Nubuck"), o("tresse", "Tressé"), o("croco", "Embossé croco")] },
      { id: "couleur", label: "Couleur", options: [o("cognac", "Cognac", "#8A5434"), o("naturel", "Naturel", "#C49A6C"), o("camel", "Camel", "#A8743F"), o("chocolat", "Chocolat", "#4E3626"), o("noir", "Noir", "#1E1B19"), o("bordeaux", "Bordeaux", "#5E2328"), o("olive", "Olive", "#4F5236"), o("gris", "Gris", "#6E6A66"), o("blanc-casse", "Blanc cassé", "#E2DACB")] },
    ],
  },
  {
    id: "metal", code: "MET", name: "Métaux", shop: "", kinds: ["bricolage", "deco"], gen: "metal", group: "Métaux", materialId: "m-laiton",
    intro: "Laiton, bronze, cuivre, inox, acier noirci : poignées, robinetterie, luminaires, pieds de meubles.",
    axes: [
      { id: "metal", label: "Métal", options: [o("laiton", "Laiton", "#C49A52"), o("bronze", "Bronze", "#8C6239"), o("cuivre", "Cuivre", "#B87333"), o("inox", "Inox", "#B9BCBC"), o("chrome", "Chrome", "#D5D8DA"), o("zinc", "Zinc", "#9DA3A6"), o("acier-noir", "Acier noirci", "#2A2C2E")] },
      { id: "finition", label: "Finition", options: [o("brosse", "Brossé"), o("poli", "Poli"), o("vieilli", "Vieilli patiné")] },
    ],
  },
  {
    id: "cannele", code: "CAN", name: "Bois cannelé et tasseaux", shop: "panneau bois cannelé", kinds: ["bricolage", "deco"], gen: "fluted", group: "Bois",
    intro: "Panneaux à joncs, cannelures creusées ou tasseaux sur feutre : le relief du bois massif pour les murs, façades et têtes de lit.",
    axes: [
      { id: "essence", label: "Essence", options: [pal("chene", "Chêne naturel", ["#8A6239", "#D6B07A"]), pal("chene-clair", "Chêne blanchi", ["#B3A086", "#ECE2D1"]), pal("chene-fume", "Chêne fumé", ["#3B2A1E", "#7E5E44"]), pal("noyer", "Noyer", ["#3D2A1F", "#8A6448"]), pal("frene", "Frêne", ["#B5A184", "#EFE4CF"]), pal("teinte-noir", "Chêne teinté noir", ["#1C1A18", "#3E3731"])] },
      { id: "profil", label: "Profil", options: [o("joncs", "Joncs demi-ronds 20 mm"), o("joncs-fins", "Joncs fins 12 mm"), o("cannelures", "Cannelures creusées"), o("tasseaux", "Tasseaux sur feutre")] },
      { id: "finition", label: "Finition", options: [o("huile", "Huilé mat"), o("vitrifie", "Vernis satiné"), o("brut", "Brut brossé")] },
    ],
  },
  {
    id: "cannage", code: "CNG", name: "Cannage et rotin", shop: "cannage rotin", kinds: ["deco", "meuble"], gen: "cane", group: "Bois",
    intro: "Le cannage à maille octogonale des chaises bistrot, la maille carrée et le rotin tressé, pour les portes de buffet et les assises.",
    axes: [
      { id: "tressage", label: "Tressage", options: [o("octogonal", "Cannage traditionnel (maille octogonale)"), o("carre", "Maille carrée"), o("tresse", "Rotin tressé plein")] },
      { id: "teinte", label: "Teinte", options: [o("naturel", "Naturel", "#D6B47E"), o("miel", "Miel", "#B98340"), o("blanchi", "Blanchi", "#E4D8C2"), o("tabac", "Tabac", "#7E5230"), o("noir", "Noir", "#26221F")] },
    ],
  },
  {
    id: "papier-peint", code: "PAP", name: "Papiers peints", shop: "papier peint", kinds: ["bricolage", "deco"], gen: "wallpaper", group: "Murs",
    intro: "Grandes feuilles, rayures, arches, éventails Art déco : des motifs imprimés sur papier intissé, dans neuf harmonies.",
    axes: [
      { id: "motif", label: "Motif", options: [o("feuillage", "Grandes feuilles"), o("rayures", "Rayures"), o("chevrons", "Chevrons"), o("pois", "Pois"), o("arches", "Arches"), o("eventails", "Éventails Art déco"), o("treillage", "Treillage"), o("uni", "Uni toilé")] },
      { id: "coloris", label: "Coloris", options: [pal("peche", "Pêche et corail", ["#F1D3C4", "#D98468"]), pal("sauge", "Sauge", ["#E0E4D6", "#7E9479"]), pal("bleu", "Bleu de Delft", ["#E8ECEF", "#34507A"]), pal("terracotta", "Terracotta", ["#F0E2D2", "#B5603E"]), pal("rose", "Vieux rose", ["#F3E0D9", "#B97E7A"]), pal("moutarde", "Moutarde", ["#F2E6C8", "#B98A33"]), pal("creme", "Crème et lin", ["#F2ECE1", "#B5A386"]), pal("vert-foret", "Vert forêt et or", ["#22392F", "#C9B07E"]), pal("noir-or", "Noir et or", ["#23252A", "#C49A52"])] },
    ],
  },
  {
    id: "moquette", code: "MOQ", name: "Moquettes et tapis", shop: "moquette", kinds: ["bricolage", "deco"], gen: "carpet", group: "Textiles",
    intro: "Bouclée, velours ras, berbère chiné ou sisal : des fibres épaisses, à voir à l'échelle d'une dalle.",
    axes: [
      { id: "type", label: "Fibre", options: [o("bouclee", "Bouclée"), o("velours", "Velours ras"), o("berbere", "Berbère chiné"), o("sisal", "Sisal tissé")] },
      { id: "couleur", label: "Couleur", options: FABRIC_COLORS.filter((c) => !["blanc", "noir", "lavande", "moutarde"].includes(c.id)) },
    ],
  },
  {
    id: "quincaillerie", code: "QUI", name: "Quincaillerie", shop: "poignée", kinds: ["bricolage", "deco"], gen: "hardware", group: "Métaux",
    intro: "Barres moletées, boutons, poignées coquille, béquilles sur rosace : la quincaillerie en volume, dans six métaux et trois finitions.",
    axes: [
      { id: "modele", label: "Modèle", options: [o("barre-moletee", "Barre moletée sur rosaces"), o("bouton-molete", "Bouton moleté"), o("bouton-rond", "Bouton rond"), o("poignee-t", "Poignée en T"), o("coquille", "Poignée coquille"), o("bequille", "Béquille sur rosace"), o("anneau", "Anneau tombant"), o("bouton-strie", "Bouton strié en spirale"), o("robinet", "Mitigeur de cuisine col carré"), o("pastille", "Pastille de finition")] },
      { id: "metal", label: "Métal", options: [o("laiton", "Laiton", "#C49A52"), o("bronze", "Bronze", "#8C6239"), o("cuivre", "Cuivre", "#B87333"), o("inox", "Inox", "#B9BCBC"), o("chrome", "Chrome", "#D5D8DA"), o("acier-noir", "Acier noirci", "#2A2C2E")] },
      { id: "finition", label: "Finition", options: [o("brosse", "Brossé"), o("poli", "Poli"), o("vieilli", "Vieilli patiné")] },
    ],
  },
  {
    id: "luminaires", code: "LUM", name: "Luminaires et LED", shop: "luminaire", kinds: ["deco", "bricolage"], gen: "lighting", group: "Objets",
    intro: "Lustres, suspensions, appliques, spots, rubans LED et lampadaires, allumés dans la teinte de lumière choisie.",
    axes: [
      { id: "forme", label: "Luminaire", options: [o("lustre-spoutnik", "Lustre Spoutnik"), o("lustre-anneaux", "Lustre à anneaux"), o("suspension-globe", "Suspension globe opaline"), o("suspension-cloche", "Suspension cloche"), o("applique-demi-lune", "Applique demi-lune"), o("applique-bras", "Applique à bras"), o("spot-encastre", "Spot encastré"), o("rail-spots", "Rail de spots"), o("ruban-led", "Ruban LED en profilé"), o("lampadaire-arc", "Lampadaire arc"), o("lampe-plissee", "Lampe à poser plissée")] },
      { id: "finition", label: "Finition", options: [o("laiton", "Laiton brossé", "#C49A52"), o("noir", "Noir mat", "#232323"), o("blanc", "Blanc mat", "#EEEDEA"), o("chrome", "Chrome", "#D5D8DA"), o("bronze", "Bronze", "#8C6239")] },
      { id: "lumiere", label: "Lumière", options: [o("2700", "Blanc chaud 2700 K", "#FFD39A"), o("3000", "Blanc doux 3000 K", "#FFE2BE"), o("4000", "Blanc neutre 4000 K", "#FFF3E6")] },
    ],
  },
  {
    id: "electricite", code: "ELE", name: "Interrupteurs et prises", shop: "interrupteur", kinds: ["bricolage"], gen: "electric", group: "Métaux",
    intro: "Interrupteurs à bascule, poussoirs, variateurs, prises simples, doubles et USB-C : la finition qui accompagne la quincaillerie.",
    axes: [
      { id: "modele", label: "Modèle", options: [o("bascule", "Interrupteur à bascule"), o("poussoir", "Interrupteur à poussoir"), o("variateur", "Variateur rotatif"), o("double", "Double interrupteur"), o("prise", "Prise de courant"), o("prise-double", "Prise double"), o("prise-usb", "Prise et USB-C")] },
      { id: "finition", label: "Finition", options: [o("laiton", "Laiton brossé", "#C49A52"), o("porcelaine", "Porcelaine blanche", "#F4F2EE"), o("noir", "Noir mat", "#232323"), o("chrome", "Chrome", "#D5D8DA"), o("bronze", "Bronze", "#8C6239"), o("inox", "Inox brossé", "#B9BCBC")] },
    ],
  },
  {
    id: "assises", code: "ASS", name: "Canapés et assises", shop: "canapé", kinds: ["meuble", "deco"], gen: "sofa", group: "Textiles",
    intro: "Canapé droit, canapé courbe, fauteuil, banquette et pouf, habillés de chacun de nos tissus.",
    axes: [
      { id: "modele", label: "Modèle", options: [o("canape-droit", "Canapé droit 3 places"), o("canape-courbe", "Canapé courbe"), o("fauteuil", "Fauteuil enveloppant"), o("banquette", "Banquette"), o("pouf", "Pouf rond")] },
      { id: "tissu", label: "Tissu", options: [o("velours", "Velours"), o("bouclette", "Bouclette"), o("lin", "Lin lavé"), o("cotele", "Velours côtelé")] },
      { id: "couleur", label: "Couleur", options: FABRIC_COLORS },
    ],
  },
  {
    id: "tapis", code: "TAP", name: "Tapis", shop: "tapis", kinds: ["deco"], gen: "rug", group: "Textiles",
    intro: "Tapis rectangulaires, ronds et de passage, unis, rayés, berbères, bordés ou tuftés, à la bonne échelle sous vos meubles.",
    axes: [
      { id: "forme", label: "Format", options: [o("rectangle", "200 × 300 cm"), o("rond", "Rond Ø 200 cm"), o("passage", "Passage 80 × 240 cm")] },
      { id: "motif", label: "Motif", options: [o("uni", "Uni"), o("raye", "Rayé"), o("berbere", "Losanges berbères"), o("borde", "Bordure contrastée"), o("tufte", "Formes tuftées")] },
      { id: "couleur", label: "Couleur", options: FABRIC_COLORS.filter((c) => ["ecru", "sable", "lin", "camel", "terracotta", "rouille", "olive", "sauge", "bleu-nuit", "gris-clair", "anthracite", "rose-poudre"].includes(c.id)) },
    ],
  },
  {
    id: "tableaux", code: "ART", name: "Tableaux et œuvres", shop: "tableau abstrait", kinds: ["deco"], gen: "art", group: "Objets",
    intro: "Compositions abstraites originales, peintes pour Pièce Rêvée, encadrées de chêne, de noir ou de laiton, ou sur toile.",
    axes: [
      { id: "composition", label: "Composition", options: [o("champs", "Champs colorés"), o("arches", "Arches"), o("ligne", "Ligne continue"), o("organique", "Formes organiques"), o("soleil", "Soleil couchant"), o("texture", "Monochrome texturé")] },
      { id: "palette", label: "Palette", options: [pal("terre", "Terres", ["#EFE6D8", "#C0714F", "#8A5B36", "#D9B88F"]), pal("sauge", "Sauge et sable", ["#EEEBE2", "#9DAA8C", "#D6C3A3", "#5E6B4F"]), pal("bleu", "Bleus", ["#ECEDEC", "#34507A", "#A9B2C9", "#1D2A44"]), pal("noir-blanc", "Noir et blanc", ["#F1EFEA", "#1E1E1E", "#8E8E8A", "#D6D3CC"]), pal("rose", "Rose et ocre", ["#F3E6DF", "#D9A08E", "#C99A45", "#8E4A55"])] },
      { id: "cadre", label: "Cadre", options: [o("chene", "Cadre chêne"), o("noir", "Cadre noir"), o("laiton", "Cadre laiton"), o("toile", "Toile sans cadre")] },
    ],
  },
  {
    id: "stylisme", code: "STY", name: "Objets de stylisme", shop: "fleurs séchées", kinds: ["deco"], gen: "styling", group: "Objets",
    intro: "Branches, fleurs et feuilles séchées, tasse en grès, cuillère en laiton, galet : les touches vivantes qui font respirer une planche.",
    axes: [
      { id: "objet", label: "Objet", options: [o("tulipe", "Tulipe séchée"), o("branche", "Branche de bois flotté"), o("feuille", "Feuille d'arum séchée"), o("eucalyptus", "Brin d'eucalyptus"), o("tasse", "Tasse en grès"), o("cuillere", "Cuillère en laiton"), o("galet", "Galet poli")] },
      { id: "nuance", label: "Nuance", options: [o("rouge", "Rouge garance", "#A8343A"), o("rose", "Vieux rose", "#C98A86"), o("blanc", "Blanc cassé", "#EAE3D4"), o("sable", "Sable", "#CDB28A"), o("vert", "Vert sauge", "#8FA07A"), o("ocre", "Ocre", "#C99A45"), o("noir", "Noir", "#2A2826")] },
    ],
  },
  {
    id: "objets", code: "OBJ", name: "Objets de design", shop: "", kinds: ["deco", "meuble"], gen: "object", group: "Objets",
    intro: "Vases, lampes, guéridons, tabourets, miroirs, sculptures : quinze formes d'éditeur dans quinze matières, en volume et à l'échelle.",
    axes: [
      { id: "forme", label: "Forme", options: [o("vase-amphore", "Vase amphore"), o("vase-boule", "Vase boule"), o("vase-cylindre", "Vase cylindre"), o("soliflore", "Soliflore"), o("coupe", "Coupe sur pied"), o("bougeoir", "Bougeoir"), o("lampe-champignon", "Lampe champignon"), o("lampe-globe", "Lampe globe"), o("gueridon", "Guéridon"), o("table-tambour", "Table basse tambour"), o("tabouret", "Tabouret tripode"), o("miroir-arche", "Miroir arche"), o("jardiniere", "Jardinière et buis"), o("plateau", "Plateau ovale"), o("sculpture", "Sculpture empilée")] },
      { id: "matiere", label: "Matière", options: [o("ceramique-craie", "Céramique blanc craie", "#ECE8DF"), o("ceramique-sauge", "Céramique sauge", "#9DAA8C"), o("ceramique-terracotta", "Céramique terracotta", "#C0714F"), o("ceramique-cobalt", "Céramique bleu cobalt", "#2C4A8C"), o("ceramique-noire", "Céramique noire", "#2A2A28"), o("ceramique-rose", "Céramique rose thé", "#E3C1B4"), o("gres", "Grès brut", "#C9B08E"), o("travertin", "Travertin", "#E1D1B5"), o("marbre-blanc", "Marbre Calacatta", "#F3F1EC"), o("marbre-vert", "Marbre vert des Alpes", "#1F3B30"), o("noyer", "Noyer massif", "#5B4030"), o("chene", "Chêne massif", "#B98E5E"), o("laiton", "Laiton poli", "#C49A52"), o("acier-noir", "Acier noirci", "#2A2C2E"), o("verre-fume", "Verre fumé", "#4A4540")] },
    ],
  },

];

export const familyById = new Map(FAMILIES.map((f) => [f.id, f]));
export const GROUPS = ["Carrelages", "Pierres", "Bois", "Murs", "Textiles", "Métaux", "Objets"] as const;

export interface Variant { family: Family; opts: Opt[]; ref: string }

/** Lit une référence « sr:… » ; les options inconnues ou manquantes prennent la première valeur de l'axe. */
export function parseVariant(ref: string): Variant | null {
  if (!ref.startsWith("sr:")) return null;
  const [, fid, ...rest] = ref.split(":");
  const family = familyById.get(fid ?? "");
  if (!family) return null;
  const opts = family.axes.map((a, i) => a.options.find((x) => x.id === rest[i]) ?? customOpt(a, rest[i]) ?? a.options[0]!);
  return { family, opts, ref: makeRef(family, opts) };
}
/** Teinte sur mesure (« x-c0714f ») : possible sur tout axe de couleurs, pour des matières sans limite de teinte. */
export const isColorAxis = (a: Axis) => a.options.filter((x) => x.hex).length >= a.options.length * 0.8 && a.options.length >= 4;
export const customId = (hex: string) => `x-${hex.replace("#", "").toLowerCase()}`;
function customOpt(a: Axis, id: string | undefined): Opt | null {
  const m = /^x-([0-9a-f]{6})$/i.exec(id ?? "");
  return m && isColorAxis(a) ? { id: `x-${m[1]!.toLowerCase()}`, label: `Teinte sur mesure #${m[1]!.toUpperCase()}`, hex: `#${m[1]!.toLowerCase()}` } : null;
}
export const makeRef = (f: Family, opts: Opt[]) => `sr:${f.id}:${opts.map((x) => x.id).join(":")}`;
export const isVariant = (ref: string) => ref.startsWith("sr:") && parseVariant(ref) !== null;
export function withOption(ref: string, axisId: string, optId: string): string {
  const v = parseVariant(ref); if (!v) return ref;
  const i = v.family.axes.findIndex((a) => a.id === axisId); if (i < 0) return ref;
  const opt = v.family.axes[i]!.options.find((x) => x.id === optId) ?? customOpt(v.family.axes[i]!, optId); if (!opt) return ref;
  const opts = [...v.opts]; opts[i] = opt;
  return makeRef(v.family, opts);
}
export const opt = (v: Variant, axisId: string) => v.opts[v.family.axes.findIndex((a) => a.id === axisId)];

/** Nom complet : « Zellige vert émeraude · hexagone · émail brillant » ; court : « Zellige vert émeraude ». */
export function variantName(v: Variant, short = false): string {
  const lo = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);
  const L = (axis: string) => lo(opt(v, axis)?.label ?? "");
  const [head, tail]: [string, string[]] = (() => {
    switch (v.family.id) {
      case "zellige": return [`Zellige ${L("teinte")}`, [L("format"), L("finition"), L("joint")]];
      case "faience": return [`Faïence ${L("teinte")}`, [L("format"), L("finition"), L("joint")]];
      case "tomette": return [`Tomette ${L("teinte")}`, [L("format"), L("finition"), L("joint")]];
      case "ciment": return [`Carreau ciment ${L("motif")}`, [L("coloris")]];
      case "terrazzo": return [`Terrazzo fond ${L("fond")}`, [`éclats ${L("eclats")}`, L("palette")]];
      case "marbre": return [opt(v, "pierre")!.label, [L("finition")]];
      case "parquet": return [`Parquet ${L("essence")}`, [L("pose"), L("finition")]];
      case "peinture": return [`Peinture ${L("teinte")}`, [L("finition")]];
      case "enduit": return [`${opt(v, "type")!.label} ${L("teinte")}`, [L("aspect")]];
      case "tissu": return [`${opt(v, "matiere")!.label} ${L("couleur")}`, []];
      case "cuir": return [`Cuir ${L("type")} ${L("couleur")}`, []];
      case "metal": return [`${opt(v, "metal")!.label} ${L("finition")}`, []];
      case "cannele": return [`Bois cannelé ${L("essence")}`, [L("profil"), L("finition")]];
      case "cannage": return [`${opt(v, "tressage")!.id === "tresse" ? "Rotin tressé" : "Cannage"} ${L("teinte")}`, [opt(v, "tressage")!.id === "tresse" ? "" : L("tressage")]];
      case "papier-peint": return [`Papier peint ${L("motif")}`, [L("coloris")]];
      case "moquette": return [`Moquette ${L("type")} ${L("couleur")}`, []];
      case "luminaires": return [`${opt(v, "forme")!.label} ${L("finition")}`, [L("lumiere")]];
      case "electricite": return [`${opt(v, "modele")!.label} ${L("finition")}`, []];
      case "assises": return [`${opt(v, "modele")!.label} ${L("tissu")} ${L("couleur")}`, []];
      case "stylisme": return [`${opt(v, "objet")!.label}`, [L("nuance")]];
      case "mosaique": return [`Mosaïque ${L("motif")}`, [L("palette")]];
      case "tapis": return [`Tapis ${L("motif")} ${L("couleur")}`, [L("forme")]];
      case "tableaux": return [`${opt(v, "composition")!.label}, ${L("palette")}`, [L("cadre")]];
      case "objets": return [`${opt(v, "forme")!.label} ${L("matiere")}`, []];
      case "quincaillerie": return [`${opt(v, "modele")!.label} ${L("metal")}`, [L("finition")]];
      default: return [v.family.name, v.opts.map((x) => lo(x.label))];
    }
  })();
  if (short) return head;
  return [head, ...tail.filter((t) => t && t !== "joint clair")].join(" · ");
}

/** Recherche chez les enseignes : générique et honnête (« zellige vert émeraude hexagone »). */
export function variantShop(v: Variant): { q: string; kinds: RetailerKind[] } {
  const l = (s: string) => s.toLowerCase().replace(/[×,]/g, " ").replace(/\s+/g, " ").trim();
  const f = v.family;
  const q = f.id === "peinture" ? `peinture ${l(v.opts[0]!.label)} ${l(v.opts[1]!.label.split(" ")[0]!)}`
    : f.id === "metal" ? `${l(v.opts[0]!.label)} ${l(v.opts[1]!.label.split(" ")[0]!)}`
      : f.id === "tissu" ? `tissu ${l(v.opts[0]!.label.split(" ")[0]!)} ${l(v.opts[1]!.label)}`
        : f.id === "parquet" ? `parquet ${l(v.opts[0]!.label)} ${l(v.opts[1]!.label)}`
          : f.id === "marbre" ? l(v.opts[0]!.label)
            : f.id === "enduit" ? `${l(v.opts[0]!.label)} ${l(v.opts[1]!.label)}`
              : f.id === "ciment" ? `carreau ciment ${l(v.opts[0]!.label)}`
                : `${f.shop} ${l(v.opts[0]!.label)}${f.gen === "tile" ? ` ${l(v.opts[1]!.label.split(" ")[0]!)}` : ""}`;
  return { q: q.replace(/\s+/g, " ").trim(), kinds: f.kinds };
}

/** Couleur dominante d'une déclinaison (vignettes, palettes, rapprochements). */
export function variantHex(v: Variant): string {
  const c = v.opts.find((x) => x.hex)?.hex;
  if (v.family.id === "terrazzo") return v.opts[0]!.hex!;
  if (v.family.id === "ciment") return v.opts[1]!.colors![1]!;
  if (v.family.id === "marbre" || v.family.id === "parquet" || v.family.id === "cannele") return v.opts[0]!.colors![v.family.id === "marbre" ? 0 : 1]!;
  if (v.family.id === "papier-peint") return v.opts[1]!.colors![0]!;
  if (v.family.id === "quincaillerie") return v.opts[1]!.hex!;
  return c ?? "#cccccc";
}

/** Référence Pièce Rêvée de la déclinaison, stable et lisible : « PR-ZEL-05·06·01·04 ». */
export function variantCode(v: Variant): string {
  return `PR-${v.family.code}-${v.opts.map((x, i) => (x.id.startsWith("x-") ? x.id.slice(2).toUpperCase() : String(v.family.axes[i]!.options.indexOf(x) + 1).padStart(2, "0"))).join("·")}`;
}

/** Nombre total de déclinaisons possibles (affiché sur le showroom). */
export const VARIANT_COUNT = FAMILIES.reduce((n, f) => n + f.axes.reduce((m, a) => m * a.options.length, 1), 0);
