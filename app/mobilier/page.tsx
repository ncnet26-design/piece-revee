import { ExploreList } from "@/components/ExploreList";
import { FURNITURE } from "@/content/index";
import { meta } from "@/lib/seo";

export const metadata = meta({ title: "Mobilier culte : les pièces qui ont fait l'histoire du design", description: "Chaises, fauteuils, tables, rangements et luminaires iconiques : designer, année, éditeur officiel et conseils pour les intégrer chez vous.", path: "/mobilier/" });

export default function Page() {
  return (<>
    <div className="vhead"><div><h1>Mobilier culte</h1><p>{FURNITURE.length} pièces qui ont écrit l'histoire du design, avec leur éditeur officiel et une idée pour les intégrer.</p></div></div>
    <ExploreList kind="mobilier" />
    <p className="notice mt-6">Les noms de designers et d'éditeurs sont cités à titre informatif. Achetez auprès de l'éditeur officiel, d'un revendeur agréé ou en vintage authentifié : les copies sont nombreuses.</p>
  </>);
}
