"use client";
import Link from "next/link";
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { CHAPITRES, CHOIX_DEPART, FINITIONS, POINTS, pointSelon, type Choix, type Partie } from "./chapitres";
import type { StageHandle } from "./scene";

/** Images de repli (sans 3D) : une par chapitre, générées par IA et étiquetées. */
const REPLI = ["/editorial/ia/art-deco-contemporain", "/editorial/ia/accueil-table", "/editorial/ia/japandi-essai", "/matieres/travertin/1280", "/editorial/ia/salon-boucle-noyer", "/editorial/ia/salon-velours-chene"];

const progressOf = (el: HTMLElement | null) => {
  if (!el) return 0;
  const r = el.getBoundingClientRect(), span = r.height - window.innerHeight;
  return span > 0 ? Math.min(1, Math.max(0, -r.top / span)) : 0;
};

const Ctx = createContext<{ choix: Choix; choisir: (p: Partie, id: string) => void; mode: string }>({ choix: CHOIX_DEPART, choisir: () => undefined, mode: "chargement" });

/**
 * Récit piloté au défilement : la scène 3D reste épinglée pendant que les six chapitres défilent par-dessus.
 * Sans WebGL, avec l'économie de données ou en cas d'erreur, des images fixes prennent le relais. Mouvement réduit respecté.
 */
export function Stage({ chapters }: { chapters: ReactNode[] }) {
  const section = useRef<HTMLElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const bar = useRef<HTMLDivElement>(null);
  const handleRef = useRef<StageHandle | null>(null);
  const spotEls = useRef<Array<HTMLAnchorElement | null>>([]);
  const [mode, setMode] = useState<"chargement" | "3d" | "repli">("chargement");
  const [chap, setChap] = useState(0);
  const [choix, setChoix] = useState<Choix>(CHOIX_DEPART);
  const choixRef = useRef(choix);
  const choisir = (p: Partie, id: string) => { setChoix((c) => ({ ...c, [p]: id })); handleRef.current?.setFinish(p, id); };
  useEffect(() => { choixRef.current = choix; }, [choix]);

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
    let alive = true, io: IntersectionObserver | null = null;
    const shown = POINTS.map(() => false);
    const onRm = () => handleRef.current?.setReduced(rm.matches);
    const idle = (cb: () => void) => { const w = window as Window & { requestIdleCallback?: (c: () => void, o?: { timeout: number }) => number }; if (w.requestIdleCallback) w.requestIdleCallback(cb, { timeout: 1500 }); else setTimeout(cb, 300); };
    // Sur ordinateur : dès que le navigateur est libre, avec l'ouverture animée.
    // Sur téléphone : au premier geste ; l'image de l'ouverture (la même pièce, rendue en 3D) s'affiche d'abord.
    const start = (cb: (intro: boolean) => void) => {
      if (!mobile) { idle(() => cb(true)); return; }
      const evs = ["scroll", "touchstart", "pointerdown", "keydown"] as const;
      const go = () => { evs.forEach((e) => window.removeEventListener(e, go)); idle(() => cb(false)); };
      evs.forEach((e) => window.addEventListener(e, go, { passive: true, once: true }));
      if (progressOf(section.current) > 0.02) go();
    };
    start((intro) => void import("./scene").then(({ createStage }) => {
      if (!alive) return;
      try {
        handleRef.current = createStage(el, {
          getProgress: () => progressOf(section.current),
          reduced: rm.matches, mobile, intro, choix: choixRef.current,
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
        io = new IntersectionObserver(([e]) => handleRef.current?.setActive(Boolean(e?.isIntersecting)), { rootMargin: "100px" });
        if (section.current) io.observe(section.current);
      } catch { setMode("repli"); }
    }).catch(() => { if (alive) setMode("repli"); }));
    return () => { alive = false; io?.disconnect(); rm.removeEventListener("change", onRm); handleRef.current?.dispose(); handleRef.current = null; };
  }, []);

  return (
    <Ctx.Provider value={{ choix, choisir, mode }}>
      <section ref={section} aria-label="Le parcours, en six temps" className="bleed relative -mt-7 bg-[#0C0E0B] text-[#F2EEE6]">
        <div className="sticky top-0 h-[100svh] overflow-hidden">
          {/* Repli : images fixes, une par chapitre */}
          <div aria-hidden className={`absolute inset-0 transition-opacity duration-700 ${mode === "3d" ? "opacity-0" : "opacity-100"}`}>
            {REPLI.map((n, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={n} src={n.startsWith("/matieres/") ? `${n}.webp` : `${n}-1024.webp`} alt="" loading={i === 0 ? "eager" : "lazy"} decoding="async"
                className={`absolute inset-0 size-full object-cover transition-opacity duration-700 motion-reduce:transition-none ${i === chap ? "opacity-60" : "opacity-0"}`} />
            ))}
          </div>
          <canvas ref={canvas} aria-hidden className={`absolute inset-0 size-full transition-opacity duration-300 motion-reduce:transition-none ${mode === "3d" ? "opacity-100" : "opacity-0"}`} />
          {/* Voiles pour la lisibilité du texte */}
          <div aria-hidden className="pointer-events-none absolute inset-0 bg-[linear-gradient(0deg,rgba(12,14,11,.92)_0%,rgba(12,14,11,.55)_38%,rgba(12,14,11,0)_62%)] md:bg-[linear-gradient(90deg,rgba(12,14,11,.86)_0%,rgba(12,14,11,.5)_32%,rgba(12,14,11,0)_55%)]" />
          <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-[linear-gradient(180deg,rgba(12,14,11,.7),rgba(12,14,11,0))]" />

          {/* Points cliquables de la pièce transformée (nom et lien selon les finitions choisies) */}
          <div className="absolute inset-0" style={{ visibility: mode === "3d" ? "visible" : "hidden" }}>
            {POINTS.map((p, i) => { const s = pointSelon(p, choix); return (
              <a key={p.id} ref={(e) => { spotEls.current[i] = e; }} href={s.href} tabIndex={-1} aria-hidden="true" aria-label={`${s.label} : voir ${s.detail.toLowerCase()}`}
                className="group absolute left-0 top-0 flex items-center gap-2 no-underline opacity-0" style={{ pointerEvents: "none", willChange: "transform" }}>
                <span className="xp-spot -ml-[14px] -mt-[14px] grid size-7 place-items-center rounded-full bg-[#F2EEE6] transition group-hover:scale-110 group-focus-visible:scale-110">
                  <span className="size-2 rounded-full bg-[#B0784A]" />
                </span>
                <span className="-mt-[14px] hidden whitespace-nowrap bg-[#0C0E0B]/80 px-2.5 py-1 text-[12px] font-medium text-[#F2EEE6] backdrop-blur sm:inline group-hover:bg-[#F2EEE6] group-hover:text-[#0C0E0B] group-focus-visible:bg-[#F2EEE6] group-focus-visible:text-[#0C0E0B]">
                  {s.label} <span className="opacity-60">→ {s.detail}</span>
                </span>
              </a>
            ); })}
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
          {/* Invitation à défiler, à l'ouverture */}
          <a href="#piece" aria-label="Faire défiler vers la suite" className={`xp-cue absolute bottom-8 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 text-[10.5px] font-semibold uppercase tracking-[.22em] text-[#F2EEE6]/70 no-underline transition-opacity md:flex ${chap === 0 ? "opacity-100" : "pointer-events-none opacity-0"}`}>
            Faites défiler <span aria-hidden className="block h-9 w-px overflow-hidden bg-white/20"><span className="block h-1/2 w-px bg-[#C99467]" /></span>
          </a>
          <div aria-hidden className="absolute inset-x-0 bottom-0 h-[2px] bg-white/10"><div ref={bar} className="h-full origin-left bg-[#C99467]" style={{ transform: "scaleX(0)" }} /></div>
          <p className="absolute bottom-4 right-5 m-0 text-[10.5px] text-[#F2EEE6]/55">{mode === "3d" ? "Scène 3D · textures CC0 · images d'inspiration générées par IA" : "Images générées par IA"}</p>
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
    </Ctx.Provider>
  );
}

