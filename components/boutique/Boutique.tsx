"use client";
import { useEffect, useMemo, useState } from "react";
import { chercher, estAccessoire, FAMILLES, norm, selection, type Famille, type IndexCatalogue, type ProduitCatalogue } from "@/lib/catalogue";
import { toggleExternal, useProject } from "@/lib/studio/project";
import { ProduitImage } from "@/components/ProduitImage";
import { PHOTOS_STYLES, tailleUnsplash } from "@/lib/inspirations-photos";
import { imageValide } from "@/lib/catalogue-achetable";

const U = (st: keyof typeof PHOTOS_STYLES, i: number) => tailleUnsplash(PHOTOS_STYLES[st][i]!.src, 160, "webp");
/** Pastille de chaque famille : vraie photo d'intérieur (Unsplash) ou texture réelle de matière. */
export const COUVERTURES: Partial<Record<Famille, string>> = {
  canape: U("contemporain", 0), fauteuil: U("mid-century", 3), chaise: U("scandinave", 2),
  "table-basse": U("japandi", 0), "table-manger": U("haussmannien", 0), rangement: "/matieres/noyer/640.webp",
  luminaire: U("industriel", 4), lampadaire: U("mid-century", 1), tapis: U("boheme", 3), lit: U("wabi-sabi", 4),
  deco: "/matieres/terre-cuite/640.webp", rideau: "/matieres/lin-lave/640.webp", poignee: "/matieres/cuir/640.webp", robinetterie: "/matieres/pierre-calcaire/640.webp",
  "salle-de-bain": U("contemporain", 5), peinture: "/matieres/enduit-chaux/640.webp", sol: "/matieres/parquet-point-de-hongrie/640.webp",
};
const ZONES = { FR: "France", EU: "Europe", US: "États-Unis" } as const;
const AV: Record<string, string> = { InStock: "En stock", OutOfStock: "Épuisé", PreOrder: "Précommande", BackOrder: "Sur commande", LimitedAvailability: "Stock limité" };
const PAGE = 48;
type P = ProduitCatalogue & { f: Famille; score?: number };

const cache = new Map<Famille, Promise<P[]>>();
const load = (f: Famille) => {
  if (!cache.has(f)) cache.set(f, fetch(`/catalogue/${f}.json`).then((r) => (r.ok ? r.json() as Promise<ProduitCatalogue[]> : [])).then((l) => l.filter((p) => !estAccessoire(p.n)).map((p) => ({ ...p, f }))).catch(() => []));
  return cache.get(f)!;
};
const prix = (p: ProduitCatalogue) => (p.p === null ? null : p.p.toLocaleString("fr-FR", { style: "currency", currency: p.c ?? "EUR", maximumFractionDigits: p.p % 1 ? 2 : 0 }));

/**
 * La boutique : tous les produits réels suivis par le robot (prix et disponibilité relevés sur les pages des enseignes),
 * à parcourir par famille, à chercher, filtrer, puis à ajouter à sa pièce ou acheter chez l'enseigne.
 */
