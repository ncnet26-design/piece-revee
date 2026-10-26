import { Suspense } from "react";
import { NewProject } from "@/components/NewProject";
import { meta } from "@/lib/seo";

export const metadata = meta({ title: "Nouveau projet", description: "Une photo, votre envie, votre budget : recevez une étude complète et des rendus de votre espace.", path: "/projet/nouveau/", noindex: true });

export default function Page() {
  return (<>
    <div className="vhead"><div><h1>Nouveau projet</h1><p>Une photo de votre pièce ou de votre extérieur, votre envie, et l'étude arrive en une à deux minutes.</p></div></div>
    <Suspense fallback={<div className="skeleton h-96" />}><NewProject /></Suspense>
  </>);
}
