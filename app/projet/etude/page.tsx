import { Suspense } from "react";
import { StudyPage } from "@/components/ProjectPages";
import { meta } from "@/lib/seo";

export const metadata = meta({ title: "Étude", description: "Votre étude d'aménagement.", path: "/projet/etude/", noindex: true });
export default function Page() { return <Suspense fallback={<div className="skeleton h-96" />}><StudyPage /></Suspense>; }
