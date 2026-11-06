"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { chercher, FAMILLES, norm, selection, type Famille, type IndexCatalogue, type ProduitCatalogue } from "@/lib/catalogue";
import { toggleExternal, useProject } from "@/lib/studio/project";
import { ProduitImage } from "@/components/ProduitImage";

const PAGE = 40;
type Gamme = "petit" | "moyen" | "haut";
type P = ProduitCatalogue & { f: Famille; g: Gamme; score?: number };
const NOM_GAMME: Record<Gamme, string> = { petit: "Petit budget", moyen: "Budget moyen", haut: "Haut de gamme" };
const AV: Record<string, string> = { InStock: "En stock", PreOrder: "Précommande", BackOrder: "Sur commande", LimitedAvailability: "Stock limité" };

/** Sélection de la boutique (scripts/selection-boutique.ts) : références d'exception, à tous les prix. */
const cache = new Map<Famille, Promise<P[]>>();
const load = (f: Famille) => {
  if (!cache.has(f)) cache.set(f, fetch(`/boutique/${f}.json`).then((r) => (r.ok ? r.json() as Promise<Array<ProduitCatalogue & { g: Gamme }>> : [])).then((l) => l.map((p) => ({ ...p, f }))).catch(() => []));
  return cache.get(f)!;
};
const prix = (p: ProduitCatalogue) => (p.p === null ? null : p.p.toLocaleString("fr-FR", { style: "currency", currency: p.c ?? "EUR", maximumFractionDigits: p.p % 1 ? 2 : 0 }));

/**
 * Toute la boutique : la sélection d'exception par famille, à chercher, filtrer par budget et par enseigne,
 * puis à ajouter à sa pièce ou à acheter chez l'enseigne. Photos centrées sur fond beige, chargées depuis l'enseigne.
 */
