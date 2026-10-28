"use client";
import { useMemo, useState } from "react";
import { CATEGORIES, daysSince, TIERS } from "@/lib/products/schema";
import { byTier, findSimilar, type Filters, type Match, type ObjectFeatures } from "@/lib/studio/similar";

const STYLE_LABELS: Record<string, string> = { contemporain: "Contemporain", minimal: "Minimal", seventies: "Années 70", "design-iconique": "Design iconique", scandinave: "Scandinave", classique: "Classique", vintage: "Vintage", "art-deco": "Art déco", mineral: "Minéral", confort: "Confort", "industriel-chic": "Industriel chic" };
const fmtDate = (iso: string) => new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });

/** Comparateur : produits réels proches de l'objet sélectionné, classés par gamme, avec filtres. */
export function Comparator({ features, objectName }: { features: ObjectFeatures; objectName: string }) {
  const [f, setF] = useState<Filters>({ maxPrice: null, tiers: [], style: null, maxWidth: null });
  const all = useMemo(() => findSimilar(features), [features]);
  const matches = useMemo(() => findSimilar(features, f), [features, f]);
  const tiers = byTier(matches);
  const styles = [...new Set(all.flatMap((m) => m.product.style))];
  const exact = matches.find((m) => m.exact);
  const toggleTier = (t: keyof typeof TIERS) => setF((x) => ({ ...x, tiers: x.tiers?.includes(t) ? x.tiers.filter((y) => y !== t) : [...(x.tiers ?? []), t] }));

  return (
    <section aria-labelledby="h-compare" className="mt-5">
      <div className="flex items-baseline justify-between gap-2">
        <h3 id="h-compare" className="text-[15px] font-semibold">Produits à acheter</h3>
        <span className="text-[11.5px] text-muted">{matches.length} sur {all.length}</span>
      </div>
      {!features.productId && (
        <p className="mt-1.5 rounded-xl bg-[#F4F1EA] px-3 py-2 text-[12px] leading-snug text-[#5F5F67]">
          Ce {objectName.toLowerCase()} est un modèle 3D générique : voici des <strong>alternatives visuelles</strong> vendues par de vraies enseignes, pas le produit exact.
        </p>
      )}
      <div className="mt-3 flex flex-wrap gap-1.5" role="group" aria-label="Gamme">
        {(Object.keys(TIERS) as Array<keyof typeof TIERS>).map((t) => (
          <button key={t} type="button" aria-pressed={Boolean(f.tiers?.includes(t))} onClick={() => toggleTier(t)} className={`rounded-full border px-3 py-1 text-[12px] ${f.tiers?.includes(t) ? "border-ink bg-ink text-white" : "border-line bg-white"}`}>{TIERS[t]}</button>
        ))}
      </div>
      <div className="mt-2 grid grid-cols-2 gap-2 text-[12px]">
        <label className="grid gap-1">Budget max.
          <select className="rounded-lg border border-line bg-white px-2 py-1.5" value={f.maxPrice ?? ""} onChange={(e) => setF((x) => ({ ...x, maxPrice: e.target.value ? Number(e.target.value) : null }))}>
            <option value="">Tous les prix</option>{[100, 300, 500, 1000, 2000, 5000].map((v) => <option key={v} value={v}>{v.toLocaleString("fr-FR")} €</option>)}
          </select>
        </label>
        <label className="grid gap-1">Style
          <select className="rounded-lg border border-line bg-white px-2 py-1.5" value={f.style ?? ""} onChange={(e) => setF((x) => ({ ...x, style: e.target.value || null }))}>
            <option value="">Tous</option>{styles.map((s) => <option key={s} value={s}>{STYLE_LABELS[s] ?? s}</option>)}
          </select>
        </label>
        {features.dims && features.dims.w > 50 && (
          <label className="col-span-2 grid gap-1">Largeur max. {f.maxWidth ? `${f.maxWidth} cm` : "(toutes)"}
            <input type="range" min={40} max={360} step={10} value={f.maxWidth ?? 360} onChange={(e) => setF((x) => ({ ...x, maxWidth: Number(e.target.value) >= 360 ? null : Number(e.target.value) }))} aria-label="Largeur maximale en centimètres" />
          </label>
        )}
      </div>
      {f.maxPrice ? <p className="mt-1 text-[11px] text-muted">Les produits sans prix relevé restent affichés.</p> : null}

      {exact && <ul className="mt-3 grid list-none gap-2 p-0"><ProductCard m={exact} /></ul>}
      {matches.length === 0 ? <p className="mt-4 text-[13px] text-muted">Aucun produit ne correspond à ces filtres{all.length === 0 ? ` : la base ne contient pas encore de ${CATEGORIES[features.category].toLowerCase()}` : ""}.</p> : (
        (Object.keys(TIERS) as Array<keyof typeof TIERS>).map((t) => tiers[t].filter((m) => !m.exact).length > 0 && (
          <div key={t} className="mt-4">
            <h4 className="mb-2 text-[11px] font-semibold uppercase tracking-[.12em] text-muted">{TIERS[t]}</h4>
            <ul className="grid list-none gap-2 p-0">{tiers[t].filter((m) => !m.exact).map((m) => <ProductCard key={m.product.id} m={m} />)}</ul>
          </div>
        ))
      )}
      <p className="mt-4 text-[11px] leading-snug text-muted">Prix et disponibilités relevés sur les sites officiels à la date indiquée : ils peuvent avoir changé. Les photos des produits sont visibles sur les fiches des marques (leurs droits ne nous permettent pas de les reproduire).</p>
    </section>
  );
}

