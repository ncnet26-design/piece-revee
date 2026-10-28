import data from "@/content/data/inspirations.json";

/** Photos d'inspiration libres de droits, choisies à la main (auteur, source et licence toujours affichés). */
export interface Inspiration { id: string; collection: string; src: string; thumb: string; width: number; height: number; title: string; author: string; authorUrl: string | null; source: string; sourceUrl: string; license: string }
export const INSPIRATIONS = data as Inspiration[];
export const INSPI_COLLECTIONS: Array<{ id: string; label: string; prompt: string }> = [
  { id: "villas", label: "Villas d'architecte", prompt: "Séjour d'une villa d'architecte contemporaine, baies vitrées sur la mer, béton clair, bois et lin" },
  { id: "haussmann", label: "Haussmannien", prompt: "Salon d'un appartement haussmannien parisien, moulures, cheminée en marbre, parquet en point de Hongrie, mobilier contemporain" },
  { id: "design", label: "Appartements de designer", prompt: "Appartement de designer, penthouse lumineux, mobilier d'éditeur, matières nobles, palette sable et noyer" },
  { id: "chambres", label: "Chambres et suites", prompt: "Chambre de suite d'hôtel de luxe, tête de lit en bouclette, lin lavé, lumière douce du matin" },
  { id: "cuisines", label: "Cuisines d'exception", prompt: "Cuisine d'exception, îlot en marbre veiné, façades en noyer cannelé, laiton brossé" },
  { id: "bains", label: "Salles de bain", prompt: "Salle de bain spa, travertin, baignoire îlot, robinetterie en laiton, lumière naturelle" },
  { id: "lofts", label: "Lofts et ateliers", prompt: "Loft d'artiste, verrière d'atelier, béton ciré, cuir cognac, grandes plantes" },
  { id: "chateaux", label: "Châteaux et demeures", prompt: "Grand salon d'une demeure française restaurée, boiseries, mobilier contemporain, tons pierre" },
  { id: "exterieurs", label: "Terrasses et jardins", prompt: "Terrasse méditerranéenne d'une villa, piscine, oliviers, pierre claire et rotin" },
];
