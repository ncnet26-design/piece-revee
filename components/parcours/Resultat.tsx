"use client";
import { MentionIA } from "@/components/MentionIA";
import { textureMatiere } from "@/lib/texture-matiere";
import { useEffect, useRef, useState } from "react";
import { PrixPiece, type LignePiece } from "@/components/PrixPiece";
import { produitsParBudget } from "@/lib/boutique-client";
import { productById } from "@/lib/products/schema";
import type { Surface } from "@/lib/ia-jobs";
import type { AiObject } from "@/lib/studio/showcase";
import { useProject } from "@/lib/studio/project";
import { hit, lensUrl, nearestMaterials, nearestPaint, sampleColor, surfaceQuery } from "@/lib/parcours";
import { Panel } from "@/components/parcours/Panel";
import { ShopLinks } from "@/components/ShopLinks";
import { EnLigne } from "./EnLigne";
import { Catalogue } from "./Catalogue";
import { BeforeAfter } from "@/components/BeforeAfter";
import { VideoAvantApres } from "./VideoAvantApres";
import { Identique } from "./Identique";

type Sel = { kind: "objet"; o: AiObject } | { kind: "surface"; s: Surface } | { kind: "couleur"; hex: string; x: number; y: number };

/**
 * La pièce transformée : on touche n'importe où. Un meuble ouvre ses alternatives réelles (trois gammes) ;
 * un mur, un sol ou un rideau ouvre sa teinte, ses matières proches et où les trouver ; ailleurs, la couleur du point.
 */
