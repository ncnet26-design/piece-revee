import Link from "next/link";

/** Bandeau sobre pour les outils dont la fonction principale est désormais dans le Studio. */
export function LegacyNotice({ children, href = "/transformer/", cta = "Transformer ma pièce" }: { children: React.ReactNode; href?: string; cta?: string }) {
  return (
    <aside className="mb-8 flex flex-wrap items-center justify-between gap-3 border-y border-line py-3 text-[13.5px]" aria-label="Information">
      <p className="text-muted">{children}</p>
      <Link href={href} className="btn btn-sm">{cta}</Link>
    </aside>
  );
}
