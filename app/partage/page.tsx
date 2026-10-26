import { Suspense } from "react";
import { Shared } from "@/components/Shared";
import { meta } from "@/lib/seo";

export const metadata = meta({ title: "Projet partagé", description: "Un projet d'aménagement réalisé avec Pièce Rêvée.", path: "/partage/", noindex: true });
export default function Page() { return <Suspense fallback={<div className="skeleton h-96" />}><Shared /></Suspense>; }
