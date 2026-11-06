import type { Famille } from "@/lib/catalogue";

/**
 * Les meubles du salon d'exemple de l'accueil (public/editorial/ia/salon-exemple.webp), à l'endroit exact des pastilles
 * dessinées sur l'image (en % de la largeur et de la hauteur), et la recherche faite dans la boutique.
 * Le premier mot de la recherche doit nommer le meuble (voir components/home/Hero.tsx).
 * « secondaire » : pastille trop proche d'une autre pour un doigt ; cliquable seulement sur grand écran.
 */
export const PIECES: Array<{ id: string; label: string; famille: Famille; query: string; x: number; y: number; secondaire?: boolean }> = [
  { id: "canape", label: "Canapé courbe en bouclette", famille: "canape", query: "canapé courbe bouclette", x: 38.1, y: 61.2 },
  { id: "table", label: "Tables basses en marbre", famille: "table-basse", query: "table basse marbre ronde", x: 56.9, y: 70.2 },
  { id: "fauteuil", label: "Fauteuil vert à motif", famille: "fauteuil", query: "fauteuil vert", x: 83.9, y: 65.2 },
  { id: "suspension", label: "Suspension en résille", famille: "luminaire", query: "suspension métal résille", x: 48, y: 8 },
  { id: "tapis", label: "Tapis rond rayé", famille: "tapis", query: "tapis rond noir blanc", x: 58.8, y: 81 },
  { id: "appoint", label: "Bout de canapé en bois", famille: "table-basse", query: "table d'appoint bois", x: 18.3, y: 72.5 },
  { id: "applique", label: "Applique murale", famille: "luminaire", query: "applique murale laiton", x: 86.2, y: 27.1 },
  { id: "tableau", label: "Grand tableau", famille: "deco", query: "tableau peinture", x: 69.7, y: 33.3 },
  { id: "vase", label: "Vase en céramique", famille: "deco", query: "vase céramique", x: 57.5, y: 54.3 },
  { id: "coussin", label: "Coussin en velours", famille: "deco", query: "coussin velours", x: 29.5, y: 55 },
  { secondaire: true, id: "coussin-motif", label: "Coussin pied-de-poule", famille: "deco", query: "coussin noir blanc", x: 34.8, y: 54.9 },
  { secondaire: true, id: "coussin-boule", label: "Coussin rond en bouclette", famille: "deco", query: "coussin rond bouclette", x: 49, y: 52.7 },
  { secondaire: true, id: "suspension-2", label: "Seconde suspension en résille", famille: "luminaire", query: "suspension métal", x: 56.2, y: 9.7 },
  { secondaire: true, id: "table-appoint", label: "Petite table en marbre", famille: "table-basse", query: "table d'appoint marbre", x: 66.7, y: 65.2 },
  { secondaire: true, id: "livres", label: "Tables basses en marbre (livres posés dessus)", famille: "table-basse", query: "table basse marbre", x: 53.8, y: 64.4 },
];
