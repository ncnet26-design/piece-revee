import { ExploreList } from "@/components/ExploreList";
import { MATERIALS } from "@/content/index";
import { meta } from "@/lib/seo";

export const metadata = meta({ title: "Matériauthèque : 60 matières pour la maison et le jardin", description: "Pierre, bois, terre, textiles, métal, extérieur : où poser chaque matière, comment l'entretenir et par quoi la remplacer si le budget est serré.", path: "/matieres/" });

export default function Page() {
  return (<>
    <div className="vhead"><div><h1>Matériauthèque</h1><p>{MATERIALS.length} matières : où les utiliser, comment les entretenir, et leur version petit budget.</p></div></div>
    <ExploreList kind="matieres" />
  </>);
}
