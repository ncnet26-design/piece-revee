import StudioApp from "@/components/studio/StudioApp";
import { meta } from "@/lib/seo";

export const metadata = meta({
  title: "Studio : imaginez votre pièce, touchez un meuble, trouvez où l'acheter",
  description: "Créez ou transformez une pièce avec l'IA, explorez chaque meuble, comparez de vraies alternatives à trois niveaux de prix, manipulez la scène en 3D et suivez votre budget.",
  path: "/studio/",
});

export default function Page() {
  return <StudioApp />;
}