const NOMS: Record<Partie, string> = { canape: "Canapé", sol: "Parquet", mur: "Chaux" };

/**
 * « Composez-la » : le visiteur essaie des finitions sur la pièce 3D, et les liens suivent son choix.
 * Sans 3D, les liens restent (même destination), le sélecteur change seulement les liens.
 */
export function Composer() {
  const { choix, choisir, mode } = useContext(Ctx);
  return (
    <div className="mt-6">
      <p className="m-0 text-[11px] font-semibold uppercase tracking-[.2em] text-[#F2EEE6]/60">Composez-la{mode === "3d" ? " : la pièce change sous vos yeux" : ""}</p>
      <div className="mt-3 grid gap-3">
        {(Object.keys(FINITIONS) as Partie[]).map((p) => (
          <fieldset key={p} className="m-0 flex min-w-0 items-center gap-3 border-0 p-0">
            <legend className="float-left w-14 shrink-0 p-0 text-[12.5px] text-[#F2EEE6]/70">{NOMS[p]}</legend>
            <div className="flex flex-wrap gap-1.5">
              {FINITIONS[p].map((f) => {
                const on = choix[p] === f.id;
                return (
                  <button key={f.id} type="button" aria-pressed={on} onClick={() => choisir(p, f.id)} title={f.label}
                    className={`group flex min-h-9 items-center gap-1.5 rounded-full border py-1 pl-1 pr-2.5 text-[12px] transition ${on ? "border-[#C99467] bg-[#F2EEE6]/10 text-[#F2EEE6]" : "border-[#F2EEE6]/20 text-[#F2EEE6]/75 hover:border-[#F2EEE6]/50"}`}>
                    <span aria-hidden className={`block size-6 rounded-full border border-white/25 transition ${on ? "scale-110" : "group-hover:scale-105"}`} style={{ background: f.teinte }} />
                    {f.label}
                  </button>
                );
              })}
            </div>
          </fieldset>
        ))}
      </div>
      <ul className={`mt-5 grid list-none grid-cols-1 gap-x-4 gap-y-2 p-0 text-[14px] sm:grid-cols-2 ${mode === "3d" ? "md:sr-only" : ""}`}>
        {POINTS.map((pt) => { const s = pointSelon(pt, choix); return (
          <li key={pt.id}><Link href={s.href} className="text-[#F2EEE6] underline decoration-[#C99467] underline-offset-4 hover:decoration-2">{s.label}</Link></li>
        ); })}
      </ul>
    </div>
  );
}
