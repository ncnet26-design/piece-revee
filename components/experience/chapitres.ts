/** Données partagées par la page « Expérience » : chapitres du récit, finitions au choix et points cliquables. */

export const CHAPITRES = [
  { id: "ouverture", court: "Ouverture" },
  { id: "piece", court: "Votre pièce" },
  { id: "inspirations", court: "Inspirations" },
  { id: "moodboard", court: "Moodboard" },
  { id: "transformation", court: "Transformation" },
  { id: "cliquable", court: "Cliquable" },
] as const;

export type Partie = "canape" | "sol" | "mur";
export interface Finition { id: string; label: string; teinte: string; nom: string; href: string; lien: string }

/**
 * Finitions que le visiteur peut essayer sur la pièce transformée. Chaque lien mène à une page qui existe :
 * une recherche dans la boutique qui donne des résultats réels (vérifiée sur le catalogue), ou la fiche de la matière.
 */
export const FINITIONS: Record<Partie, Finition[]> = {
  canape: [
    { id: "boucle", label: "Bouclé crème", teinte: "#ECE4D6", nom: "Canapé courbe en bouclé", href: "/boutique/?famille=canape&q=bouclé", lien: "Canapés en bouclé" },
    { id: "velours", label: "Velours vert", teinte: "#3E5846", nom: "Canapé courbe en velours", href: "/boutique/?famille=canape&q=velours", lien: "Canapés en velours" },
    { id: "lin", label: "Lin terracotta", teinte: "#B4653F", nom: "Canapé courbe en lin", href: "/boutique/?famille=canape&q=lin", lien: "Canapés en lin" },
  ],
  sol: [
    { id: "hongrie", label: "Point de Hongrie", teinte: "#B08A60", nom: "Parquet chêne point de Hongrie", href: "/matieres/chene/", lien: "Le chêne" },
    { id: "clair", label: "Chêne clair", teinte: "#D6BC94", nom: "Parquet chêne clair", href: "/matieres/chene/", lien: "Le chêne" },
    { id: "fume", label: "Chêne fumé", teinte: "#5A4233", nom: "Parquet chêne fumé", href: "/matieres/chenefume/", lien: "Le chêne fumé" },
  ],
  mur: [
    { id: "chaux", label: "Blanc chaud", teinte: "#EDE3D4", nom: "Enduit à la chaux, blanc chaud", href: "/matieres/chaux/", lien: "La chaux" },
    { id: "sauge", label: "Vert sauge", teinte: "#A7B199", nom: "Enduit à la chaux, vert sauge", href: "/matieres/chaux/", lien: "La chaux" },
    { id: "terre", label: "Terre cuite", teinte: "#C8977A", nom: "Enduit à la chaux, terre cuite", href: "/matieres/chaux/", lien: "La chaux" },
  ],
};
export type Choix = Record<Partie, string>;
export const CHOIX_DEPART: Choix = { canape: "boucle", sol: "hongrie", mur: "chaux" };
export const finition = (p: Partie, id: string) => FINITIONS[p].find((f) => f.id === id) ?? FINITIONS[p][0]!;

export interface PointCliquable {
  id: string;
  label: string;
  detail: string;
  href: string;
  /** Si le point dépend d'une finition choisie, son nom et son lien suivent le choix. */
  partie?: Partie;
  /** Position dans la scène 3D (mètres). */
  pos: [number, number, number];
}

/** Chaque élément de la pièce transformée mène à une vraie page du site (recherche dans la boutique ou matériauthèque). */
export const POINTS: PointCliquable[] = [
  { id: "canape", label: "Canapé courbe en bouclé", detail: "Canapés", href: "/boutique/?famille=canape&q=bouclé", partie: "canape", pos: [-0.75, 0.72, -1.45] },
  { id: "table", label: "Table basse en travertin", detail: "Tables basses en travertin", href: "/boutique/?famille=table-basse&q=travertin", pos: [0.25, 0.5, -0.15] },
  { id: "buffet", label: "Buffet en noyer", detail: "Rangements en noyer", href: "/boutique/?famille=rangement&q=noyer", pos: [2.05, 0.85, -2.05] },
  { id: "suspension", label: "Suspension en papier", detail: "Luminaires en papier", href: "/boutique/?famille=luminaire&q=papier", pos: [0.22, 2.2, -0.35] },
  { id: "mur", label: "Enduit à la chaux", detail: "Matières", href: "/matieres/chaux/", partie: "mur", pos: [-2.15, 1.25, -2.36] },
  { id: "sol", label: "Parquet en chêne", detail: "Matières", href: "/matieres/chene/", partie: "sol", pos: [-1.6, 0.03, 1.25] },
];

/** Nom et lien d'un point selon les finitions choisies. */
export function pointSelon(p: PointCliquable, choix: Choix): { label: string; detail: string; href: string } {
  if (!p.partie) return p;
  const f = finition(p.partie, choix[p.partie]);
  return { label: f.nom, detail: f.lien, href: f.href };
}