function ProductCard({ m }: { m: Match }) {
  const p = m.product, old = daysSince(p.verification.at) > 30;
  return (
    <li className="rounded-2xl border border-line bg-white p-3 shadow-[0_1px_2px_rgba(0,0,0,.03)]">
      <div className="flex gap-3">
        <div aria-hidden className="relative grid size-16 shrink-0 place-items-center overflow-hidden rounded-xl" style={{ background: `linear-gradient(135deg, ${p.colors[0]?.hex ?? "#ddd"}, #F4F1EA)` }}>
          <span className="text-[9px] font-semibold uppercase tracking-wider text-white/90 mix-blend-difference">{p.brand.slice(0, 10)}</span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-[.08em] text-muted">{p.brand}{p.retailer !== p.brand ? ` · ${p.retailer}` : ""}</p>
          <p className="text-[13.5px] font-medium leading-tight">{p.name}</p>
          <p className="mt-0.5 text-[13px] font-semibold">{p.price ? p.price.text : <span className="font-normal text-muted">Prix : voir la fiche</span>}</p>
        </div>
        <span className={`h-fit shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${m.exact ? "bg-ink text-white" : "bg-[#F4F1EA] text-ink"}`} title="Score de similarité">{m.exact ? "Exact" : `${m.score} %`}</span>
      </div>
      <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 text-[11.5px]">
        {p.dimensions && <><dt className="text-muted">Dimensions</dt><dd>{p.dimensions.text}</dd></>}
        <dt className="text-muted">Matière</dt><dd>{p.material}{p.finish ? ` · ${p.finish}` : ""}</dd>
        {p.designer && <><dt className="text-muted">Design</dt><dd>{p.designer}</dd></>}
        {p.reference && <><dt className="text-muted">Réf.</dt><dd className="font-mono">{p.reference}</dd></>}
        {p.availability && <><dt className="text-muted">Dispo.</dt><dd>{p.availability.text}</dd></>}
      </dl>
      {m.reasons.length > 0 && <p className="mt-1.5 text-[11.5px] text-[#5F5F67]">{m.reasons.slice(0, 3).join(" · ")}</p>}
      {p.note && <p className="mt-1 text-[11px] text-muted">{p.note}</p>}
      <div className="mt-2 flex items-center justify-between gap-2">
        <span className={`text-[10.5px] ${old ? "text-[#9A5B1E]" : "text-muted"}`}>{p.demo ? "Donnée de démonstration (fictive)" : `Vérifié le ${fmtDate(p.verification.at)}${p.price ? ` · ${p.price.region}` : ""}`}</span>
        <a className="btn btn-primary !min-h-0 !px-3 !py-1.5 text-[12px]" href={p.url} target="_blank" rel="noopener noreferrer nofollow">Voir chez {p.retailer}<span className="sr-only"> (nouvel onglet)</span></a>
      </div>
    </li>
  );
}
