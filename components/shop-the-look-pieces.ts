import type { Famille } from "@/lib/catalogue";

/** Les pièces du salon d'exemple, leur zone sur l'image et la recherche faite dans la boutique. */
export const PIECES: Array<{ id: string; label: string; famille: Famille; query: string; x: number; y: number }> = [
  { id: "canape", label: "Canapé courbe en bouclé", famille: "canape", query: "canapé courbe bouclé", x: 26, y: 70 },
  { id: "table", label: "Table basse en travertin", famille: "table-basse", query: "table basse travertin ovale", x: 59, y: 79 },
  { id: "buffet", label: "Buffet cannelé en noyer", famille: "rangement", query: "buffet noyer cannelé", x: 77, y: 63 },
];
