import { Parcours } from "@/components/parcours/Parcours";
import { meta } from "@/lib/seo";

export const metadata = meta({
  title: "Transformer ma pièce avec mes inspirations",
  description: "Une photo de votre pièce, vos inspirations Pinterest ou magazine : votre moodboard, votre pièce transformée, et chaque meuble, couleur ou matière cliquable avec des liens pour l'acheter.",
  path: "/transformer/",
});

export default function Page() {
  return (
    <div className="wrap py-10 sm:py-14">
      <p className="eyebrow">Transformer ma pièce</p>
      <h1 className="mt-3 max-w-[18ch] text-[clamp(40px,5.6vw,76px)]">Vos inspirations, <em>chez vous.</em></h1>
      <p className="mt-4 max-w-[58ch] text-[16px] text-muted">Photographiez votre pièce, ajoutez ce qui vous inspire. Nous composons votre moodboard, transformons votre pièce dans cet esprit, et chaque meuble, couleur ou matière devient cliquable pour le retrouver en vente.</p>
      <div className="mt-10"><Parcours /></div>
    </div>
  );
}
