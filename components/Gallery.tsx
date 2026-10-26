"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { GALLERY, GALLERY_SPACES, STYLES, styleById } from "@/content/index";
import { searchCatalogDemo } from "@/lib/catalog";
import { openCamille } from "@/lib/camille-bus";
import { GalleryCard, GalleryVisual } from "./cards";
import { FavButton } from "./FavButton";
import { IconClose } from "./icons";

type Scope = "interieur" | "exterieur";

export function Gallery() {
  const params = useSearchParams();
  const router = useRouter();
  const initial = useMemo(() => {
    const g = params.get("g"); const s = params.get("style");
    const it = g ? GALLERY.find((x) => x.id === g) : undefined;
    const st = s ? STYLES.find((x) => x.slug === s) : undefined;
    return { scope: (it?.scope ?? st?.scope ?? "interieur") as Scope, style: st?.id ?? "Tous", openId: it?.id ?? null };
  }, [params]);
  const [scope, setScope] = useState<Scope>(initial.scope);
  const [style, setStyle] = useState(initial.style);
  const [space, setSpace] = useState("Tous");
  const [openId, setOpenId] = useState<string | null>(initial.openId);
  const dlg = useRef<HTMLDialogElement>(null);

  useEffect(() => { if (openId) dlg.current?.showModal(); else dlg.current?.close(); }, [openId]);

  const styles = STYLES.filter((s) => s.scope === scope);
  const list = useMemo(() => GALLERY.filter((g) => g.scope === scope && (style === "Tous" || g.styleId === style) && (space === "Tous" || g.space === space)), [scope, style, space]);
  const item = GALLERY.find((g) => g.id === openId);
  const st = item ? styleById.get(item.styleId) : undefined;
  const look = item ? searchCatalogDemo(st?.name ?? "") : null;

  return (
    <>
      <div className="vhead">
        <div><h1>Galerie d'inspiration</h1><p>Trouvez l'ambiance qui vous ressemble. « Je veux ça chez moi » applique le style et la palette à la photo de votre espace.</p></div>
        <div className="seg" role="group" aria-label="Intérieur ou extérieur">
          {(["interieur", "exterieur"] as const).map((s) => <button key={s} type="button" aria-pressed={scope === s} onClick={() => { setScope(s); setStyle("Tous"); setSpace("Tous"); }}>{s === "interieur" ? "Intérieur" : "Extérieur"}</button>)}
        </div>
      </div>
      <div className="mb-3 flex flex-wrap items-center gap-2.5">
        <label className="eyebrow" htmlFor="g-space">Espace</label>
        <select id="g-space" className="input w-auto min-w-40" value={space} onChange={(e) => setSpace(e.target.value)}>
          <option>Tous</option>{GALLERY_SPACES[scope].map((s) => <option key={s}>{s}</option>)}
        </select>
        <span className="text-[13px] text-muted">{list.length} inspiration{list.length > 1 ? "s" : ""}</span>
      </div>
      <div className="mb-5 flex flex-wrap gap-1.5" role="group" aria-label="Styles">
        {[{ id: "Tous", name: "Tous" }, ...styles].map((s) => <button key={s.id} type="button" className="chip" aria-pressed={style === s.id} onClick={() => setStyle(s.id)}>{s.name}</button>)}
      </div>
      <div className="grid-cards">{list.map((g) => <GalleryCard key={g.id} item={g} onOpen={setOpenId} />)}</div>
      <p className="notice mt-5">Les visuels marqués « Illustration » sont dessinés en attendant l'import des photos libres de droits (Unsplash, Pexels, Wikimedia Commons), affichées avec le nom du photographe et la licence.</p>

      <dialog ref={dlg} aria-labelledby="g-title" onClose={() => { setOpenId(null); router.replace("/galerie/", { scroll: false }); }} onClick={(e) => { if (e.target === dlg.current) setOpenId(null); }}
        className="m-auto max-h-[calc(100%-32px)] w-[min(980px,calc(100%-24px))] rounded-[var(--r)] border-0 bg-surface p-0 text-ink backdrop:bg-[var(--scrim)]">
        {item && st && (
          <div className="relative grid md:grid-cols-[1.15fr_1fr]">
            <button type="button" className="btn btn-sm absolute right-2.5 top-2.5 z-10" onClick={() => setOpenId(null)} aria-label="Fermer"><IconClose width={16} height={16} /></button>
            <div className="min-h-64 bg-soft [&>*]:h-full [&>*]:w-full [&>*]:object-cover"><GalleryVisual item={item} width={800} height={600} /></div>
            <div className="flex flex-col gap-3.5 p-6">
              <span className="eyebrow">{st.name} · {item.space}</span>
              <h2 id="g-title" className="text-3xl">{item.title}</h2>
              <p className="text-muted">{st.summary}</p>
              <div><span className="eyebrow">Palette</span><div className="pal lg mt-2">{st.palette.map((c) => <span key={c} style={{ background: c }} title={c} />)}</div></div>
              <div><span className="eyebrow">Les clés du style</span><ul className="dots mt-2">{st.keys.map((k) => <li key={k}>{k}</li>)}</ul></div>
              <div className="flex flex-wrap gap-1.5">
                <Link className="btn btn-primary" href={`/projet/nouveau/?style=${st.id}&space=${encodeURIComponent(item.space)}`}>Je veux ça chez moi</Link>
                <FavButton id={item.id} name={item.title} variant="button" />
                <button type="button" className="btn btn-sm" onClick={() => { setOpenId(null); openCamille(`Comment recréer l'ambiance « ${item.title} » chez moi ?`); }}>Demander à Camille</button>
                <Link className="btn btn-sm" href={`/styles/${st.slug}/`}>Tout sur ce style</Link>
              </div>
              <div className="notice"><b>Acheter le look.</b> {look?.status === "suggestion"
                ? <>Le catalogue des enseignes partenaires n'est pas encore branché. En attendant, des recherches sont proposées sur les sites officiels, sans prix inventé.</>
                : <>Produits similaires du catalogue.</>}</div>
              {item.photo && <p className="credit">Photo : <a href={item.photo.authorUrl ?? item.photo.sourceUrl} target="_blank" rel="noopener noreferrer">{item.photo.author}</a> sur <a href={item.photo.sourceUrl} target="_blank" rel="noopener noreferrer">{item.photo.source}</a> · {item.photo.license}</p>}
            </div>
          </div>
        )}
      </dialog>
    </>
  );
}
