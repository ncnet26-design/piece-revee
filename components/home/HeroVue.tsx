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
  ["Plus d'erreur d'achat", "Vous voyez votre pièce refaite avant de dépenser un euro."],
  ["Plus d'heures de recherche", "Chaque meuble de l'image est trouvé pour vous, en vente."],
  ["Votre budget respecté", "Pour chaque meuble : un petit prix, un prix moyen, un haut de gamme."],
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
    const t = setInterval(() => setI((x) => { let n = (x + 1) % PIECES.length; while (PIECES[n]!.secondaire) n = (n + 1) % PIECES.length; return n; }), 4200);
    return () => clearInterval(t);
  }, [touche]);
  const sel = PIECES[i]!, l = trouves[sel.id] ?? {};

  return (
    <section aria-labelledby="h-hero" className="grid items-center gap-10 pb-16 pt-6 sm:pt-10 lg:grid-cols-[1fr_1.15fr] lg:gap-14 lg:pb-24">
      <div>
        <p className="eyebrow">Décoration d'intérieur par IA · tous budgets</p>
        <h1 id="h-hero" className="mt-5 max-w-[14ch] text-[clamp(46px,6vw,92px)] leading-[.95]">Voyez votre pièce refaite <em>avant d'acheter un seul meuble.</em></h1>
        <p className="mt-6 max-w-[48ch] text-[17px] leading-relaxed text-muted">Une photo de votre pièce, quelques images qui vous plaisent : en quelques minutes, Pièce Rêvée vous montre votre pièce transformée et trouve chaque meuble en vente, du petit budget au haut de gamme.</p>
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Link href="/transformer/" className="btn btn-primary btn-lg">Essayer gratuitement</Link>
          <Link href="/boutique/" className="btn btn-lg">Voir la boutique</Link>
        </div>
        <p className="mt-4 text-[13px] text-muted">1 étude offerte · sans carte bancaire · vous achetez directement chez les enseignes</p>
        <ol className="mt-10 grid border-t border-line pt-8 list-none gap-4 p-0">
          {PROMESSES.map(([t, d]) => (
            <li key={t} className="flex gap-4">
              <span aria-hidden className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-ink text-[12px] text-surface">✓</span>
              <span><span className="block text-[15px] font-semibold">{t}</span><span className="text-[14px] text-muted">{d}</span></span>
            </li>
          ))}
        </ol>
      </div>

      <div>
        <figure className="relative m-0 overflow-hidden rounded-[2px] bg-soft">
          <Photo src="/editorial/ia/salon-exemple.webp" priority sizes="(min-width:1024px) 55vw, 100vw" alt="Exemple de pièce transformée : canapé courbe en bouclette, tables basses en marbre, fauteuil vert, tapis rond rayé, grand tableau coloré" className="block aspect-[1000/651] w-full object-cover" />
          {/* Les pastilles sont dessinées sur l'image : des zones cliquables transparentes sont posées dessus. */}
          {PIECES.map((p, k) => (
            <button key={p.id} type="button" onClick={() => { setI(k); setTouche(true); }} aria-pressed={i === k} aria-label={`${p.label} : voir les produits par budget`}
              className={`absolute size-[6%] min-h-7 min-w-7 -translate-x-1/2 -translate-y-1/2 rounded-full ${p.secondaire ? "hidden lg:block" : ""}`} style={{ left: `${p.x}%`, top: `${p.y}%` }}>
              {i === k && <span aria-hidden className="hero-onde absolute inset-[18%] rounded-full ring-2 ring-[var(--bronze)]" />}
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
