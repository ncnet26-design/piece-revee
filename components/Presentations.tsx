import Link from "next/link";

/* eslint-disable @next/next/no-img-element -- visuels statiques */

/** Présentations de projet : grande image, titre, matière vedette et rangée d'échantillons (style planche éditoriale). */
const ITEMS = [
  { href: "/transformer/", img: "/visuels/hero-3d.webp", title: "Salon velours", sub: "Douceur profonde, lignes calmes.", featured: { tex: "m-velours", brand: "Velours", name: "Rouge grenat profond", tags: ["Tissu", "Usage intensif"] }, row: ["tx-chene", "m-travertin", "m-lin", "tx-laine", "tx-cuir"] },
  { href: "/transformer/", img: "/visuels/visite-3d.webp", title: "Chambre sauge", sub: "Simplicité apaisée, bois blond.", featured: { tex: "tx-chene", brand: "Parquet", name: "Chêne naturel huilé", tags: ["Sol", "Pièces de vie"] }, row: ["m-lin", "tx-coton", "m-chaux", "tx-bouclette", "tx-enduit"] },
  { href: "/transformer/", img: "/visuels/cuisine-3d.webp", title: "Cuisine olive", sub: "Pierre claire, vert tendre.", featured: { tex: "m-ardoise", brand: "Pierre", name: "Dallage gris anthracite", tags: ["Sol", "Pièces humides"] }, row: ["m-gres", "tx-bois-fin", "m-metro", "tx-beton", "m-terrazzo"] },
];

export function Presentations() {
  return (
    <ul className="m-0 grid list-none gap-5 p-0 md:grid-cols-3" aria-label="Exemples de présentations">
      {ITEMS.map((p) => (
        <li key={p.title}>
          <Link href={p.href} className="group relative block overflow-hidden rounded-[28px] bg-[#1b1a18] text-white no-underline" style={{ aspectRatio: "2 / 3" }}>
            <img src={p.img} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]" />
            <span aria-hidden="true" className="absolute inset-0 bg-gradient-to-b from-black/55 via-transparent to-black/25" />
            <span className="absolute left-0 right-0 top-0 p-6">
              <span className="block text-[clamp(24px,2.3vw,32px)] font-[650] leading-[1.05] tracking-[-.025em]">{p.title}</span>
              <span className="mt-1 block text-[clamp(18px,1.7vw,24px)] font-medium leading-tight text-white/75">{p.sub}</span>
            </span>
            <span className="absolute left-1/2 top-[38%] w-[46%] -translate-x-1/2 overflow-hidden rounded-[14px] border-[3px] border-white shadow-2xl" style={{ aspectRatio: "1 / 1" }}>
              <img src={`/textures/${p.featured.tex}/diff.webp`} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
              <span className="absolute inset-0 bg-gradient-to-t from-black/55 to-transparent" />
              <span className="absolute bottom-0 left-0 p-3 text-left">
                <b className="block text-[13px] leading-tight">{p.featured.brand}</b>
                <span className="block text-[12px] leading-tight text-white/85">{p.featured.name}</span>
                <span className="mt-1.5 flex flex-wrap gap-1">{p.featured.tags.map((t) => <span key={t} className="rounded-full bg-white/90 px-2 py-0.5 text-[9.5px] font-medium text-[#111]">{t}</span>)}</span>
              </span>
            </span>
            <span className="absolute inset-x-0 bottom-0 grid grid-cols-5 gap-2 p-4">
              {p.row.map((t) => <img key={t} src={`/textures/${t}/diff.webp`} alt="" loading="lazy" className="aspect-square w-full rounded-[10px] border-2 border-white object-cover shadow-lg" />)}
            </span>
            <span className="sr-only">{`${p.title} : ${p.sub} Exemple de présentation de projet.`}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
