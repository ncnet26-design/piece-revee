"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { CATEGORY_ONE, type Product } from "@/lib/products/schema";
import { MATERIALS, materialById, textureQuality } from "@/lib/materials/schema";
import { furnitureById, sameCategory } from "@/lib/studio/library";
import { loadScene, saveScene, DEFAULT_SCENE, type StudioScene } from "@/lib/studio/scene";
import { withWants, type ObjectFeatures } from "@/lib/studio/similar";
import type { Intent } from "@/lib/studio/intent";
import type { Slot, StudioEngine, Tool } from "@/lib/studio/engine";
import { Comparator } from "./Comparator";
import { Panel } from "./Panel";

/** Matière du moteur → mot-clé de ressemblance des produits. */
const TAG: Array<[RegExp, string]> = [[/velours/, "velours"], [/boucle/, "boucle"], [/^lin/, "lin"], [/laine/, "laine"], [/cuir/, "cuir"], [/travertin/, "travertin"], [/marbre/, "marbre"], [/pierre|terrazzo|beton/, "pierre"], [/chene|noyer|bois|parquet/, "bois"], [/laiton|bronze/, "laiton"], [/chrome|inox|aluminium|noir-mat/, "metal"], [/verre/, "verre"]];
const tagOf = (id: string) => TAG.find(([re]) => re.test(id))?.[1];
const PAINTS = ["#EDE8DF", "#E3DBC9", "#D9CDB8", "#C9C8C2", "#A9B39B", "#2F4A3D", "#24345A", "#B8674A"];
const RES: Array<[string, number, number]> = [["HD · 1920 × 1080", 1920, 1080], ["QHD · 2560 × 1440", 2560, 1440], ["4K · 3840 × 2160", 3840, 2160]];

/**
 * Scène 3D interactive : vrais objets 3D indépendants (GLB et objets calculés), sélection au clic ou au toucher,
 * déplacement, rotation, remplacement, matières PBR ; rendu final par lancer de rayons.
 */
