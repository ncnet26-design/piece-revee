/**
 * Description de la scène du Studio : pièce + objets. Chaque objet a un identifiant stable (`uid`),
 * distinct de son nom affiché et du modèle 3D utilisé (remplaçable sans perdre sa place ni son identité).
 */
export interface SceneObject {
  uid: string;
  furnitureId: string;
  /** Position au sol (m), centre de la pièce = 0,0 ; y = hauteur de pose (0 = sol). */
  x: number; y: number; z: number;
  rotY: number;
  /** Objet fixé sur un autre (poignée sur un buffet) : coordonnées relatives au parent. */
  parent?: string;
  variant?: string;
  /** Matière du moteur appliquée par zone (« slot » = matériau d'origine du modèle). */
  materials?: Record<string, string>;
  /** Couleur appliquée par zone. */
  colors?: Record<string, string>;
}
export interface StudioScene {
  v: 1;
  room: { w: number; d: number; h: number; wall: string; floor: string; wallFinish?: string; wallFinishes?: Partial<Record<"fond" | "avant" | "gauche" | "droite", string>> };
  objects: SceneObject[];
}

export const DEFAULT_SCENE: StudioScene = {
  v: 1,
  room: { w: 5.6, d: 4.8, h: 2.9, wall: "#EDE8DF", floor: "parquet-chevron", wallFinish: "peinture-mate" },
  objects: [
    { uid: "tapis-1", furnitureId: "tapis-laine", x: -0.25, y: 0, z: 0.2, rotY: Math.PI / 2 },
    { uid: "canape-1", furnitureId: "canape-glam-velours", x: -2.15, y: 0, z: 0.2, rotY: Math.PI / 2, variant: "Champagne" },
    { uid: "fauteuil-1", furnitureId: "fauteuil-lounge-cuir", x: 1.05, y: 0, z: 1.25, rotY: -2.3 },
    { uid: "table-basse-1", furnitureId: "table-basse-galet-travertin", x: -0.55, y: 0, z: 0.2, rotY: Math.PI / 2 },
    { uid: "buffet-1", furnitureId: "buffet-cannele", x: 2.52, y: 0, z: -0.2, rotY: -Math.PI / 2 },
    { uid: "poignee-1", furnitureId: "poignee-barre-moletee", parent: "buffet-1", x: -0.42, y: 0.52, z: 0.275, rotY: 0 },
    { uid: "poignee-2", furnitureId: "poignee-barre-moletee", parent: "buffet-1", x: 0.42, y: 0.52, z: 0.275, rotY: 0 },
    { uid: "vase-1", furnitureId: "vase-laiton", parent: "buffet-1", x: 0.75, y: 0.68, z: 0, rotY: 0 },
    { uid: "lampadaire-1", furnitureId: "lampadaire-globe", x: -2.3, y: 0, z: -1.65, rotY: 0 },
    { uid: "suspension-1", furnitureId: "suspension-globe", x: -0.55, y: 1.95, z: 0.2, rotY: 0 },
    { uid: "plante-1", furnitureId: "plante-translucide", x: 2.35, y: 0, z: -1.9, rotY: 0.4 },
  ],
};

/** Scène de contrôle qualité : une matière exigeante par objet, lumière latérale. */
export const QA_SCENE: StudioScene = {
  v: 1,
  room: { w: 5, d: 4.2, h: 2.8, wall: "#E9E3D8", floor: "parquet-chevron", wallFinish: "peinture-mate", wallFinishes: { droite: "enduit-chaux", gauche: "enduit-chaux" } },
  objects: [
    { uid: "qa-buffet", furnitureId: "buffet-cannele", x: 0, y: 0, z: -1.82, rotY: 0, materials: {} },
    { uid: "qa-canape", furnitureId: "canape-glam-velours", x: -1.45, y: 0, z: 0.35, rotY: Math.PI / 2, variant: "Champagne" },
    { uid: "qa-table", furnitureId: "table-basse-galet-travertin", x: 0.05, y: 0, z: 0.35, rotY: Math.PI / 2 },
    { uid: "qa-robinet", furnitureId: "robinet-laiton", parent: "qa-buffet", x: 0.7, y: 0.68, z: 0, rotY: 0 },
    { uid: "qa-poignee-1", furnitureId: "poignee-barre-moletee", parent: "qa-buffet", x: -0.42, y: 0.52, z: 0.275, rotY: 0 },
    { uid: "qa-tapis", furnitureId: "tapis-laine", x: -0.3, y: 0, z: 0.35, rotY: Math.PI / 2 },
  ],
};
/** Vues de contrôle (position caméra, cible). */
export const QA_VIEWS: Record<string, { pos: [number, number, number]; target: [number, number, number]; fov?: number }> = {
  generale: { pos: [1.9, 1.55, 2.0], target: [-0.3, 0.55, -0.4], fov: 50 },
  bois: { pos: [0.35, 0.75, -0.95], target: [-0.2, 0.42, -1.6], fov: 35 },
  murs: { pos: [1.2, 1.5, 0.3], target: [2.5, 1.4, -0.6], fov: 40 },
  pierre: { pos: [0.55, 0.75, 1.15], target: [0.05, 0.25, 0.35], fov: 35 },
  metal: { pos: [1.0, 1.1, -1.25], target: [0.75, 0.82, -1.82], fov: 28 },
  tissu: { pos: [-0.5, 0.9, 1.2], target: [-1.45, 0.45, 0.35], fov: 32 },
};

const KEY = "pr_studio_scene_v2";
export function loadScene(): StudioScene {
  try {
    const s = JSON.parse(localStorage.getItem(KEY) ?? "null") as StudioScene | null;
    if (s?.v === 1 && Array.isArray(s.objects)) return s;
  } catch { /* stockage indisponible */ }
  return structuredClone(DEFAULT_SCENE);
}
export function saveScene(s: StudioScene) { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* idem */ } }
