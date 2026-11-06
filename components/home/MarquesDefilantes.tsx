"use client";
import { useState } from "react";

/**
 * Bande défilante des enseignes présentes sur le site (catalogue relevé par le robot).
 * Noms en texte seulement (pas de logos copiés). Se met en pause au survol, au clavier (bouton) et si l'appareil demande moins d'animations.
 */
export function MarquesDefilantes({ marques }: { marques: string[] }) {
  const [pause, setPause] = useState(false);
  const liste = (cle: string, cache: boolean) => (
    <ul aria-hidden={cache || undefined} className="m-0 flex shrink-0 list-none items-center p-0">
      {marques.map((m) => (
        <li key={`${cle}${m}`} className="flex items-center whitespace-nowrap px-7 font-display text-[clamp(26px,3vw,40px)] leading-none text-surface">
          {m}<span aria-hidden className="ml-14 text-[22px] text-[var(--bronze)]">✦</span>
        </li>
      ))}
    </ul>
  );
  return (
    <section aria-labelledby="h-marques" className="bleed bg-ink py-9 text-surface">
      <div className="wrap mb-6 flex flex-wrap items-center justify-between gap-4">
        <h2 id="h-marques" className="m-0 font-ui text-[11px] font-semibold uppercase tracking-[.2em] text-surface/70">Les meubles proposés viennent de {marques.length} enseignes</h2>
        <button type="button" onClick={() => setPause((p) => !p)} aria-pressed={pause} className="text-[12px] text-surface/70 underline underline-offset-4 hover:text-surface">
          {pause ? "Relancer le défilement" : "Mettre en pause"}
        </button>
      </div>
      <div className="marquee overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_6%,#000_94%,transparent)]">
        <div className="marquee-track flex w-max" style={pause ? { animationPlayState: "paused" } : undefined}>
          {liste("a", false)}
          {liste("b", true)}
        </div>
      </div>
    </section>
  );
}
