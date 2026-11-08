"use client";
import { useState } from "react";

/**
 * Bande défilante des enseignes présentes sur le site (catalogue relevé par le robot).
 * Noms en texte seulement (pas de logos copiés). Se met en pause au survol, au clavier (bouton) et si l'appareil demande moins d'animations.
 */
export function MarquesDefilantes({ marques, design = [] }: { marques: string[]; design?: string[] }) {
  const [pause, setPause] = useState(false);
  const liste = (noms: string[], cle: string, cache: boolean, petit = false) => (
    <ul aria-hidden={cache || undefined} className="m-0 flex shrink-0 list-none items-center p-0">
      {noms.map((m) => (
        <li key={`${cle}${m}`} className={`flex items-center whitespace-nowrap leading-none ${petit ? "px-5 font-ui text-[clamp(14px,1.4vw,18px)] font-medium uppercase tracking-[.14em] text-surface/75" : "px-7 font-display text-[clamp(26px,3vw,40px)] text-surface"}`}>
          {m}<span aria-hidden className={`${petit ? "ml-10 text-[12px]" : "ml-14 text-[22px]"} text-[var(--bronze)]`}>✦</span>
        </li>
      ))}
    </ul>
  );
  return (
    <section aria-labelledby="h-marques" className="bleed bg-ink py-9 text-surface">
      <div className="wrap mb-6 flex flex-wrap items-center justify-between gap-4">
        <h2 id="h-marques" className="m-0 font-ui text-[11px] font-semibold uppercase tracking-[.2em] text-surface/70">{marques.length} enseignes{design.length ? ` et ${design.length} marques de design` : ""}, à tous les prix</h2>
        <button type="button" onClick={() => setPause((p) => !p)} aria-pressed={pause} className="text-[12px] text-surface/70 underline underline-offset-4 hover:text-surface">
          {pause ? "Relancer le défilement" : "Mettre en pause"}
        </button>
      </div>
      <div className="marquee overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_6%,#000_94%,transparent)]">
        <div className="marquee-track flex w-max" style={pause ? { animationPlayState: "paused" } : undefined}>
          {liste(marques, "a", false)}
          {liste(marques, "b", true)}
        </div>
      </div>
      {design.length > 0 && (
        <div className="marquee mt-6 overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_6%,#000_94%,transparent)]">
          <div className="marquee-track marquee-inverse flex w-max" style={pause ? { animationPlayState: "paused" } : undefined}>
            {liste(design, "c", false, true)}
            {liste(design, "d", true, true)}
          </div>
        </div>
      )}
    </section>
  );
}
