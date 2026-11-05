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
        <li key={`${cle}${m}`} className="flex items-center whitespace-nowrap px-6 text-[13px] font-semibold uppercase tracking-[.2em] text-muted">
          {m}<span aria-hidden className="ml-12 text-[var(--bronze)]">·</span>
        </li>
      ))}
    </ul>
  );
  return (
    <section aria-labelledby="h-marques" className="bleed border-y border-line bg-surface py-5">
      <div className="wrap mb-3 flex items-center justify-between gap-4">
        <h2 id="h-marques" className="eyebrow m-0">{marques.length} enseignes sur Pièce Rêvée</h2>
        <button type="button" onClick={() => setPause((p) => !p)} aria-pressed={pause} className="text-[12px] text-muted underline underline-offset-4 hover:text-ink">
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
