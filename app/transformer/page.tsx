import Transformer from "@/components/transform/Transformer";
import { meta } from "@/lib/seo";
import { LegacyNotice } from "@/components/LegacyNotice";

export const metadata = meta({
  title: "Transformer mon espace : une photo, trois inspirations, votre projet en image et en vidéo",
  description: "Déposez une photo de votre pièce et trois inspirations : palette, matières, objets réels, planche projet en haute définition, film en motion design, liste d'achats et budget par poste.",
  path: "/transformer/",
});

export default function Page() {
  return (<>
    <LegacyNotice>Première version de la transformation de photo (planche et film). La transformation se fait désormais dans le Studio, avec comparaison avant/après et meubles cliquables.</LegacyNotice>
    <Transformer />
  </>);
}
