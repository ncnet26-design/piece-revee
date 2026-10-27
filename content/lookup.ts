/** Index légers pour les composants du navigateur (évite d'embarquer toute la bibliothèque dans chaque page). */
import { MATERIALS } from "./materials.ts";
import { STYLES } from "./styles.ts";
import { PLANTS } from "./plants.ts";
export { PROJECT_STEPS } from "./guides.ts";
export { STYLES };

export const materialById = new Map(MATERIALS.map((m) => [m.id, m]));
export const styleById = new Map(STYLES.map((s) => [s.id, s]));
export const plantById = new Map(PLANTS.map((p) => [p.id, p]));
