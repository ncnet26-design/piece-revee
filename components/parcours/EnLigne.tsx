"use client";
import { useEffect, useState } from "react";
import { searchOnline, type RechercheEnLigne, type Trouve } from "@/lib/ia-jobs";
import { toggleExternal, useProject } from "@/lib/studio/project";
import { ProduitImage } from "@/components/ProduitImage";

const AV: Record<string, string> = { InStock: "En stock", OutOfStock: "Épuisé", PreOrder: "Précommande", BackOrder: "Sur commande", LimitedAvailability: "Stock limité", OnlineOnly: "En ligne uniquement" };
const fmt = (p: Trouve) => (p.price === null ? null : `${p.price.toLocaleString("fr-FR", { minimumFractionDigits: p.price % 1 ? 2 : 0, maximumFractionDigits: 2 })} ${p.currency === "EUR" || !p.currency ? "€" : p.currency}`);

/** Répartit en trois gammes selon les prix relevés (tiers de la fourchette trouvée). */
function gamme(p: Trouve, all: Trouve[]): string | null {
  const prices = all.map((x) => x.price).filter((x): x is number => x !== null).sort((a, b) => a - b);
  if (p.price === null || prices.length < 3) return null;
  const a = prices[Math.floor(prices.length / 3)]!, b = prices[Math.floor((2 * prices.length) / 3)]!;
  return p.price < a ? "Économique" : p.price < b ? "Intermédiaire" : "Premium";
}

/**
 * Produits en vente trouvés à l'instant sur internet pour l'élément touché.
 * Le prix affiché est celui relevé sur la page du vendeur ; sinon « prix sur le site ».
 * Les suggestions de recherche Google sont affichées telles quelles, comme l'exigent les règles de Google.
 */
export function EnLigne({ query, label, forObject }: { query: string; label: string; forObject?: string }) {
  const project = useProject();
  const inList = (u: string) => project.list.some((x) => x.productId === u);
  const [state, setState] = useState<{ q: string; data: RechercheEnLigne | null; error: string | null } | null>(null);
  useEffect(() => {
    let alive = true;
    void searchOnline(query, label).then((r) => { if (alive) setState({ q: query, data: r.ok ? r.value : null, error: r.ok ? null : r.message }); });
    return () => { alive = false; };
  }, [query, label]);
  const loading = !state || state.q !== query;
  const list = state?.data?.produits ?? [];

  return (
    <section aria-labelledby="h-en-ligne" className="mt-6 border-t border-line pt-5">
      <div className="flex items-baseline justify-between gap-2">
        <h3 id="h-en-ligne" className="text-[15px] font-semibold tracking-tight">Trouvés sur internet</h3>
        {!loading && <span className="text-[11.5px] text-muted" aria-live="polite">{list.length} résultat{list.length > 1 ? "s" : ""}</span>}
      </div>
      <p className="mt-1 text-[12px] text-muted">Recherche : « {query} »</p>
      {loading && <p role="status" className="studio-progress mt-3 rounded-[2px] bg-soft px-3 py-2.5 text-[13px]">Recherche en cours chez les vendeurs en ligne…</p>}
      {!loading && state?.error && <p role="alert" className="mt-3 rounded-[2px] bg-[#FBEDE6] px-3 py-2 text-[12.5px] text-[#8A3B17]">{state.error}</p>}
      {!loading && !state?.error && list.length === 0 && <p className="mt-3 text-[12.5px] text-muted">Aucune page produit trouvée pour cet élément. Essayez Google Lens ci-dessous.</p>}
      {list.length > 0 && (
        <ul className="mt-3 grid list-none gap-2 p-0">
          {list.map((p) => { const g = gamme(p, list), price = fmt(p); return (
            <li key={p.url} className="rounded-[2px] border border-line bg-white p-3">
              <div className="flex items-start justify-between gap-3">
                {p.image ? <ProduitImage src={p.image} alt="" merchant={p.merchant} className="w-20 shrink-0" /> : null}
                <div className="min-w-0">
                  <p className="text-[10.5px] font-semibold uppercase tracking-[.1em] text-muted">{p.merchant}{p.brand && !p.merchant.toLowerCase().includes(p.brand.toLowerCase()) ? ` · ${p.brand}` : ""}</p>
                  <p className="text-[13.5px] font-medium leading-snug">{p.title}</p>
                  <p className="mt-0.5 text-[13px] font-semibold tabular-nums">{price ?? <span className="font-normal text-muted">Prix sur le site</span>}{p.availability && AV[p.availability] ? <span className="ml-2 font-normal text-muted">· {AV[p.availability]}</span> : null}</p>
                </div>
                {g && <span className="h-fit shrink-0 rounded-full bg-soft px-2 py-0.5 text-[11px] font-semibold">{g}</span>}
              </div>
              <p className="mt-1 text-[10.5px] text-muted">{p.checkedAt ? `Prix relevé sur la page le ${new Date(p.checkedAt).toLocaleString("fr-FR", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })}` : "Page trouvée par la recherche ; prix non relevé"}</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <a className="btn btn-primary !min-h-0 !px-3 !py-1.5 text-[12px]" href={p.url} target="_blank" rel="noopener noreferrer nofollow">Voir chez {p.merchant}<span className="sr-only"> (nouvel onglet)</span></a>
                <button type="button" className="btn !min-h-0 !px-3 !py-1.5 text-[12px]" aria-pressed={inList(p.url)} onClick={() => toggleExternal({ title: p.title, url: p.url, merchant: p.merchant, price: p.price, currency: p.currency, checkedAt: p.checkedAt, source: "internet" }, forObject)}>{inList(p.url) ? "✓ Dans ma pièce" : "Ajouter à ma pièce"}</button>
              </div>
            </li>); })}
        </ul>
      )}
      {!loading && state?.data?.suggestions && (
        <div className="mt-4">
          <p className="text-[11px] text-muted">Recherches Google associées</p>
          <iframe title="Suggestions de recherche Google" sandbox="allow-popups allow-popups-to-escape-sandbox" className="mt-1 h-[64px] w-full rounded-[2px] border-0"
            srcDoc={`<base target="_blank">${state.data.suggestions}`} />
        </div>
      )}
      {list.length > 0 && <p className="mt-3 text-[11px] leading-snug text-muted">Résultats trouvés automatiquement à l'instant, sans partenariat. Vérifiez dimensions, prix et livraison sur le site du vendeur.</p>}
    </section>
  );
}
