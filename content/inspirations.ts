import data from "@/content/data/inspirations.json";

/** Photos d'inspiration libres de droits, choisies à la main (auteur, source et licence toujours affichés). */
export interface Inspiration { id: string; collection: string; src: string; thumb: string; width: number; height: number; title: string; author: string; authorUrl: string | null; source: string; sourceUrl: string; license: string }
export const INSPIRATIONS = data as Inspiration[];
export const INSPI_COLLECTIONS: Array<{ id: string; label: string; prompt: string }> = [
  { id: "salons", label: "Salons", prompt: "Salon d'architecte d'intérieur, canapé courbe en bouclette, panneaux de bois cannelé, lustre sculptural, tapis graphique" },
  { id: "haussmann", label: "Haussmannien", prompt: "Salon d'un appartement haussmannien parisien, moulures, cheminée en marbre, parquet en point de Hongrie, mobilier contemporain, art moderne" },
  { id: "chambres", label: "Chambres", prompt: "Chambre de designer, tête de lit ondulée en bouclette, murs sculptés, suspension plissée, lumière douce du matin" },
  { id: "villas", label: "Villas", prompt: "Séjour d'une villa d'architecte contemporaine, baies vitrées sur la mer, béton clair, bois et lin" },
  { id: "hotels", label: "Hôtels", prompt: "Bar d'hôtel parisien intimiste, banquettes en velours émeraude, comptoir en noyer cannelé et laiton" },
  { id: "bars", label: "Bars et restaurants", prompt: "Restaurant méditerranéen aux arches de chaux, banquettes en lin, tables en travertin, suspensions en rotin" },
  { id: "clubs", label: "Clubs", prompt: "Lounge de club privé, bar en onyx rétroéclairé, canapés courbes en velours rouille, murs laqués vert profond" },
  { id: "cuisines", label: "Cuisines", prompt: "Cuisine d'exception, îlot en marbre veiné, façades en noyer cannelé, laiton brossé" },
  { id: "bains", label: "Salles de bain", prompt: "Salle de bain spa en travertin, baignoire sculpturale en pierre, robinetterie en laiton brossé" },
  { id: "design", label: "Appartements de designer", prompt: "Appartement de designer, béton brut, canapé courbe en velours terracotta, table basse en pierre sculptée, grande œuvre abstraite" },
];
