import Link from "next/link";
import Visite3D from "@/components/home3d/Visite3D";
import { meta } from "@/lib/seo";
import { LegacyNotice } from "@/components/LegacyNotice";

export const metadata = meta({
  title: "Maquette d'appartement 3D : tester un plan pièce par pièce",
  description: "Promenez-vous de pièce en pièce dans un appartement en 3D, changez murs, sols, meubles et couleurs, appliquez un style et partagez vos astuces.",
  path: "/visite-3d/",
});

export default function Page() {
  return (<>
    <LegacyNotice>Maquette d'appartement simplifiée, pour tester un plan et des volumes. Pour voir votre vraie pièce transformée, utilisez « Transformer ma pièce ».</LegacyNotice>
    <Visite3D />
    <section className="mx-auto mt-8 max-w-3xl">
      <h2 className="text-2xl">Votre intérieur, en vrai volume</h2>
      <p className="mt-2 text-muted">Déplacez-vous de l'entrée au salon, de la cuisine à la terrasse. Touchez un meuble pour changer sa couleur, son tissu, sa matière ou son modèle ; touchez un mur ou un sol pour essayer une peinture, un enduit à la chaux, des tomettes ou un parquet de la <Link href="/matieres/">matériauthèque</Link>. Appliquez un style en un geste, épinglez vos astuces et partagez votre plan par simple lien.</p>
      <ul className="dots mt-4 text-[15px]">
        <li>Plus de 30 objets modifiables, des dizaines de matières et 20 styles</li>
        <li>Les bons repères d'aménagement à chaque pièce (passages, hauteurs, éclairage)</li>
        <li>Camille répond à vos questions pendant la visite</li>
        <li>Gratuit, sans compte : votre plan est enregistré sur votre appareil</li>
      </ul>
      <p className="mt-4 text-[13px] text-muted">Les dimensions sont indicatives : vérifiez toujours les mesures réelles de votre logement avant d'acheter.</p>
    </section>
  </>);
}
