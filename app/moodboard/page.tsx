import { Moodboard } from "@/components/Moodboard";
import { meta } from "@/lib/seo";

export const metadata = meta({ title: "Mon moodboard", description: "Vos matières, meubles, lieux et images préférés, et la palette qui s'en dégage.", path: "/moodboard/", noindex: true });
export default function Page() { return <Moodboard />; }