export function Boutique() {
  const [index, setIndex] = useState<IndexCatalogue | null>(null);
  const [fam, setFam] = useState<Famille | "tout">("tout");
  const [q, setQ] = useState("");
  const [zone, setZone] = useState<"" | keyof typeof ZONES>("");
  const [vendeur, setVendeur] = useState("");
  const [max, setMax] = useState<number | null>(null);
  const [tri, setTri] = useState<"pertinence" | "prix-asc" | "prix-desc">("pertinence");
  const [stock, setStock] = useState(false);
  const [items, setItems] = useState<P[] | null>(null);
  const [n, setN] = useState(PAGE);
  const project = useProject();
  const inList = (u: string) => project.list.some((x) => x.productId === u);

  useEffect(() => {
    void fetch("/catalogue/index.json").then((r) => (r.ok ? r.json() : null)).then((d: IndexCatalogue | null) => setIndex(d)).catch(() => setIndex(null));
    try {
      const u = new URLSearchParams(location.search), f = u.get("famille"), recherche = u.get("q");
      if (f && f in FAMILLES) setTimeout(() => setFam(f as Famille), 0);
      // Recherche transmise par un lien (ex. une matière choisie dans la pièce 3D).
      if (recherche) setTimeout(() => setQ(recherche.slice(0, 80)), 0);
    } catch { /* */ }
  }, []);
  const familles = useMemo(() => (Object.keys(FAMILLES) as Famille[]).filter((f) => (index?.familles[f] ?? 0) > 0), [index]);
  // Familles à charger : celle choisie, ou toutes dès qu'on cherche ou qu'on regarde « tout ».
  useEffect(() => {
    if (!index) return;
    let alive = true;
    const fs = fam === "tout" ? familles : [fam];
    void Promise.all(fs.map(load)).then((ls) => { if (alive) { setItems(ls.flat()); setN(PAGE); } });
    return () => { alive = false; };
  }, [fam, familles, index]);

  const vendeurs = useMemo(() => [...new Set((items ?? []).map((p) => p.m))].sort(), [items]);
  const list = useMemo(() => {
    let l: P[] = items ?? [];
    if (zone) l = l.filter((p) => (p.z ?? "FR") === zone);
    if (vendeur) l = l.filter((p) => p.m === vendeur);
    if (max) l = l.filter((p) => p.p !== null && p.p <= max);
    if (stock) l = l.filter((p) => p.a === "InStock");
    if (q.trim().length > 1) l = chercher(l, q, 5000) as P[];
    if (tri === "prix-asc") l = [...l].sort((a, b) => (a.p ?? 1e9) - (b.p ?? 1e9));
    if (tri === "prix-desc") l = [...l].sort((a, b) => (b.p ?? -1) - (a.p ?? -1));
    if (tri === "pertinence" && !q.trim()) l = selection(l);
    // Produits avec une vraie photo d'abord, quel que soit le tri (tri stable : l'ordre choisi est gardé).
    l = [...l].sort((a, b) => Number(imageValide(b.i)) - Number(imageValide(a.i)));
    return l;
  }, [items, zone, vendeur, max, stock, q, tri]);

  if (index === null) return <div className="mt-10 min-h-[80vh]" aria-busy="true"><p className="text-muted">Chargement du catalogue…</p></div>;
  const total = index.total;

  return (
    <div>
      <p className="mt-4 text-[14px] text-muted">{total.toLocaleString("fr-FR")} produits réels de {Object.keys(index.vendeurs).length} enseignes, relevés et revérifiés chaque nuit · mis à jour le {new Date(index.updatedAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long" })}</p>

      <nav aria-label="Familles" className="mt-8 flex gap-3 overflow-x-auto pb-2">
        <button type="button" onClick={() => setFam("tout")} aria-pressed={fam === "tout"} className={`shrink-0 rounded-full border px-4 py-2 text-[13.5px] transition ${fam === "tout" ? "border-ink bg-ink text-white" : "border-line bg-surface hover:border-ink"}`}>Tout</button>
        {familles.map((f) => (
          <button key={f} type="button" onClick={() => setFam(f)} aria-pressed={fam === f}
            className={`group flex shrink-0 items-center gap-2 rounded-full border py-1 pl-1 pr-4 text-[13.5px] transition ${fam === f ? "border-ink bg-ink text-white" : "border-line bg-surface hover:border-ink"}`}>
            {COUVERTURES[f] && <span aria-hidden className="size-8 rounded-full bg-cover bg-center" style={{ backgroundImage: `url(${COUVERTURES[f]})` }} />}
            {FAMILLES[f]}<span className={fam === f ? "text-white/70" : "text-muted"}>{index.familles[f]}</span>
          </button>
        ))}
      </nav>

      <div className="mt-6 grid grid-cols-2 gap-2 border-y border-line py-4 sm:gap-3 lg:grid-cols-[1.6fr_repeat(4,1fr)]">
        <input value={q} onChange={(e) => { setQ(e.target.value); setN(PAGE); }} placeholder="Rechercher : canapé bouclé, lampe laiton, vase grès…" aria-label="Rechercher un produit" className="input col-span-2 lg:col-span-1 !rounded-full" />
        <select aria-label="Zone de vente" className="input !rounded-full !px-3 text-[13.5px] sm:!px-4 sm:text-[15px]" value={zone} onChange={(e) => setZone(e.target.value as typeof zone)}><option value="">Toutes zones</option>{Object.entries(ZONES).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
        <select aria-label="Enseigne" className="input !rounded-full !px-3 text-[13.5px] sm:!px-4 sm:text-[15px]" value={vendeur} onChange={(e) => setVendeur(e.target.value)}><option value="">Toutes enseignes</option>{vendeurs.map((v) => <option key={v} value={v}>{v}</option>)}</select>
        <select aria-label="Prix maximum" className="input !rounded-full !px-3 text-[13.5px] sm:!px-4 sm:text-[15px]" value={max ?? ""} onChange={(e) => setMax(e.target.value ? Number(e.target.value) : null)}><option value="">Tous les prix</option>{[50, 100, 250, 500, 1000, 2000, 5000].map((v) => <option key={v} value={v}>Jusqu'à {v.toLocaleString("fr-FR")}</option>)}</select>
        <select aria-label="Trier" className="input !rounded-full !px-3 text-[13.5px] sm:!px-4 sm:text-[15px]" value={tri} onChange={(e) => setTri(e.target.value as typeof tri)}><option value="pertinence">Sélection</option><option value="prix-asc">Prix croissant</option><option value="prix-desc">Prix décroissant</option></select>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-4 text-[13px]">
        <label className="flex items-center gap-2"><input type="checkbox" checked={stock} onChange={(e) => setStock(e.target.checked)} /> En stock uniquement</label>
        <span className="ml-auto text-muted" aria-live="polite">{items === null ? "Chargement…" : `${list.length.toLocaleString("fr-FR")} produit${list.length > 1 ? "s" : ""}`}</span>
      </div>

      {items !== null && list.length === 0 && <p className="mt-16 text-center text-muted">Aucun produit ne correspond. Essayez une autre recherche ou retirez un filtre.</p>}
      <ul className="mt-8 grid min-h-[60vh] list-none grid-cols-2 gap-x-4 gap-y-10 p-0 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {list.slice(0, n).map((p) => (
          <li key={p.u} className="group flex flex-col">
            <a href={p.u} target="_blank" rel="noopener noreferrer nofollow" className="block no-underline" tabIndex={-1} aria-hidden>
              <ProduitImage src={p.i} alt="" merchant={p.m} />
            </a>
            <div className="mt-3 flex items-start justify-between gap-2">
              <p className="text-[10.5px] font-semibold uppercase tracking-[.12em] text-muted">{p.m}{p.b && norm(p.b) !== norm(p.m) ? ` · ${p.b}` : ""}</p>
              {(p.z ?? "FR") !== "FR" && <span className="rounded-full bg-soft px-2 py-0.5 text-[10.5px] text-muted">{ZONES[p.z ?? "FR"]}</span>}
            </div>
            <p className="mt-1 line-clamp-2 text-[14.5px] leading-snug">{p.n}</p>
            <p className="mt-1.5 text-[15px] font-semibold tabular-nums">{prix(p) ?? <span className="text-[13px] font-normal text-muted">Prix sur le site</span>}{p.a && AV[p.a] ? <span className="ml-2 text-[12px] font-normal text-muted">{AV[p.a]}</span> : null}</p>
            <p className="text-[10.5px] text-muted">{FAMILLES[p.f]} · relevé le {new Date(p.d).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              <a className="btn btn-primary !min-h-0 !px-3 !py-1.5 text-[12px]" href={p.u} target="_blank" rel="noopener noreferrer nofollow">Acheter chez {p.m}<span className="sr-only"> : {p.n} (nouvel onglet)</span></a>
              <button type="button" className="btn !min-h-0 !px-3 !py-1.5 text-[12px]" aria-pressed={inList(p.u)} onClick={() => toggleExternal({ title: p.n, url: p.u, merchant: p.m, price: p.p, currency: p.c, checkedAt: p.d, source: "catalogue" })}>{inList(p.u) ? "✓ Dans ma pièce" : "Ajouter à ma pièce"}</button>
            </div>
          </li>
        ))}
      </ul>
      {list.length > n && <div className="mt-8 text-center"><button type="button" className="btn btn-lg" onClick={() => setN((x) => x + PAGE)}>Voir {Math.min(PAGE, list.length - n)} produits de plus</button></div>}
      <p className="mt-10 text-[12px] leading-relaxed text-muted">Liens directs vers les enseignes, sans partenariat ni classement payé. Prix et disponibilité relevés automatiquement sur leurs pages à la date indiquée : ils ont pu changer, vérifiez-les avant l'achat. Les produits vendus aux États-Unis sont affichés en dollars ; la livraison en France n'est pas garantie.</p>
    </div>
  );
}
