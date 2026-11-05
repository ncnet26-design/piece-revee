"use client";
import { textureMatiere } from "@/lib/texture-matiere";
import { useCallback, useRef, useState } from "react";
import type { Product } from "@/lib/products/schema";
import { productById } from "@/lib/products/schema";
import type { Surface } from "@/lib/ia-jobs";
import { featuresOf, type AiObject } from "@/lib/studio/showcase";
import { updateProject, useProject } from "@/lib/studio/project";
import { hit, lensUrl, nearestMaterials, nearestPaint, sampleColor, surfaceQuery } from "@/lib/parcours";
import { Comparator } from "@/components/parcours/Comparator";
import { Panel } from "@/components/parcours/Panel";
import { ShopLinks } from "@/components/ShopLinks";
import { EnLigne } from "./EnLigne";
import { Catalogue } from "./Catalogue";
import { BeforeAfter } from "@/components/BeforeAfter";

type Sel = { kind: "objet"; o: AiObject } | { kind: "surface"; s: Surface } | { kind: "couleur"; hex: string; x: number; y: number };

/**
 * La pièce transformée : on touche n'importe où. Un meuble ouvre ses alternatives réelles (trois gammes) ;
 * un mur, un sol ou un rideau ouvre sa teinte, ses matières proches et où les trouver ; ailleurs, la couleur du point.
 */
