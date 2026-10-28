"use client";
import { useCallback, useMemo, useRef, useState } from "react";
import { CATEGORY_ONE, type Category, type Product } from "@/lib/products/schema";
import { featuresOf, type AiObject } from "@/lib/studio/showcase";
import { withWants, type Filters } from "@/lib/studio/similar";
import type { Intent } from "@/lib/studio/intent";
import { analyseImage, createJob, maskFor, waitForJob, type IaJob } from "@/lib/ia-jobs";
import { Comparator } from "./Comparator";
import { Panel } from "./Panel";

const MAT_FR: Record<string, string> = { travertin: "travertin", marbre: "marbre", pierre: "pierre", bois: "bois", velours: "velours", boucle: "bouclé", lin: "lin", laine: "laine", cuir: "cuir", laiton: "laiton", metal: "métal", verre: "verre", ceramique: "céramique", "terre-cuite": "terre cuite", ciment: "ciment" };
const SHAPES: Array<[string, string]> = [["organique", "Organique"], ["arrondi", "Arrondi"], ["ronde", "Rond"], ["ovale", "Ovale"], ["droit", "Droit"], ["basse", "Bas"], ["massive", "Massif"], ["pieds-fins", "Pieds fins"], ["globe", "Globe"], ["capitonne", "Capitonné"]];
const MARKABLE: Category[] = ["canape", "fauteuil", "table-basse", "lampadaire", "luminaire", "rangement", "chaise", "table-manger", "tapis", "deco", "lit", "robinetterie", "salle-de-bain"];

export interface ExploreImage { id: string; src: string; width: number; height: number; title: string; generator: string; objects: AiObject[] }

/**
 * Le rendu en grand, avec ses meubles cliquables. Une image n'est pas une scène 3D : les zones désignent les meubles,
 * la recherche s'appuie sur leurs traits visuels ; pour manipuler en volume, on passe à l'onglet 3D.
 */
