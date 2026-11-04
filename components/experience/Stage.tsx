"use client";
import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { CHAPITRES, POINTS } from "./chapitres";
import type { StageHandle } from "./scene";

/** Images de repli (sans 3D) : une par chapitre, toutes générées par IA et étiquetées. */
const REPLI = ["art-deco-contemporain", "accueil-table", "japandi-essai", "matiere-travertin", "salon-boucle-noyer", "salon-velours-chene"];

const progressOf = (el: HTMLElement | null) => {
  if (!el) return 0;
  const r = el.getBoundingClientRect(), span = r.height - window.innerHeight;
  return span > 0 ? Math.min(1, Math.max(0, -r.top / span)) : 0;
};

/**
 * Récit pilotable au défilement : la scène 3D reste épinglée pendant que les six chapitres défilent par-dessus.
 * Sans WebGL, avec l'économie de données ou en cas d'erreur, des images fixes prennent le relais. Mouvement réduit respecté.
 */
export function Stage({ chapters }: { chapters: ReactNode[] }) {
  const section = useRef<HTMLElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const bar = useRef<HTMLDivElement>(null);
  const spotEls = useRef<Array<HTMLAnchorElement | null>>([]);
  const [mode, setMode] = useState<"chargement" | "3d" | "repli">("chargement");
  const [chap, setChap] = useState(0);

  // Chapitre courant et barre de progression (fonctionne aussi sans 3D).
  useEffect(() => {
    const on = () => {
      const p = progressOf(section.current);
      setChap(Math.round(p * (CHAPITRES.length - 1)));
      if (bar.current) bar.current.style.transform = `scaleX(${p})`;
    };
    on();
    window.addEventListener("scroll", on, { passive: true }); window.addEventListener("resize", on);
    return () => { window.removeEventListener("scroll", on); window.removeEventListener("resize", on); };
  }, []);

  // Scène 3D, chargée après l'affichage du texte.
  useEffect(() => {
    const el = canvas.current; if (!el) return;
    const conn = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
    if (conn?.saveData) { setTimeout(() => setMode("repli"), 0); return; }
    const rm = window.matchMedia("(prefers-reduced-motion: reduce)");
    const mobile = window.matchMedia("(max-width: 767px), (pointer: coarse)").matches;
    let handle: StageHandle | null = null, alive = true, io: IntersectionObserver | null = null;
    const shown = POINTS.map(() => false);
    const onRm = () => handle?.setReduced(rm.matches);
    // La 3D se charge quand le navigateur est libre : le texte et les boutons sont utilisables tout de suite.
    const idle = (cb: () => void) => { const w = window as Window & { requestIdleCallback?: (c: () => void, o?: { timeout: number }) => number }; if (w.requestIdleCallback) w.requestIdleCallback(cb, { timeout: 1500 }); else setTimeout(cb, 300); };
    // Sur téléphone, elle démarre au premier geste (défilement, toucher) : l'ouverture s'affiche d'abord en photo.
    const start = (cb: () => void) => {
      if (!mobile) { idle(cb); return; }
      const evs = ["scroll", "touchstart", "pointerdown", "keydown"] as const;
      const go = () => { evs.forEach((e) => window.removeEventListener(e, go)); idle(cb); };
      evs.forEach((e) => window.addEventListener(e, go, { passive: true, once: true }));
      if (progressOf(section.current) > 0.02) go();
    };
    start(() => void import("./scene").then(({ createStage }) => {
      if (!alive) return;
      try {
        handle = createStage(el, {
          getProgress: () => progressOf(section.current),
          reduced: rm.matches, mobile,
          onReady: () => { if (alive) setMode("3d"); },
          onFrame: (_p, spots) => spots.forEach((s, i) => {
            const a = spotEls.current[i]; if (!a) return;
            a.style.transform = `translate3d(${s.x.toFixed(1)}px, ${s.y.toFixed(1)}px, 0)`;
            a.style.opacity = String(s.v);
            const on = s.v > 0.5;
            if (on !== shown[i]) { shown[i] = on; a.tabIndex = on ? 0 : -1; a.style.pointerEvents = on ? "auto" : "none"; a.setAttribute("aria-hidden", on ? "false" : "true"); }
          }),
        });
        rm.addEventListener("change", onRm);
        io = new IntersectionObserver(([e]) => handle?.setActive(Boolean(e?.isIntersecting)), { rootMargin: "100px" });
        if (section.current) io.observe(section.current);
      } catch { setMode("repli"); }
    }).catch(() => { if (alive) setMode("repli"); }));
    return () => { alive = false; io?.disconnect(); rm.removeEventListener("change", onRm); handle?.dispose(); };
  }, []);

  return (
    <section ref={section} aria-label="Le parcours, en six temps" className="bleed relative -mt-7 bg-[#0C0E0B] text-[#F2EEE6]">
      <div className="sticky top-0 h-[100svh] overflow-hidden">
        {/* Repli : images fixes, une par chapitre */}
        <div aria-hidden className={`absolute inset-0 transition-opacity duration-700 ${mode === "3d" ? "opacity-0" : "opacity-100"}`}>
          {REPLI.map((n, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={n} src={`/editorial/ia/${n}-1024.webp`} alt="" loading={i === 0 ? "eager" : "lazy"} decoding="async"
              className={`absolute inset-0 size-full object-cover transition-opacity duration-700 motion-reduce:transition-none ${i === chap ? "opacity-60" : "opacity-0"}`} />
          ))}
        </div>
        <canvas ref={canvas} aria-hidden className={`absolute inset-0 size-full transition-opacity duration-[1200ms] motion-reduce:transition-none ${mode === "3d" ? "opacity-100" : "opacity-0"}`} />
        {/* Voiles pour la lisibilité du texte */}
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-[linear-gradient(0deg,rgba(12,14,11,.92)_0%,rgba(12,14,11,.55)_38%,rgba(12,14,11,0)_62%)] md:bg-[linear-gradient(90deg,rgba(12,14,11,.86)_0%,rgba(12,14,11,.5)_32%,rgba(12,14,11,0)_55%)]" />
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-[linear-gradient(180deg,rgba(12,14,11,.7),rgba(12,14,11,0))]" />

        {/* Points cliquables de la pièce transformée */}
        <div className="absolute inset-0" style={{ visibility: mode === "3d" ? "visible" : "hidden" }}>
          {POINTS.map((p, i) => (
            <a key={p.id} ref={(e) => { spotEls.current[i] = e; }} href={p.href} tabIndex={-1} aria-hidden="true" aria-label={`${p.label} : voir ${p.detail.toLowerCase()}`}
              className="group absolute left-0 top-0 flex items-center gap-2 no-underline opacity-0" style={{ pointerEvents: "none", willChange: "transform" }}>
              <span className="-ml-[14px] -mt-[14px] grid size-7 place-items-center rounded-full bg-[#F2EEE6] shadow-[0_0_0_7px_rgba(242,238,230,.18)] transition group-hover:scale-110 group-focus-visible:scale-110">
                <span className="size-2 rounded-full bg-[#B0784A]" />
              </span>
              <span className="-mt-[14px] hidden whitespace-nowrap bg-[#0C0E0B]/80 px-2.5 py-1 text-[12px] font-medium text-[#F2EEE6] backdrop-blur sm:inline group-hover:bg-[#F2EEE6] group-hover:text-[#0C0E0B] group-focus-visible:bg-[#F2EEE6] group-focus-visible:text-[#0C0E0B]">
                {p.label} <span className="opacity-60">→ {p.detail}</span>
              </span>
            </a>
          ))}
        </div>

        {/* Sommaire des chapitres */}
        <nav aria-label="Chapitres" className="absolute right-5 top-1/2 hidden -translate-y-1/2 lg:block">
          <ol className="m-0 flex list-none flex-col items-end gap-3 p-0">
            {CHAPITRES.map((c, i) => (
              <li key={c.id}>
                <a href={`#${c.id}`} aria-current={i === chap ? "step" : undefined} className="group flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[.18em] text-[#F2EEE6]/55 [text-shadow:0_1px_10px_rgba(0,0,0,.8)] no-underline hover:text-[#F2EEE6] aria-[current=step]:text-[#F2EEE6]">
                  <span className="opacity-0 transition group-hover:opacity-100 group-aria-[current=step]:opacity-100">{c.court}</span>
                  <span className={`block h-px transition-all ${i === chap ? "w-10 bg-[#C99467]" : "w-5 bg-current"}`} />
                </a>
              </li>
            ))}
          </ol>
        </nav>
        <div aria-hidden className="absolute inset-x-0 bottom-0 h-[2px] bg-white/10"><div ref={bar} className="h-full origin-left bg-[#C99467]" style={{ transform: "scaleX(0)" }} /></div>
        <p className="absolute bottom-4 right-5 m-0 text-[10.5px] text-[#F2EEE6]/55">{mode === "repli" ? "Images générées par IA" : "Scène 3D · textures CC0 · images d'inspiration générées par IA"}</p>
      </div>

      {/* Les chapitres défilent par-dessus la scène */}
      <div className="relative -mt-[100svh]">
        {chapters.map((c, i) => (
          <article key={CHAPITRES[i]!.id} id={CHAPITRES[i]!.id} className="wrap flex min-h-[100svh] scroll-mt-0 items-end pb-20 pt-28 md:items-center md:pb-0">
            {c}
          </article>
        ))}
      </div>
    </section>
  );
}

/** Lien de fin de récit, accessible même sans 3D. */
export function SpotList() {
  return (
    <ul className="mt-6 grid list-none grid-cols-2 gap-x-4 gap-y-2 p-0 text-[14px]">
      {POINTS.map((p) => <li key={p.id}><Link href={p.href} className="text-[#F2EEE6] underline decoration-[#C99467] underline-offset-4 hover:decoration-2">{p.label}</Link></li>)}
    </ul>
  );
}