export function Resultat({ image, before, objects, surfaces, analysing }: { image: string; before?: string; objects: AiObject[]; surfaces: Surface[]; analysing: boolean }) {
  const [sel, setSel] = useState<Sel | null>(null);
  const [compare, setCompare] = useState(false);
  const [ratio, setRatio] = useState("4 / 3");
  const img = useRef<HTMLImageElement>(null);
  const project = useProject();
  const inList = useCallback((id: string) => project.list.some((x) => x.productId === id), [project.list]);
  const total = project.list.reduce((s, x) => s + (productById(x.productId)?.price?.amount ?? x.external?.price ?? 0) * x.qty, 0);

  const onAdd = (p: Product, forObject: string) => updateProject((x) => ({
    ...x, list: x.list.some((y) => y.productId === p.id) ? x.list.filter((y) => y.productId !== p.id) : [...x.list, { productId: p.id, qty: 1, forObject }],
  }));

  const onClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * 100, y = ((e.clientY - r.top) / r.height) * 100;
    const h = hit(x, y, objects, surfaces);
    if (h) { setSel(h); return; }
    const hex = img.current ? sampleColor(img.current, x, y) : null;
    if (hex) setSel({ kind: "couleur", hex, x, y });
  };

  const title = sel?.kind === "objet" ? sel.o.label : sel?.kind === "surface" ? sel.s.label || sel.s.kind : sel ? `Couleur ${nearestPaint(sel.hex).name.toLowerCase()}` : "";
  const kicker = sel?.kind === "objet" ? "Meuble et objet" : sel?.kind === "surface" ? "Surface" : "Couleur";

  return (
    <div className="relative">
      <div className="mb-3 flex flex-wrap items-center gap-2 text-[13px]">
        <span className="text-muted">{analysing ? "Repérage des meubles et des surfaces…" : `${objects.length} élément${objects.length > 1 ? "s" : ""} et ${surfaces.length} surface${surfaces.length > 1 ? "s" : ""} repérés · touchez n'importe où`}</span>
        <span className="flex-1" />
        {before && <button type="button" className="btn btn-sm" aria-pressed={compare} onClick={() => setCompare((v) => !v)}>{compare ? "Revenir à la pièce cliquable" : "Comparer avant / après"}</button>}
      </div>
      {compare && before ? (
        // eslint-disable-next-line @next/next/no-img-element
        <BeforeAfter ratio={ratio} labelBefore="Ma pièce" labelAfter="Transformée" before={<img src={before} alt="Ma pièce avant" />} after={<img src={image} alt="Ma pièce transformée" />} />
      ) : (
        <div className="relative cursor-crosshair overflow-hidden rounded-[2px] bg-soft" onClick={onClick} data-testid="piece-transformee">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img ref={img} src={image} alt="Ma pièce transformée avec mes inspirations" crossOrigin="anonymous" className="block w-full" onLoad={(e) => setRatio(`${e.currentTarget.naturalWidth} / ${e.currentTarget.naturalHeight}`)} />
          {objects.map((o) => (
            <button key={o.id} type="button" onClick={(e) => { e.stopPropagation(); setSel({ kind: "objet", o }); }} aria-label={`${o.label} : voir les modèles ressemblants`} aria-pressed={sel?.kind === "objet" && sel.o.id === o.id}
              className="studio-hotspot absolute" style={{ left: `${o.zone.x}%`, top: `${o.zone.y}%`, width: `${o.zone.w}%`, height: `${o.zone.h}%` }}>
              <span className="studio-hotspot-dot" style={{ left: "50%", top: "50%" }} />
              <span className="studio-hotspot-label">{o.label}</span>
            </button>
          ))}
          {sel?.kind === "couleur" && <span aria-hidden className="pointer-events-none absolute size-6 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow" style={{ left: `${sel.x}%`, top: `${sel.y}%`, background: sel.hex }} />}
          <span className="pointer-events-none absolute bottom-3 left-3 rounded-full bg-black/45 px-2.5 py-1 text-[10.5px] font-medium text-white backdrop-blur">Image générée par IA</span>
        </div>
      )}

      {(objects.length > 0 || surfaces.length > 0) && (
        <div className="mt-4">
          <p className="eyebrow">Dans cette image</p>
          <ul className="mt-2 flex list-none flex-wrap gap-1.5 p-0">
            {objects.map((o) => <li key={o.id}><button type="button" className="btn btn-sm" onClick={() => setSel({ kind: "objet", o })}>{o.label}</button></li>)}
            {surfaces.map((s) => (
              <li key={s.id}><button type="button" className="btn btn-sm" onClick={() => setSel({ kind: "surface", s })}>
                {s.colors[0] && <span aria-hidden className="size-3 rounded-full ring-1 ring-black/10" style={{ background: s.colors[0].hex }} />}{s.label || s.kind}
              </button></li>
            ))}
          </ul>
        </div>
      )}
      {project.list.length > 0 && (
        <p className="mt-4 text-[13px]"><a className="underline" href="/ma-piece/">Ma pièce composée : {project.list.length} article{project.list.length > 1 ? "s" : ""}{total ? ` · ${total.toLocaleString("fr-FR")} € de prix relevés` : ""} — voir ma liste d'achats</a></p>
      )}

      <Panel open={Boolean(sel)} kicker={kicker} title={title} onClose={() => setSel(null)}>
        {sel?.kind === "objet" && (<>
          {sel.o.description && <p className="mt-2 text-[13px] text-muted">{sel.o.description}</p>}
          <EnLigne key={`en-ligne-${sel.o.id}`} query={sel.o.query || sel.o.label} label={sel.o.label} forObject={sel.o.id} />
          <details className="group mt-5 border-t border-line pt-4">
            <summary className="cursor-pointer list-none text-[14px] font-semibold">Aussi dans notre boutique<span className="ml-2 font-normal text-muted">30 000 produits, prix revérifiés chaque nuit</span><span aria-hidden className="ml-1 inline-block text-muted transition group-open:rotate-180">⌄</span></summary>
            <Catalogue type={sel.o.type} label={sel.o.label} query={sel.o.query || sel.o.label} forObject={sel.o.id} />
          </details>
          <details className="group mt-5 border-t border-line pt-4">
            <summary className="cursor-pointer list-none text-[14px] font-semibold">Dans notre sélection vérifiée<span aria-hidden className="ml-1 inline-block text-muted transition group-open:rotate-180">⌄</span></summary>
            <Comparator key={sel.o.id} features={featuresOf(sel.o)} objectName={sel.o.label} inList={inList} onAdd={(p) => onAdd(p, sel.o.id)} />
          </details>
          <PartoutEnLigne q={sel.o.query || sel.o.label} />
          <Lens image={image} />
        </>)}
        {sel?.kind === "surface" && <Teinte hex={sel.s.colors[0]?.hex} name={sel.s.colors[0]?.name} kind={sel.s.kind} material={sel.s.material} finish={sel.s.finish} />}
        {sel?.kind === "couleur" && <Teinte hex={sel.hex} />}
      </Panel>
    </div>
  );
}

