/** Vignette d'une matière du contenu : texture réelle photographiée (CC0, /matieres), ou rien (on garde alors la couleur de base). */
const VERS_TEXTURE: Record<string, string> = {
  "bois-huile": "chene-huile", "chene-naturel": "chene-huile", "chene-fume": "chene-fume", "noyer-verni": "noyer", noyer: "noyer",
  "parquet-chevron": "parquet-point-de-hongrie", boucle: "bouclette", "tapis-laine": "bouclette", "lin-lave": "lin-lave", "velours-foret": "velours", velours: "velours",
  "enduit-chaux": "enduit-chaux", "platre-texture": "enduit-chaux", "pierre-mate": "pierre-calcaire", "pierre-naturelle": "pierre-calcaire",
  travertin: "travertin", terrazzo: "terrazzo", "terre-cuite": "terre-cuite", cuir: "cuir", rotin: "rotin", brique: "brique", ardoise: "ardoise", "marbre-carrare": "marbre-carrare",
};
export const textureMatiere = (id: string): string | null => (VERS_TEXTURE[id] ? `/matieres/${VERS_TEXTURE[id]}/640.webp` : null);
