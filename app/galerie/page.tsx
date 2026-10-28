import { InspirationBank } from "@/components/InspirationBank";
import { meta } from "@/lib/seo";

export const metadata = meta({ title: "Inspirations : styles, espaces et matières", description: "Douze styles, onze espaces et les matières qui les composent : choisissez un point de départ, gardez vos favoris et lancez votre projet dans le Studio.", path: "/galerie/" });

export default function Page() {
  return (
    <section className="pt-6">
      <p className="eyebrow">Inspirations</p>
      <h1 className="mt-3 max-w-[16ch] text-[clamp(44px,6.4vw,88px)]">Trouver le ton <em>avant le meuble.</em></h1>
      <p className="mt-5 max-w-[56ch] text-[16px] text-muted">Un style, c'est d'abord une famille de matières et une palette. Choisissez un point de départ, il préremplit votre projet dans le Studio.</p>
      <div className="mt-12"><InspirationBank /></div>
    </section>
  );
}
