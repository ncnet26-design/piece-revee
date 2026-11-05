import { MaPiece } from "@/components/parcours/MaPiece";
import { meta } from "@/lib/seo";

export const metadata = meta({ title: "Ma pièce : ma liste d'achats", description: "Les meubles et objets gardés pendant la transformation de votre pièce, avec leurs prix relevés et les liens vers les enseignes.", path: "/ma-piece/" });

export default function Page() {
  return (
    <section className="pt-6">
      <p className="eyebrow">Ma pièce</p>
      <h1 className="mt-3 max-w-[16ch] text-[clamp(44px,6.4vw,88px)]">Ma liste <em>d'achats.</em></h1>
      <p className="mt-5 max-w-[56ch] text-[16px] text-muted">Les pièces que vous avez gardées, leurs prix relevés sur les pages des enseignes et le total. Elles restent dans ce navigateur.</p>
      <div className="mt-10"><MaPiece /></div>
    </section>
  );
}
