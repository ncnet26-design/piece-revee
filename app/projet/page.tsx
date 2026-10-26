import { ProjectList } from "@/components/ProjectPages";
import { meta } from "@/lib/seo";

export const metadata = meta({ title: "Mes projets", description: "Vos études, rendus, listes d'achats et guides d'étapes.", path: "/projet/", noindex: true });
export default function Page() { return <ProjectList />; }
