/** Données partagées par la page « Expérience » : chapitres du récit et points cliquables de la pièce transformée. */

export const CHAPITRES = [
  { id: "ouverture", court: "Ouverture" },
  { id: "piece", court: "Votre pièce" },
  { id: "inspirations", court: "Inspirations" },
  { id: "moodboard", court: "Moodboard" },
  { id: "transformation", court: "Transformation" },
  { id: "cliquable", court: "Cliquable" },
] as const;

export interface PointCliquable {
  id: string;
  label: string;
  detail: string;
  href: string;
  /** Position dans la scène 3D (mètres). */
  pos: [number, number, number];
}

/** Chaque élément de la pièce transformée mène à une vraie page du site (boutique filtrée ou matériauthèque). */
export const POINTS: PointCliquable[] = [
  { id: "canape", label: "Canapé courbe en bouclé", detail: "Canapés", href: "/boutique/?famille=canape", pos: [-0.75, 0.72, -1.45] },
  { id: "table", label: "Table basse en travertin", detail: "Tables basses", href: "/boutique/?famille=table-basse", pos: [0.25, 0.5, -0.15] },
  { id: "buffet", label: "Buffet cannelé en noyer", detail: "Rangements", href: "/boutique/?famille=rangement", pos: [2.05, 0.85, -2.05] },
  { id: "suspension", label: "Suspension en papier", detail: "Luminaires", href: "/boutique/?famille=luminaire", pos: [0.22, 2.2, -0.35] },
  { id: "mur", label: "Enduit à la chaux", detail: "Matières", href: "/showroom/", pos: [-2.15, 1.25, -2.36] },
  { id: "sol", label: "Parquet en chêne", detail: "Sols", href: "/boutique/?famille=sol", pos: [-1.6, 0.03, 1.25] },
];
