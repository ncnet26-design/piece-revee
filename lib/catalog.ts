/**
 * Catalogue produits.
 * Tant que les flux d'affiliation ne sont pas branchés, aucun produit n'est affiché : on indique quoi chercher et
 * sur quels sites officiels (mode « suggestion », clairement signalé). Jamais de prix ni de lien produit inventés :
 * seules les pages d'accueil des enseignes sont liées.
 */
export interface Suggestion { merchant: string; url: string; query: string }
export type CatalogResult = { status: "suggestion"; suggestions: Suggestion[] } | { status: "produits"; count: number };

export const MERCHANTS = [
  { merchant: "Maisons du Monde", url: "https://www.maisonsdumonde.com" },
  { merchant: "La Redoute Intérieurs", url: "https://www.laredoute.fr" },
  { merchant: "Leroy Merlin", url: "https://www.leroymerlin.fr" },
  { merchant: "Castorama", url: "https://www.castorama.fr" },
  { merchant: "Made in Design", url: "https://www.madeindesign.com" },
  { merchant: "Selency (seconde main)", url: "https://www.selency.fr" },
] as const;

export function searchCatalogDemo(query: string): CatalogResult {
  return { status: "suggestion", suggestions: MERCHANTS.map((m) => ({ ...m, query })) };
}
