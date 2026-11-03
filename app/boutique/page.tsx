import { Boutique } from "@/components/boutique/Boutique";
import { meta } from "@/lib/seo";

export const metadata = meta({
  title: "La boutique : meubles, luminaires et déco de vraies enseignes",
  description: "Des milliers de produits réels — canapés, tables, luminaires, tapis, déco, peintures — relevés chaque nuit chez les enseignes françaises, européennes et américaines, avec prix, disponibilité et lien d'achat.",
  path: "/boutique/",
});

export default function Page() {
  return (
    <div className="wrap py-10 sm:py-14">
      <p className="eyebrow">La boutique</p>
      <h1 className="mt-3 max-w-[16ch] text-[clamp(40px,5.6vw,76px)]">Tout ce qu'il faut, <em>chez les bonnes enseignes.</em></h1>
      <Boutique />
    </div>
  );
}
