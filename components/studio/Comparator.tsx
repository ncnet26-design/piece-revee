"use client";
import { useMemo, useState } from "react";
import { CATEGORIES, daysSince, PRODUCTS, TIERS, type Product } from "@/lib/products/schema";
import { byTier, findSimilar, type Filters, type Match, type ObjectFeatures } from "@/lib/studio/similar";

const STYLE: Record<string, string> = { contemporain: "Contemporain", minimal: "Minimal", seventies: "Années 70", "design-iconique": "Design iconique", scandinave: "Scandinave", classique: "Classique", vintage: "Vintage", "art-deco": "Art déco", mineral: "Minéral", confort: "Confort", organique: "Organique", "industriel-chic": "Industriel chic", glam: "Glam" };
const MATS: Record<string, string> = { travertin: "Travertin", "travertin-effet": "Effet travertin", pierre: "Pierre", marbre: "Marbre", bois: "Bois", velours: "Velours", boucle: "Bouclé", cuir: "Cuir", laiton: "Laiton", verre: "Verre", metal: "Métal", ciment: "Ciment" };
const fmtDate = (iso: string) => new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
const TIER_KEYS = Object.keys(TIERS) as Array<keyof typeof TIERS>;

/**
 * Alternatives réelles au meuble sélectionné, classées par ressemblance puis réparties par gamme.
 * Le classement ne dépend que de la ressemblance (jamais d'un partenariat).
 */
