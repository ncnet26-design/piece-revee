"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { GALLERY, libraryById, materialById, placeById, styleById } from "@/content/index";
import { favorites, useFavorites } from "@/lib/favorites";
import { extractPalette, preparePhoto } from "@/lib/photo";
import { openCamille } from "@/lib/camille-bus";
import { useLocal } from "@/lib/use-local";
import { GalleryCard } from "./cards";

interface Upload { id: string; dataUrl: string; palette: string[] }
const UP_KEY = "pr_moodboard_uploads";
const NO_UPLOADS: Upload[] = [];

export function Moodboard() {
  const favs = useFavorites();
  const router = useRouter();
  const [uploads, setUploadsStored] = useLocal<Upload[]>(UP_KEY, NO_UPLOADS);
  const [msg, setMsg] = useState<string | null>(null);
  const [over, setOver] = useState(false);
  const saveUploads = (u: Upload[]) => setUploadsStored(u);

  const items = favs.map((id) => ({ id, lib: libraryById.get(id), gal: GALLERY.find((g) => g.id === id) }));
  const palette = useMemo(() => {
    const cols: string[] = [];
    for (const { id, gal } of items) {
      const m = materialById.get(id); if (m) cols.push(m.colors[0]);
      const p = placeById.get(id); if (p) cols.push(...p.palette.slice(0, 2));
      if (gal) cols.push(...(styleById.get(gal.styleId)?.palette.slice(0, 2) ?? []));
    }
    for (const u of uploads) cols.push(...u.palette.slice(0, 2));
    return [...new Set(cols.map((c) => c.toUpperCase()))].slice(0, 10);
  }, [items, uploads]);

  const add = async (files: FileList | null) => {
    if (!files) return; setMsg(null);
    const next = [...uploads];
    for (const f of Array.from(files).slice(0, 6)) {
      const r = await preparePhoto(f, 640); if (!r.ok) { setMsg(r.message); continue; }
      next.push({ id: crypto.randomUUID(), dataUrl: r.photo.dataUrl, palette: await extractPalette(r.photo.dataUrl) });
    }
    saveUploads(next.slice(-12));
  };
  const empty = favs.length === 0 && uploads.length === 0;
  const summary = items.map((i) => i.lib?.name ?? i.gal?.title).filter(Boolean).join(", ");

  return (
    <>
      <div className="vhead">
        <div><h1>Mon moodboard</h1><p>Rassemblez matières, meubles, lieux, plantes et images qui vous parlent. L'étude et Camille s'en servent.</p></div>
        {!empty && <div className="flex flex-wrap gap-2">
          <button type="button" className="btn btn-primary" onClick={() => openCamille(`Analyse mon moodboard : ${summary || "mes images"}${palette.length ? `, palette ${palette.join(" ")}` : ""}. Quel style s'en dégage, est-ce cohérent, et comment le concrétiser chez moi ?`)}>Analyser avec Camille</button>
          <Link className="btn" href="/projet/nouveau/">Transformer ma pièce avec ce moodboard</Link>
        </div>}
      </div>
      <label onDragOver={(e) => { e.preventDefault(); setOver(true); }} onDragLeave={() => setOver(false)} onDrop={(e) => { e.preventDefault(); setOver(false); void add(e.dataTransfer.files); }}
        className={`mb-6 flex cursor-pointer flex-col items-center gap-1 rounded-[var(--r)] border-[1.5px] border-dashed p-6 text-center ${over ? "border-accent" : "border-line"}`}>
        <b>Glissez vos images ici</b><span className="text-[13px] text-muted">ou touchez pour en choisir : la palette est extraite automatiquement. Elles restent sur votre appareil.</span>
        <input type="file" accept="image/jpeg,image/png,image/webp" multiple className="sr-only" onChange={(e) => void add(e.target.files)} />
      </label>
      {msg && <p role="alert" className="notice notice-warn mb-4">{msg}</p>}
      {palette.length > 0 && <div className="mb-6"><span className="eyebrow">Palette du moodboard</span><div className="pal lg mt-2 flex-wrap">{palette.map((c) => <span key={c} style={{ background: c }} title={c} />)}</div></div>}
      {empty ? (
        <div className="panel flex flex-col items-center gap-2 border-dashed py-10 text-center"><h2 className="text-2xl">Votre moodboard est vide</h2><p className="text-muted">Touchez le cœur sur une matière, un meuble, un lieu ou une inspiration pour l'ajouter ici.</p><div className="mt-2 flex gap-2"><Link className="btn btn-primary" href="/galerie/">Parcourir la galerie</Link><Link className="btn" href="/matieres/">Les matières</Link></div></div>
      ) : (
        <div className="grid-cards">
          {uploads.map((u) => (
            <article key={u.id} className="card">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <div className="vis"><img src={u.dataUrl} alt="Image ajoutée au moodboard" /></div>
              <div className="body"><span className="eyebrow">Mon image</span><div className="pal">{u.palette.map((c) => <span key={c} style={{ background: c }} />)}</div><button type="button" className="btn btn-sm mt-2 self-start" onClick={() => saveUploads(uploads.filter((x) => x.id !== u.id))}>Retirer</button></div>
            </article>
          ))}
          {items.map(({ id, lib, gal }) => gal ? <GalleryCard key={id} item={gal} onOpen={() => router.push(`/galerie/?g=${id}`)} /> : lib ? (
            <article key={id} className="card"><div className="body p-4"><span className="eyebrow">{({ matiere: "Matière", accord: "Accord", meuble: "Mobilier", lieu: "Lieu", plante: "Plante", style: "Style", guide: "Guide" } as const)[lib.kind]}</span><h3><Link href={lib.href} className="card-link text-ink no-underline">{lib.name}</Link></h3><button type="button" className="btn btn-sm over mt-2 self-start" onClick={() => favorites.toggle(id)}>Retirer</button></div></article>
          ) : null)}
        </div>
      )}
    </>
  );
}
