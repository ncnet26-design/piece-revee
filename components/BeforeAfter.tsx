"use client";
import { useId, useState, type ReactNode } from "react";

/** Comparateur avant/après au glissé (souris, doigt, clavier). */
export function BeforeAfter({ before, after, labelAfter = "Après", ratio = "4 / 3" }: { before: ReactNode; after: ReactNode; labelAfter?: string; ratio?: string }) {
  const [cut, setCut] = useState(50);
  const id = useId();
  return (
    <div className="relative overflow-hidden rounded-[var(--r-s)] bg-soft" style={{ aspectRatio: ratio, maxWidth: "100%" }}>
      <div className="absolute inset-0 [&>*]:h-full [&>*]:w-full [&>*]:object-cover">{before}</div>
      <div className="absolute inset-0 [&>*]:h-full [&>*]:w-full [&>*]:object-cover" style={{ clipPath: `inset(0 0 0 ${cut}%)` }}>{after}</div>
      <span className="absolute left-2.5 top-2.5 rounded-full bg-black/70 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-white">Avant</span>
      <span className="absolute right-2.5 top-2.5 rounded-full bg-black/70 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-white">{labelAfter}</span>
      <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 w-0.5 bg-white shadow" style={{ left: `${cut}%` }}>
        <span className="absolute left-1/2 top-1/2 grid h-9 w-9 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white text-[#121412] shadow-lg">⟷</span>
      </div>
      <label htmlFor={id} className="sr-only">Comparer avant et après</label>
      <input id={id} type="range" min={0} max={100} value={cut} onChange={(e) => setCut(Number(e.target.value))} className="absolute inset-0 m-0 h-full w-full cursor-ew-resize opacity-0" />
    </div>
  );
}
