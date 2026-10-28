import QualityLab from "@/components/studio/QualityLab";
import { meta } from "@/lib/seo";

export const metadata = meta({
  title: "Contrôle qualité du rendu",
  description: "Scène de référence pour mesurer le réalisme des matières : noyer verni, peinture mate, enduit à la chaux, travertin, laiton brossé, bouclé.",
  path: "/studio/controle/",
});

export default function Page() {
  return (
    <section className="mx-auto max-w-6xl">
      <h1 className="text-[clamp(26px,3.6vw,40px)] font-semibold tracking-tight">Contrôle qualité du rendu</h1>
      <p className="mt-2 max-w-2xl text-[14px] text-muted">Une matière exigeante par objet, une lumière latérale, des gros plans. Comparez l'ancien et le nouveau pipeline, puis lancez un rendu final.</p>
      <div className="mt-6"><QualityLab /></div>
    </section>
  );
}
