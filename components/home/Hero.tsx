import Link from "next/link";
import indexCatalogue from "@/public/boutique/index.json";
import { BeforeAfter } from "@/components/BeforeAfter";
import { Photo } from "@/components/Photo";
import { MentionIA } from "@/components/MentionIA";
import { PIECES } from "@/components/shop-the-look-pieces";
import { trouverParBudget } from "@/lib/trouves-par-budget";
import { HeroVue } from "./HeroVue";

const IDX = indexCatalogue as { total: number; vendeurs: Record<string, number> };
const NB_REFS = (Math.floor(IDX.total / 100) * 100).toLocaleString("fr-FR").replace(/ /g, " ");
const NB_ENSEIGNES = Object.keys(IDX.vendeurs).length;

/**
 * Haut de page construit comme une page de vente : une promesse, un bouton, des garanties, et la preuve (l'avant/après) à côté.
 */
export function Hero() {
  return (
    <section aria-labelledby="h-hero" className="grid gap-x-14 gap-y-7 pb-14 pt-4 sm:pt-8 lg:grid-cols-[1fr_1.2fr] lg:grid-rows-[auto_auto] lg:pb-20">
      <div className="lg:self-end">
        <p className="inline-flex items-center gap-2 rounded-full bg-surface px-3.5 py-1.5 text-[12.5px] font-semibold"><span aria-hidden className="text-[var(--bronze)]">★</span> 1 étude offerte · sans carte bancaire</p>
        <h1 id="h-hero" className="mt-5 max-w-[12ch] sm:mt-6 text-[clamp(42px,6.2vw,96px)] leading-[.94]">Transformez votre pièce, <em>achetez chaque meuble.</em></h1>
      </div>

      <div className="lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:self-center">
        <div className="relative">
          <BeforeAfter ratio="2528 / 1696" labelBefore="Avant" labelAfter="Après"
            before={<Photo src="/editorial/ia/salon-avant.webp" priority sizes="(min-width:1024px) 55vw, 100vw" alt="Avant : salon peu meublé, vieux canapé en cuir, table en pin, cartons, murs nus" />}
            after={<Photo src="/editorial/ia/salon-apres.webp" priority sizes="(min-width:1024px) 55vw, 100vw" alt="Après : même salon, canapé courbe en bouclette, tables basses en marbre, fauteuil vert, tapis rond rayé, grand tableau" />} />
          <MentionIA className="bottom-2.5 left-2.5" />
        </div>
        <p className="mt-3 text-center text-[13px] text-muted"><span aria-hidden>⟷</span> Glissez pour comparer : mêmes murs, mêmes fenêtres, une autre pièce.</p>
      </div>

      <div className="flex flex-col lg:self-start">
        <p className="order-2 mt-6 max-w-[44ch] lg:order-none lg:mt-0 text-[17px] sm:text-[18px] leading-relaxed text-muted">Envoyez une photo de votre pièce : notre IA la refait dans le style qui vous plaît, et chaque meuble que vous voyez est en vente, du petit budget au haut de gamme.</p>
        <div className="order-1 flex flex-wrap items-center gap-3 lg:order-none lg:mt-9">
          <Link href="/transformer/" className="btn btn-primary !min-h-0 grow gap-3 !px-8 sm:grow-0 !py-[18px] text-[18px] font-semibold shadow-[0_10px_30px_-12px_rgba(27,26,23,.55)]">
            <svg aria-hidden viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 8h3l2-2.5h6L17 8h3v11H4z" /><circle cx="12" cy="13" r="3.5" /></svg>
            Transformer ma pièce
          </Link>
          <a href="#exemple" className="btn !min-h-0 !px-6 !py-[18px] text-[16px]">Voir un exemple</a>
        </div>
        <ul aria-label="Nos garanties" className="order-3 mt-6 grid list-none gap-2.5 p-0 text-[15px] lg:order-none lg:mt-8">
          {[`${NB_REFS} meubles de ${NB_ENSEIGNES} enseignes, à tous les prix`, "Votre pièce refaite en quelques minutes", "Vous achetez directement chez l'enseigne, au prix de l'enseigne"].map((t) => (
            <li key={t} className="flex items-start gap-2.5"><span aria-hidden className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-ink text-[11px] text-surface">✓</span>{t}</li>
          ))}
        </ul>
      </div>

    </section>
  );
}

/** L'exemple à toucher : chaque meuble de la pièce mène à trois produits réels, un par budget, et au prix total. */
export function ExemplePiece() {
  return <HeroVue trouves={trouverParBudget(PIECES)} />;
}