export function Boutique() {
  const [index, setIndex] = useState<IndexCatalogue | null>(null);
  const [fam, setFam] = useState<Famille | "tout">("tout");
  const [gamme, setGamme] = useState<Gamme | "">("");
  const [q, setQ] = useState("");
  const [vendeur, setVendeur] = useState("");
  const [tri, setTri] = useState<"selection" | "prix-asc" | "prix-desc">("selection");
  const [items, setItems] = useState<P[] | null>(null);
  const [n, setN] = useState(PAGE);
  const project = useProject();
  const pret = index !== null;
  // Données chargées quand la boutique approche de l'écran (pas au chargement de la page).
  const racine = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = racine.current;
    if (!el || typeof IntersectionObserver === "undefined") { setTimeout(() => setVisible(true), 0); return; }
    const o = new IntersectionObserver((e) => { if (e.some((x) => x.isIntersecting)) { setVisible(true); o.disconnect(); } }, { rootMargin: "800px" });
    o.observe(el);
    return () => o.disconnect();
  }, [pret]);
  const inList = (u: string) => project.list.some((x) => x.productId === u);

  useEffect(() => {
    void fetch("/boutique/index.json").then((r) => (r.ok ? r.json() : null)).then((d: IndexCatalogue | null) => setIndex(d)).catch(() => setIndex(null));
    try {
      const u = new URLSearchParams(location.search), f = u.get("famille"), recherche = u.get("q");
      if (f && f in FAMILLES) setTimeout(() => setFam(f as Famille), 0);
      if (recherche) setTimeout(() => setQ(recherche.slice(0, 80)), 0);
    } catch { /* */ }
  }, []);
  const familles = useMemo(() => (Object.keys(FAMILLES) as Famille[]).filter((f) => (index?.familles[f] ?? 0) >= 10), [index]);
  useEffect(() => {
    if (!index || !visible) return;
    let alive = true;
    void Promise.all((fam === "tout" ? familles : [fam]).map(load)).then((ls) => { if (alive) { setItems(ls.flat()); setN(PAGE); } });
    return () => { alive = false; };
  }, [fam, familles, index, visible]);

  const vendeurs = useMemo(() => [...new Set((items ?? []).map((p) => p.m))].sort((a, b) => a.localeCompare(b, "fr")), [items]);
  const list = useMemo(() => {
    let l: P[] = items ?? [];
    if (gamme) l = l.filter((p) => p.g === gamme);
    if (vendeur) l = l.filter((p) => p.m === vendeur);
    if (q.trim().length > 1) l = chercher(l, q, 5000) as P[];
    else if (tri === "selection") l = selection(l);
    if (tri === "prix-asc") l = [...l].sort((a, b) => (a.p ?? 1e9) - (b.p ?? 1e9));
    if (tri === "prix-desc") l = [...l].sort((a, b) => (b.p ?? 1e9) - (a.p ?? 1e9));
    return l;
  }, [items, gamme, vendeur, q, tri]);

  if (index === null) return <div ref={racine} className="mt-10 min-h-[60vh]" aria-busy="true"><p className="text-center text-muted">Chargement de la boutique…</p></div>;
  const reset = () => { setN(PAGE); };

  return (
    <div ref={racine}>
      <nav aria-label="Familles" className="flex flex-wrap justify-center gap-1.5">
        <button type="button" className="chip" aria-pressed={fam === "tout"} onClick={() => { setFam("tout"); reset(); }}>Tout</button>
        {familles.map((f) => <button key={f} type="button" className="chip" aria-pressed={fam === f} onClick={() => { setFam(f); reset(); }}>{FAMILLES[f]}</button>)}
      </nav>

      <div className="mx-auto mt-6 flex max-w-[980px] flex-wrap items-center justify-center gap-2">
        <input value={q} onChange={(e) => { setQ(e.target.value); reset(); }} placeholder="Rechercher : canapé bouclé, lampe en laiton, vase en grès…" aria-label="Rechercher un produit" className="input min-w-[260px] flex-1 !rounded-full" />
        <div role="group" aria-label="Budget" className="seg">
          <button type="button" aria-pressed={gamme === ""} onClick={() => { setGamme(""); reset(); }}>Tous budgets</button>
          {(["petit", "moyen", "haut"] as Gamme[]).map((g) => <button key={g} type="button" aria-pressed={gamme === g} onClick={() => { setGamme(g); reset(); }}>{NOM_GAMME[g]}</button>)}
        </div>
        <select aria-label="Enseigne" className="input !w-auto !rounded-full !px-4 text-[14px]" value={vendeur} onChange={(e) => { setVendeur(e.target.value); reset(); }}><option value="">Toutes les enseignes</option>{vendeurs.map((v) => <option key={v} value={v}>{v}</option>)}</select>
        <select aria-label="Trier" className="input !w-auto !rounded-full !px-4 text-[14px]" value={tri} onChange={(e) => setTri(e.target.value as typeof tri)}><option value="selection">Notre sélection</option><option value="prix-asc">Prix croissant</option><option value="prix-desc">Prix décroissant</option></select>
      </div>
      <p className="mt-4 text-center text-[13px] text-muted" aria-live="polite">{items === null ? "Chargement…" : `${list.length.toLocaleString("fr-FR")} référence${list.length > 1 ? "s" : ""}`}</p>

      {items !== null && list.length === 0 && <p className="mt-16 text-center text-muted">Aucune référence ne correspond. Essayez une autre recherche ou retirez un filtre.</p>}
      <ul className="mt-10 grid min-h-[50vh] list-none grid-cols-2 gap-x-5 gap-y-12 p-0 sm:grid-cols-3 lg:grid-cols-4">
        {list.slice(0, n).map((p) => (
          <li key={p.u} className="group flex flex-col text-center">
            <a href={p.u} target="_blank" rel="noopener noreferrer nofollow" className="block no-underline" tabIndex={-1} aria-hidden>
              <ProduitImage src={p.i} alt="" merchant={p.m} />
            </a>
            <p className="mt-4 text-[10.5px] font-semibold uppercase tracking-[.16em] text-muted">{p.m}{p.b && norm(p.b) !== norm(p.m) ? ` · ${p.b}` : ""}</p>
            <p className="mx-auto mt-1.5 line-clamp-2 max-w-[30ch] text-[14.5px] leading-snug">{p.n}</p>
            <p className="mt-2 text-[15px] font-semibold tabular-nums">{prix(p) ?? <span className="text-[13px] font-normal text-muted">Prix sur le site</span>}</p>
            <p className="mt-0.5 text-[11px] text-muted">{NOM_GAMME[p.g]}{p.a && AV[p.a] ? ` · ${AV[p.a]}` : ""}{p.p !== null ? ` · relevé le ${new Date(p.d).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}` : ""}</p>
            <div className="mt-4 flex flex-wrap justify-center gap-1.5">
              <a className="btn btn-primary !min-h-0 !px-3.5 !py-1.5 text-[12px]" href={p.u} target="_blank" rel="noopener noreferrer nofollow">Voir chez {p.m}<span className="sr-only"> : {p.n} (nouvel onglet)</span></a>
              <button type="button" className="btn !min-h-0 !px-3.5 !py-1.5 text-[12px]" aria-pressed={inList(p.u)} onClick={() => toggleExternal({ title: p.n, url: p.u, merchant: p.m, price: p.p, currency: p.c, checkedAt: p.d, source: "catalogue" })}>{inList(p.u) ? "✓ Dans ma pièce" : "Ajouter à ma pièce"}</button>
            </div>
          </li>
        ))}
      </ul>
      {list.length > n && <div className="mt-14 text-center"><button type="button" className="btn btn-lg" onClick={() => setN((x) => x + PAGE)}>Voir {Math.min(PAGE, list.length - n)} références de plus</button></div>}
      <p className="mx-auto mt-14 max-w-[70ch] text-center text-[12px] leading-relaxed text-muted">Sélection faite parmi les produits relevés chaque nuit chez les enseignes : éditeurs et maisons reconnus, à tous les prix, une déclinaison par modèle. Liens directs, sans partenariat ni classement payé. Prix et disponibilité relevés sur leurs pages à la date indiquée : vérifiez-les avant l'achat.</p>
    </div>
  );
}
