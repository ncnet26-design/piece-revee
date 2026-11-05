"use client";
import { MentionIA } from "@/components/MentionIA";
import Link from "next/link";
import { useState } from "react";
import type { ProduitCatalogue } from "@/lib/catalogue";
import { PIECES } from "@/components/shop-the-look-pieces";
import { Photo } from "@/components/Photo";
import { ProduitImage } from "@/components/ProduitImage";

const fmt = (p: ProduitCatalogue) => (p.p === null ? "Prix sur le site" : p.p.toLocaleString("fr-FR", { style: "currency", currency: p.c ?? "EUR", maximumFractionDigits: 0 }));

/** « Shop the look » : chaque pièce du salon d'exemple mène aux produits ressemblants de la boutique (calculés à la publication). */
export function ShopTheLookVue({ found }: { found: Record<string, ProduitCatalogue[]> }) {
  const [sel, setSel] = useState(PIECES[1]!);
  const list = found[sel.id] ?? [];

  return (
    <div className="grid gap-8 lg:grid-cols-[1.55fr_1fr] lg:gap-12">
      <figure className="relative m-0 self-start overflow-hidden rounded-[2px] bg-soft">
        <Photo src="/editorial/ia/salon-boucle-noyer.webp" sizes="(min-width:1024px) 66vw, 100vw" alt="Salon : canapé courbe en bouclé, table basse en travertin, buffet cannelé en noyer" className="block aspect-[16/9] w-full object-cover" />
        {PIECES.map((p) => (
          <button key={p.id} type="button" onClick={() => setSel(p)} aria-pressed={sel.id === p.id} aria-label={`${p.label} : voir les produits ressemblants`}
            className="group absolute -translate-x-1/2 -translate-y-1/2" style={{ left: `${p.x}%`, top: `${p.y}%` }}>
            <span className={`grid size-8 place-items-center rounded-full bg-white/95 shadow-[0_0_0_8px_rgba(255,255,255,.28)] transition ${sel.id === p.id ? "scale-110" : "group-hover:scale-110"}`}>
              <span className={`size-2.5 rounded-full ${sel.id === p.id ? "bg-bronze" : "bg-ink"}`} />
            </span>
          </button>
        ))}
        <MentionIA />
      </figure>
      <div aria-live="polite">
        <p className="eyebrow">Dans l'image</p>
        <h3 className="mt-2 font-display text-[34px] font-normal leading-tight">{sel.label}</h3>
        <ul className="mt-6 list-none divide-y divide-line border-y border-line p-0">
          {list.length === 0 && <li className="py-4 text-[14px] text-muted">Pas encore de produit assez ressemblant dans la boutique : le robot en ajoute chaque nuit.</li>}
          {list.map((p) => (
            <li key={p.u}>
              <a href={p.u} target="_blank" rel="noopener noreferrer nofollow" className="group flex items-center gap-4 py-3 no-underline">
                <ProduitImage src={p.i} alt="" merchant={p.m} className="w-16 shrink-0" />
                <span className="min-w-0 flex-1">
                  <span className="block text-[11px] font-semibold uppercase tracking-[.14em] text-muted">{p.m}</span>
                  <span className="line-clamp-2 text-[15px] group-hover:underline">{p.n}</span><span className="sr-only"> (nouvel onglet)</span>
                </span>
                <span className="shrink-0 text-[15px] font-medium tabular-nums">{fmt(p)}</span>
              </a>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-[12px] text-muted">Prix relevés sur les sites des enseignes{list[0] ? ` (le ${new Date(list[0].d).toLocaleDateString("fr-FR", { day: "numeric", month: "long" })})` : ""}. Aucune marque ne paie pour être classée.</p>
        <div className="mt-6 flex flex-wrap gap-2">
          <Link href={`/boutique/?famille=${sel.famille}`} className="btn">Tout voir dans la boutique</Link>
          <Link href="/transformer/" className="btn btn-primary">Faire de même avec ma pièce</Link>
        </div>
      </div>
    </div>
  );
}