export function Scene3D({ intent, inList, onAdd, onFinal }: { intent: Intent | null; inList: (id: string) => boolean; onAdd: (p: Product, objectId: string) => void; onFinal: (dataUrl: string, label: string, scene: StudioScene) => void }) {
  const host = useRef<HTMLDivElement>(null);
  const eng = useRef<StudioEngine | null>(null);
  const [scene, setScene] = useState<StudioScene | null>(null);
  const [sel, setSel] = useState<string | null>(null);
  const [tool, setToolState] = useState<Tool>("selection");
  const [loading, setLoading] = useState(1);
  const [state, setState] = useState<"chargement" | "pret" | "indisponible">("chargement");
  const [slots, setSlots] = useState<Slot[]>([]);
  const [variants, setVariants] = useState<string[]>([]);
  const [dims, setDims] = useState<{ w: number; d: number; h: number } | null>(null);
  const [final, setFinal] = useState<{ running: boolean; done: number; total: number; error?: string; ctrl?: AbortController } | null>(null);
  const [room, setRoom] = useState(false);

  useEffect(() => {
    const el = host.current; if (!el) return;
    let alive = true;
    void (async () => {
      const { StudioEngine } = await import("@/lib/studio/engine");
      if (!alive) return;
      const s = loadScene();
      try {
        eng.current = new StudioEngine(el, s, {
          onSelect: (uid) => setSel(uid),
          onChange: (next) => { setScene(next); saveScene(next); },
          onLoading: (n) => setLoading(n),
        }, window.matchMedia("(max-width: 900px)").matches ? "standard" : "haute");
        setScene(s); setState("pret");
        // Sur téléphone, la scène occupe l'écran : on la fait défiler pour qu'elle soit entièrement visible.
        if (window.innerWidth < 900) el.scrollIntoView({ block: "start", behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
        (window as unknown as { __studio?: StudioEngine }).__studio = eng.current;
      } catch { setState("indisponible"); }
    })();
    return () => { alive = false; eng.current?.dispose(); eng.current = null; };
  }, []);

  // Fiche de l'objet sélectionné (zones de matière, variantes, dimensions réelles dans la scène).
  useEffect(() => {
    const e = eng.current;
    if (!e || !sel) { setSlots([]); setVariants([]); setDims(null); return; }
    setSlots(e.slots(sel)); setVariants(e.variants(sel)); setDims(e.dimensions(sel));
  }, [sel, scene, loading]);

  // Une demande (« remplace la table basse… ») sélectionne l'objet visé.
  useEffect(() => {
    if (!intent?.category || !scene || !eng.current) return;
    const o = scene.objects.find((x) => furnitureById(x.furnitureId)?.category === intent.category);
    if (o) { eng.current.select(o.uid); eng.current.focus(o.uid); }
  }, [intent, scene]);

  const obj = scene?.objects.find((o) => o.uid === sel) ?? null;
  const def = obj ? furnitureById(obj.furnitureId) ?? null : null;
  const features: ObjectFeatures | null = useMemo(() => {
    if (!obj || !def) return null;
    const applied = Object.values(obj.materials ?? {});
    const tags = [...new Set(applied.map(tagOf).filter((x): x is string => Boolean(x)))];
    const mats = tags.length ? tags : def.materials;
    const colors = [...Object.values(obj.colors ?? {}), ...applied.map((a) => materialById(a)?.baseColor).filter((x): x is string => Boolean(x))];
    const base: ObjectFeatures = { category: def.category, style: def.style, silhouette: def.silhouette, materials: mats, colors: colors.length ? colors : def.colors.map((c) => c.hex), dims, productId: def.productId };
    return intent?.category === def.category ? withWants(base, intent.wants) : base;
  }, [obj, def, dims, intent]);

  const setTool = (t: Tool) => { setToolState(t); eng.current?.setTool(t); };
  const runFinal = async (w: number, h: number) => {
    const e = eng.current; if (!e || !scene) return;
    const ctrl = new AbortController();
    setFinal({ running: true, done: 0, total: 256, ctrl });
    try {
      const r = await e.finalRender({ width: w, height: h, samples: e.soft ? 8 : 256, signal: ctrl.signal, onProgress: (d, t) => setFinal((f) => (f ? { ...f, done: d, total: t } : f)) });
      onFinal(r.dataUrl, `Rendu final ${r.width} × ${r.height} · ${r.samples} échantillons · ${(r.ms / 1000).toFixed(0)} s`, scene);
      setFinal(null);
    } catch (err) {
      setFinal({ running: false, done: 0, total: 0, error: (err as Error).name === "AbortError" ? "Rendu annulé." : "Le rendu final n'a pas pu être calculé sur cet appareil (mémoire graphique insuffisante ?). Essayez une résolution plus petite." });
    }
  };

  const btn = (on: boolean) => `grid h-10 min-w-10 place-items-center rounded-full px-3 text-[12.5px] font-medium transition ${on ? "bg-ink text-white" : "text-ink hover:bg-black/5"}`;
  return (
    <div className="relative">
      <div ref={host} className="relative h-[min(78vh,760px)] min-h-[420px] scroll-mt-3 overflow-hidden rounded-[2px] bg-[#E9E6E0]" data-testid="scene-3d">
        {state !== "pret" && <div className="absolute inset-0 grid place-items-center text-[13px] text-muted">{state === "indisponible" ? "La 3D n'est pas disponible sur cet appareil." : "Préparation de la pièce…"}</div>}
        {state === "pret" && loading > 0 && <div role="status" className="studio-progress absolute left-1/2 top-4 -translate-x-1/2 rounded-full bg-white/85 px-3 py-1 text-[12px] backdrop-blur">Chargement des meubles et des matières…</div>}
      </div>
      {/* Outils discrets, en bas de la vue */}
      <div role="toolbar" aria-label="Outils de la scène" className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-full border border-white/60 bg-white/85 p-1 shadow-[0_10px_30px_-12px_rgba(0,0,0,.35)] backdrop-blur">
        <button type="button" className={btn(tool === "selection")} aria-pressed={tool === "selection"} onClick={() => setTool("selection")}>Choisir</button>
        <button type="button" className={btn(tool === "deplacer")} aria-pressed={tool === "deplacer"} onClick={() => setTool("deplacer")}>Déplacer</button>
        <button type="button" className={btn(tool === "pivoter")} aria-pressed={tool === "pivoter"} onClick={() => setTool("pivoter")}>Pivoter</button>
        <span aria-hidden className="mx-1 h-5 w-px bg-line" />
        <button type="button" className={btn(false)} onClick={() => setRoom((v) => !v)} aria-expanded={room}>Pièce</button>
        <button type="button" className={btn(false)} onClick={() => setFinal({ running: false, done: 0, total: 0 })}>Rendu final</button>
      </div>

      {room && scene && (
        <div className="absolute left-3 top-3 z-30 w-[280px] rounded-[2px] border border-line bg-white/95 p-4 text-[12.5px] shadow-xl backdrop-blur">
          <p className="font-semibold">Murs</p>
          <div className="mt-2 flex flex-wrap gap-1.5">{PAINTS.map((c) => <button key={c} type="button" aria-label={`Peindre les murs en ${c}`} aria-pressed={scene.room.wall === c} onClick={() => eng.current?.setWallColor(c)} className={`size-7 rounded-full ring-1 ring-black/10 ${scene.room.wall === c ? "outline outline-2 outline-offset-2 outline-ink" : ""}`} style={{ background: c }} />)}
            <label className="grid size-7 cursor-pointer place-items-center rounded-full bg-[conic-gradient(red,yellow,lime,cyan,blue,magenta,red)] ring-1 ring-black/10"><span className="sr-only">Teinte sur mesure</span><input type="color" className="sr-only" value={scene.room.wall} onChange={(e) => eng.current?.setWallColor(e.target.value.toUpperCase())} /></label>
          </div>
          <p className="mt-3 font-semibold">Sol</p>
          <select className="mt-1 w-full rounded-[2px] border border-line px-2 py-1.5" value={scene.room.floor} onChange={(e) => eng.current?.setFloor(e.target.value)}>
            {MATERIALS.filter((m) => ["Sol", "Bois", "Pierre"].includes(m.category) && !/tapis/.test(m.id)).map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
          <button type="button" className="mt-3 text-muted underline" onClick={() => { if (confirm("Revenir à la pièce témoin d'origine ?")) void eng.current?.load(structuredClone(DEFAULT_SCENE)); }}>Réinitialiser la pièce</button>
        </div>
      )}

      {final && (
        <div role="dialog" aria-label="Rendu final" className="absolute right-3 top-3 z-30 w-[300px] rounded-[2px] border border-line bg-white/95 p-4 text-[12.5px] shadow-xl backdrop-blur">
          <p className="font-semibold">Rendu final par lancer de rayons</p>
          <p className="mt-1 text-muted">Lumière indirecte, rebonds, reflets et ombres douces calculés physiquement, à la résolution choisie (aucun agrandissement).</p>
          {final.running ? (<>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-line"><div className="h-full bg-ink transition-[width]" style={{ width: `${(final.done / Math.max(1, final.total)) * 100}%` }} /></div>
            <p className="mt-1.5 tabular-nums" aria-live="polite">{final.done} / {final.total} échantillons</p>
            <button type="button" className="btn mt-2 !min-h-0 !py-1.5 text-[12px]" onClick={() => final.ctrl?.abort()}>Annuler</button>
          </>) : (<>
            {final.error && <p role="alert" className="mt-2 text-[#8A3B17]">{final.error}</p>}
            <div className="mt-3 grid gap-1.5">{RES.map(([l, w, h]) => <button key={l} type="button" className="btn !min-h-0 justify-between !py-2 text-[12px]" onClick={() => void runFinal(w, h)}>{l}</button>)}</div>
            <button type="button" className="mt-2 text-muted underline" onClick={() => setFinal(null)}>Fermer</button>
          </>)}
        </div>
      )}

      <Panel open={Boolean(obj && def)} kicker={def ? `${CATEGORY_ONE[def.category]} · objet 3D` : ""} title={def?.name ?? ""} onClose={() => eng.current?.select(null)}>
        {obj && def && (<>
          <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-[13px]">
            <dt className="text-muted">Dimensions</dt><dd className="tabular-nums">{dims ? `${dims.w} × ${dims.d} × ${dims.h} cm` : "—"}</dd>
            <dt className="text-muted">Matières</dt><dd>{def.materials.join(", ")}</dd>
            <dt className="text-muted">Style</dt><dd>{def.style.join(", ")}</dd>
            {def.features.length > 0 && <><dt className="text-muted">Détails</dt><dd>{def.features.join(" · ")}</dd></>}
            <dt className="text-muted">Modèle 3D</dt><dd className="text-[12px]">{def.credit ? <>Modèle générique « {def.name} » · {def.credit.authors.join(", ")} · <a className="underline" href={def.credit.url} target="_blank" rel="noopener noreferrer">{def.credit.license}</a></> : "Objet calculé par Pièce Rêvée"}</dd>
          </dl>
          <p className="mt-2 text-[11.5px] text-muted">Identifiant de l'objet : <code>{obj.uid}</code></p>

          {variants.length > 0 && (<>
            <h3 className="mt-5 text-[13px] font-semibold">Coloris d'origine</h3>
            <div className="mt-2 flex flex-wrap gap-1.5">{variants.map((v) => <button key={v} type="button" aria-pressed={obj.variant === v} className={`rounded-full border px-3 py-1 text-[12px] ${obj.variant === v ? "border-ink bg-ink text-white" : "border-line bg-white"}`} onClick={() => void eng.current?.setVariant(obj.uid, v)}>{v}</button>)}</div>
          </>)}

          {slots.length > 0 && (<>
            <h3 className="mt-5 text-[13px] font-semibold">Matières</h3>
            {slots.map((s) => {
              const cur = obj.materials?.[s.id];
              const cands = MATERIALS.filter((m) => m.category !== "Sol" && m.category !== "Peinture" && m.category !== "Enduit");
              return (
                <div key={s.id} className="mt-2">
                  <p className="text-[12px] text-muted">{s.label}{cur ? ` : ${materialById(cur)?.name}` : " : d'origine"}</p>
                  <div className="mt-1 flex gap-1.5 overflow-x-auto pb-1">
                    <button type="button" className={`h-9 shrink-0 rounded-full border px-3 text-[11.5px] ${!cur ? "border-ink" : "border-line"}`} onClick={() => void eng.current?.setMaterial(obj.uid, s.id, null)}>D'origine</button>
                    {cands.map((m) => <button key={m.id} type="button" title={`${m.name} · ${textureQuality(m).label}`} aria-label={m.name} aria-pressed={cur === m.id} className={`size-9 shrink-0 rounded-full ring-1 ring-black/10 ${cur === m.id ? "outline outline-2 outline-offset-2 outline-ink" : ""}`} style={{ background: `radial-gradient(circle at 30% 30%, #fff8, transparent 55%), ${m.baseColor}` }} onClick={() => void eng.current?.setMaterial(obj.uid, s.id, m.id)} />)}
                    <label className="grid size-9 shrink-0 cursor-pointer place-items-center rounded-full bg-[conic-gradient(red,yellow,lime,cyan,blue,magenta,red)] ring-1 ring-black/10" title="Couleur sur mesure"><span className="sr-only">Couleur sur mesure pour {s.label}</span><input type="color" className="sr-only" onChange={(e) => eng.current?.setColor(obj.uid, s.id, e.target.value)} /></label>
                  </div>
                </div>
              );
            })}
          </>)}

          {sameCategory(def).length > 1 && (<>
            <h3 className="mt-5 text-[13px] font-semibold">Remplacer par un autre modèle</h3>
            <div className="mt-2 grid grid-cols-3 gap-2">{sameCategory(def).map((f) => (
              <button key={f.id} type="button" aria-pressed={f.id === def.id} onClick={() => void eng.current?.replace(obj.uid, f.id)} className={`overflow-hidden rounded-[2px] border bg-white text-left text-[11px] leading-tight ${f.id === def.id ? "border-ink" : "border-line hover:border-ink/40"}`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {f.kind === "glb" ? <img src={`/models/thumbs/${f.model}.webp`} alt="" className="aspect-square w-full bg-[#F4F1EA] object-contain" loading="lazy" /> : <span className="grid aspect-square place-items-center bg-[#F4F1EA] text-muted">3D</span>}
                <span className="block p-1.5">{f.name}</span>
              </button>
            ))}</div>
          </>)}
          {!obj.parent && <div className="mt-4 flex flex-wrap gap-1.5 text-[12px]">
            <button type="button" className="btn !min-h-0 !py-1.5" onClick={() => eng.current?.rotateSelected(-15)}>↺ 15°</button>
            <button type="button" className="btn !min-h-0 !py-1.5" onClick={() => eng.current?.rotateSelected(15)}>↻ 15°</button>
            <button type="button" className="btn !min-h-0 !py-1.5" onClick={() => { eng.current?.remove(obj.uid); }}>Retirer de la pièce</button>
          </div>}
          {features && <Comparator key={`${obj.uid}|${def.id}|${JSON.stringify(obj.materials)}|${JSON.stringify(intent?.summary)}`} features={features} objectName={CATEGORY_ONE[def.category]} preset={intent?.category === def.category ? { maxPrice: intent.maxPrice } : undefined} inList={inList} onAdd={(p) => onAdd(p, obj.uid)} />}
        </>)}
      </Panel>
    </div>
  );
}
