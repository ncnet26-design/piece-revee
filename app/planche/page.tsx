import Planche from "@/components/board/Planche";
import { meta } from "@/lib/seo";

export const metadata = meta({
  title: "Planche de matières 3D : composez votre ambiance avec de vraies matières",
  description: "Posez parquet, travertin, lin, velours, peintures et meubles 3D sur une planche éclairée comme en atelier. Export haute définition, partage par lien et liens d'achat chez les enseignes.",
  path: "/planche/",
});

export default function Page() {
  return <Planche />;
}
