"use client";
import { useEffect, useRef, useState } from "react";
import { QA_SCENE, QA_VIEWS } from "@/lib/studio/scene";
import type { StudioEngine } from "@/lib/studio/engine";

const LABELS: Record<string, string> = { generale: "Vue générale", bois: "Noyer verni", murs: "Peinture et enduit", pierre: "Travertin", metal: "Laiton brossé", tissu: "Bouclé" };
/** Matières appliquées à la plus grande zone de chaque objet de contrôle. */
const ASSIGN: Record<string, string> = { "qa-buffet": "noyer-verni", "qa-canape": "boucle" };

/**
 * Banc d'essai visuel : la même scène dans le pipeline « avant » (couleurs unies, sans éclairage d'intérieur)
 * et « après » (matières PBR, HDR, occlusion, lancer de rayons), vue par vue. Sert aussi aux mesures automatiques.
 */
export default function QualityLab() {
  const host = useRef<HTMLDivElement>(null);
  const eng = useRef<StudioEngine | null>(null);
  const [view, setView] = useState("generale");
  const [ready, setReady] = useState(false);
  const [baseline, setBaseline] = useState(false);
  const [final, setFinal] = useState<string | null>(null);

  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const avant = q.get("avant") === "1", vue = q.get("vue") ?? "generale";
    const el = host.current; if (!el) return;
    let alive = true, assigned = false;
    void (async () => {
      const { StudioEngine } = await import("@/lib/studio/engine");
      if (!alive) return;
      const e = new StudioEngine(el, structuredClone(QA_SCENE), {
        onSelect: () => {}, onChange: () => {},
        onLoading: (n) => {
          if (n > 0 || !alive) return;
          if (!assigned) {
            assigned = true;
            void Promise.all(Object.entries(ASSIGN).map(([uid, m]) => { const s = e.slots(uid)[0]; return s ? e.setMaterial(uid, s.id, m) : null; }))
              .then(() => new Promise((r) => setTimeout(r, 1200))).then(() => { if (alive) { setReady(true); el.dataset.ready = "1"; } });
          }
        },
      }, "haute", { baseline: avant });
      eng.current = e; setBaseline(avant); setView(vue);
      e.view(vue, QA_VIEWS);
      (window as unknown as { __studio?: StudioEngine }).__studio = e;
    })();
    return () => { alive = false; eng.current?.dispose(); };
  }, []);

  const go = (v: string) => { setView(v); eng.current?.view(v, QA_VIEWS); };
  const render = async () => {
    const e = eng.current; if (!e) return;
    const r = await e.finalRender({ width: 1920, height: 1080, samples: e.soft ? 4 : 200 });
    setFinal(r.dataUrl);
  };
  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        {Object.keys(QA_VIEWS).map((v) => <button key={v} type="button" aria-pressed={view === v} onClick={() => go(v)} className={`rounded-full border px-3 py-1.5 text-[13px] ${view === v ? "border-ink bg-ink text-white" : "border-line bg-white"}`}>{LABELS[v]}</button>)}
        <span className="flex-1" />
        <a className="text-[13px] underline" href={`?avant=${baseline ? 0 : 1}&vue=${view}`}>{baseline ? "Voir le pipeline actuel" : "Voir l'ancien pipeline (avant)"}</a>
        <button type="button" className="btn !min-h-0 !py-1.5 text-[13px]" onClick={() => void render()} disabled={!ready}>Rendu final (lancer de rayons)</button>
      </div>
      <div ref={host} data-testid="qa-scene" className="relative mt-4 aspect-video w-full overflow-hidden rounded-[22px] bg-[#E9E6E0]">
        {!ready && <span className="absolute inset-0 grid place-items-center text-[13px] text-muted">Chargement de la scène de contrôle…</span>}
        <span className="absolute left-3 top-3 rounded-full bg-black/50 px-2.5 py-1 text-[11px] text-white">{baseline ? "Avant : couleurs unies, sans éclairage d'intérieur" : "Après : matières PBR, HDR, occlusion ambiante"}</span>
      </div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {final && <img src={final} alt="Rendu final de la scène de contrôle" className="mt-4 w-full rounded-[22px]" />}
    </div>
  );
}
