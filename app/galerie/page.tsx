import { Inspirations } from "@/components/Inspirations";
import { meta } from "@/lib/seo";

export const metadata = meta({ title: "Inspirations : villas, haussmannien, appartements de designer", description: "Des photos d'intérieurs d'exception, libres de droits : villas d'architecte, appartements haussmanniens, suites, cuisines, salles de bain. Transformez chacune en moodboard.", path: "/galerie/" });

export default function Page() {
  return (<>
    <div className="vhead"><div><span className="eyebrow">Inspirations</span><h1 className="mt-2">Des lieux qui font <em>rêver.</em></h1><p>Villas d'architecte, appartements haussmanniens, suites et cuisines d'exception. Chaque photo devient un moodboard en un geste.</p></div></div>
    <Inspirations />
  </>);
}
