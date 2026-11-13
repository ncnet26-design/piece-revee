import Link from "next/link";
import { meta } from "@/lib/seo";

export const metadata = { ...meta({ title: "Inspirations", description: "Les inspirations sont dans la galerie.", path: "/galerie/" }), robots: { index: false } };

/** Ancienne adresse devinée par les visiteurs : renvoie vers la galerie. */
export default function Page() {
  return (
    <>
      <meta httpEquiv="refresh" content="0; url=/galerie/" />
      <section className="py-24 text-center">
        <h1 className="text-[clamp(40px,5vw,64px)]">Inspirations</h1>
        <p className="mt-4 text-muted">Les inspirations sont dans la galerie.</p>
        <Link href="/galerie/" className="btn btn-primary mt-6">Voir la galerie</Link>
      </section>
    </>
  );
}
