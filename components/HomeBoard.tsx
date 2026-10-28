"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { Board, BoardItem, Shape } from "@/lib/board/state";
import { parseVariant, variantCode, variantName } from "@/lib/showroom/catalog";

/** Planche « Pêche rêvée » : la composition vivante de la page d'accueil (références réelles du showroom). */
const ITEMS: Array<[string, Shape, number, number, number, number]> = [
  ["sr:papier-peint:feuillage:peche", "piece", 0.26, -0.12, 4, 1.25],
  ["sr:cannele:chene-clair:joncs:huile", "piece", 0.02, -0.06, -3, 1.05],
  ["sr:marbre:rosa:poli", "carre", -0.2, -0.13, 8, 0.95],
  ["sr:zellige:bleu-nuit:metro:brillant:fonce", "carre", -0.12, -0.2, -6, 0.75],
  ["sr:tissu:velours:vieux-rose", "drape", -0.33, 0.05, -10, 1],
  ["sr:moquette:berbere:rose-poudre", "piece", 0.12, 0.2, 3, 1],
  ["sr:terrazzo:rose:moyens:multi", "carre", -0.12, 0.12, 12, 0.9],
  ["sr:tissu:bouclette:ecru", "drape", 0.34, 0.16, 8, 0.85],
  ["sr:cannage:octogonal:naturel", "piece", 0.4, -0.15, -5, 0.8],
  ["sr:quincaillerie:bequille:laiton:brosse", "piece", 0.18, 0.04, 82, 1.4],
  ["sr:quincaillerie:bouton-molete:bronze:brosse", "piece", -0.02, 0.06, 0, 1.4],
  ["sr:peinture:rose-pale:brillant", "goutte", -0.05, 0.13, 0, 1.6],
  ["sr:objets:vase-boule:ceramique-terracotta", "piece", -0.42, -0.2, 0, 0.75],
];
const BOARD = (): Board => ({ v: 1, title: "Pêche rêvée", bg: "#EFEBE3", items: ITEMS.map(([ref, shape, x, z, rot, s], i) => ({ id: `h${i}`, ref, shape, x, z, rot, s })) });

export function HomeBoard() {
  const host = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<"attente" | "pret" | "indisponible">("attente");
  useEffect(() => {
    const el = host.current; if (!el) return;
    let engine: import("@/lib/board/engine").BoardEngine | null = null, alive = true, started = false;
    const timers: number[] = [];
    const start = async () => {
      started = true;
      const { BoardEngine } = await import("@/lib/board/engine");
      if (!alive) return;
      try { engine = new BoardEngine(el, { onSelect: () => {}, onMove: () => {}, onDropAt: () => {} }); } catch { setState("indisponible"); return; }
      const calm = engine.software || window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const full = BOARD(), uploads = new Map<string, string>();
      setState("pret");
      if (calm) { await engine.sync(full, uploads); return; }
      engine.enableShowcase();
      // Les échantillons arrivent un à un, du fond vers le premier plan.
      const shown: BoardItem[] = [];
      full.items.forEach((it, i) => timers.push(window.setTimeout(() => { if (!alive || !engine) return; shown.push(it); void engine.sync({ ...full, items: [...shown] }, uploads); }, 300 + i * 380)));
    };
    const io = new IntersectionObserver((es) => {
      const vis = es.some((e) => e.isIntersecting);
      if (vis && !started) void start();
      engine?.setPaused(!vis);
    }, { rootMargin: "200px" });
    io.observe(el);
    return () => { alive = false; io.disconnect(); timers.forEach(clearTimeout); engine?.dispose(); };
  }, []);

  const openInBoard = () => { try { localStorage.setItem("pr_planche", JSON.stringify(BOARD())); } catch { /* stockage indisponible */ } };
  const refs = [...new Set(ITEMS.map(([r]) => r))].map((r) => parseVariant(r)!).filter(Boolean);
  return (
    <section className="section" aria-labelledby="h-live">
      <div className="vhead"><div><span className="eyebrow">Planche vivante</span><h2 id="h-live" className="h2 mt-2">Pêche rêvée, <em>composée en direct.</em></h2><p>Chaque échantillon est calculé en 3D : relief du papier peint, joncs du bois, moletage du laiton, goutte de peinture laquée.</p></div><Link className="btn btn-primary" href="/planche/" onClick={openInBoard}>Composer la mienne</Link></div>
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div ref={host} className="relative aspect-[3/2] overflow-hidden rounded-[28px] bg-[#EFEBE3] shadow-[0_1px_2px_rgba(0,0,0,.04),0_30px_60px_-34px_rgba(0,0,0,.3)]">
          {state !== "pret" && <span className="absolute inset-0 grid place-items-center text-[13px] text-muted">{state === "indisponible" ? "La 3D n'est pas disponible sur cet appareil." : "Préparation de la planche…"}</span>}
        </div>
        <ol className="m-0 grid list-none content-start gap-2 p-0 text-[13px]" aria-label="Références de la planche">
          {refs.map((v) => (
            <li key={v.ref} className="flex items-baseline justify-between gap-3 border-b border-line pb-2">
              <span className="font-medium">{variantName(v, true)}</span>
              <span className="shrink-0 font-mono text-[10.5px] text-muted">{variantCode(v)}</span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
