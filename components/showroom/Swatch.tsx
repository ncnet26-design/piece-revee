"use client";
import { useEffect, useRef, useState } from "react";

/** File d'attente : une vignette à la fois, entre deux images, pour garder la page fluide. */
let chain: Promise<void> = Promise.resolve();
const enqueue = (job: () => Promise<void>) => { chain = chain.then(() => new Promise<void>((r) => requestAnimationFrame(() => r()))).then(job).catch(() => {}); return chain; };

/** Échantillon du showroom rendu avec éclairage d'atelier (calculé quand il devient visible). */
export function Swatch({ refId, label, size = 320, className = "", repeat = 1 }: { refId: string; label: string; size?: number; className?: string; repeat?: number }) {
  const cv = useRef<HTMLCanvasElement>(null);
  const [done, setDone] = useState(false);
  useEffect(() => {
    const el = cv.current; if (!el) return;
    let alive = true;
    const run = () => enqueue(async () => {
      if (!alive) return;
      const { shootSample } = await import("@/lib/showroom/thumbs");
      if (!alive || !cv.current) return;
      let ok = false;
      try { ok = await shootSample(refId, cv.current); } catch { ok = false; }
      if (!ok && alive && cv.current) {
        const [{ surfaceFor }, { renderSwatch }] = await Promise.all([import("@/lib/showroom/surfaces"), import("@/lib/showroom/generate")]);
        const s = await surfaceFor(refId, 512);
        if (s && cv.current) renderSwatch(s, cv.current, repeat);
      }
      if (alive) setDone(true);
    });
    const io = new IntersectionObserver((es) => { if (es.some((e) => e.isIntersecting)) { io.disconnect(); void run(); } }, { rootMargin: "300px" });
    io.observe(el);
    return () => { alive = false; io.disconnect(); };
  }, [refId, size, repeat]);
  return (
    <span className={`relative block overflow-hidden bg-[radial-gradient(circle_at_42%_30%,#FBF9F4,#E7E1D6)] ${className}`}>
      <canvas ref={cv} width={Math.min(720, size * 2)} height={Math.min(720, size * 2)} role="img" aria-label={label} className={`block h-full w-full transition-opacity duration-500 ${done ? "opacity-100" : "opacity-0"}`} />
      {!done && <span aria-hidden="true" className="absolute inset-0 animate-pulse bg-gradient-to-br from-[#EDE8DF] to-[#E2DCD1]" />}
    </span>
  );
}
