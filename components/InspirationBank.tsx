"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import data from "@/content/data/inspiration-bank.json";
import { materialById } from "@/lib/materials/schema";
import { updateProject } from "@/lib/studio/project";

/**
 * Banque d'inspiration : styles, espaces et matières, chacun relié à une palette et à de vraies matières.
 * On filtre, on cherche, on garde ses favoris, puis on lance un projet dans le Studio avec ce point de départ.
 */
type Img = { kind: "photo" | "planche" | "matiere" | "ia"; src: string; width: number; height: number; credit: string; license: string; sourceUrl: string | null } | null;
interface Entry { id: string; type: "style" | "espace" | "matiere"; title: string; subtitle: string; description: string; materials: string[]; palette: string[]; rooms: string[]; styles: string[]; image: Img; planche?: string; prompt: string; brief: string }
const BANK = data as Entry[];
const TYPES: Array<[Entry["type"] | "favoris", string]> = [["style", "Styles"], ["espace", "Espaces"], ["matiere", "Matières"], ["favoris", "Mes favoris"]];
const ROOMS = BANK.filter((e) => e.type === "espace").map((e) => [e.id, e.title] as const);
const KEY = "pr_inspi_favoris";
const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

export function InspirationBank() {
  const router = useRouter();
  const [type, setType] = useState<Entry["type"] | "favoris">("style");
  const [q, setQ] = useState("");
  const [room, setRoom] = useState<string | null>(null);
  const [mat, setMat] = useState<string | null>(null);
  const [fav, setFav] = useState<string[]>([]);
  const [open, setOpen] = useState<Entry | null>(null);
  const dlg = useRef<HTMLDialogElement>(null);
  useEffect(() => { try { const f = JSON.parse(localStorage.getItem(KEY) ?? "[]"); if (Array.isArray(f)) setTimeout(() => setFav(f), 0); } catch { /* */ } }, []);
  useEffect(() => { const d = dlg.current; if (!d) return; if (open && !d.open) d.showModal(); if (!open && d.open) d.close(); }, [open]);
  const toggleFav = (id: string) => setFav((f) => { const n = f.includes(id) ? f.filter((x) => x !== id) : [...f, id]; try { localStorage.setItem(KEY, JSON.stringify(n)); } catch { /* */ } return n; });

  const allMats = useMemo(() => [...new Set(BANK.flatMap((e) => e.materials))].filter((m) => materialById(m)).sort((a, b) => materialById(a)!.name.localeCompare(materialById(b)!.name)), []);
  const list = BANK.filter((e) => (type === "favoris" ? fav.includes(e.id) : e.type === type))
    .filter((e) => !room || e.rooms.includes(room) || e.id === room)
    .filter((e) => !mat || e.materials.includes(mat))
    .filter((e) => !q || norm(`${e.title} ${e.subtitle} ${e.description} ${e.materials.map((m) => materialById(m)?.name ?? m).join(" ")}`).includes(norm(q)));

  /** Lance un projet avec cette inspiration : style, matières, texte et image de référence dans le brief. */
  const start = (e: Entry) => {
    updateProject((p) => ({ ...p, brief: { ...p.brief, style: e.type === "style" ? e.title : p.brief.style, room: e.type === "espace" && ["salon", "chambre", "cuisine", "salle-de-bain", "entree", "bureau"].includes(e.id) ? e.id as never : p.brief.room, materials: [...new Set([...(p.brief.materials ?? []), ...e.materials.filter((m) => materialById(m))])].slice(0, 8), inspirations: e.image?.kind === "photo" ? [e.image.src, ...p.brief.inspirations].slice(0, 3) : p.brief.inspirations } }));
    try { localStorage.setItem("pr_studio_idee", e.brief); } catch { /* */ }
    router.push("/studio/?etape=creer");
  };

  return (
    <div>
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3 border-b border-line pb-4">
        <nav aria-label="Rubriques" className="flex gap-5">
          {TYPES.map(([id, l]) => (
            <button key={id} type="button" onClick={() => { setType(id); setRoom(null); }} aria-pressed={type === id}
              className={`border-0 bg-transparent px-0 pb-1 text-[15px] transition ${type === id ? "font-semibold text-ink shadow-[inset_0_-2px_0_var(--ink)]" : "text-muted hover:text-ink"}`}>
              {l}{id === "favoris" && fav.length ? ` (${fav.length})` : ""}
            </button>
          ))}
        </nav>
        <span className="flex-1" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher : travertin, japandi, cuisine…" aria-label="Rechercher une inspiration" className="input w-full !rounded-full !py-2 sm:w-72" />
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-2 text-[13px]">
        {type !== "espace" && (
          <select aria-label="Filtrer par espace" value={room ?? ""} onChange={(e) => setRoom(e.target.value || null)} className="input !w-auto !rounded-full !py-1.5">
            <option value="">Tous les espaces</option>{ROOMS.map(([id, t]) => <option key={id} value={id}>{t}</option>)}
          </select>
        )}
        <select aria-label="Filtrer par matière" value={mat ?? ""} onChange={(e) => setMat(e.target.value || null)} className="input !w-auto !rounded-full !py-1.5">
          <option value="">Toutes les matières</option>{allMats.map((m) => <option key={m} value={m}>{materialById(m)!.name}</option>)}
        </select>
        <span className="ml-auto text-muted" aria-live="polite">{list.length} inspiration{list.length > 1 ? "s" : ""}</span>
      </div>

      {list.length === 0 ? (
        <p className="mt-16 text-center text-muted">{type === "favoris" ? "Aucun favori pour l'instant : touchez ♡ sur une inspiration pour la garder ici." : "Aucune inspiration ne correspond à ces critères."}</p>
      ) : (
        <ul className="mt-8 grid list-none grid-cols-1 gap-x-6 gap-y-12 p-0 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((e) => (
            <li key={e.id} className="group">
              <button type="button" onClick={() => setOpen(e)} className="block w-full border-0 bg-transparent p-0 text-left" aria-label={`${e.title} : voir le détail${e.image?.kind === "ia" ? " · Image générée par IA" : ""}`}>
                <figure className="relative m-0 aspect-[4/3] overflow-hidden rounded-[10px] bg-soft">
                  {e.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={e.image.kind === "ia" ? e.image.src.replace(/\.webp$/, "-640.webp") : e.image.src} alt="" loading="lazy" className="size-full object-cover transition duration-700 group-hover:scale-[1.025]" />
                  ) : (
                    <div className="flex size-full items-end gap-2 p-6">{e.palette.map((c) => <span key={c} className="h-2/3 flex-1 rounded-[6px]" style={{ background: c }} />)}</div>
                  )}
                  {e.image?.kind === "ia" && <figcaption className="absolute bottom-2 left-2 rounded-full bg-black/45 px-2 py-0.5 text-[10.5px] font-medium text-white backdrop-blur">Image générée par IA</figcaption>}
                </figure>
              </button>
              <div className="mt-4 flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[.16em] text-muted">{e.subtitle}</p>
                  <h3 className="mt-1 font-display text-[28px] font-normal leading-tight tracking-[-.01em]">{e.title}</h3>
                </div>
                <button type="button" onClick={() => toggleFav(e.id)} aria-pressed={fav.includes(e.id)} aria-label={`${fav.includes(e.id) ? "Retirer" : "Ajouter"} ${e.title} des favoris`}
                  className="grid size-9 shrink-0 place-items-center rounded-full border border-line text-[16px] transition hover:border-ink">{fav.includes(e.id) ? "♥" : "♡"}</button>
              </div>
              {e.palette.length > 0 && <div className="mt-2 flex gap-1.5" aria-hidden>{e.palette.map((c) => <span key={c} className="size-3.5 rounded-full ring-1 ring-black/10" style={{ background: c }} />)}</div>}
            </li>
          ))}
        </ul>
      )}

      <dialog ref={dlg} onClose={() => setOpen(null)} aria-label={open?.title} className="m-auto w-[min(1100px,94vw)] max-h-[92vh] overflow-y-auto rounded-[14px] border-0 bg-surface p-0 text-ink backdrop:bg-[var(--scrim)]">
        {open && (
          <div className="grid lg:grid-cols-[1.25fr_1fr]">
            <figure className="relative m-0 bg-soft">
              {open.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={open.image.src} alt={open.title} className="size-full max-h-[80vh] object-cover" />
              ) : <div className="flex aspect-[4/3] items-end gap-3 p-10">{open.palette.map((c) => <span key={c} className="h-3/4 flex-1 rounded-[8px]" style={{ background: c }} />)}</div>}
              {open.image && <figcaption className="absolute bottom-3 left-3 max-w-[90%] rounded-full bg-black/45 px-3 py-1 text-[11px] text-white backdrop-blur">{open.image.kind === "photo" ? "Photographie" : open.image.kind === "planche" ? "Planche de matières" : open.image.kind === "ia" ? "Image générée par IA" : "Matière photographiée"} · {open.image.credit} · {open.image.license}{open.image.sourceUrl ? <> · <a className="underline" href={open.image.sourceUrl} target="_blank" rel="noopener noreferrer">source</a></> : null}</figcaption>}
            </figure>
            <div className="flex flex-col gap-5 p-7 lg:p-9">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[.16em] text-muted">{open.type === "style" ? "Style" : open.type === "espace" ? "Espace" : "Matière"}</p>
                  <h2 className="mt-1 text-[40px]">{open.title}</h2>
                </div>
                <button type="button" onClick={() => setOpen(null)} className="grid size-9 place-items-center rounded-full border border-line text-[18px]" aria-label="Fermer">×</button>
              </div>
              <p className="text-[15px] leading-relaxed">{open.description}</p>
              {open.palette.length > 0 && <div><p className="eyebrow">Palette</p><div className="mt-2 flex gap-2">{open.palette.map((c) => <span key={c} className="flex flex-col items-center gap-1 text-[10.5px] text-muted"><span className="size-10 rounded-full ring-1 ring-black/10" style={{ background: c }} />{c}</span>)}</div></div>}
              {open.planche && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={open.planche} alt={`Planche de matières : ${open.title}`} loading="lazy" className="w-full rounded-[8px]" />
              )}
              <div>
                <p className="eyebrow">Matières</p>
                <ul className="mt-2 grid list-none grid-cols-2 gap-2 p-0">
                  {open.materials.map((id) => { const m = materialById(id); if (!m) return null; return (
                    <li key={id} className="flex items-center gap-2.5 text-[13px]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={`/editorial/matieres/${id}.webp`} alt="" className="size-10 rounded-[6px] object-cover" onError={(ev) => { (ev.currentTarget as HTMLImageElement).style.background = m.baseColor; (ev.currentTarget as HTMLImageElement).removeAttribute("src"); }} />
                      <span><span className="font-medium">{m.name}</span><br /><span className="text-muted">{m.finish}</span></span>
                    </li>); })}
                </ul>
              </div>
              <div className="mt-auto flex flex-wrap gap-2 pt-2">
                <button type="button" className="btn btn-primary" onClick={() => start(open)}>Créer un projet avec {open.type === "matiere" ? "cette matière" : open.type === "espace" ? "cet espace" : "ce style"}</button>
                <button type="button" className="btn" onClick={() => toggleFav(open.id)} aria-pressed={fav.includes(open.id)}>{fav.includes(open.id) ? "♥ Dans mes favoris" : "♡ Favori"}</button>
              </div>
            </div>
          </div>
        )}
      </dialog>
    </div>
  );
}
