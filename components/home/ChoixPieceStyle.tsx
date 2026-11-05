"use client";
import Link from "next/link";
import { useState } from "react";
import { GAMMES, NOM_GAMME, NOM_PIECE, NOM_STYLE, PIECES, STYLES, type Gamme, type Piece, type Style } from "@/lib/catalogue-achetable";

export type Apercu = Record<string, Partial<Record<Gamme, { n: number; min: number; exemples: Array<{ nom: string; enseigne: string; prix: number; url: string }> }>>>;
const prix = (n: number) => n.toLocaleString("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: n % 1 ? 2 : 0 });

/**
 * Le concept en un geste : une pièce, un style → trois gammes de pièces réelles, avec prix et liens.
 * L'aperçu est calculé à la publication depuis le catalogue vérifié (data/catalogue.json).
 */
export function ChoixPieceStyle({ apercu }: { apercu: Apercu }) {
  const [piece, setPiece] = useState<Piece>("salon");
  const [style, setStyle] = useState<Style>("japandi");
  const a = apercu[`${piece}|${style}`] ?? {};
  const total = GAMMES.reduce((s, g) => s + (a[g]?.n ?? 0), 0);
  const puce = (on: boolean) => ({ style: on ? { background: "var(--ink)", color: "var(--surface)", borderColor: "var(--ink)" } : undefined, "aria-pressed": on });
  return (
    <div>
      <div className="grid gap-6 lg:grid-cols-[1fr_2fr]">
        <fieldset className="m-0 border-0 p-0">
          <legend className="p-0 text-[11px] font-semibold uppercase tracking-[.2em] text-muted">1 · Votre pièce</legend>
          <div className="mt-3 flex flex-wrap gap-1.5">{PIECES.map((p) => <button key={p} type="button" className="chip" {...puce(piece === p)} onClick={() => setPiece(p)}>{NOM_PIECE[p]}</button>)}</div>
        </fieldset>
        <fieldset className="m-0 border-0 p-0">
          <legend className="p-0 text-[11px] font-semibold uppercase tracking-[.2em] text-muted">2 · Votre style</legend>
          <div className="mt-3 flex flex-wrap gap-1.5">{STYLES.map((s) => <button key={s} type="button" className="chip" {...puce(style === s)} onClick={() => setStyle(s)}>{NOM_STYLE[s]}</button>)}</div>
        </fieldset>
      </div>
      <p className="mt-10 text-[11px] font-semibold uppercase tracking-[.2em] text-muted" aria-live="polite">3 · Vos pièces, par budget · {total} en vente</p>
      <div className="mt-4 grid gap-px bg-line md:grid-cols-3">
        {GAMMES.map((g) => {
          const x = a[g];
          return (
            <div key={g} className="bg-bg p-6">
              <div className="flex items-baseline justify-between gap-3 border-b border-ink pb-2">
                <h3 className="font-display text-[26px] font-normal">{NOM_GAMME[g]}</h3>
                {x && <span className="text-[12px] text-muted">{x.n} pièce{x.n > 1 ? "s" : ""}</span>}
              </div>
              {x ? (
                <ul className="mt-3 list-none divide-y divide-line p-0">
                  {x.exemples.map((e) => (
                    <li key={e.url} className="py-2.5">
                      <a href={e.url} target="_blank" rel="noopener noreferrer nofollow" className="flex items-baseline justify-between gap-3 text-[13.5px] no-underline hover:underline">
                        <span className="min-w-0"><span className="line-clamp-1">{e.nom}</span><span className="text-[11.5px] text-muted">{e.enseigne}</span></span>
                        <span className="shrink-0 font-semibold tabular-nums">{prix(e.prix)}</span><span className="sr-only"> (nouvel onglet)</span>
                      </a>
                    </li>
                  ))}
                </ul>
              ) : <p className="mt-4 text-[13px] text-muted">Pas encore de pièce vérifiée dans cette gamme.</p>}
            </div>
          );
        })}
      </div>
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <p className="m-0 text-[12px] text-muted">Gamme calculée pour chaque type de meuble (un canapé « petit budget » n'a pas le prix d'un vase). Prix relevés et vérifiés sur les pages des enseignes ; aucune marque ne paie pour être classée.</p>
        <Link href={`/boutique/?piece=${piece}&style=${style}#selection`} className="btn btn-primary">Voir toutes les pièces</Link>
      </div>
    </div>
  );
}
