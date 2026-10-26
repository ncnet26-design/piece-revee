import { Account } from "@/components/Account";
import { meta } from "@/lib/seo";

export const metadata = meta({ title: "Mon compte", description: "Offre, factures, profil de goûts, données personnelles.", path: "/compte/", noindex: true });
export default function Page() {
  return (<><div className="vhead"><div><h1>Mon compte</h1><p>Votre offre, vos préférences et vos données, en toute transparence.</p></div></div><Account /></>);
}
