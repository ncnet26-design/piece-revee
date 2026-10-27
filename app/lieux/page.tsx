import { ExploreList } from "@/components/ExploreList";
import { PLACES } from "@/content/index";
import { meta } from "@/lib/seo";

export const metadata = meta({ title: "Lieux d'exception : maisons d'architectes, villas et jardins", description: "Quarante maisons, villas et jardins célèbres classés par thème, avec ce qu'on peut leur emprunter chez soi.", path: "/lieux/" });

export default function Page() {
  return (<>
    <div className="vhead"><div><h1>Lieux d'exception</h1><p>{PLACES.length} maisons d'architectes, villas et jardins classés par thème. Pour chacun : ce qu'on peut transposer chez soi.</p></div></div>
    <ExploreList kind="lieux" items={PLACES} />
    <p className="notice mt-6">Les visuels sont des interprétations graphiques de la palette de chaque lieu. Chaque fiche renvoie vers le site officiel et vers des photos sous licence libre.</p>
  </>);
}
