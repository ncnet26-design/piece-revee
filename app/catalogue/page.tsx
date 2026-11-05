import { Redirection } from "@/components/Redirection";
import { meta } from "@/lib/seo";

export const metadata = { ...meta({ title: "La boutique", description: "Le catalogue a rejoint la boutique.", path: "/boutique/" }), robots: { index: false } };

/** L'ancien catalogue a rejoint la boutique : les anciens liens (avec leurs filtres) y mènent. */
export default function Page() {
  return <Redirection vers="/boutique/" ancre="selection" />;
}
