import { Suspense } from "react";
import { SignIn } from "@/components/SignIn";
import { meta } from "@/lib/seo";

export const metadata = meta({ title: "Se connecter", description: "Connexion par lien magique, Google ou Apple.", path: "/connexion/", noindex: true });
export default function Page() { return <Suspense fallback={<div className="skeleton h-72" />}><SignIn /></Suspense>; }
