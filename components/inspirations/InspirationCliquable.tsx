"use client";
import { useState } from "react";
import { Photo } from "@/components/Photo";
import { ProduitImage } from "@/components/ProduitImage";
import { MentionIA } from "@/components/MentionIA";
import { PrixPiece } from "@/components/PrixPiece";
import type { Gamme, PieceDansImage, Trouves } from "@/lib/trouves-par-budget";

const NOM: Record<Gamme, string> = { petit: "Petit budget", moyen: "Budget moyen", haut: "Haut de gamme" };
const prix = (p: number | null, c: string | null) => (p === null ? "Prix sur le site" : p.toLocaleString("fr-FR", { style: "currency", currency: c ?? "EUR", maximumFractionDigits: 0 }));

/** Image d'inspiration dont chaque meuble est cliquable : trois vrais produits, un par budget. */
export function InspirationCliquable({ src, alt, ratio, pieces, trouves }: { src: string; alt: string; ratio: string; pieces: PieceDansImage[]; trouves: Trouves }) {
  const avec = pieces.filter((p) => Object.keys(trouves[p.id] ?? {}).length > 0);
  const [i, setI] = useState(0);
  const sel = avec[i];
  return (
    <div>
      <figure className="relative m-0 overflow-hidden bg-soft" style={{ aspectRatio: ratio }}>
        <Photo src={src} alt={alt} sizes="(min-width:1024px) 66vw, 100vw" className="block size-full object-cover" />
        {avec.map((p, k) => (
          <button key={p.id} type="button" onClick={() => setI(k)} aria-pressed={i === k} aria-label={`${p.label} : voir les produits par budget`}
            className="group absolute -translate-x-1/2 -translate-y-1/2 p-1.5" style={{ left: `${p.x}%`, top: `${p.y}%` }}>
            <span className={`grid size-7 place-items-center rounded-full bg-white/95 shadow-[0_0_0_6px_rgba(255,255,255,.3)] transition ${i === k ? "scale-110" : "group-hover:scale-110"}`}>
              <span className={`size-2.5 rounded-full ${i === k ? "bg-[var(--bronze)]" : "bg-ink"}`} />
            </span>
          </button>
        ))}
        <span className="pointer-events-none absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-[11.5px] font-semibold text-ink">Touchez un meuble</span>
        <MentionIA />
      </figure>
      {sel && (
        <div aria-live="polite" className="mt-3 bg-surface p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[.16em] text-muted">{sel.label} · en vente</p>
          <ul key={sel.id} className="hero-fondu mt-3 grid list-none gap-2 p-0 sm:grid-cols-3">
            {(["petit", "moyen", "haut"] as Gamme[]).map((g) => {
              const p = trouves[sel.id]?.[g];
              return (
                <li key={g} className="min-w-0">
                  {p ? (
                    <a href={p.u} target="_blank" rel="noopener noreferrer nofollow" className="group flex items-center gap-3 no-underline">
                      <ProduitImage src={p.i} alt="" merchant={p.m} className="w-14 shrink-0" />
                      <span className="min-w-0">
                        <span className="block text-[10.5px] font-semibold uppercase tracking-[.12em] text-[var(--bronze)]">{NOM[g]}</span>
                        <span className="block truncate text-[13px] group-hover:underline">{p.m}</span>
                        <span className="block text-[14px] font-semibold tabular-nums">{prix(p.p, p.c)}</span>
                        <span className="sr-only">{p.n} (nouvel onglet)</span>
                      </span>
                    </a>
                  ) : <span className="text-[12px] text-muted">{NOM[g]} : bientôt</span>}
                </li>
              );
            })}
          </ul>
        </div>
      )}
      <div className="mt-3"><PrixPiece titre="Cette pièce complète, à votre budget" lignes={avec.map((p) => ({ id: p.id, label: p.label, produits: trouves[p.id] ?? {} }))} /></div>
    </div>
  );
}
