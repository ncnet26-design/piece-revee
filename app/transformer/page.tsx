import Transformer from "@/components/transform/Transformer";
import { meta } from "@/lib/seo";

export const metadata = meta({
  title: "Transformer mon espace : une photo, trois inspirations, votre projet en image et en vidéo",
  description: "Déposez une photo de votre pièce et trois inspirations : palette, matières, objets réels, planche projet en haute définition, film en motion design, liste d'achats et budget par poste.",
  path: "/transformer/",
});

export default function Page() {
  return <Transformer />;
}
