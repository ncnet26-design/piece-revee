import Showroom from "@/components/showroom/Showroom";
import { meta } from "@/lib/seo";

export const metadata = meta({
  title: "Showroom : zelliges, peintures, marbres, parquets et tissus dans toutes leurs déclinaisons",
  description: "Près de 3 000 déclinaisons de matières à comparer en 3D : zelliges, faïences, tomettes, carreaux de ciment, terrazzo, marbres, parquets, peintures, enduits, tissus, cuirs et métaux.",
  path: "/showroom/",
});

export default function Page() {
  return <Showroom />;
}
