import type { Source } from "./types.ts";

/** Sources officielles et ouvertes. URL de page d'accueil quand l'adresse exacte de la fiche n'a pas pu être vérifiée. */
export const SRC = {
  codeCivil: { title: "Code civil, articles 671 à 673 (Légifrance)", url: "https://www.legifrance.gouv.fr", consulted: null },
  loi89: { title: "Loi n° 89-462 du 6 juillet 1989, article 7 (Légifrance)", url: "https://www.legifrance.gouv.fr", consulted: null },
  urbanisme: { title: "Service-public.fr : travaux et autorisations d'urbanisme", url: "https://www.service-public.fr", consulted: null },
  copro: { title: "Service-public.fr : copropriété, travaux", url: "https://www.service-public.fr", consulted: null },
  caue: { title: "Fédération nationale des CAUE", url: "https://www.fncaue.com", consulted: null },
  ademe: { title: "ADEME : conseils aux particuliers", url: "https://www.ademe.fr", consulted: null },
  franceRenov: { title: "France Rénov'", url: "https://france-renov.gouv.fr", consulted: null },
  tela: { title: "Tela Botanica (CC BY-SA)", url: "https://www.tela-botanica.org", consulted: null },
  ofb: { title: "Office français de la biodiversité", url: "https://www.ofb.gouv.fr", consulted: null },
  consoElec: { title: "Promotelec / norme NF C 15-100 (présentation grand public)", url: "https://www.promotelec.com", consulted: null },
  inrs: { title: "INRS : prévention des risques (amiante, plomb, chantiers)", url: "https://www.inrs.fr", consulted: null },
} satisfies Record<string, Source>;
