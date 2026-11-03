"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { chercher, estAccessoire, type Famille, type ProduitCatalogue } from "@/lib/catalogue";

/** Les pièces du salon d'exemple, leur zone sur l'image et la recherche faite dans la boutique. */
const PIECES: Array<{ id: string; label: string; famille: Famille; query: string; x: number; y: number }> = [
  { id: "canape", label: "Canapé courbe en bouclé", famille: "canape", query: "canapé courbe bouclé", x: 26, y: 70 },
  { id: "table", label: "Table basse en travertin", famille: "table-basse", query: "table basse travertin ovale", x: 59, y: 79 },
  { id: "buffet", label: "Buffet cannelé en noyer", famille: "rangement", query: "buffet noyer cannelé", x: 77, y: 63 },
];
const fmt = (p: ProduitCatalogue) => (p.p === null ? "Prix sur le site" : p.p.toLocaleString("fr-FR", { style: "currency", currency: p.c ?? "EUR", maximumFractionDigits: 0 }));

/** « Shop the look » : chaque pièce du salon d'exemple mène aux produits ressemblants de la boutique (prix relevés, liens d'achat). */
export function ShopTheLook() {
  const [sel, setSel] = useState(PIECES[1]!);
  const [found, setFound] = useState<Record<string, Array<ProduitCatalogue & { score: number }>>>({});
  useEffect(() => {
    let alive = true;
    void Promise.all(PIECES.map(async (p) => {
      const l = await fetch(`/catalogue/${p.famille}.json`).then((r) => (r.ok ? r.json() as Promise<ProduitCatalogue[]> : [])).catch(() => []);
      return [p.id, chercher(l.filter((x) => !estAccessoire(x.n)), p.query, 3)] as const;
    })).then((r) => { if (alive) setFound(Object.fromEntries(r)); });
    return () => { alive = false; };
  }, []);
  const list = found[sel.id];

  return (
    <div className="grid gap-8 lg:grid-cols-[1.55fr_1fr] lg:gap-12">
      <figure className="relative m-0 self-start overflow-hidden rounded-[6px] bg-soft">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/editorial/ia/salon-boucle-noyer-2400.webp" alt="Salon : canapé courbe en bouclé, table basse en travertin, buffet cannelé en noyer" loading="lazy" className="block aspect-[16/9] w-full object-cover" />
        {PIECES.map((p) => (
          <button key={p.id} type="button" onClick={() => setSel(p)} aria-pressed={sel.id === p.id} aria-label={`${p.label} : voir les produits ressemblants`}
            className="group absolute -translate-x-1/2 -translate-y-1/2" style={{ left: `${p.x}%`, top: `${p.y}%` }}>
            <span className={`grid size-8 place-items-center rounded-full bg-white/95 shadow-[0_0_0_8px_rgba(255,255,255,.28)] transition ${sel.id === p.id ? "scale-110" : "group-hover:scale-110"}`}>
              <span className={`size-2.5 rounded-full ${sel.id === p.id ? "bg-bronze" : "bg-ink"}`} />
            </span>
          </button>
        ))}
        <figcaption className="absolute bottom-3 left-3 rounded-full bg-black/45 px-2.5 py-1 text-[10.5px] text-white backdrop-blur">Image générée par IA</figcaption>
      </figure>
      <div aria-live="polite">
        <p className="eyebrow">Dans l'image</p>
        <h3 className="mt-2 font-display text-[34px] font-normal leading-tight">{sel.label}</h3>
        <ul className="mt-6 list-none divide-y divide-line border-y border-line p-0">
          {list === undefined && <li className="py-4 text-[14px] text-muted">Recherche dans la boutique…</li>}
          {list?.length === 0 && <li className="py-4 text-[14px] text-muted">Pas encore de produit assez ressemblant dans la boutique : le robot en ajoute chaque nuit.</li>}
          {list?.map((p) => (
            <li key={p.u} className="flex items-baseline justify-between gap-4 py-4">
              <a href={p.u} target="_blank" rel="noopener noreferrer nofollow" className="min-w-0 no-underline hover:underline">
                <span className="block text-[11px] font-semibold uppercase tracking-[.14em] text-muted">{p.m}</span>
                <span className="text-[15px]">{p.n}</span><span className="sr-only"> (nouvel onglet)</span>
              </a>
              <span className="shrink-0 text-[15px] font-medium tabular-nums">{fmt(p)}</span>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-[12px] text-muted">Prix relevés sur les sites des enseignes. Aucune marque ne paie pour être classée.</p>
        <div className="mt-6 flex flex-wrap gap-2">
          <Link href={`/boutique/?famille=${sel.famille}`} className="btn">Tout voir dans la boutique</Link>
          <Link href="/transformer/" className="btn btn-primary">Faire de même avec ma pièce</Link>
        </div>
      </div>
    </div>
  );
}
