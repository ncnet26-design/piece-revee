"use client";
import { useEffect, useState } from "react";
import { chercher, familleDe, FAMILLES, type ProduitCatalogue } from "@/lib/catalogue";
import { toggleExternal, useProject } from "@/lib/studio/project";

const files = new Map<string, Promise<ProduitCatalogue[]>>();
const load = (f: string) => {
  if (!files.has(f)) files.set(f, fetch(`/catalogue/${f}.json`).then((r) => (r.ok ? r.json() as Promise<ProduitCatalogue[]> : [])).catch(() => []));
  return files.get(f)!;
};
const AV: Record<string, string> = { InStock: "En stock", OutOfStock: "Épuisé", PreOrder: "Précommande", BackOrder: "Sur commande", LimitedAvailability: "Stock limité" };

/** Produits ressemblants dans le catalogue tenu à jour chaque nuit par le robot (prix et disponibilité relevés sur les pages des enseignes). */
export function Catalogue({ type, label, query, forObject }: { type: string; label: string; query: string; forObject?: string }) {
  const project = useProject();
  const inList = (u: string) => project.list.some((x) => x.productId === u);
  const f = familleDe(type, label);
  const [res, setRes] = useState<{ key: string; list: Array<ProduitCatalogue & { score: number }>; total: number } | null>(null);
  const key = `${f}|${query}`;
  useEffect(() => {
    if (!f) return;
    let alive = true;
    void load(f).then((all) => { if (alive) setRes({ key, list: chercher(all, `${query} ${label}`, 6), total: all.length }); });
    return () => { alive = false; };
  }, [f, key, query, label]);
  if (!f || !res || res.key !== key || res.total === 0) return null;
  return (
    <section aria-labelledby="h-catalogue" className="mt-6 border-t border-line pt-5">
      <div className="flex items-baseline justify-between gap-2">
        <h3 id="h-catalogue" className="text-[15px] font-semibold tracking-tight">Dans notre catalogue</h3>
        <span className="text-[11.5px] text-muted">{res.total.toLocaleString("fr-FR")} {FAMILLES[f].toLowerCase()} suivis</span>
      </div>
      {res.list.length === 0 ? <p className="mt-2 text-[12.5px] text-muted">Rien d'assez ressemblant parmi les produits suivis.</p> : (
        <ul className="mt-3 grid list-none gap-2 p-0">
          {res.list.map((p) => (
            <li key={p.u} className="rounded-[12px] border border-line bg-white p-3">
              <p className="text-[10.5px] font-semibold uppercase tracking-[.1em] text-muted">{p.m}{p.b && p.b !== p.m ? ` · ${p.b}` : ""}</p>
              <p className="text-[13.5px] font-medium leading-snug">{p.n}</p>
              <p className="mt-0.5 text-[13px] font-semibold tabular-nums">{p.p !== null ? `${p.p.toLocaleString("fr-FR", { maximumFractionDigits: 2 })} ${p.c === "EUR" || !p.c ? "€" : p.c}` : <span className="font-normal text-muted">Prix sur le site</span>}{p.a && AV[p.a] ? <span className="ml-2 font-normal text-muted">· {AV[p.a]}</span> : null}</p>
              <p className="mt-1 text-[10.5px] text-muted">Relevé sur la page de l'enseigne le {new Date(p.d).toLocaleDateString("fr-FR", { day: "numeric", month: "long" })} · ressemblance {p.score} %</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <a className="btn !min-h-0 !px-3 !py-1.5 text-[12px]" href={p.u} target="_blank" rel="noopener noreferrer nofollow">Voir chez {p.m}<span className="sr-only"> (nouvel onglet)</span></a>
                <button type="button" className="btn !min-h-0 !px-3 !py-1.5 text-[12px]" aria-pressed={inList(p.u)} onClick={() => toggleExternal({ title: p.n, url: p.u, merchant: p.m, price: p.p, currency: p.c, checkedAt: p.d, source: "catalogue" }, forObject)}>{inList(p.u) ? "✓ Dans ma pièce" : "Ajouter à ma pièce"}</button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