export function Comparator({ features, objectName, preset, inList, onAdd, onReplace }: {
  features: ObjectFeatures; objectName: string; preset?: Filters;
  inList: (id: string) => boolean; onAdd: (p: Product) => void; onReplace?: (p: Product) => void;
}) {
  const [f, setF] = useState<Filters>(() => ({ maxPrice: null, tiers: [], style: null, maxWidth: null, material: null, brand: null, market: null, ...preset }));
  const all = useMemo(() => findSimilar(features), [features]);
  const matches = useMemo(() => findSimilar(features, f), [features, f]);
  const tiers = byTier(matches);
  const sameCategory = PRODUCTS.filter((p) => p.category === features.category).length;
  const brands = [...new Set(all.map((m) => m.product.brand))].sort();
  const mats = [...new Set(all.flatMap((m) => m.product.materials))].filter((x) => MATS[x]);
  const styles = [...new Set(all.flatMap((m) => m.product.style))];
  const exact = matches.find((m) => m.exact);
  const set = (p: Partial<Filters>) => setF((x) => ({ ...x, ...p }));
  const toggleTier = (t: keyof typeof TIERS) => set({ tiers: f.tiers?.includes(t) ? f.tiers.filter((y) => y !== t) : [...(f.tiers ?? []), t] });
  const sel = "rounded-lg border border-line bg-white px-2 py-1.5 text-[12px]";

  return (
    <section aria-labelledby="h-compare" className="mt-6">
      <div className="flex items-baseline justify-between gap-2">
        <h3 id="h-compare" className="text-[15px] font-semibold tracking-tight">Où trouver un modèle ressemblant</h3>
        <span className="text-[11.5px] text-muted" aria-live="polite">{matches.length} résultat{matches.length > 1 ? "s" : ""}</span>
      </div>
      {!features.productId && (
        <p className="mt-1.5 text-[12px] leading-snug text-[#5F5F67]">
          Ce {objectName.toLowerCase()} est une création originale : voici des <strong className="font-semibold text-ink">alternatives ressemblantes</strong> vendues aujourd'hui, pas le modèle exact.
        </p>
      )}
      <details className="group mt-3 rounded-xl border border-line bg-white/70 open:bg-white">
        <summary className="flex cursor-pointer list-none items-center justify-between px-3 py-2 text-[12.5px] font-medium">Filtres<span aria-hidden className="text-muted transition group-open:rotate-180">⌄</span></summary>
        <div className="grid gap-2 px-3 pb-3">
          <div className="flex flex-wrap gap-1.5" role="group" aria-label="Gamme">
            {TIER_KEYS.map((t) => <button key={t} type="button" aria-pressed={Boolean(f.tiers?.includes(t))} onClick={() => toggleTier(t)} className={`rounded-full border px-3 py-1 text-[12px] transition ${f.tiers?.includes(t) ? "border-ink bg-ink text-white" : "border-line bg-white hover:border-ink/40"}`}>{TIERS[t]}</button>)}
          </div>
          <div className="grid grid-cols-2 gap-2 text-[12px]">
            <label className="grid gap-1">Budget max.<select className={sel} value={f.maxPrice ?? ""} onChange={(e) => set({ maxPrice: e.target.value ? Number(e.target.value) : null })}><option value="">Tous les prix</option>{[150, 300, 400, 500, 1000, 2000, 5000].map((v) => <option key={v} value={v}>{v.toLocaleString("fr-FR")} €</option>)}</select></label>
            <label className="grid gap-1">Matière<select className={sel} value={f.material ?? ""} onChange={(e) => set({ material: e.target.value || null })}><option value="">Toutes</option>{mats.map((m) => <option key={m} value={m}>{MATS[m]}</option>)}</select></label>
            <label className="grid gap-1">Style<select className={sel} value={f.style ?? ""} onChange={(e) => set({ style: e.target.value || null })}><option value="">Tous</option>{styles.map((s) => <option key={s} value={s}>{STYLE[s] ?? s}</option>)}</select></label>
            <label className="grid gap-1">Marque<select className={sel} value={f.brand ?? ""} onChange={(e) => set({ brand: e.target.value || null })}><option value="">Toutes</option>{brands.map((b) => <option key={b} value={b}>{b}</option>)}</select></label>
            <label className="grid gap-1">Boutique<select className={sel} value={f.market ?? ""} onChange={(e) => set({ market: (e.target.value || null) as Filters["market"] })}><option value="">Tous pays</option><option value="FR">Boutiques françaises</option><option value="EU">France et Europe</option></select></label>
            {features.dims && features.dims.w > 50 && (
              <label className="grid gap-1">Largeur max.<select className={sel} value={f.maxWidth ?? ""} onChange={(e) => set({ maxWidth: e.target.value ? Number(e.target.value) : null })}><option value="">Toutes</option>{[80, 100, 120, 150, 200, 250].map((v) => <option key={v} value={v}>{v} cm</option>)}</select></label>
            )}
          </div>
          {f.maxPrice ? <p className="text-[11px] text-muted">Les produits sans prix relevé restent affichés.</p> : null}
        </div>
      </details>

      {exact && <ul className="mt-3 grid list-none gap-2 p-0"><ProductCard m={exact} added={inList(exact.product.id)} onAdd={onAdd} onReplace={onReplace} /></ul>}
      {matches.length === 0 ? (
        <p className="mt-4 rounded-xl bg-[#F4F1EA] px-3 py-3 text-[13px] leading-snug">
          {sameCategory === 0 ? `Notre base ne contient pas encore de ${CATEGORIES[features.category].toLowerCase()} vérifiés.` : all.length === 0 ? "Aucun produit de notre base n'est assez ressemblant : nous préférons ne rien proposer plutôt qu'un modèle sans rapport." : "Aucun produit ne correspond à ces filtres."}
        </p>
      ) : TIER_KEYS.filter((t) => !f.tiers?.length || f.tiers.includes(t)).map((t) => {
        const list = tiers[t].filter((m) => !m.exact);
        return (
          <div key={t} className="mt-5">
            <h4 className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[.14em] text-muted">{TIERS[t]}<span className="h-px flex-1 bg-line" /></h4>
            {list.length ? <ul className="grid list-none gap-2 p-0">{list.map((m) => <ProductCard key={m.product.id} m={m} added={inList(m.product.id)} onAdd={onAdd} onReplace={onReplace} />)}</ul>
              : <p className="text-[12px] text-muted">Pas d'alternative assez ressemblante dans cette gamme.</p>}
          </div>
        );
      })}
      <p className="mt-5 text-[11px] leading-snug text-muted">Prix relevés sur les sites des enseignes à la date indiquée, susceptibles d'avoir changé. Les photos des produits se trouvent sur leurs fiches : leurs droits ne nous permettent pas encore de les reproduire ici.</p>
    </section>
  );
}

function ProductCard({ m, added, onAdd, onReplace }: { m: Match; added: boolean; onAdd: (p: Product) => void; onReplace?: (p: Product) => void }) {
  const p = m.product, old = daysSince(p.verification.at) > 30;
  return (
    <li className="pr-card rounded-2xl border border-line bg-white p-3">
      <div className="flex gap-3">
        <div aria-hidden className="relative size-14 shrink-0 overflow-hidden rounded-xl" style={{ background: `radial-gradient(120% 90% at 30% 25%, #fff 0%, ${p.colors[0]?.hex ?? "#ddd"} 70%)` }} />
        <div className="min-w-0 flex-1">
          <p className="text-[10.5px] font-semibold uppercase tracking-[.1em] text-muted">{p.brand}{p.retailer !== p.brand ? ` · chez ${p.retailer}` : ""}</p>
          <p className="text-[13.5px] font-medium leading-tight">{p.name}</p>
          <p className="mt-0.5 text-[13px] font-semibold tabular-nums">{p.price ? p.price.text : <span className="font-normal text-muted">Prix sur la fiche</span>}</p>
        </div>
        <span className={`h-fit shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold tabular-nums ${m.exact ? "bg-ink text-white" : "bg-[#F4F1EA] text-ink"}`} title="Ressemblance avec le meuble du rendu">{m.exact ? "Exact" : `${m.score} %`}</span>
      </div>
      <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 text-[11.5px]">
        {p.dimensions && <><dt className="text-muted">Dimensions</dt><dd>{p.dimensions.text}</dd></>}
        <dt className="text-muted">Matière</dt><dd>{p.material}{p.finish ? ` · ${p.finish}` : ""}</dd>
        {p.designer && <><dt className="text-muted">Design</dt><dd>{p.designer}</dd></>}
        {p.reference && <><dt className="text-muted">Réf.</dt><dd className="font-mono">{p.reference}</dd></>}
        {p.availability && <><dt className="text-muted">Dispo.</dt><dd>{p.availability.text}</dd></>}
      </dl>
      {m.reasons.length > 0 && <p className="mt-1.5 text-[11.5px] text-[#5F5F67]">{m.reasons.slice(0, 4).join(" · ")}</p>}
      {p.note && <p className="mt-1 text-[11px] text-[#9A5B1E]">{p.note}</p>}
      <p className={`mt-1.5 text-[10.5px] ${old ? "text-[#9A5B1E]" : "text-muted"}`}>{p.demo ? "Donnée de démonstration (fictive)" : `Vérifié le ${fmtDate(p.verification.at)}${p.price ? ` · ${p.price.region}` : ""}`}</p>
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <a className="btn btn-primary !min-h-0 !px-3 !py-1.5 text-[12px]" href={p.url} target="_blank" rel="noopener noreferrer nofollow">Voir la fiche<span className="sr-only"> {p.name} chez {p.retailer} (nouvel onglet)</span></a>
        <button type="button" className="btn !min-h-0 !px-3 !py-1.5 text-[12px]" aria-pressed={added} onClick={() => onAdd(p)}>{added ? "✓ Dans ma liste" : "Ajouter à ma liste"}</button>
        {onReplace && <button type="button" className="btn !min-h-0 !px-3 !py-1.5 text-[12px]" onClick={() => onReplace(p)}>Essayer dans la pièce</button>}
      </div>
    </li>
  );
}
