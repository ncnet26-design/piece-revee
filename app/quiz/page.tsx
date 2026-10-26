import { Quiz } from "@/components/Quiz";
import { meta } from "@/lib/seo";

export const metadata = meta({ title: "Quel est votre style de décoration ? Le quiz", description: "Gardez ou écartez 16 ambiances : découvrez votre style dominant et la palette qui vous ressemble.", path: "/quiz/" });

export default function Page() {
  return (<>
    <div className="vhead"><div><h1>Trouver mon style</h1><p>Gardez ou écartez 16 ambiances. Votre profil de goûts guide ensuite l'étude et les conseils de Camille.</p></div></div>
    <Quiz />
  </>);
}
