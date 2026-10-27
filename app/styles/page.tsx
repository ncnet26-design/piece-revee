import { ExploreList } from "@/components/ExploreList";
import { STYLES } from "@/content/index";
import { meta } from "@/lib/seo";

export const metadata = meta({ title: "Styles de décoration et de jardin", description: "Japandi, méditerranéen, Art déco, scandinave, jardin sec, jardin japonais… Les clés de chaque style, ses matières et ses erreurs à éviter.", path: "/styles/" });

export default function Page() {
  return (<>
    <div className="vhead"><div><h1>Styles</h1><p>Douze styles d'intérieur et huit styles de jardin : les clés, les matières, les erreurs à éviter, et comment les adapter à votre budget.</p></div></div>
    <ExploreList kind="styles" items={STYLES} />
  </>);
}
