import { ExploreList } from "@/components/ExploreList";
import { PLANTS } from "@/content/index";
import { meta } from "@/lib/seo";

export const metadata = meta({ title: "Fiches plantes : jardin, balcon et intérieur", description: "Exposition, rusticité, arrosage, floraison, taille et toxicité : des fiches simples pour choisir les bonnes plantes.", path: "/plantes/" });

export default function Page() {
  return (<>
    <div className="vhead"><div><h1>Plantes</h1><p>{PLANTS.length} fiches pour le jardin, le balcon et l'intérieur : exposition, rusticité, arrosage, calendrier.</p></div></div>
    <ExploreList kind="plantes" items={PLANTS} />
    <p className="notice mt-6">Fiches indicatives, à adapter à votre climat local. La rusticité suppose un sol bien drainé.</p>
  </>);
}
