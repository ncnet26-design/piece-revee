"use client";
/* eslint-disable @next/next/no-img-element -- photos libres servies telles quelles */
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { INSPIRATIONS, INSPI_COLLECTIONS, type Inspiration } from "@/content/inspirations";
import { openCamille } from "@/lib/camille-bus";
import { IconClose } from "./icons";

/** Inspirations : uniquement des photos (libres de droits, choisies à la main, ou créées par IA à la demande). */
export function Inspirations() {
  const router = useRouter();
  const [col, setCol] = useState<string>("tous");
  const [open, setOpen] = useState<Inspiration | null>(null);
  const [ai, setAi] = useState<Record<string, string[]>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const dlg = useRef<HTMLDialogElement>(null);
  useEffect(() => { if (open) dlg.current?.showModal(); else dlg.current?.close(); }, [open]);

  const list = INSPIRATIONS.filter((p) => col === "tous" || p.collection === col);
  const cols = INSPI_COLLECTIONS.filter((c) => col === "tous" || c.id === col);

  const toBoard = async (src: string, title: string) => {
    setBusy("board");
    const m = await import("@/lib/board/fromImage");
    try { const { board, photoId, dataUrl } = await m.boardFromImage(src, title); m.storeBoardWithPhoto(board, photoId, dataUrl); router.push("/planche/"); }
    catch { setMsg("L'image n'a pas pu être lue. Réessayez."); setBusy(null); }
  };
  const generate = async (c: (typeof INSPI_COLLECTIONS)[number]) => {
    setBusy(c.id); setMsg(null);
    const { conceptImage } = await import("@/lib/ia");
    const r = await conceptImage(`${c.prompt}. Photographie d'architecture d'intérieur, cadrage large, lumière naturelle.`, "4:3");
    if (r.ok) setAi((a) => ({ ...a, [c.id]: [r.image, ...(a[c.id] ?? [])] }));
    else setMsg(r.message);
    setBusy(null);
  };
  const aiItems = cols.flatMap((c) => (ai[c.id] ?? []).map((src, i): Inspiration => ({ id: `ia-${c.id}-${i}`, collection: c.id, src, thumb: src, width: 1200, height: 900, title: c.label, author: "Image créée par IA", authorUrl: null, source: "Pièce Rêvée", sourceUrl: "", license: "Image générée" })));
  const shown = [...aiItems, ...list];

  return (
    <div>
      <div className="flex flex-wrap gap-1.5" role="group" aria-label="Collections">
        {[{ id: "tous", label: "Toutes" }, ...INSPI_COLLECTIONS].map((c) => <button key={c.id} type="button" className="chip" aria-pressed={col === c.id} onClick={() => setCol(c.id)}>{c.label}</button>)}
      </div>
      {msg && <p role="status" className="notice notice-warn mt-4">{msg}</p>}
      <ul className="m-0 mt-6 list-none columns-1 gap-4 p-0 sm:columns-2 lg:columns-3 [&>li]:mb-4 [&>li]:break-inside-avoid">
        {shown.map((p) => (
          <li key={p.id}>
            <button type="button" className="group relative block w-full overflow-hidden rounded-[22px] bg-soft p-0 text-left" onClick={() => setOpen(p)} aria-label={`${INSPI_COLLECTIONS.find((c) => c.id === p.collection)?.label} : ${p.title}`}>
              <img src={p.thumb} alt="" loading="lazy" width={p.width} height={p.height} className="h-auto w-full transition-transform duration-700 group-hover:scale-[1.03]" />
              <span aria-hidden="true" className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-4 pt-10 text-[13px] font-medium text-white opacity-0 transition-opacity group-hover:opacity-100">{INSPI_COLLECTIONS.find((c) => c.id === p.collection)?.label}</span>
            </button>
          </li>
        ))}
        {cols.map((c) => (
          <li key={`gen-${c.id}`}>
            <div className="grid aspect-[4/3] place-items-center rounded-[22px] border border-dashed border-line bg-surface p-6 text-center">
              <div>
                <p className="m-0 text-[15px] font-semibold">{c.label}</p>
                <p className="m-0 mt-1 text-[13px] text-muted">Une nouvelle photo d'ambiance, créée pour vous par IA.</p>
                <button type="button" className="btn btn-sm btn-primary mt-3" onClick={() => void generate(c)} disabled={!!busy}>{busy === c.id ? <><span className="spinner" /> Création…</> : "Générer une photo"}</button>
              </div>
            </div>
          </li>
        ))}
      </ul>
      <dialog ref={dlg} aria-label="Inspiration" onClose={() => setOpen(null)} onClick={(e) => { if (e.target === dlg.current) setOpen(null); }}
        className="m-auto max-h-[calc(100%-24px)] w-[min(1180px,calc(100%-24px))] overflow-hidden rounded-[24px] border-0 bg-surface p-0 text-ink backdrop:bg-black/70">
        {open && (
          <div className="grid lg:grid-cols-[1fr_340px]">
            <img src={open.src} alt={open.title} className="max-h-[80vh] w-full bg-black object-contain" />
            <div className="flex flex-col gap-3 p-6">
              <button type="button" className="btn btn-sm btn-ghost self-end" aria-label="Fermer" onClick={() => setOpen(null)}><IconClose width={16} height={16} /></button>
              <span className="eyebrow">{INSPI_COLLECTIONS.find((c) => c.id === open.collection)?.label}</span>
              <h2 className="text-[26px] leading-tight">{open.title.length > 60 ? `${open.title.slice(0, 57)}…` : open.title}</h2>
              <button type="button" className="btn btn-primary" onClick={() => void toBoard(open.src, INSPI_COLLECTIONS.find((c) => c.id === open.collection)?.label ?? "Inspiration")} disabled={busy === "board"}>{busy === "board" ? "Composition…" : "Créer un moodboard"}</button>
              <button type="button" className="btn" onClick={() => { setOpen(null); openCamille(`Comment recréer chez moi l'ambiance de cette inspiration (${INSPI_COLLECTIONS.find((c) => c.id === open.collection)?.label}) ?`); }}>Demander à Camille</button>
              <p className="credit mt-auto">{open.sourceUrl ? <>Photo : {open.authorUrl ? <a href={open.authorUrl} target="_blank" rel="noopener noreferrer">{open.author}</a> : open.author} sur <a href={open.sourceUrl} target="_blank" rel="noopener noreferrer">{open.source}</a> · {open.license}</> : "Image créée par IA, à titre d'inspiration."}</p>
            </div>
          </div>
        )}
      </dialog>
    </div>
  );
}
