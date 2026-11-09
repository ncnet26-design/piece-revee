"use client";
import { useEffect, useState } from "react";
import { chercher, familleDe, FAMILLES, type ProduitCatalogue } from "@/lib/catalogue";
import { toggleExternal, useProject } from "@/lib/studio/project";
import { ProduitImage } from "@/components/ProduitImage";
import { accord, attributsObjet } from "@/lib/attributs";

const files = new Map<string, Promise<ProduitCatalogue[]>>();
const load = (f: string) => {
  if (!files.has(f)) files.set(f, fetch(`/boutique/${f}.json`).then((r) => (r.ok ? r.json() as Promise<ProduitCatalogue[]> : [])).catch(() => []));
  return files.get(f)!;
};
const AV: Record<string, string> = { InStock: "En stock", OutOfStock: "Épuisé", PreOrder: "Précommande", BackOrder: "Sur commande", LimitedAvailability: "Stock limité" };

/** Produits ressemblants dans le catalogue tenu à jour chaque nuit par le robot (prix et disponibilité relevés sur les pages des enseignes). */
type ObjetVu = { label: string; materials?: string[]; colors?: Array<{ name: string }>; shape?: string[] };
export function Catalogue({ type, label, query, forObject, objet }: { type: string; label: string; query: string; forObject?: string; objet?: ObjetVu }) {
  const project = useProject();
  const inList = (u: string) => project.list.some((x) => x.productId === u);
  const f = familleDe(type, label);
  const [plus, setPlus] = useState<{ key: string; n: number }>({ key: "", n: 6 });
  const [res, setRes] = useState<{ key: string; list: Array<ProduitCatalogue & { score: number; communs: string[] }>; total: number; ecartes: number } | null>(null);
  const objetCle = objet ? JSON.stringify([objet.materials, objet.colors?.map((c) => c.name), objet.shape]) : "";
  const key = `${f}|${query}|${objetCle}`;
  useEffect(() => {
    if (!f) return;
    let alive = true;
    void load(f).then((all) => {
      if (!alive) return;
      // Correspondance stricte : une autre matière, une autre couleur ou une autre forme que le meuble de l'image écarte le produit.
      const vu = objet ? attributsObjet(objet) : null;
      const brut = chercher(all, `${query} ${label}`, 500);
      const notes = brut.map((p) => { const a = vu ? accord(vu, `${p.n} ${p.b ?? ""}`) : { ok: true, communs: [], bonus: 0 }; return { ...p, score: Math.min(100, p.score + a.bonus), communs: a.communs, ok: a.ok }; });
      const gardes = notes.filter((p) => p.ok).sort((a, b) => b.communs.length - a.communs.length || b.score - a.score || (a.p ?? 1e9) - (b.p ?? 1e9));
      setRes({ key, list: gardes, total: all.length, ecartes: notes.length - gardes.length });
    });
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- objet résumé par objetCle
  }, [f, key, query, label]);
  const vus = plus.key === key ? plus.n : 6;
  if (!f || !res || res.key !== key || res.total === 0) return null;
  return (
    <section aria-labelledby="h-catalogue" className="mt-6 border-t border-line pt-5">
      <div className="flex items-baseline justify-between gap-2">
        <h3 id="h-catalogue" className="text-[15px] font-semibold tracking-tight">Dans notre catalogue</h3>
        <span className="text-[11.5px] text-muted">{res.total.toLocaleString("fr-FR")} {FAMILLES[f].toLowerCase()} suivis</span>
      </div>
      {res.ecartes > 0 && <p className="mt-1 text-[11.5px] text-muted">{res.ecartes} produit{res.ecartes > 1 ? "s" : ""} écarté{res.ecartes > 1 ? "s" : ""} : autre matière, couleur ou forme que sur l'image.</p>}
      {res.list.length === 0 ? <p className="mt-2 text-[12.5px] text-muted">Rien d'identique parmi les produits suivis : utilisez « Trouver l'identique » ci-dessus.</p> : (
        <ul className="mt-3 grid list-none gap-2 p-0">
          {res.list.slice(0, vus).map((p) => (
            <li key={p.u} className="flex gap-3 rounded-[2px] border border-line bg-white p-3">
              <ProduitImage src={p.i} alt="" merchant={p.m} className="w-20 shrink-0 self-start" />
              <div className="min-w-0 flex-1">
              <p className="text-[10.5px] font-semibold uppercase tracking-[.1em] text-muted">{p.m}{p.b && p.b !== p.m ? ` · ${p.b}` : ""}</p>
              <p className="text-[13.5px] font-medium leading-snug">{p.n}</p>
              <p className="mt-0.5 text-[13px] font-semibold tabular-nums">{p.p !== null ? `${p.p.toLocaleString("fr-FR", { maximumFractionDigits: 2 })} ${p.c === "EUR" || !p.c ? "€" : p.c}` : <span className="font-normal text-muted">Prix sur le site</span>}{p.a && AV[p.a] ? <span className="ml-2 font-normal text-muted">· {AV[p.a]}</span> : null}</p>
              {p.communs.length > 0 && <p className="mt-1 flex flex-wrap gap-1">{p.communs.map((c) => <span key={c} className="rounded-full bg-[var(--soft)] px-2 py-0.5 text-[10.5px] font-medium">{c} ✓</span>)}</p>}
              <p className="mt-1 text-[10.5px] text-muted">Relevé sur la page de l'enseigne le {new Date(p.d).toLocaleDateString("fr-FR", { day: "numeric", month: "long" })}</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <a className="btn !min-h-0 !px-3 !py-1.5 text-[12px]" href={p.u} target="_blank" rel="noopener noreferrer nofollow">Voir chez {p.m}<span className="sr-only"> (nouvel onglet)</span></a>
                <button type="button" className="btn !min-h-0 !px-3 !py-1.5 text-[12px]" aria-pressed={inList(p.u)} onClick={() => toggleExternal({ title: p.n, url: p.u, merchant: p.m, price: p.p, currency: p.c, checkedAt: p.d, source: "catalogue" }, forObject)}>{inList(p.u) ? "✓ Dans ma pièce" : "Ajouter à ma pièce"}</button>
              </div>
              </div>
            </li>
          ))}
        </ul>
      )}
      {res.list.length > vus && (
        <button type="button" className="btn mt-3 w-full" onClick={() => setPlus({ key, n: vus + 12 })}>
          Voir {Math.min(12, res.list.length - vus)} modèles de plus <span className="text-muted">· {res.list.length - vus} autres trouvés</span>
        </button>
      )}
    </section>
  );
}
