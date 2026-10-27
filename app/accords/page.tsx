import { ExploreList } from "@/components/ExploreList";
import { PAIRINGS } from "@/content/index";
import { meta } from "@/lib/seo";

export const metadata = meta({ title: "Accords de matières : 30 trios qui fonctionnent", description: "Les assemblages d'un architecte d'intérieur expliqués : contrastes, proportions et pièces où ils brillent, dedans comme dehors.", path: "/accords/" });

export default function Page() {
  return (<>
    <div className="vhead"><div><h1>Accords de matières</h1><p>{PAIRINGS.length} trios expliqués : pourquoi ils fonctionnent, dans quelles proportions, et où les utiliser.</p></div></div>
    <ExploreList kind="accords" items={PAIRINGS} />
  </>);
}
