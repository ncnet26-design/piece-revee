import { PIECES } from "@/components/shop-the-look-pieces";
import { trouverParBudget } from "@/lib/trouves-par-budget";
import { HeroVue } from "./HeroVue";

/** En-tête de l'accueil : la promesse et une pièce dont chaque meuble mène à un vrai produit par budget. */
export function Hero() {
  return <HeroVue trouves={trouverParBudget(PIECES)} />;
}