/** Teinte d'un mur, d'un sol ou d'un point : nom approchant, matières proches de la bibliothèque, recherche chez les enseignes. */
function Teinte({ hex, name, kind, material, finish }: { hex?: string; name?: string; kind?: string; material?: string; finish?: string }) {
  if (!hex) return <p className="mt-3 text-[13px] text-muted">Couleur non relevée pour cette surface.</p>;
  const paint = nearestPaint(hex), mats = nearestMaterials(hex, kind);
  const { q, kinds } = surfaceQuery(kind, name || paint.name, material, finish);
  return (
    <div className="mt-4 grid gap-5">
      <div className="flex items-center gap-4">
        <span aria-hidden className="size-16 shrink-0 rounded-[2px] ring-1 ring-black/10" style={{ background: hex }} />
        <div className="text-[13px]">
          <p className="text-[15px] font-medium">{name || paint.name}</p>
          <p className="text-muted">{[material, finish].filter(Boolean).join(" · ") || "Couleur relevée sur l'image"}</p>
          <p className="mt-1 font-mono text-[12px]">{hex} · teinte approchante : {paint.name.toLowerCase()}</p>
        </div>
      </div>
      <p className="rounded-[2px] bg-soft px-3 py-2 text-[12px] leading-snug text-muted">Une couleur à l'écran n'est jamais exactement la couleur réelle : comparez sur un nuancier ou un échantillon avant d'acheter.</p>
      {mats.length > 0 && (
        <div>
          <p className="eyebrow">Matières proches</p>
          <ul className="mt-2 grid list-none gap-2 p-0">
            {mats.map((m) => (
              <li key={m.id} className="flex items-center gap-3 text-[13px]">
                <span aria-hidden className="size-10 shrink-0 rounded-[2px] bg-cover bg-center ring-1 ring-black/5" style={{ backgroundColor: m.baseColor, backgroundImage: textureMatiere(m.id) ? `url(${textureMatiere(m.id)})` : undefined }} />
                <span><span className="font-medium">{m.name}</span><br /><span className="text-muted">{m.finish}</span></span>
              </li>
            ))}
          </ul>
        </div>
      )}
      <EnLigne query={q} label={name || paint.name} />
      <Catalogue type={kind === "sol" ? "sol" : kind === "rideaux" ? "rideau" : "peinture"} label={name || paint.name} query={q} />
      <div>
        <p className="eyebrow">Chercher aussi chez</p>
        <div className="mt-2"><ShopLinks query={q} kinds={kinds} max={4} title="" /></div>
      </div>
    </div>
  );
}

function Lens({ image }: { image: string }) {
  if (!/^https:\/\//.test(image)) return null;
  return (
    <div className="mt-5 border-t border-line pt-4 text-[12.5px]">
      <a className="btn btn-sm" href={lensUrl(image)} target="_blank" rel="noopener noreferrer">Chercher sur tout le web avec Google Lens<span className="sr-only"> (nouvel onglet)</span></a>
      <p className="mt-1.5 text-muted">Ouvre l'image dans Google Lens : sélectionnez le meuble pour voir des modèles en vente partout sur le web.</p>
    </div>
  );
}

/** Encore plus de modèles : la recherche de chaque enseigne et Google Shopping, ouverts sur leurs sites (prix et stock chez eux). */
function PartoutEnLigne({ q }: { q: string }) {
  return (
    <div className="mt-5 border-t border-line pt-4">
      <p className="text-[15px] font-semibold tracking-tight">Encore plus de modèles</p>
      <div className="mt-2"><ShopLinks query={q} kinds={["meuble", "deco"]} max={30} title="" /></div>
      <a className="btn btn-sm mt-2" href={`https://www.google.com/search?tbm=shop&hl=fr&gl=fr&q=${encodeURIComponent(q)}`} target="_blank" rel="noopener noreferrer nofollow">Comparer sur Google Shopping ↗<span className="sr-only"> (nouvel onglet)</span></a>
    </div>
  );
}
