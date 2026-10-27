"use client";
import { useEffect, useRef, type RefObject } from "react";

/** Dessine seulement quand le canevas approche de l'écran, pendant un temps libre du navigateur. */
function useLazyPaint(ref: RefObject<HTMLCanvasElement | null>, paint: (c: HTMLCanvasElement) => void, key: string) {
  useEffect(() => {
    const el = ref.current; if (!el) return;
    let done = false; let idle = 0;
    const run = () => { if (done || !ref.current) return; done = true; paint(ref.current); };
    const schedule = () => { const w = window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number; cancelIdleCallback?: (h: number) => void }; idle = w.requestIdleCallback ? w.requestIdleCallback(run, { timeout: 300 }) : window.setTimeout(run, 16); };
    if (!("IntersectionObserver" in window)) { schedule(); return; }
    const io = new IntersectionObserver((entries) => { if (entries.some((e) => e.isIntersecting)) { io.disconnect(); schedule(); } }, { rootMargin: "300px" });
    io.observe(el);
    return () => { io.disconnect(); const w = window as Window & { cancelIdleCallback?: (h: number) => void }; if (w.cancelIdleCallback) w.cancelIdleCallback(idle); else clearTimeout(idle); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
}
import { paintMaterial, paintPlace, paintScene, type SceneSpec } from "@/lib/draw";
import type { TextureKind } from "@/content/types";

interface CanvasProps { width?: number; height?: number; label: string; className?: string }

/** Vignette dessinée d'une matière. */
export function MaterialSwatch({ texture, colors, seed, width = 360, height = 270, label, className }: CanvasProps & { texture: TextureKind; colors: readonly string[]; seed: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const key = colors.join(",");
  useLazyPaint(ref, (c) => paintMaterial(c, texture, key.split(","), seed), `${texture}|${key}|${seed}`);
  return <canvas ref={ref} width={width} height={height} role="img" aria-label={label} className={className} />;
}

/** Scène dessinée (pièce ou extérieur), utilisée tant qu'aucune photo libre n'est disponible. */
export function Scene({ spec, width = 640, height = 480, label, className }: CanvasProps & { spec: SceneSpec }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const key = JSON.stringify(spec);
  useLazyPaint(ref, (c) => paintScene(c, JSON.parse(key) as SceneSpec), key);
  return <canvas ref={ref} width={width} height={height} role="img" aria-label={label} className={className} />;
}

/** Interprétation graphique d'un lieu, à partir de sa palette. */
export function PlaceVisual({ palette, seed, width = 480, height = 360, label, className }: CanvasProps & { palette: readonly string[]; seed: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const key = palette.join(",");
  useLazyPaint(ref, (c) => paintPlace(c, key.split(","), seed), `${key}|${seed}`);
  return <canvas ref={ref} width={width} height={height} role="img" aria-label={label} className={className} />;
}
