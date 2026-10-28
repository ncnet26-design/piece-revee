"use client";
import { productById, TIERS } from "@/lib/products/schema";
import { updateProject, type Project } from "@/lib/studio/project";

/** Liste d'achats du projet et budget total, calculé uniquement à partir des prix relevés. */
export function ShoppingList({ project }: { project: Project }) {
  const rows = project.list.map((it) => ({ it, p: productById(it.productId) })).filter((r) => r.p);
  const totals = new Map<string, number>();
  let unknown = 0;
  for (const { it, p } of rows) { if (p!.price?.amount != null) totals.set(p!.price.currency, (totals.get(p!.price.currency) ?? 0) + p!.price.amount * it.qty); else unknown++; }
  const eur = totals.get("EUR") ?? 0, budget = project.brief.budget;
  const fmt = (v: number, c: string) => v.toLocaleString("fr-FR", { style: "currency", currency: c, maximumFractionDigits: 2 });
  const qty = (id: string, d: number) => updateProject((p) => ({ ...p, list: p.list.map((x) => (x.productId === id ? { ...x, qty: Math.max(1, x.qty + d) } : x)) }));
  const remove = (id: string) => updateProject((p) => ({ ...p, list: p.list.filter((x) => x.productId !== id) }));
  if (!rows.length) return <div className="grid place-items-center rounded-[14px] border border-dashed border-line bg-white/60 p-10 text-center text-[13.5px] text-muted">Votre liste est vide. Touchez un meuble dans votre rendu ou dans la 3D, puis « Ajouter à ma liste ».</div>;
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <ul className="grid list-none gap-2 p-0">
        {rows.map(({ it, p }) => (
          <li key={it.productId} className="flex flex-wrap items-center gap-3 rounded-2xl border border-line bg-white p-3">
            <span aria-hidden className="size-12 shrink-0 rounded-xl" style={{ background: `radial-gradient(120% 90% at 30% 25%, #fff 0%, ${p!.colors[0]?.hex ?? "#ddd"} 70%)` }} />
            <div className="min-w-0 flex-1">
              <p className="text-[10.5px] font-semibold uppercase tracking-[.1em] text-muted">{p!.brand} · {TIERS[p!.tier]}</p>
              <p className="text-[14px] font-medium leading-tight">{p!.name}</p>
              <p className="text-[12px] text-muted">{p!.price ? `${p!.price.text} · relevé le ${new Date(p!.price.observedAt).toLocaleDateString("fr-FR")}` : "Prix sur la fiche"}</p>
            </div>
            <div className="flex items-center gap-1 text-[13px]" role="group" aria-label={`Quantité de ${p!.name}`}>
              <button type="button" className="size-8 rounded-full border border-line" onClick={() => qty(it.productId, -1)} aria-label="Retirer un">−</button>
              <span className="w-6 text-center tabular-nums">{it.qty}</span>
              <button type="button" className="size-8 rounded-full border border-line" onClick={() => qty(it.productId, 1)} aria-label="Ajouter un">+</button>
            </div>
            <a className="btn !min-h-0 !px-3 !py-1.5 text-[12px]" href={p!.url} target="_blank" rel="noopener noreferrer nofollow">Fiche<span className="sr-only"> {p!.name} (nouvel onglet)</span></a>
            <button type="button" className="text-[12px] text-muted underline" onClick={() => remove(it.productId)}>Retirer</button>
          </li>
        ))}
      </ul>
      <aside className="h-fit rounded-[14px] border border-line bg-white p-5" aria-label="Budget">
        <p className="text-[10.5px] font-semibold uppercase tracking-[.16em] text-muted">Budget</p>
        {[...totals].map(([c, v]) => <p key={c} className="mt-1 text-[26px] font-semibold tabular-nums tracking-tight">{fmt(v, c)}</p>)}
        {unknown > 0 && <p className="mt-1 text-[12px] text-muted">+ {unknown} produit{unknown > 1 ? "s" : ""} sans prix relevé</p>}
        {totals.size > 1 && <p className="mt-1 text-[12px] text-muted">Montants dans plusieurs devises : non additionnés.</p>}
        {budget ? (<>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-line"><div className={`h-full ${eur > budget ? "bg-[#B5603E]" : "bg-ink"}`} style={{ width: `${Math.min(100, (eur / budget) * 100)}%` }} /></div>
          <p className="mt-1.5 text-[12.5px]">{eur > budget ? `Dépassement de ${fmt(eur - budget, "EUR")}` : `Reste ${fmt(budget - eur, "EUR")} sur ${fmt(budget, "EUR")}`}</p>
        </>) : <p className="mt-3 text-[12px] text-muted">Indiquez un budget dans « Créer » pour le suivre ici.</p>}
        <p className="mt-4 text-[11px] leading-snug text-muted">Prix relevés sur les sites des enseignes, hors livraison : vérifiez-les avant l'achat.</p>
      </aside>
    </div>
  );
}
