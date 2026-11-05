"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { ProduitCatalogue } from "@/lib/catalogue";
import { PIECES } from "@/components/shop-the-look-pieces";
import { Photo } from "@/components/Photo";
import { ProduitImage } from "@/components/ProduitImage";
import { MentionIA } from "@/components/MentionIA";

export type Gamme = "petit" | "moyen" | "haut";
export type Trouves = Record<string, Partial<Record<Gamme, ProduitCatalogue>>>;
const NOM: Record<Gamme, string> = { petit: "Petit budget", moyen: "Budget moyen", haut: "Haut de gamme" };
const prix = (p: ProduitCatalogue) => (p.p === null ? "Prix sur le site" : p.p.toLocaleString("fr-FR", { style: "currency", currency: p.c ?? "EUR", maximumFractionDigits: 0 }));

const PROMESSES: Array<[string, string]> = [
  ["Une photo suffit", "Prise au téléphone, telle que la pièce est aujourd'hui."],
  ["Votre style, pas le nôtre", "Vos images Pinterest ou Instagram deviennent un moodboard."],
  ["Tout est à acheter", "Chaque meuble mène à de vrais produits, du petit budget au haut de gamme."],
];

/**
 * La promesse à gauche ; à droite, une pièce dont on touche les meubles : trois produits réels par meuble, un par budget.
 * Les points défilent seuls tant qu'on n'a pas touché (sauf si l'appareil demande moins d'animations).
 */
export function HeroVue({ trouves }: { trouves: Trouves }) {
  const [i, setI] = useState(1);
  const [touche, setTouche] = useState(false);
  useEffect(() => {
    if (touche || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => setI((x) => (x + 1) % PIECES.length), 4200);
    return () => clearInterval(t);
  }, [touche]);
  const sel = PIECES[i]!, l = trouves[sel.id] ?? {};

  return (
    <section aria-labelledby="h-hero" className="grid items-center gap-10 pb-16 pt-6 sm:pt-10 lg:grid-cols-[1fr_1.15fr] lg:gap-14 lg:pb-24">
      <div>
        <p className="eyebrow">Architecte d'intérieur en ligne · tous budgets</p>
        <h1 id="h-hero" className="mt-5 max-w-[13ch] text-[clamp(48px,6.4vw,96px)] leading-[.95]">Votre pièce refaite, <em>et tout est à acheter.</em></h1>
        <p className="mt-6 max-w-[46ch] text-[17px] leading-relaxed text-muted">Envoyez une photo de votre pièce et des images qui vous plaisent : vous la voyez transformée, et chaque meuble mène à de vrais produits, du petit budget au haut de gamme.</p>
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Link href="/transformer/" className="btn btn-primary btn-lg">Essayer gratuitement</Link>
          <Link href="/boutique/" className="btn btn-lg">Voir la boutique</Link>
        </div>
        <p className="mt-4 text-[13px] text-muted">1 étude offerte · sans carte bancaire · résultat en moins d'une minute</p>
        <ol className="mt-10 grid border-t border-line pt-8 list-none gap-4 p-0">
          {PROMESSES.map(([t, d], k) => (
            <li key={t} className="flex gap-4">
              <span className="font-display text-[28px] leading-none text-[var(--bronze)]">{k + 1}</span>
              <span><span className="block text-[15px] font-semibold">{t}</span><span className="text-[14px] text-muted">{d}</span></span>
            </li>
          ))}
        </ol>
      </div>

      <div>
        <figure className="relative m-0 overflow-hidden rounded-[2px] bg-soft">
          <Photo src="/editorial/ia/salon-boucle-noyer.webp" priority sizes="(min-width:1024px) 55vw, 100vw" alt="Exemple de pièce transformée : canapé courbe en bouclé, table basse en travertin, buffet cannelé en noyer" className="block aspect-[16/9] w-full object-cover" />
          {PIECES.map((p, k) => (
            <button key={p.id} type="button" onClick={() => { setI(k); setTouche(true); }} aria-pressed={i === k} aria-label={`${p.label} : voir les produits par budget`}
              className="group absolute -translate-x-1/2 -translate-y-1/2" style={{ left: `${p.x}%`, top: `${p.y}%` }}>
              <span className={`relative grid size-9 place-items-center rounded-full bg-white/95 transition ${i === k ? "scale-110" : "group-hover:scale-110"}`}>
                {i === k && <span aria-hidden className="hero-onde absolute inset-0 rounded-full" />}
                <span className={`size-2.5 rounded-full ${i === k ? "bg-[var(--bronze)]" : "bg-ink"}`} />
              </span>
            </button>
          ))}
          <span className="pointer-events-none absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-[11.5px] font-semibold text-ink">Touchez un meuble</span>
          <MentionIA />
        </figure>
        <div aria-live="polite" className="mt-4 rounded-[2px] bg-surface p-4 sm:p-5">
          <p className="text-[11px] font-semibold uppercase tracking-[.16em] text-muted">{sel.label} · en vente maintenant</p>
          <ul key={sel.id} className="hero-fondu mt-3 grid list-none gap-2 p-0 sm:grid-cols-3">
            {(["petit", "moyen", "haut"] as Gamme[]).map((g) => {
              const p = l[g];
              return (
                <li key={g} className="min-w-0">
                  {p ? (
                    <a href={p.u} target="_blank" rel="noopener noreferrer nofollow" className="group flex items-center gap-3 no-underline sm:flex-col sm:items-stretch sm:gap-2 sm:text-center">
                      <ProduitImage src={p.i} alt="" merchant={p.m} className="w-16 shrink-0 sm:w-full" />
                      <span className="min-w-0">
                        <span className="block text-[10.5px] font-semibold uppercase tracking-[.12em] text-[var(--bronze)]">{NOM[g]}</span>
                        <span className="block truncate text-[13px] group-hover:underline">{p.m}</span>
                        <span className="block text-[14px] font-semibold tabular-nums">{prix(p)}</span>
                        <span className="sr-only">{p.n} (nouvel onglet)</span>
                      </span>
                    </a>
                  ) : <span className="text-[12px] text-muted">{NOM[g]} : bientôt</span>}
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </section>
  );
}
