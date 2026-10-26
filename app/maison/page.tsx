import { HomePage } from "@/components/HomePage";
import { meta } from "@/lib/seo";

export const metadata = meta({ title: "Ma maison", description: "Toutes vos pièces et extérieurs, un fil conducteur, un budget global.", path: "/maison/", noindex: true });
export default function Page() {
  return (<>
    <div className="vhead"><div><h1>Ma maison</h1><p>Toutes vos pièces au même endroit, avec un fil conducteur qui garde l'ensemble cohérent, et un budget global.</p></div></div>
    <HomePage />
  </>);
}
