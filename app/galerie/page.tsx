import { Gallery } from "@/components/Gallery";
import { meta } from "@/lib/seo";

export const metadata = meta({ title: "Galerie d'inspiration intérieur et jardin", description: "Salons, chambres, cuisines, jardins et terrasses classés par style : trouvez l'ambiance qui vous ressemble et appliquez-la à votre pièce.", path: "/galerie/" });

export default function Page() {
  return <Gallery />;
}