export function Explorer({ image, intent, onObjects, onNewVersion, inList, onAdd }: {
  image: ExploreImage; intent: Intent | null;
  onObjects: (objects: AiObject[]) => void;
  onNewVersion: (job: IaJob, base: ExploreImage, label: string) => void;
  inList: (id: string) => boolean; onAdd: (p: Product, objectId: string) => void;
}) {
  const [sel, setSel] = useState<string | null>(null);
  const [marking, setMarking] = useState<{ x: number; y: number; type?: Category; mats: string[]; shape: string[] } | null>(null);
  const [markMode, setMarkMode] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const box = useRef<HTMLDivElement>(null);
  const obj = image.objects.find((o) => o.id === sel) ?? null;

  // Une demande en langage naturel sélectionne l'objet visé.
  const target = intent?.category ? image.objects.find((o) => o.type === intent.category) ?? null : null;
  const active = obj ?? target;
  const features = useMemo(() => (active ? (intent && target?.id === active.id ? withWants(featuresOf(active), intent.wants) : featuresOf(active)) : null), [active, intent, target]);
  const preset: Filters | undefined = intent && target?.id === active?.id ? { maxPrice: intent.maxPrice } : undefined;

  const onImageClick = useCallback(async (e: React.MouseEvent<HTMLDivElement>) => {
    if (!markMode || !box.current) return;
    const r = box.current.getBoundingClientRect();
    setMarking({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100, mats: [], shape: [] });
  }, [markMode]);

  /** Repère manuel : couleur relevée autour du point, catégorie choisie par l'utilisateur. */
  const addMarked = async () => {
    if (!marking?.type) return;
    const type = marking.type;
    const img = new Image(); img.crossOrigin = "anonymous"; img.src = image.src; await img.decode().catch(() => {});
    let hex = "#B8A890";
    try {
      const c = document.createElement("canvas"); c.width = c.height = 24; const x = c.getContext("2d", { willReadFrequently: true })!;
      x.drawImage(img, (marking.x / 100) * img.naturalWidth - 30, (marking.y / 100) * img.naturalHeight - 30, 60, 60, 0, 0, 24, 24);
      const d = x.getImageData(0, 0, 24, 24).data; let r = 0, g = 0, b = 0; for (let i = 0; i < d.length; i += 4) { r += d[i]!; g += d[i + 1]!; b += d[i + 2]!; }
      const n = d.length / 4; hex = `#${[r, g, b].map((v) => Math.round(v / n).toString(16).padStart(2, "0")).join("")}`;
    } catch { /* image d'une autre origine : couleur par défaut */ }
    const o: AiObject = { id: `${type}_${String(image.objects.length + 1).padStart(3, "0")}`, type, label: CATEGORY_ONE[type], design_source: "user_marked", shape: marking.shape, materials: marking.mats, colors: [{ name: "relevée", hex }], style: [], estimated_dimensions_cm: null, zone: { x: Math.max(0, marking.x - 6), y: Math.max(0, marking.y - 6), w: 12, h: 12 } };
    onObjects([...image.objects, o]); setMarking(null); setMarkMode(false); setSel(o.id);
  };

  const autoDetect = async () => {
    setBusy("Analyse de l'image…"); setError(null);
    const r = await analyseImage(image.src);
    setBusy(null);
    if (!r.ok) { setError(r.message); return; }
    onObjects([...image.objects.filter((o) => o.design_source !== "ai_detected"), ...(r.value.objects as AiObject[])]);
  };

  /** Essai d'une alternative : édition localisée de l'image (le reste est protégé par un masque). */
  const tryInRoom = async (p: Product) => {
    if (!active) return;
    setError(null); setBusy(`Préparation de l'essai : ${p.name}…`);
    try {
      const { image: base, mask } = await maskFor(image.src, active.zone);
      const desc = `${active.label} → replace it with a piece that looks like: ${p.material}${p.finish ? `, ${p.finish}` : ""}, colour ${p.colors.map((c) => c.name).join("/")}, ${p.dimensions?.text ?? ""}, silhouette ${p.silhouette.join(", ")}. Keep its position, scale and perspective; no logo, no text.`;
      const r = await createJob({ mode: "transform", brief: desc, photo: base, mask, onlyZone: { label: active.label, ...active.zone }, keep: ["fenetres", "portes", "murs", "plafond", "sol", "mobilier"], quality: "standard" });
      if (!r.ok) { setBusy(null); setError(r.message); return; }
      setBusy("Mise à jour localisée de l'image…");
      const done = await waitForJob(r.value, () => {});
      setBusy(null);
      if (done.status === "terminee") onNewVersion(done, image, `Essai : ${p.name}`);
      else setError(done.error?.message ?? "L'essai n'a pas abouti.");
    } catch { setBusy(null); setError("L'essai n'a pas pu être préparé."); }
  };

  return (
    <div className="relative">
      <div ref={box} onClick={onImageClick} className={`relative overflow-hidden rounded-[14px] bg-[#E9E6E0] ${markMode ? "cursor-crosshair" : ""}`} style={{ aspectRatio: `${image.width} / ${image.height}` }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={image.src} alt={image.title} className="absolute inset-0 size-full object-cover" crossOrigin="anonymous" />
        {image.objects.map((o, i) => {
          const on = active?.id === o.id;
          return (
            <button key={o.id} type="button" onClick={(e) => { e.stopPropagation(); setSel(o.id); }}
              className={`studio-hotspot group absolute ${on ? "is-on" : ""}`}
              style={{ left: `${o.zone.x}%`, top: `${o.zone.y}%`, width: `${o.zone.w}%`, height: `${o.zone.h}%`, animationDelay: `${i * 70}ms` }}
              aria-label={`${o.label} : voir des modèles ressemblants`} aria-pressed={on}>
              <span className="studio-hotspot-dot" style={{ left: "50%", top: "50%" }} />
              <span className="studio-hotspot-label">{o.label}</span>
            </button>
          );
        })}
        {marking && (
          <div className="absolute z-10 w-[min(300px,90%)] -translate-x-1/2 rounded-2xl bg-white p-3 text-[12px] shadow-xl" style={{ left: `${Math.min(75, Math.max(25, marking.x))}%`, top: `${Math.min(55, marking.y)}%` }} onClick={(e) => e.stopPropagation()}>
            {!marking.type ? (<>
              <p className="mb-2 font-medium">Quel meuble avez-vous touché ?</p>
              <div className="flex flex-wrap gap-1.5">{MARKABLE.map((c) => <button key={c} type="button" className="rounded-full border border-line px-2.5 py-1 hover:border-ink/40" onClick={() => setMarking({ ...marking, type: c })}>{CATEGORY_ONE[c]}</button>)}</div>
            </>) : (<>
              <p className="mb-1 font-medium">{CATEGORY_ONE[marking.type]} : précisez si vous voulez</p>
              <p className="text-muted">Matières</p>
              <div className="mt-1 flex flex-wrap gap-1">{Object.entries(MAT_FR).map(([k, l]) => <button key={k} type="button" aria-pressed={marking.mats.includes(k)} className={`rounded-full border px-2 py-0.5 ${marking.mats.includes(k) ? "border-ink bg-ink text-white" : "border-line"}`} onClick={() => setMarking({ ...marking, mats: marking.mats.includes(k) ? marking.mats.filter((x) => x !== k) : [...marking.mats, k] })}>{l}</button>)}</div>
              <p className="mt-2 text-muted">Forme</p>
              <div className="mt-1 flex flex-wrap gap-1">{SHAPES.map(([k, l]) => <button key={k} type="button" aria-pressed={marking.shape.includes(k)} className={`rounded-full border px-2 py-0.5 ${marking.shape.includes(k) ? "border-ink bg-ink text-white" : "border-line"}`} onClick={() => setMarking({ ...marking, shape: marking.shape.includes(k) ? marking.shape.filter((x) => x !== k) : [...marking.shape, k] })}>{l}</button>)}</div>
              <button type="button" className="btn btn-primary mt-3 !min-h-0 !px-3 !py-1.5 text-[12px]" onClick={() => void addMarked()}>Chercher des modèles ressemblants</button>
            </>)}
            <button type="button" className="ml-2 mt-2 text-muted underline" onClick={() => setMarking(null)}>Annuler</button>
          </div>
        )}
        <span className="pointer-events-none absolute bottom-3 left-3 rounded-full bg-black/45 px-2.5 py-1 text-[10.5px] font-medium text-white backdrop-blur">{image.generator === "image importée" ? "Image importée" : image.generator === "rendu 3D" ? "Rendu 3D" : `Rendu créé par IA · ${image.generator}`}</span>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2 text-[12.5px]">
        <span className="text-muted">{image.objects.length} meuble{image.objects.length > 1 ? "s" : ""} identifié{image.objects.length > 1 ? "s" : ""} · touchez-en un</span>
        <span className="flex-1" />
        <button type="button" className={`btn !min-h-0 !px-3 !py-1.5 text-[12px] ${markMode ? "btn-primary" : ""}`} aria-pressed={markMode} onClick={() => { setMarkMode((v) => !v); setMarking(null); }}>{markMode ? "Touchez le meuble sur l'image" : "Désigner un meuble"}</button>
        <button type="button" className="btn !min-h-0 !px-3 !py-1.5 text-[12px]" onClick={() => void autoDetect()} disabled={Boolean(busy)}>Identifier automatiquement</button>
      </div>
      {busy && <p role="status" className="studio-progress mt-2 text-[12.5px]">{busy}</p>}
      {error && <p role="alert" className="mt-2 rounded-xl bg-[#FBEDE6] px-3 py-2 text-[12.5px] text-[#8A3B17]">{error}</p>}

      <Panel open={Boolean(active)} kicker={active?.design_source === "ai_generated" ? "Création originale · IA" : active?.design_source === "studio_designed" ? "Création originale · Pièce Rêvée" : active?.design_source === "ai_detected" ? "Repéré par l'analyse" : "Repéré par vous"} title={active?.label ?? ""} onClose={() => setSel(null)}>
        {active && features && (<>
          <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-[13px]">
            <dt className="text-muted">Type</dt><dd>{CATEGORY_ONE[active.type]}</dd>
            {active.materials.length > 0 && <><dt className="text-muted">Matières</dt><dd>{active.materials.map((m) => MAT_FR[m] ?? m).join(", ")}</dd></>}
            {active.shape.length > 0 && <><dt className="text-muted">Forme</dt><dd>{active.shape.join(", ").replace(/-/g, " ")}</dd></>}
            <dt className="text-muted">Couleur</dt><dd className="flex items-center gap-1.5">{active.colors.map((c) => <span key={c.hex} className="inline-flex items-center gap-1"><span aria-hidden className="size-3 rounded-full ring-1 ring-black/10" style={{ background: c.hex }} />{c.name}</span>)}</dd>
            {active.estimated_dimensions_cm && <><dt className="text-muted">Dimensions</dt><dd>≈ {active.estimated_dimensions_cm.width} × {active.estimated_dimensions_cm.depth} × {active.estimated_dimensions_cm.height} cm <span className="text-muted">(estimées)</span></dd></>}
          </dl>
          {active.description && <p className="mt-3 text-[13px] leading-relaxed text-[#4A4A50]">{active.description}</p>}
          {intent && target?.id === active.id && intent.summary.length > 0 && <p className="mt-3 rounded-xl bg-[#EEF0EA] px-3 py-2 text-[12px]">Votre demande : {intent.summary.join(" · ")}</p>}
          <Comparator key={`${active.id}|${JSON.stringify(preset)}`} features={features} objectName={CATEGORY_ONE[active.type]} preset={preset} inList={inList} onAdd={(p) => onAdd(p, active.id)} onReplace={(p) => void tryInRoom(p)} />
        </>)}
      </Panel>
    </div>
  );
}
