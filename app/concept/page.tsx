import Concept from "@/components/concept/Concept";
import { meta } from "@/lib/seo";

export const metadata = meta({
  title: "Générer un concept : une phrase, une image éditoriale et ses matières assorties",
  description: "Décrivez l'ambiance de votre pièce : une image éditoriale est créée, puis le site en tire la palette et choisit les matières du showroom, rôle par rôle, en fiche téléchargeable.",
  path: "/concept/",
});

export default function Page() {
  return <Concept />;
}
