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
export function EnLigne({ query, label, forObject, photo }: { query: string; label: string; forObject?: string; photo?: string }) {
  const project = useProject();
  const inList = (u: string) => project.list.some((x) => x.productId === u);
  const [state, setState] = useState<{ q: string; data: RechercheEnLigne | null; error: string | null } | null>(null);
  const [partiel, setPartiel] = useState<{ q: string; data: RechercheEnLigne } | null>(null);
  useEffect(() => {
    let alive = true;
    void searchOnline(query, label, photo, (r) => { if (alive) setPartiel({ q: query, data: r }); })
      .then((r) => { if (alive) setState({ q: query, data: r.ok ? r.value : null, error: r.ok ? null : r.message }); });
    return () => { alive = false; };
  }, [query, label, photo]);
  const loading = !state || state.q !== query;
  // Pendant la recherche : les produits déjà trouvés s'affichent, les prix arrivent au fil de l'eau.
  const list = (loading ? (partiel?.q === query ? partiel.data.produits : []) : state?.data?.produits) ?? [];

  return (
    <section aria-labelledby="h-en-ligne" className="mt-6 border-t border-line pt-5">
      <div className="flex items-baseline justify-between gap-2">
        <h3 id="h-en-ligne" className="text-[15px] font-semibold tracking-tight">Trouvés sur internet par l'IA</h3>
        {!loading && <span className="text-[11.5px] text-muted" aria-live="polite">{list.length} résultat{list.length > 1 ? "s" : ""}</span>}
      </div>
      <p className="mt-1 text-[12px] text-muted">Recherche : « {query} »</p>
      {loading && <p role="status" className="studio-progress mt-3 rounded-[2px] bg-soft px-3 py-2.5 text-[13px]">{list.length ? `${list.length} modèles trouvés · relevé des prix en cours…` : "L'IA cherche ce modèle chez les vendeurs en ligne…"}</p>}
      {loading && !list.length && (
        <ul aria-hidden className="mt-3 grid list-none gap-2 p-0">
          {[0, 1, 2].map((k) => <li key={k} className="studio-shimmer h-[76px] rounded-[2px] bg-soft" style={{ animationDelay: `${k * 0.15}s` }} />)}
        </ul>
      )}
      {!loading && state?.error && (/abonn/.test(state.error)
        // Recherche web payante, réservée aux abonnés : simple information, pas une erreur.
        ? <p className="mt-3 rounded-[2px] bg-soft px-3 py-2.5 text-[12.5px]">Cette recherche sur tout le web est réservée aux abonnés. Gratuitement : « Trouver l'identique » (plus haut) cherche ce meuble exact avec Google Lens, et notre boutique (plus bas) propose des modèles sélectionnés.</p>
        : <p role="alert" className="mt-3 rounded-[2px] bg-[#FBEDE6] px-3 py-2 text-[12.5px] text-[#8A3B17]">{state.error}</p>)}
      {!loading && !state?.error && list.length === 0 && <p className="mt-3 text-[12.5px] text-muted">Aucune page produit trouvée pour cet élément. Essayez « Trouver l'identique » plus haut.</p>}
      {list.length > 0 && (["Économique", "Intermédiaire", "Premium", null] as const).map((g) => {
        const l = list.filter((p) => gamme(p, list) === g);
        if (!l.length) return null;
        const titre = g === "Économique" ? "Petit budget" : g === "Intermédiaire" ? "Budget moyen" : g === "Premium" ? "Haut de gamme" : "Autres modèles";
        return (
          <div key={titre} className="mt-5">
            <p className="text-[10.5px] font-semibold uppercase tracking-[.16em] text-muted">{titre}</p>
            <ul className="mt-2 grid list-none gap-2 p-0">
              {l.map((p) => { const price = fmt(p); return (
                <li key={p.url} className="flex items-center gap-3 rounded-[2px] bg-surface p-2.5">
                  {p.image ? <ProduitImage src={p.image} alt="" merchant={p.merchant} className="w-16 shrink-0" /> : <span aria-hidden className="grid size-16 shrink-0 place-items-center bg-[#EFEBE3] font-display text-[22px] text-[#CFC7BA]">{p.merchant.charAt(0).toUpperCase()}</span>}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[10.5px] font-semibold uppercase tracking-[.1em] text-muted">{p.merchant}</p>
                    <p className="line-clamp-2 text-[13px] font-medium leading-snug">{p.title}</p>
                    <p className="mt-0.5 text-[13px] font-semibold tabular-nums">{price ?? <span className={`font-normal text-muted ${loading && !p.checkedAt ? "studio-shimmer rounded-[2px] px-1" : ""}`}>{loading && !p.checkedAt ? "Prix en cours…" : "Prix sur le site"}</span>}{p.availability && AV[p.availability] ? <span className="ml-2 font-normal text-muted">· {AV[p.availability]}</span> : null}</p>
                    <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-[12px]">
                      <a className="font-semibold underline underline-offset-2" href={p.url} target="_blank" rel="noopener noreferrer nofollow">Voir chez {p.merchant}<span className="sr-only"> (nouvel onglet)</span></a>
                      <button type="button" className="text-muted underline underline-offset-2 hover:text-ink" aria-pressed={inList(p.url)} onClick={() => toggleExternal({ title: p.title, url: p.url, merchant: p.merchant, price: p.price, currency: p.currency, checkedAt: p.checkedAt, source: "internet" }, forObject)}>{inList(p.url) ? "✓ Dans ma pièce" : "Ajouter à ma pièce"}</button>
                    </div>
                  </div>
                </li>); })}
            </ul>
          </div>
        );
      })}
      {!loading && state?.data?.suggestions && (
        <div className="mt-4">
          <p className="text-[11px] text-muted">Recherches Google associées</p>
          <iframe title="Suggestions de recherche Google" sandbox="allow-popups allow-popups-to-escape-sandbox" className="mt-1 h-[64px] w-full rounded-[2px] border-0"
            srcDoc={`<base target="_blank">${state.data.suggestions}`} />
        </div>
      )}
      {list.length > 0 && <p className="mt-4 text-[11px] leading-snug text-muted">Trouvés à l'instant par l'IA avec la recherche Google, chez toutes les enseignes ; prix relevés sur leurs pages quand elles le permettent. Sans partenariat : vérifiez dimensions, prix et livraison chez le vendeur.</p>}
    </section>
  );
}
