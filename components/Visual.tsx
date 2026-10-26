"use client";
import { useEffect, useRef } from "react";
import { paintMaterial, paintPlace, paintScene, type SceneSpec } from "@/lib/draw";
import type { TextureKind } from "@/content/types";

interface CanvasProps { width?: number; height?: number; label: string; className?: string }

/** Vignette dessinée d'une matière. */
export function MaterialSwatch({ texture, colors, seed, width = 360, height = 270, label, className }: CanvasProps & { texture: TextureKind; colors: readonly string[]; seed: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const key = colors.join(",");
  useEffect(() => { if (ref.current) paintMaterial(ref.current, texture, key.split(","), seed); }, [texture, key, seed]);
  return <canvas ref={ref} width={width} height={height} role="img" aria-label={label} className={className} />;
}

/** Scène dessinée (pièce ou extérieur), utilisée tant qu'aucune photo libre n'est disponible. */
export function Scene({ spec, width = 640, height = 480, label, className }: CanvasProps & { spec: SceneSpec }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const key = JSON.stringify(spec);
  useEffect(() => { if (ref.current) paintScene(ref.current, JSON.parse(key) as SceneSpec); }, [key]);
  return <canvas ref={ref} width={width} height={height} role="img" aria-label={label} className={className} />;
}

/** Interprétation graphique d'un lieu, à partir de sa palette. */
export function PlaceVisual({ palette, seed, width = 480, height = 360, label, className }: CanvasProps & { palette: readonly string[]; seed: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const key = palette.join(",");
  useEffect(() => { if (ref.current) paintPlace(ref.current, key.split(","), seed); }, [key, seed]);
  return <canvas ref={ref} width={width} height={height} role="img" aria-label={label} className={className} />;
}
