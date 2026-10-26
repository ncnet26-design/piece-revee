import Link from "next/link";
import { JsonLd } from "./JsonLd";
import { absoluteUrl } from "@/lib/site";

export function Crumbs({ items }: { items: { name: string; href: string }[] }) {
  return (
    <>
      <nav className="crumbs" aria-label="Fil d'Ariane">
        <Link href="/">Accueil</Link>
        {items.map((it, i) => (
          <span key={it.href}>
            <span aria-hidden="true">/ </span>
            {i === items.length - 1 ? <span aria-current="page">{it.name}</span> : <Link href={it.href}>{it.name}</Link>}
          </span>
        ))}
      </nav>
      <JsonLd data={{
        "@context": "https://schema.org", "@type": "BreadcrumbList",
        itemListElement: [{ name: "Accueil", href: "/" }, ...items].map((it, i) => ({ "@type": "ListItem", position: i + 1, name: it.name, item: absoluteUrl(it.href) })),
      }} />
    </>
  );
}
