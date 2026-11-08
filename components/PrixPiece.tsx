"use client";
import { plusAncienne } from "@/lib/date-releve";
import { useState } from "react";
import type { ProduitCatalogue } from "@/lib/catalogue";
import type { Gamme } from "@/lib/choisir-produit";
import { toggleExternal, useProject } from "@/lib/studio/project";
import { ProduitImage } from "@/components/ProduitImage";

export type LignePiece = { id: string; label: string; produits: Partial<Record<Gamme, ProduitCatalogue>> };
const NOM: Record<Gamme, string> = { petit: "Petit budget", moyen: "Budget moyen", haut: "Haut de gamme" };
const eur = (n: number) => n.toLocaleString("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).replace(/\u202f/g, "\u00a0");

/**
 * « Le prix de cette pièce refaite » : le total à trois budgets, la liste des pièces de la gamme choisie
 * et un bouton pour tout garder dans « Ma pièce ». Seuls les produits au prix relevé comptent dans le total.
 */
export function PrixPiece({ lignes, titre = "Le prix de cette pièce refaite" }: { lignes: LignePiece[]; titre?: string }) {
  const [g, setG] = useState<Gamme>("moyen");
  const project = useProject();
  const total = (x: Gamme) => lignes.reduce((s, l) => s + (l.produits[x]?.p ?? 0), 0);
  const nb = (x: Gamme) => lignes.filter((l) => l.produits[x]?.p != null).length;
  const gammes = (["petit", "moyen", "haut"] as Gamme[]).filter((x) => nb(x) > 0);
  if (!gammes.length) return null;
  const choix = gammes.includes(g) ? g : gammes[0]!;
  const liste = lignes.filter((l) => l.produits[choix]?.p != null);
  const dans = (u: string) => project.list.some((x) => x.productId === u);
  const toutDedans = liste.every((l) => dans(l.produits[choix]!.u));
  const toutGarder = () => { for (const l of liste) { const p = l.produits[choix]!; if (toutDedans || !dans(p.u)) toggleExternal({ title: p.n, url: p.u, merchant: p.m, price: p.p, currency: p.c, checkedAt: p.d, source: "catalogue" }, l.id); } };

  return (
    <section aria-label={titre} className="bg-surface p-4 sm:p-6">
      <p className="text-[11px] font-semibold uppercase tracking-[.16em] text-muted">{titre}</p>
      <div role="group" aria-label="Choisir un budget" className="mt-3 grid grid-cols-3 gap-2">
        {gammes.map((x) => (
          <button key={x} type="button" aria-pressed={choix === x} onClick={() => setG(x)}
            className={`rounded-[2px] border px-2 py-3 text-center transition ${choix === x ? "border-ink bg-ink text-surface" : "border-line bg-bg hover:border-ink"}`}>
            <span className="block text-[10.5px] font-semibold uppercase tracking-[.12em] opacity-80">{NOM[x]}</span>
            <span className="mt-1 block font-display text-[clamp(22px,2.6vw,32px)] leading-none tabular-nums">{eur(total(x))}</span>
            <span className="mt-1 block text-[11px] opacity-70">{nb(x)} pièce{nb(x) > 1 ? "s" : ""}</span>
          </button>
        ))}
      </div>
      <ul key={choix} className="hero-fondu mt-4 grid list-none gap-1 p-0">
        {liste.map((l) => { const p = l.produits[choix]!; return (
          <li key={l.id}>
            <a href={p.u} target="_blank" rel="noopener noreferrer nofollow" className="group flex items-center gap-3 py-1.5 no-underline">
              <ProduitImage src={p.i} alt="" merchant={p.m} className="w-11 shrink-0" />
              <span className="min-w-0 flex-1"><span className="block truncate text-[13px] group-hover:underline">{l.label}</span><span className="block truncate text-[11.5px] text-muted">{p.m}</span></span>
              <span className="shrink-0 text-[13.5px] font-semibold tabular-nums">{eur(p.p!)}</span>
              <span className="sr-only"> : {p.n} (nouvel onglet)</span>
            </a>
          </li>); })}
      </ul>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
        <p className="m-0 text-[11.5px] text-muted">Prix relevés sur les sites des enseignes{(() => { const d = plusAncienne(liste.map((l) => l.produits[choix]?.d)); return d ? ` le ${d}` : ""; })()} ; à vérifier avant l'achat.</p>
        <button type="button" className="btn btn-primary !min-h-0 !px-4 !py-2 text-[13px]" onClick={toutGarder}>{toutDedans ? "✓ Toute la liste est dans ma pièce" : `Garder toute la liste (${eur(total(choix))})`}</button>
      </div>
    </section>
  );
}
