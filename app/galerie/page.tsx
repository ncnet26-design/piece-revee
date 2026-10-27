import { ArchiGallery } from "@/components/ArchiGallery";
import { Gallery } from "@/components/Gallery";
import { meta } from "@/lib/seo";

export const metadata = meta({ title: "Inspirations : intérieurs, châteaux, gîtes, jardins", description: "Photos libres de vrais lieux (châteaux, gîtes, lofts, villas, intérieurs d'architecte) et galerie par style : trouvez l'ambiance qui vous ressemble.", path: "/galerie/" });

export default function Page() {
  return (<>
    <div className="vhead"><div><span className="eyebrow">Inspirations</span><h1 className="mt-2">Le beau, <em>pour de vrai</em></h1><p>De vrais lieux photographiés, puis une galerie par style à appliquer à votre propre pièce.</p></div></div>
    <ArchiGallery />
    <h2 className="h2 mb-6">Par style</h2>
    <Gallery />
  </>);
}
