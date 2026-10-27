/** Enseignes et formats d'adresse de leur moteur de recherche (vérifiés par scripts/check-retailers.ts). */
export type RetailerKind = "meuble" | "deco" | "bricolage" | "jardin";
export interface Retailer { id: string; name: string; home: string; kinds: RetailerKind[]; patterns: string[] }

export const RETAILERS: Retailer[] = [
  { id: "ikea", name: "IKEA", home: "https://www.ikea.com/fr/fr/", kinds: ["meuble", "deco", "jardin"], patterns: ["https://www.ikea.com/fr/fr/search/?q={q}"] },
  { id: "leroymerlin", name: "Leroy Merlin", home: "https://www.leroymerlin.fr/", kinds: ["bricolage", "jardin", "meuble", "deco"], patterns: ["https://www.leroymerlin.fr/produits/recherche?q={q}", "https://www.leroymerlin.fr/recherche={q}"] },
  { id: "castorama", name: "Castorama", home: "https://www.castorama.fr/", kinds: ["bricolage", "jardin"], patterns: ["https://www.castorama.fr/search?term={q}"] },
  { id: "maisonsdumonde", name: "Maisons du Monde", home: "https://www.maisonsdumonde.com/FR/fr", kinds: ["meuble", "deco", "jardin"], patterns: ["https://www.maisonsdumonde.com/FR/fr/search?q={q}"] },
  { id: "laredoute", name: "La Redoute Intérieurs", home: "https://www.laredoute.fr/", kinds: ["meuble", "deco"], patterns: ["https://www.laredoute.fr/psrch/psrch.aspx?kwrd={q}"] },
  { id: "conforama", name: "Conforama", home: "https://www.conforama.fr/", kinds: ["meuble"], patterns: ["https://www.conforama.fr/recherche-conforama/{q}"] },
  { id: "but", name: "BUT", home: "https://www.but.fr/", kinds: ["meuble"], patterns: ["https://www.but.fr/recherche?q={q}"] },
  { id: "manomano", name: "ManoMano", home: "https://www.manomano.fr/", kinds: ["bricolage", "jardin", "meuble"], patterns: ["https://www.manomano.fr/recherche/{q}"] },
  { id: "selency", name: "Selency (seconde main)", home: "https://www.selency.fr/", kinds: ["meuble", "deco"], patterns: ["https://www.selency.fr/recherche?q={q}"] },
];