export function Resultat({ image, before, objects, surfaces, analysing }: { image: string; before?: string; objects: AiObject[]; surfaces: Surface[]; analysing: boolean }) {
  const [sel, setSelBrut] = useState<Sel | null>(null);
  const [photo, setPhoto] = useState<string | undefined>(undefined);
  // Prix de la pièce refaite à trois budgets, calculé dans notre boutique dès que les meubles sont repérés.
  const [lignes, setLignes] = useState<{ cle: string; l: LignePiece[] } | null>(null);
  const cle = objects.map((o) => o.id).join("|");
  useEffect(() => {
    if (!objects.length) return;
    let vivant = true;
    void produitsParBudget(objects).then((l) => { if (vivant) setLignes({ cle, l }); });
    return () => { vivant = false; };
  }, [cle, objects]);
  // Choisir un meuble découpe aussi sa photo (au moment du geste, pas pendant l'affichage).
  const setSel = (x: Sel | null) => { setSelBrut(x); setPhoto(x?.kind === "objet" ? decoupe(img.current, x.o.zone) : undefined); };
  const [compare, setCompare] = useState(false);
  const [ratio, setRatio] = useState("4 / 3");
  const img = useRef<HTMLImageElement>(null);
  const project = useProject();
  const total = project.list.reduce((s, x) => s + (productById(x.productId)?.price?.amount ?? x.external?.price ?? 0) * x.qty, 0);


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

  // Image à taille raisonnable : jamais plus haute que 68 % de l'écran, centrée ; le détail est à droite sur ordinateur.
  const [rw, rh] = ratio.split("/").map((x) => Number(x.trim()) || 1) as [number, number];
  return (
    <div className="relative">
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(320px,1fr)] lg:gap-8">
      <div className="min-w-0">
      <div className="mb-3 flex flex-wrap items-center gap-2 text-[13px]">
        <span className="text-muted">{analysing ? "Repérage des meubles et des surfaces…" : `${objects.length} élément${objects.length > 1 ? "s" : ""} et ${surfaces.length} surface${surfaces.length > 1 ? "s" : ""} repérés · touchez n'importe où`}</span>
        <span className="flex-1" />
        {before && <button type="button" className="btn btn-sm" aria-pressed={compare} onClick={() => setCompare((v) => !v)}>{compare ? "Revenir à la pièce cliquable" : "Comparer avant / après"}</button>}
      </div>
      {compare && before ? (
        // eslint-disable-next-line @next/next/no-img-element
        <div className="mx-auto" style={{ maxWidth: `calc(68vh * ${rw} / ${rh})` }}><BeforeAfter ratio={ratio} labelBefore="Ma pièce" labelAfter="Transformée" before={<img src={before} alt="Ma pièce avant" />} after={<img src={image} alt="Ma pièce transformée" />} /></div>
      ) : (
        <div className="flex justify-center rounded-[2px] bg-soft">
        <div className="relative inline-block max-w-full cursor-crosshair overflow-hidden" onClick={onClick} data-testid="piece-transformee">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img ref={img} src={image} alt="Ma pièce transformée avec mes inspirations" crossOrigin="anonymous" className="block max-h-[68vh] w-auto max-w-full" onLoad={(e) => setRatio(`${e.currentTarget.naturalWidth} / ${e.currentTarget.naturalHeight}`)} />
          {objects.map((o) => (
            <button key={o.id} type="button" onClick={(e) => { e.stopPropagation(); setSel({ kind: "objet", o }); }} aria-label={`${o.label} : voir les modèles ressemblants`} aria-pressed={sel?.kind === "objet" && sel.o.id === o.id}
              className="studio-hotspot absolute" style={{ left: `${o.zone.x}%`, top: `${o.zone.y}%`, width: `${o.zone.w}%`, height: `${o.zone.h}%` }}>
              <span className="studio-hotspot-dot" style={{ left: "50%", top: "50%" }} />
              <span className="studio-hotspot-label">{o.label}</span>
            </button>
          ))}
          {sel?.kind === "couleur" && <span aria-hidden className="pointer-events-none absolute size-6 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow" style={{ left: `${sel.x}%`, top: `${sel.y}%`, background: sel.hex }} />}
          <MentionIA />
        </div>
        </div>
      )}
      </div>

      <div className="min-w-0 lg:sticky lg:top-24">
      {(objects.length > 0 || surfaces.length > 0) && (
        <div className="lg:mt-9">
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
      {lignes?.cle === cle && <div className="mt-5"><PrixPiece lignes={lignes.l} /></div>}
      </div>
      </div>
      {before && <div className="mt-6"><VideoAvantApres avant={before} apres={image} lignes={lignes?.cle === cle ? lignes.l : []} /></div>}
      {project.list.length > 0 && (
        <p className="mt-4 text-[13px]"><a className="underline" href="/ma-piece/">Ma pièce composée : {project.list.length} article{project.list.length > 1 ? "s" : ""}{total ? ` · ${total.toLocaleString("fr-FR")} € de prix relevés` : ""} — voir ma liste d'achats</a></p>
      )}

      <Panel open={Boolean(sel)} kicker={kicker} title={title} onClose={() => setSel(null)}>
        {sel?.kind === "objet" && (<>
          {sel.o.description && <p className="mt-2 text-[13px] text-muted">{sel.o.description}</p>}
          <Identique key={`identique-${sel.o.id}`} photo={photo} image={image} label={sel.o.label} />
          <EnLigne key={`en-ligne-${sel.o.id}`} query={sel.o.query || sel.o.label} label={descriptionPrecise(sel.o)} forObject={sel.o.id} photo={photo} />
          <details open className="group mt-5 border-t border-line pt-4">
            <summary className="cursor-pointer list-none text-[14px] font-semibold">Tout de suite dans notre boutique<span className="ml-2 font-normal text-muted">références d'exception, prix revérifiés chaque nuit</span><span aria-hidden className="ml-1 inline-block text-muted transition group-open:rotate-180">⌄</span></summary>
            <Catalogue type={sel.o.type} label={sel.o.label} query={sel.o.query || sel.o.label} forObject={sel.o.id} objet={sel.o} />
          </details>
          <PartoutEnLigne q={sel.o.query || sel.o.label} image={image} />
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

/** Encore plus de modèles, replié : la recherche de chaque enseigne, Google Shopping et Google Lens, ouverts sur leurs sites. */
function PartoutEnLigne({ q, image }: { q: string; image: string }) {
  return (
    <details className="group mt-5 border-t border-line pt-4">
      <summary className="cursor-pointer list-none text-[14px] font-semibold">Chercher ailleurs<span aria-hidden className="ml-1 inline-block text-muted transition group-open:rotate-180">⌄</span></summary>
      <div className="mt-3"><ShopLinks query={q} kinds={["meuble", "deco"]} max={30} title="" /></div>
      <a className="btn btn-sm mt-2" href={`https://www.google.com/search?tbm=shop&hl=fr&gl=fr&q=${encodeURIComponent(q)}`} target="_blank" rel="noopener noreferrer nofollow">Comparer sur Google Shopping ↗<span className="sr-only"> (nouvel onglet)</span></a>
      <Lens image={image} />
    </details>
  );
}

/** Description précise transmise à la recherche en ligne : type, matières, couleurs, forme et taille repérées sur l'image. */
function descriptionPrecise(o: AiObject): string {
  const d = o.estimated_dimensions_cm;
  return [o.label, o.materials.join(", "), o.colors.map((c) => c.name).join(", "), o.shape.join(", "), d ? `environ ${Math.round(d.width)} × ${Math.round(d.depth)} × ${Math.round(d.height)} cm` : ""]
    .filter(Boolean).join(" · ").slice(0, 220);
}

/** Photo du meuble découpée dans l'image transformée (avec une marge), réduite à 512 px : l'IA cherche ce qui lui ressemble. */
const decoupes = new Map<string, string | undefined>();
function decoupe(im: HTMLImageElement | null, z: { x: number; y: number; w: number; h: number }): string | undefined {
  if (!im || !im.naturalWidth) return undefined;
  const k = `${im.src}|${z.x}|${z.y}|${z.w}|${z.h}`;
  if (decoupes.has(k)) return decoupes.get(k);
  let out: string | undefined;
  try {
    const W = im.naturalWidth, H = im.naturalHeight, m = 0.12;
    const x = Math.max(0, (z.x / 100 - m * z.w / 100) * W), y = Math.max(0, (z.y / 100 - m * z.h / 100) * H);
    const w = Math.min(W - x, (z.w / 100) * W * (1 + 2 * m)), h = Math.min(H - y, (z.h / 100) * H * (1 + 2 * m));
    const r = Math.min(1, 512 / Math.max(w, h)), c = document.createElement("canvas");
    c.width = Math.max(1, Math.round(w * r)); c.height = Math.max(1, Math.round(h * r));
    c.getContext("2d")!.drawImage(im, x, y, w, h, 0, 0, c.width, c.height);
    out = c.toDataURL("image/jpeg", 0.82);
  } catch { out = undefined; } // image d'un autre site sans autorisation de lecture : recherche par la description seule
  decoupes.set(k, out);
  return out;
}
