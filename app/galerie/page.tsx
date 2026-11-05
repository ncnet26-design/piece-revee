import { PhotosStyles } from "@/components/inspirations/PhotosStyles";
import { meta } from "@/lib/seo";

export const metadata = meta({ title: "Inspirations : huit styles en vraies photos", description: "Japandi, scandinave, industriel, haussmannien, mid-century, wabi-sabi, bohème, contemporain : six vraies photos par style, et les pièces de chaque style en vente, par budget.", path: "/galerie/" });

export default function Page() {
  return (
    <section className="pt-6">
      <p className="eyebrow">Inspirations</p>
      <h1 className="mt-3 max-w-[16ch] text-[clamp(44px,6.4vw,88px)]">Trouver le ton <em>avant le meuble.</em></h1>
      <p className="mt-5 max-w-[56ch] text-[16px] text-muted">Huit styles, six vraies photos d'intérieur chacun, choisies pour qu'on les reconnaisse sans lire le titre. Chaque style mène à ses pièces en vente, du petit budget au haut de gamme.</p>
      <div className="mt-10"><PhotosStyles /></div>
    </section>
  );
}
