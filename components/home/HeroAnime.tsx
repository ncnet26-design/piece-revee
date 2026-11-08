"use client";
import { useEffect, useState } from "react";
import { Photo } from "@/components/Photo";
import { MentionIA } from "@/components/MentionIA";

export type Etiquette = { id: string; label: string; prix: string; x: number; y: number };

/** Déroulé (en millisecondes) : avant, balayage de l'IA qui révèle l'après, zoom lent, étiquettes de prix, puis on recommence. */
const ETAPES = [
  { d: 1800, texte: "Votre pièce aujourd'hui" },
  { d: 2000, texte: "L'IA redessine votre pièce…" },
  { d: 1200, texte: "Votre pièce refaite" },
  { d: 5200, texte: "Chaque meuble est en vente" },
] as const;

/**
 * La transformation racontée en animation, en boucle : la pièce avant, un balayage lumineux qui révèle la pièce refaite,
 * puis les meubles qui affichent leur prix. Bouton pause (contenu animé de plus de 5 secondes) ; sans animation si l'appareil le demande.
 */
export function HeroAnime({ etiquettes }: { etiquettes: Etiquette[] }) {
  const [phase, setPhase] = useState(0);
  const [tour, setTour] = useState(0);
  const [pause, setPause] = useState(false);
  const [calme, setCalme] = useState(false);
  useEffect(() => { const m = matchMedia("(prefers-reduced-motion: reduce)"); const f = () => setCalme(m.matches); f(); m.addEventListener("change", f); return () => m.removeEventListener("change", f); }, []);
  useEffect(() => {
    if (pause || calme) return;
    const t = setTimeout(() => { if (phase === ETAPES.length - 1) { setPhase(0); setTour((x) => x + 1); } else setPhase(phase + 1); }, ETAPES[phase]!.d);
    return () => clearTimeout(t);
  }, [phase, pause, calme]);

  const p = calme ? 3 : phase;
  const revele = p >= 1, balaye = p === 1;
  return (
    <figure className="relative m-0 overflow-hidden rounded-[2px] bg-soft" style={{ aspectRatio: "2528 / 1696" }}>
      <div className="absolute inset-0 [&_img]:size-full [&_img]:object-cover">
        <Photo src="/editorial/ia/salon-avant.webp" priority sizes="(min-width:1024px) 55vw, 100vw" alt="" />
      </div>
      <div className="absolute inset-0 [&_img]:size-full [&_img]:object-cover" style={{ clipPath: revele ? "inset(0 0 0 0)" : "inset(0 100% 0 0)", transition: calme ? "none" : revele ? `clip-path ${ETAPES[1].d}ms cubic-bezier(.6,.05,.3,1)` : "clip-path 500ms ease" }}>
        <div className="size-full" style={{ transform: p >= 2 ? "scale(1.06)" : "scale(1)", transition: calme ? "none" : p >= 2 ? "transform 7s ease-out" : "transform .5s" }}>
          <Photo src="/editorial/ia/salon-apres.webp" priority sizes="(min-width:1024px) 55vw, 100vw" alt="La même pièce refaite : canapé courbe en bouclette, tables basses en marbre, fauteuil vert, tapis rond rayé, grand tableau" />
        </div>
      </div>
      {/* Balayage lumineux de l'IA, synchronisé avec l'apparition de la pièce refaite */}
      {!calme && (
        <div aria-hidden className="pointer-events-none absolute inset-y-0 w-[18%] -translate-x-full" style={{ left: balaye || p >= 2 ? "100%" : "0%", opacity: balaye ? 1 : 0, transition: balaye ? `left ${ETAPES[1].d}ms cubic-bezier(.6,.05,.3,1), opacity .2s` : "opacity .3s", background: "linear-gradient(90deg, transparent, rgba(255,255,255,.18) 70%, rgba(255,255,255,.95) 97%, transparent)" }} />
      )}
      {/* Étiquettes de prix sur les meubles */}
      {p === 3 && etiquettes.map((e, i) => (
        <span key={`${tour}-${e.id}`} className="hero-pop pointer-events-none absolute flex -translate-x-1/2 -translate-y-1/2 items-center gap-1.5 whitespace-nowrap rounded-full bg-white/95 py-1 pl-1.5 pr-2.5 text-[11px] font-semibold text-ink shadow-[0_6px_18px_-6px_rgba(0,0,0,.45)] sm:text-[12.5px]"
          style={{ left: `${e.x}%`, top: `${e.y}%`, animationDelay: calme ? "0ms" : `${i * 420}ms` }}>
          <span aria-hidden className="size-2 rounded-full bg-[var(--bronze)]" />
          <span className="hidden sm:inline">{e.label}</span><span className="tabular-nums">{e.prix}</span>
        </span>
      ))}
      <figcaption key={p} className="hero-fondu absolute left-3 top-3 flex items-center gap-2 rounded-full bg-black/70 px-3 py-1.5 text-[12px] font-semibold text-white" aria-live="off">
        {p === 1 && <span aria-hidden className="size-1.5 animate-pulse rounded-full bg-white" />}
        {ETAPES[p]!.texte}
      </figcaption>
      {!calme && (
        <button type="button" onClick={() => setPause((v) => !v)} aria-label={pause ? "Relancer l'animation" : "Mettre l'animation en pause"} className="absolute bottom-2.5 right-2.5 grid size-9 place-items-center rounded-full bg-black/60 text-white">
          {pause ? <svg aria-hidden viewBox="0 0 24 24" className="size-4" fill="currentColor"><path d="M8 5v14l11-7z" /></svg> : <svg aria-hidden viewBox="0 0 24 24" className="size-4" fill="currentColor"><path d="M7 5h4v14H7zM13 5h4v14h-4z" /></svg>}
        </button>
      )}
      <MentionIA className="bottom-2.5 left-2.5" />
    </figure>
  );
}
