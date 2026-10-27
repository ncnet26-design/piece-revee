"use client";
import Link from "next/link";
import type { FurnitureIcon, Material, Pairing, Place, Plant, StyleTheme } from "@/content/types";
import type { GalleryItem } from "@/content/gallery";
import { materialById, styleById } from "@/content/lookup";
import { FavButton } from "./FavButton";
import { MaterialSwatch, PlaceVisual, Scene } from "./Visual";

export function GalleryVisual({ item, width = 480, height = 360 }: { item: GalleryItem; width?: number; height?: number }) {
  const style = styleById.get(item.styleId);
  if (item.photo) return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={item.photo.thumbUrl} alt={item.photo.alt} loading="lazy" decoding="async" width={item.photo.width} height={item.photo.height} />
  );
  return <Scene spec={{ scope: item.scope, space: item.space, palette: style?.palette ?? [], seed: item.seed }} width={width} height={height} label={`Illustration : ${item.title}`} />;
}

export function GalleryCard({ item, onOpen }: { item: GalleryItem; onOpen: (id: string) => void }) {
  const style = styleById.get(item.styleId);
  return (
    <article className="card">
      <div className="vis"><GalleryVisual item={item} /><FavButton id={item.id} name={item.title} /></div>
      <div className="body">
        <span className="eyebrow">{style?.name}</span>
        <h3><button type="button" className="card-link cursor-pointer border-0 bg-transparent p-0 text-left font-display text-[17.5px] text-ink" onClick={() => onOpen(item.id)}>{item.title}</button></h3>
        <div className="mt-1 flex items-center justify-between gap-2">
          <div className="pal" role="img" aria-label={`Palette : ${style?.palette.join(", ") ?? ""}`}>{style?.palette.map((c) => <span key={c} style={{ background: c }} />)}</div>
          {item.photo ? <span className="credit over">{item.photo.author} · {item.photo.source}</span> : <span className="tag">Illustration</span>}
        </div>
      </div>
    </article>
  );
}

export function MaterialCard({ m }: { m: Material }) {
  return (
    <article className="card">
      <div className="vis"><MaterialSwatch texture={m.texture} colors={m.colors} seed={m.id} label={`Échantillon dessiné : ${m.name}`} /><FavButton id={m.id} name={m.name} /></div>
      <div className="body">
        <span className="eyebrow">{m.family}</span>
        <h3><Link href={`/matieres/${m.slug}/`} className="card-link text-ink no-underline">{m.name}</Link></h3>
        <p>{m.summary}</p>
        <div className="meta"><span>{m.exterior && m.interior ? "Dedans et dehors" : m.exterior ? "Extérieur" : "Intérieur"}</span><span>{m.priceRange}</span></div>
      </div>
    </article>
  );
}

export function TripleSwatch({ ids }: { ids: readonly string[] }) {
  const ms = ids.map((id) => materialById.get(id)).filter((m): m is Material => Boolean(m));
  return (
    <div className="grid h-full grid-cols-[2fr_1fr] grid-rows-2 gap-0.5">
      {ms.slice(0, 3).map((m, i) => <div key={m.id} className={i === 0 ? "row-span-2" : ""}><MaterialSwatch texture={m.texture} colors={m.colors} seed={m.id} width={i === 0 ? 300 : 160} height={i === 0 ? 300 : 150} label={m.name} className="h-full w-full object-cover" /></div>)}
    </div>
  );
}

export function PairingCard({ p }: { p: Pairing }) {
  return (
    <article className="card">
      <div className="vis"><TripleSwatch ids={p.materials} /><FavButton id={p.id} name={p.name} /></div>
      <div className="body">
        <span className="eyebrow">Accord</span>
        <h3><Link href={`/accords/${p.slug}/`} className="card-link text-ink no-underline">{p.name}</Link></h3>
        <p>{p.mood}</p>
        <div className="meta"><span>{p.materials.map((id) => materialById.get(id)?.name).join(" · ")}</span></div>
      </div>
    </article>
  );
}

export function FurnitureCard({ f }: { f: FurnitureIcon }) {
  return (
    <article className="card">
      <div className="vis"><TripleSwatch ids={[...f.materials, ...f.materials, ...f.materials].slice(0, 3)} /><FavButton id={f.id} name={f.name} /></div>
      <div className="body">
        <span className="eyebrow">{f.category} · {f.year}</span>
        <h3><Link href={`/mobilier/${f.slug}/`} className="card-link text-ink no-underline">{f.name}</Link></h3>
        <p>{f.designer}</p>
        <div className="meta"><span>{f.editor}</span><span>{f.budgetTier}</span></div>
      </div>
    </article>
  );
}

export function PlaceCard({ p }: { p: Place }) {
  return (
    <article className="card">
      <div className="vis"><PlaceVisual palette={p.palette} seed={p.id} label={`Interprétation graphique de ${p.name}`} /><FavButton id={p.id} name={p.name} /></div>
      <div className="body">
        <span className="eyebrow">{p.theme} · {p.year}</span>
        <h3><Link href={`/lieux/${p.slug}/`} className="card-link text-ink no-underline">{p.name}</Link></h3>
        <p>{p.author}</p>
        <div className="meta"><span>{p.location}, {p.country}</span></div>
      </div>
    </article>
  );
}

export function PlantCard({ p }: { p: Plant }) {
  return (
    <article className="card">
      <div className="vis grid place-items-center" style={{ background: "linear-gradient(160deg, #DCE5D0, #9DB08A)" }}>
        <span aria-hidden="true" className="font-display text-5xl text-white/90">{p.name.charAt(0)}</span>
        <FavButton id={p.id} name={p.name} />
      </div>
      <div className="body">
        <span className="eyebrow">{p.type}</span>
        <h3><Link href={`/plantes/${p.slug}/`} className="card-link text-ink no-underline">{p.name}</Link></h3>
        <p><i>{p.latin}</i></p>
        <div className="meta"><span>{p.exposure.join(", ")}</span><span>{p.hardinessC !== null ? `jusqu'à ${p.hardinessC} °C` : "Intérieur"}</span></div>
      </div>
    </article>
  );
}

export function StyleCard({ s }: { s: StyleTheme }) {
  return (
    <article className="card">
      <div className="vis"><Scene spec={{ scope: s.scope, space: s.scope === "interieur" ? "Salon" : "Terrasse", palette: s.palette, seed: s.id.length * 977 }} width={480} height={360} label={`Illustration du style ${s.name}`} /></div>
      <div className="body">
        <span className="eyebrow">{s.scope === "interieur" ? "Intérieur" : "Extérieur"}</span>
        <h3><Link href={`/styles/${s.slug}/`} className="card-link text-ink no-underline">{s.name}</Link></h3>
        <p>{s.summary}</p>
        <div className="pal mt-2">{s.palette.map((c) => <span key={c} style={{ background: c }} />)}</div>
      </div>
    </article>
  );
}
