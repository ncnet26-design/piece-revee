"use client";
import { useEffect, useState } from "react";

const ETAPES = {
  moodboard: { duree: 14, titre: "Votre moodboard se compose", etapes: ["Lecture de vos inspirations", "Palette de couleurs", "Matières dominantes", "Style et pièces clés"] },
  transformation: { duree: 45, titre: "Votre pièce se transforme", etapes: ["Lecture de votre pièce : murs, sol, ouvertures", "Application du style de vos inspirations", "Pose des matières et des couleurs", "Lumière et finitions", "Dernières vérifications"] },
} as const;

/**
 * Attente animée pendant le moodboard ou la transformation : la photo est « balayée », les étapes avancent,
 * la barre progresse sans jamais annoncer la fin avant qu'elle n'arrive. Rien de tout cela n'est un chiffre réel du serveur :
 * c'est une estimation de durée, dite comme telle.
 */
export function Chargement({ kind, image, inspirations = [] }: { kind: keyof typeof ETAPES; image?: string | null; inspirations?: string[] }) {
  const cfg = ETAPES[kind];
  const [t, setT] = useState(0);
  useEffect(() => {
    const debut = Date.now();
    const id = setInterval(() => setT((Date.now() - debut) / 1000), 250);
    return () => clearInterval(id);
  }, []);
  // Progression qui ralentit à l'approche de la fin estimée et plafonne à 94 % tant que le résultat n'est pas arrivé.
  const pct = Math.min(94, Math.round(100 * (1 - Math.exp(-t / (cfg.duree * 0.55)))));
  const i = Math.min(cfg.etapes.length - 1, Math.floor((t / cfg.duree) * cfg.etapes.length));
  return (
    <section role="status" aria-live="polite" aria-label={`${cfg.titre} : ${cfg.etapes[i]}`} className="chargement mt-8 grid gap-8 rounded-[2px] bg-surface p-5 sm:p-8 lg:grid-cols-[1.2fr_1fr]">
      <div className="relative aspect-[4/3] overflow-hidden rounded-[2px] bg-soft">
        {image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image} alt="" className="chargement-photo absolute inset-0 size-full object-cover" />
        )}
        <span aria-hidden className="chargement-balayage" />
        <span aria-hidden className="chargement-grille" />
        {inspirations.length > 0 && (
          <span aria-hidden className="absolute bottom-3 left-3 flex">
            {inspirations.slice(0, 4).map((s, k) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={k} src={s} alt="" className="chargement-vignette -ml-3 size-14 rounded-[2px] border-2 border-white object-cover shadow first:ml-0" style={{ animationDelay: `${k * 0.35}s` }} />
            ))}
          </span>
        )}
      </div>
      <div className="flex flex-col justify-center">
        <p className="eyebrow">{kind === "moodboard" ? "Étape 2" : "Étape 3"} · en cours</p>
        <h2 className="mt-3 text-[clamp(30px,3.4vw,44px)]">{cfg.titre}<span className="chargement-points" aria-hidden><i>.</i><i>.</i><i>.</i></span></h2>
        <ol className="mt-6 grid list-none gap-3 p-0">
          {cfg.etapes.map((e, k) => (
            <li key={e} className={`flex items-center gap-3 text-[15px] transition-colors duration-500 ${k < i ? "text-ink" : k === i ? "font-semibold text-ink" : "text-muted"}`}>
              <span aria-hidden className={`grid size-6 shrink-0 place-items-center rounded-full border text-[12px] transition-all duration-500 ${k < i ? "border-ink bg-ink text-white" : k === i ? "chargement-actif border-[var(--bronze)]" : "border-line"}`}>{k < i ? "✓" : ""}</span>
              {e}
            </li>
          ))}
        </ol>
        <div className="mt-7 h-1.5 overflow-hidden rounded-full bg-soft" aria-hidden>
          <div className="chargement-barre h-full rounded-full bg-ink transition-[width] duration-700 ease-out" style={{ width: `${pct}%` }} />
        </div>
        <p className="mt-2 flex justify-between text-[12px] text-muted tabular-nums">
          <span>{Math.floor(t)} s · durée habituelle {kind === "moodboard" ? "10 à 20 s" : "30 s à 1 min"}</span><span>{pct} %</span>
        </p>
        <p className="mt-4 text-[12.5px] text-muted">Vous pouvez rester sur cette page : le résultat s'affiche tout seul.</p>
      </div>
    </section>
  );
}
