/**
 * Types du contenu éditorial.
 * Chaque fiche porte `reviewed: false` tant qu'un humain ne l'a pas relue (statut affiché dans l'admin).
 */

export type Hex = `#${string}`;

/** Algorithme de rendu générique de la matière (vignette dessinée en attendant les photos libres). */
export type TextureKind =
  | "travertine" | "marble" | "terrazzo" | "tile" | "cement" | "hex" | "wood" | "cork" | "cane" | "weave" | "boucle"
  | "cord" | "metal" | "plaster" | "fluted" | "lacquer" | "leather" | "raffia" | "washi" | "brick" | "slate" | "gravel" | "planks";

export interface Material {
  id: string;
  slug: string;
  name: string;
  family: "Pierre" | "Terre" | "Bois" | "Fibre" | "Textile" | "Métal" | "Verre" | "Composite" | "Extérieur";
  texture: TextureKind;
  colors: [Hex, Hex, Hex, ...Hex[]];
  origin: string;
  summary: string;
  uses: string[];
  care: string;
  /** Ordre de grandeur indicatif, fourni pour se repérer ; jamais un prix de produit. */
  priceRange: string;
  budgetAlternative: string;
  interior: boolean;
  exterior: boolean;
  rentalFriendly: boolean;
  laying: string[];
  reviewed: boolean;
}

export interface Pairing {
  id: string;
  slug: string;
  name: string;
  materials: [string, string, string];
  mood: string;
  why: string;
  ratio: string;
  rooms: string[];
  placeId: string | null;
  reviewed: boolean;
}

export type FurnitureCategory = "Assise" | "Table" | "Rangement" | "Luminaire" | "Extérieur";
export type BudgetTier = "Moins de 500 €" | "500 à 2 000 €" | "2 000 à 5 000 €" | "Plus de 5 000 €";

export interface FurnitureIcon {
  id: string;
  slug: string;
  name: string;
  designer: string;
  year: number;
  /** Éditeur officiel actuel (sous licence). */
  editor: string;
  editorUrl: string;
  category: FurnitureCategory;
  /** Ordre de grandeur du prix neuf chez l'éditeur, à vérifier : jamais un prix de produit. */
  budgetTier: BudgetTier;
  materials: string[];
  story: string;
  howTo: string;
  counterfeitRisk: "faible" | "moyen" | "élevé";
  reviewed: boolean;
}

export type PlaceTheme = "Riviera" | "Modernisme" | "Maisons d'architectes" | "Couleur" | "Méditerranée" | "Art déco" | "Japon" | "Riad" | "Brutalisme" | "Jardins" | "Maximalisme";

export interface Place {
  id: string;
  slug: string;
  name: string;
  author: string;
  year: string;
  location: string;
  country: string;
  theme: PlaceTheme;
  palette: [Hex, Hex, Hex, Hex];
  lessons: string[];
  materials: string[];
  officialUrl: string | null;
  /** Requête Wikimedia Commons utilisée par le script d'import d'images libres. */
  commonsQuery: string;
  visitable: boolean;
  reviewed: boolean;
}

export type Exposure = "Soleil" | "Mi-ombre" | "Ombre";

export interface Plant {
  id: string;
  slug: string;
  name: string;
  latin: string;
  type: "Arbre" | "Arbuste" | "Vivace" | "Graminée" | "Grimpante" | "Aromatique" | "Couvre-sol" | "Annuelle" | "Plante d'intérieur" | "Bulbe" | "Fougère" | "Potagère";
  exposure: Exposure[];
  /** Température minimale supportée une fois installée (°C, indicatif). Null pour les plantes d'intérieur. */
  hardinessC: number | null;
  water: "Faible" | "Moyen" | "Élevé";
  soil: string;
  heightCm: [number, number];
  /** Mois de floraison (1 = janvier). */
  bloom: number[];
  /** Mois conseillés pour planter (1 = janvier). */
  plant: number[];
  /** Mois de taille ou d'entretien principal (1 = janvier). */
  prune: number[];
  foliage: "Persistant" | "Caduc" | "Semi-persistant";
  uses: ("Massif" | "Haie" | "Pot" | "Balcon" | "Couvre-sol" | "Isolé" | "Bordure" | "Mur" | "Intérieur" | "Potager" | "Ombre légère")[];
  /** Toxicité connue pour les animaux domestiques ou les enfants. */
  toxicity: string | null;
  notes: string;
  reviewed: boolean;
}

export interface StyleTheme {
  id: string;
  slug: string;
  name: string;
  scope: "interieur" | "exterieur";
  palette: [Hex, Hex, Hex, Hex, Hex];
  summary: string;
  keys: string[];
  materials: string[];
  avoid: string[];
  budgetTip: string;
  rentalTip: string;
}

/** `consulted` reste null tant que la page n'a pas été relue en ligne (le robot de liens et la relecture le renseignent). */
export interface Source { title: string; url: string; consulted: string | null }

export interface KnowledgeChunk {
  id: string;
  domain: "interieur" | "exterieur" | "reglementation" | "securite";
  title: string;
  body: string;
  sources: Source[];
  reviewed: boolean;
}

export interface GuideArticle {
  id: string;
  slug: string;
  title: string;
  scope: "interieur" | "exterieur" | "les-deux";
  summary: string;
  steps: { title: string; body: string }[];
  mistakes: string[];
  sources: Source[];
}
