"use client";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MATERIALS } from "@/content/materials";
import { materialById } from "@/content/lookup";
import type { Material } from "@/content/types";
import type { BoardEngine, View } from "@/lib/board/engine";
import {
  BACKGROUNDS, SCALE_MAX, SCALE_MIN, TEMPLATES, decodeBoard, defaultShape, emptyBoard, encodeBoard, itemName, labelRef, parseBoard, shapesFor, uid,
  type Board, type BoardItem, type Shape,
} from "@/lib/board/state";
import { COLORS } from "@/lib/home3d/plan";
import { LIBRARY_MODELS, frenchName, libGroup, libModel } from "@/lib/home3d/library";
import { realTexture, textureUrl } from "@/lib/textures";
import { preparePhoto } from "@/lib/photo";
import { openCamille } from "@/lib/camille-bus";
import type { RetailerKind } from "@/lib/retailers";
import { MaterialSwatch } from "../Visual";
import { ShopLinks } from "../ShopLinks";
import { IconClose } from "../icons";
import { Swatch } from "../showroom/Swatch";
import { FAMILIES as SR_FAMILIES, familyById, makeRef, parseVariant, variantCode, variantName, variantShop, withOption, isColorAxis, customId } from "@/lib/showroom/catalog";
import { nearestAspect, photoreal, redesignRoom } from "@/lib/ia";
import { BeforeAfter } from "../BeforeAfter";

/** Où poser chaque matière dans la pièce (consigne pour le rendu). */
function placeOf(ref: string): string {
  const v = parseVariant(ref);
  const gen = v?.family.gen ?? (materialById.get(ref)?.family === "Textile" ? "fabric" : ref.startsWith("#") ? "paint" : "");
  switch (gen) {
    case "paint": case "plaster": return "murs";
    case "wallpaper": return "un pan de mur";
    case "fluted": return "un pan de mur ou la tête de lit";
    case "wood": case "tile": case "cement": case "terrazzo": case "carpet": return "sol";
    case "marble": return "plan, table ou sol";
    case "fabric": return "canapé, rideaux ou coussins";
    case "leather": return "assises";
    case "metal": case "hardware": return "poignées, robinetterie et luminaires";
    case "cane": return "portes de meuble ou assises";
    default: return libModel(ref) ? "mobilier" : "détails";
  }
}

const KEY = "pr_planche";
const UP_KEY = "pr_planche_photos";
type Tab = "showroom" | "matieres" | "peintures" | "objets" | "photos";
const FAMILIES: Array<Material["family"] | "Toutes"> = ["Toutes", "Bois", "Pierre", "Terre", "Textile", "Fibre", "Métal", "Composite", "Verre", "Extérieur"];
const SHAPE_LABEL: Record<Shape, string> = { carre: "Carreau", rond: "Galet", lame: "Lame", drape: "Tissu", nuancier: "Nuancier", objet: "Objet", photo: "Photo", etiquette: "Étiquette", goutte: "Goutte", piece: "Échantillon", dechire: "Déchiré" };
const MODELS = LIBRARY_MODELS.filter((m) => !/street_lamp|picnic|CoffeeCart|GothicBed/i.test(m.id));

/** Recherche d'achat et rayons adaptés à un élément de la planche. */
function shopFor(ref: string): { q: string; kinds: RetailerKind[] } {
  const v = parseVariant(ref); if (v) return variantShop(v);
  if (ref.startsWith("t:")) return { q: "", kinds: [] };
  if (ref.startsWith("#")) return { q: `${itemName(ref).toLowerCase()} mate`, kinds: ["bricolage", "deco"] };
  const m = materialById.get(ref);
  if (m) {
    const word = m.name.toLowerCase().replace(/\s*\(.*\)/, "");
    if (m.family === "Textile" || m.family === "Fibre") return { q: `tissu ${word}`, kinds: ["deco", "meuble"] };
    if (m.family === "Extérieur") return { q: word, kinds: ["jardin", "bricolage"] };
    return { q: word, kinds: ["bricolage", "deco"] };
  }
  const lm = libModel(ref);
  if (lm) return { q: frenchName(lm).toLowerCase().replace(/ \(modèle \d+\)/, ""), kinds: libGroup(lm) === "Plantes" ? ["jardin", "deco"] : ["meuble", "deco"] };
  return { q: "", kinds: [] };
}

function Thumb({ refId, className = "" }: { refId: string; className?: string }) {
  if (refId.startsWith("sr:")) return <Swatch key={refId} refId={refId} label="Aperçu de l'échantillon" size={120} className={className} />;
  // eslint-disable-next-line @next/next/no-img-element
  if (refId.startsWith("vis-")) return <img src={`/visuels/${refId.slice(4)}.webp`} alt="" loading="lazy" className={`object-cover ${className}`} />;
  if (refId.startsWith("t:")) return <span className={`grid place-items-center bg-[#FBF8F1] font-display text-[22px] text-ink ${className}`} aria-hidden="true">Aa</span>;
  if (refId.startsWith("#")) return <span className={`block ${className}`} style={{ background: refId }} aria-hidden="true" />;
  const m = materialById.get(refId);
  if (m) return <MaterialSwatch texture={m.texture} colors={m.colors} seed={m.id} width={160} height={160} label={`Échantillon dessiné : ${m.name}`} className={`block ${className}`} />;
  // eslint-disable-next-line @next/next/no-img-element
  if (libModel(refId)) return <img src={`/models/thumbs/${refId}.webp`} alt="" width={160} height={160} loading="lazy" className={`object-contain ${className}`} />;
  return <span className={`block bg-[var(--line)] ${className}`} aria-hidden="true" />;
}

function loadLocal(): Board | null {
  try { const r = localStorage.getItem(KEY); return r ? parseBoard(JSON.parse(r)) : null; } catch { return null; }
}
function loadUploads(): Map<string, string> {
  try { const r = localStorage.getItem(UP_KEY); return new Map(r ? (JSON.parse(r) as Array<[string, string]>) : []); } catch { return new Map(); }
}

export default function Planche() {
  const box = useRef<HTMLDivElement>(null);
  const engine = useRef<BoardEngine | null>(null);
  const dragRef = useRef<string | null>(null);
  const [board, setBoard] = useState<Board | null>(null);
  const [uploads, setUploads] = useState<Map<string, string>>(() => new Map());
  const [sel, setSel] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("showroom");
  const [srFam, setSrFam] = useState("zellige");
  const [family, setFamily] = useState<(typeof FAMILIES)[number]>("Toutes");
  const [q, setQ] = useState("");
  const [view, setView] = useState<View>("perspective");
  const [ready, setReady] = useState(false);
  const [toast, setToast] = useState("");
  const [render, setRender] = useState<string | null>(null);
  const [room, setRoom] = useState<string | null>(null);
  const [photo, setPhoto] = useState<{ render: string; image: string | null; busy: boolean; msg: string | null } | null>(null);
  const [applied, setApplied] = useState<string | null>(null);
  const [applyBusy, setApplyBusy] = useState(false);
  const [applyMsg, setApplyMsg] = useState<string | null>(null);
  const [templates, setTemplates] = useState(false);

  const say = useCallback((t: string) => { setToast(t); window.setTimeout(() => setToast(""), 3200); }, []);

  // Planche de départ : lien partagé, sinon planche enregistrée, sinon une composition d'exemple.
  useEffect(() => {
    const m = /[#&]p=([\w-]+)/.exec(window.location.hash);
    const shared = m ? decodeBoard(m[1]!) : null;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- lecture unique du stockage de l'appareil après hydratation
    setUploads(loadUploads());
    setBoard(shared ?? loadLocal() ?? TEMPLATES[0]!.board());
    if (shared) history.replaceState(null, "", window.location.pathname);
  }, []);
  useEffect(() => { if (board) try { localStorage.setItem(KEY, JSON.stringify(board)); } catch { /* stockage plein ou désactivé */ } }, [board]);

  const addAt = useCallback((ref: string, x = (Math.random() - 0.5) * 0.5, z = (Math.random() - 0.5) * 0.3) => {
    const it: BoardItem = { id: uid(), ref, shape: defaultShape(ref), x, z, rot: Math.round((Math.random() - 0.5) * 16), s: ref.startsWith("#") ? 1 : 1.2 };
    setBoard((b) => (b ? { ...b, items: [...b.items, it].slice(-80) } : b));
    setSel(it.id);
  }, []);

  useEffect(() => {
    if (!box.current || !board || engine.current) return;
    let alive = true;
    void (async () => {
      const { BoardEngine } = await import("@/lib/board/engine");
      if (!alive || !box.current) return;
      engine.current = new BoardEngine(box.current, {
        onSelect: (id) => setSel(id),
        onMove: (id, x, z) => setBoard((b) => (b ? { ...b, items: b.items.map((i) => (i.id === id ? { ...i, x, z } : i)) } : b)),
        onDropAt: (x, z) => { const r = dragRef.current; dragRef.current = null; if (r) addAt(r, x, z); },
      });
      setReady(true);
    })();
    return () => { alive = false; };
  }, [board, addAt]);
  useEffect(() => () => { engine.current?.dispose(); engine.current = null; }, []);
  useEffect(() => { if (ready && board) void engine.current?.sync(board, uploads); }, [ready, board, uploads]);
  useEffect(() => { engine.current?.select(sel); }, [sel, ready]);

  const update = (id: string, patch: Partial<BoardItem>) => setBoard((b) => (b ? { ...b, items: b.items.map((i) => (i.id === id ? { ...i, ...patch } : i)) } : b));
  const remove = (id: string) => { setBoard((b) => (b ? { ...b, items: b.items.filter((i) => i.id !== id) } : b)); setSel(null); };
  const toFront = (id: string) => setBoard((b) => { if (!b) return b; const it = b.items.find((i) => i.id === id); return it ? { ...b, items: [...b.items.filter((i) => i.id !== id), it] } : b; });
  const duplicate = (id: string) => setBoard((b) => { if (!b) return b; const it = b.items.find((i) => i.id === id); if (!it) return b; const c = { ...it, id: uid(), x: it.x + 0.05, z: it.z + 0.04 }; setSel(c.id); return { ...b, items: [...b.items, c] }; });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!sel || (e.target as HTMLElement)?.closest("input, textarea, select")) return;
      if (e.key === "Delete" || e.key === "Backspace") { e.preventDefault(); remove(sel); }
      if (e.key === "r" || e.key === "R") { const it = board?.items.find((i) => i.id === sel); if (it) update(sel, { rot: (it.rot + 15) % 360 }); }
      if (e.key === "Escape") setSel(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const exportHD = () => {
    const e = engine.current; if (!e) return;
    say("Calcul de l'image haute définition…");
    window.setTimeout(() => { try { setRender(e.exportImage(e.software ? 1800 : 3200)); } catch { say("L'image n'a pas pu être calculée sur cet appareil."); } }, 50);
  };
  /** Photo réaliste par IA : la planche 3D devient une vraie photographie de studio, même composition. */
  const makePhoto = async () => {
    const e = engine.current; if (!e || !board) return;
    let render = "";
    try { render = e.exportImage(e.software ? 1400 : 1800); } catch { say("L'image n'a pas pu être calculée sur cet appareil."); return; }
    setPhoto({ render, image: null, busy: true, msg: null });
    const img = new Image(); img.src = render; await img.decode();
    const names = [...new Set(board.items.filter((i) => !i.ref.startsWith("up-") && !i.ref.startsWith("vis-") && !i.ref.startsWith("t:")).map((i) => itemName(i.ref)))].slice(0, 16);
    const r = await photoreal(render, `Planche « ${board.title} » : ${names.join(", ")}.`, nearestAspect(img.naturalWidth, img.naturalHeight));
    setPhoto({ render, image: r.ok ? r.image : null, busy: false, msg: r.ok ? (r.left > 0 ? `Il vous reste ${r.left} image${r.left > 1 ? "s" : ""} aujourd'hui.` : "C'était votre dernière image du jour.") : r.message });
  };
  const share = async () => {
    if (!board) return;
    const url = `${window.location.origin}/planche/#p=${encodeBoard(board)}`;
    try { await navigator.clipboard.writeText(url); say(board.items.some((i) => i.ref.startsWith("up-")) ? "Lien copié (vos photos personnelles restent sur votre appareil)." : "Lien de la planche copié."); }
    catch { window.prompt("Copiez ce lien :", url); }
  };
  const addPhotos = async (files: FileList | null) => {
    if (!files) return;
    const next = new Map(uploads);
    for (const f of Array.from(files).slice(0, 4)) {
      const r = await preparePhoto(f, 1200);
      if (!r.ok) { say(r.message); continue; }
      const id = `up-${uid()}`; next.set(id, r.photo.dataUrl); addAt(id);
    }
    const trimmed = new Map([...next].slice(-8));
    setUploads(trimmed);
    try { localStorage.setItem(UP_KEY, JSON.stringify([...trimmed])); } catch { say("Mémoire de l'appareil pleine : la photo ne sera pas conservée après fermeture."); }
  };

  /** Une image (photo du client, inspiration) devient une planche complète, composée dans ses couleurs. */
  const fromImage = async (f: File | undefined) => {
    if (!f) return;
    const r = await preparePhoto(f, 2048);
    if (!r.ok) { say(r.message); return; }
    say("Composition de la planche à partir de votre image…");
    try {
      const { boardFromImage } = await import("@/lib/board/fromImage");
      const { board: b, photoId, dataUrl } = await boardFromImage(r.photo.dataUrl, "Ma planche inspirée");
      const next = new Map([...uploads, [photoId, dataUrl] as [string, string]].slice(-8));
      setUploads(next);
      try { localStorage.setItem(UP_KEY, JSON.stringify([...next])); } catch { /* mémoire pleine */ }
      setBoard(b); setSel(null); say("Planche composée : ajustez, remplacez, ajoutez.");
    } catch { say("L'image n'a pas pu être lue. Essayez avec une autre photo."); }
  };
  const pickRoom = async (f: File | undefined) => {
    if (!f) return;
    const r = await preparePhoto(f, 2048);
    if (!r.ok) { setApplyMsg(r.message); return; }
    setRoom(r.photo.dataUrl); setApplied(null); setApplyMsg(null);
  };
  const applyToRoom = async () => {
    const e = engine.current; if (!e || !room || !board) return;
    setApplyBusy(true); setApplyMsg(null);
    let boardImg = "";
    try { boardImg = e.exportImage(1400); } catch { /* sans image de planche : la liste suffit */ }
    const items = [...new Map(board.items.filter((i) => !i.ref.startsWith("up-") && !i.ref.startsWith("t:")).map((i) => [i.ref, i])).values()];
    const brief = [`Appliquer la planche de matières « ${board.title} » à cette pièce, en gardant sa structure.`, ...items.map((i) => `${itemName(i.ref)} : ${placeOf(i.ref)}.`), "Rendu photoréaliste, lumière naturelle."].join("\n").slice(0, 1200);
    const r = await redesignRoom(room, boardImg ? [boardImg] : [], brief);
    if (r.ok) { setApplied(r.image); setApplyMsg(r.left > 0 ? `Il vous reste ${r.left} rendu${r.left > 1 ? "s" : ""} aujourd'hui.` : "C'était votre dernier rendu du jour."); }
    else setApplyMsg(r.message);
    setApplyBusy(false);
  };

  const mats = useMemo(() => {
    const n = q.trim().toLowerCase();
    return MATERIALS.filter((m) => (family === "Toutes" || m.family === family) && (!n || `${m.name} ${m.family} ${m.origin}`.toLowerCase().includes(n)))
      .sort((a, b) => Number(!!realTexture(b.id)) - Number(!!realTexture(a.id)));
  }, [q, family]);
  const current = board?.items.find((i) => i.id === sel);
  const sheet = useMemo(() => [...new Map((board?.items ?? []).filter((i) => !i.ref.startsWith("up-") && !i.ref.startsWith("vis-") && !i.ref.startsWith("t:")).map((i) => [i.ref, i])).values()], [board]);

  const tile = (ref: string, label: string, sub?: string) => (
    <li key={ref}>
      <button type="button" draggable onDragStart={(e) => { dragRef.current = ref; e.dataTransfer.setData("text/plain", ref); e.dataTransfer.effectAllowed = "copy"; }}
        onClick={() => addAt(ref)} className="group block w-full text-left" title={`Ajouter « ${label} » à la planche (ou glissez-le)`}>
        <span aria-hidden="true" className="block aspect-square overflow-hidden rounded-[10px] bg-[var(--surface-2,#ECE8E0)] shadow-[inset_0_0_0_1px_rgba(0,0,0,.06)] transition group-hover:-translate-y-0.5 group-hover:shadow-md">
          <Thumb refId={ref} className="h-full w-full" />
        </span>
        <span className="mt-1 block truncate text-[12px] leading-tight">{label}</span>
        {sub && <span className="block truncate text-[11px] leading-tight text-muted">{sub}</span>}
      </button>
    </li>
  );

  return (
    <div className="planche">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <span className="eyebrow">Planche de matières 3D</span>
          <input aria-label="Titre de la planche" className="mt-1 block w-full max-w-[32rem] bg-transparent font-display text-[clamp(1.8rem,3.4vw,2.6rem)] leading-tight outline-none focus:underline decoration-[var(--line)]"
            value={board?.title ?? ""} onChange={(e) => setBoard((b) => (b ? { ...b, title: e.target.value.slice(0, 80) } : b))} />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="seg" role="group" aria-label="Point de vue">
            {(["perspective", "dessus"] as View[]).map((v) => (
              <button key={v} type="button" aria-pressed={view === v} className={`btn btn-sm ${view === v ? "btn-primary" : ""}`} onClick={() => { setView(v); engine.current?.setView(v); }}>{v === "dessus" ? "Vue de dessus" : "Perspective"}</button>
            ))}
          </div>
          <label className="btn btn-sm cursor-pointer">
            <input type="file" accept="image/*" className="sr-only" onChange={(e) => { void fromImage(e.target.files?.[0]); e.target.value = ""; }} />
            À partir d'une image
          </label>
          <button type="button" className="btn btn-sm" onClick={() => setTemplates(true)}>Modèles</button>
          <button type="button" className="btn btn-sm" onClick={() => void share()}>Partager</button>
          <button type="button" className="btn btn-sm" onClick={exportHD} disabled={!ready}>Exporter en HD</button>
          <button type="button" className="btn btn-sm btn-primary" onClick={() => void makePhoto()} disabled={!ready || !!photo?.busy}>{photo?.busy ? <><span className="spinner" /> Photo en cours…</> : "Photo réaliste (IA)"}</button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[300px_minmax(0,1fr)]">
        {/* Bibliothèque */}
        <aside className="panel order-2 flex max-h-[min(74vh,760px)] flex-col p-0 lg:order-1" aria-label="Bibliothèque">
          <div className="flex gap-1 overflow-x-auto border-b border-line p-2" role="tablist" aria-label="Rubriques de la bibliothèque">
            {([["showroom", "Showroom"], ["matieres", "Matières"], ["peintures", "Peintures"], ["objets", "Objets 3D"], ["photos", "Mes photos"]] as Array<[Tab, string]>).map(([t, l]) => (
              <button key={t} type="button" role="tab" aria-selected={tab === t} className={`chip whitespace-nowrap ${tab === t ? "chip-on" : ""}`} onClick={() => setTab(t)}>{l}</button>
            ))}
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto p-3">
            {tab === "showroom" && <>
              <div className="mb-3 flex flex-wrap gap-1" role="group" aria-label="Familles du showroom">
                {SR_FAMILIES.map((f) => <button key={f.id} type="button" aria-pressed={srFam === f.id} className={`chip text-[12px] ${srFam === f.id ? "chip-on" : ""}`} onClick={() => setSrFam(f.id)}>{f.name}</button>)}
              </div>
              <ul className="grid grid-cols-3 gap-x-2 gap-y-3">{(() => { const f = familyById.get(srFam)!; return f.axes[0]!.options.map((o) => { const ref = makeRef(f, [o, ...f.axes.slice(1).map((a) => a.options[0]!)]); return tile(ref, o.label, f.name); }); })()}</ul>
              <p className="mt-3 text-[12px] text-muted">Formats, finitions et joints se règlent ensuite sur l'échantillon. <Link className="underline" href={`/showroom/?f=${srFam}`}>Tout le showroom</Link></p>
            </>}
            {tab === "matieres" && <>
              <input className="input mb-2 w-full" type="search" placeholder="Chêne, marbre, lin…" aria-label="Rechercher une matière" value={q} onChange={(e) => setQ(e.target.value)} />
              <div className="mb-3 flex flex-wrap gap-1">
                {FAMILIES.map((f) => <button key={f} type="button" aria-pressed={family === f} className={`chip text-[12px] ${family === f ? "chip-on" : ""}`} onClick={() => setFamily(f)}>{f}</button>)}
              </div>
              <ul className="grid grid-cols-3 gap-x-2 gap-y-3">{mats.map((m) => tile(m.id, m.name, realTexture(m.id) ? "Photographiée" : m.family))}</ul>
              {mats.length === 0 && <p className="text-[13px] text-muted">Aucune matière ne correspond.</p>}
            </>}
            {tab === "peintures" && <>
              <ul className="grid grid-cols-3 gap-x-2 gap-y-3">{COLORS.map((c) => tile(c.hex, c.name))}</ul>
              <label className="mt-4 flex items-center gap-2 text-[13px]">
                <input type="color" defaultValue="#C9B8A0" aria-label="Choisir une teinte libre" onChange={(e) => { const v = e.target.value; window.clearTimeout((window as unknown as { _pc?: number })._pc); (window as unknown as { _pc?: number })._pc = window.setTimeout(() => addAt(v), 400); }} className="h-9 w-12 cursor-pointer rounded border border-line" />
                Teinte libre
              </label>
              <p className="mt-2 text-[12px] text-muted">Les couleurs à l'écran sont indicatives : demandez toujours un échantillon réel en magasin.</p>
            </>}
            {tab === "objets" && <>
              <p className="mb-3 text-[12.5px] text-muted">Meubles et objets photographiés en 3D (Poly Haven, licence libre CC0).</p>
              <ul className="grid grid-cols-3 gap-x-2 gap-y-3">{MODELS.map((m) => tile(m.id, frenchName(m), libGroup(m)))}</ul>
            </>}
            {tab === "photos" && <>
              <label className="flex cursor-pointer flex-col items-center gap-1 rounded-[var(--r)] border-[1.5px] border-dashed border-line p-5 text-center">
                <b className="text-[14px]">Ajouter vos photos</b>
                <span className="text-[12px] text-muted">Une pièce, un tissu, une inspiration. Elles restent sur votre appareil.</span>
                <input type="file" accept="image/jpeg,image/png,image/webp" multiple className="sr-only" onChange={(e) => void addPhotos(e.target.files)} />
              </label>
              {uploads.size > 0 && <ul className="mt-3 grid grid-cols-3 gap-2">{[...uploads].map(([id, url]) => (
                <li key={id}><button type="button" className="block w-full" onClick={() => addAt(id)} title="Ajouter à la planche">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt="Votre photo" className="aspect-square w-full rounded-[10px] object-cover" />
                </button></li>
              ))}</ul>}
            </>}
          </div>
        </aside>

        {/* Planche */}
        <div className="order-1 lg:order-2">
          <div className="relative overflow-hidden rounded-[var(--r-l)] bg-[#E9E5DD] shadow-[var(--shadow)]">
            <div ref={box} className="aspect-[4/3] w-full sm:aspect-[3/2]" />
            {!ready && <p className="absolute inset-0 grid place-items-center text-[14px] text-muted">Préparation de la planche…</p>}
            {ready && board && board.items.length === 0 && <p className="pointer-events-none absolute inset-0 grid place-items-center p-6 text-center text-[15px] text-muted">Glissez ici des matières, des peintures ou des objets depuis la bibliothèque.</p>}
            <div className="absolute bottom-3 left-3 flex gap-1">
              <button type="button" className="btn btn-sm btn-light" aria-label="Zoom arrière" onClick={() => { const e = engine.current; if (e) e.setZoom(e.zoomLevel / 1.4); }}>−</button>
              <button type="button" className="btn btn-sm btn-light" aria-label="Zoom avant" onClick={() => { const e = engine.current; if (e) e.setZoom(e.zoomLevel * 1.4); }}>+</button>
              <button type="button" className="btn btn-sm btn-light" aria-label="Vue entière" onClick={() => engine.current?.setZoom(1)}>⤢</button>
            </div>
            {toast && <p role="status" className="absolute left-1/2 top-3 -translate-x-1/2 rounded-full bg-black/75 px-4 py-1.5 text-[13px] text-white">{toast}</p>}

            {current && (
              <div className="absolute inset-x-3 bottom-3 ml-auto max-w-[380px] rounded-[16px] bg-[var(--bg)]/95 p-3 shadow-lg backdrop-blur sm:right-3 sm:inset-x-auto sm:w-[360px]" role="region" aria-label="Élément sélectionné">
                <div className="flex items-start gap-3">
                  <span aria-hidden="true" className="h-12 w-12 shrink-0 overflow-hidden rounded-[8px]"><Thumb refId={current.ref} className="h-full w-full" /></span>
                  <div className="min-w-0 flex-1">
                    <b className="block truncate text-[14px]">{current.ref.startsWith("up-") ? "Photo importée" : libModel(current.ref) ? frenchName(libModel(current.ref)!) : parseVariant(current.ref) ? variantName(parseVariant(current.ref)!, true) : itemName(current.ref)}</b>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {shapesFor(current.ref).length > 1 && shapesFor(current.ref).map((s) => (
                        <button key={s} type="button" aria-pressed={current.shape === s} className={`chip text-[11.5px] ${current.shape === s ? "chip-on" : ""}`} onClick={() => update(current.id, { shape: s })}>{SHAPE_LABEL[s]}</button>
                      ))}
                    </div>
                  </div>
                  <button type="button" className="btn btn-sm btn-ghost" aria-label="Fermer" onClick={() => setSel(null)}><IconClose width={16} height={16} /></button>
                </div>
                {(() => { const v = parseVariant(current.ref); return v && (
                  <div className="mt-2 grid grid-cols-2 gap-2 text-[12px]">
                    {v.family.axes.map((a, i) => (
                      <label key={a.id} className="min-w-0">{a.label}
                        <select className="input mt-0.5 w-full px-2 py-1 text-[12.5px]" value={v.opts[i]!.id} onChange={(e) => update(current.id, { ref: withOption(current.ref, a.id, e.target.value) })}>
                          {a.options.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
                          {v.opts[i]!.id.startsWith("x-") && <option value={v.opts[i]!.id}>{v.opts[i]!.label}</option>}
                        </select>
                        {isColorAxis(a) && (
                          <span className="mt-1 flex items-center gap-1.5 text-[11.5px] text-muted">
                            <input type="color" aria-label={`${a.label} sur mesure`} className="h-6 w-8 cursor-pointer rounded border border-line bg-transparent p-0" value={v.opts[i]!.hex ?? "#cccccc"} onChange={(e) => update(current.id, { ref: withOption(current.ref, a.id, customId(e.target.value)) })} />
                            Sur mesure
                          </span>
                        )}
                      </label>
                    ))}
                  </div>
                ); })()}
                {current.ref.startsWith("t:") && (
                  <label className="mt-2 block text-[12px]">Texte de l'étiquette
                    <input className="input mt-0.5 w-full px-2 py-1 text-[13px]" maxLength={40} defaultValue={current.ref.slice(2)} key={current.id} onChange={(e) => update(current.id, { ref: labelRef(e.target.value) })} />
                  </label>
                )}
                <div className="mt-2 grid grid-cols-2 gap-3 text-[12px]">
                  <label>Rotation<input type="range" min={-180} max={180} value={((current.rot + 540) % 360) - 180} onChange={(e) => update(current.id, { rot: Number(e.target.value) })} className="w-full accent-[var(--bronze)]" /></label>
                  <label>Taille<input type="range" min={SCALE_MIN} max={SCALE_MAX} step={0.05} value={current.s} onChange={(e) => update(current.id, { s: Number(e.target.value) })} className="w-full accent-[var(--bronze)]" /></label>
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <button type="button" className="btn btn-sm" onClick={() => toFront(current.id)}>Dessus de la pile</button>
                  <button type="button" className="btn btn-sm" onClick={() => duplicate(current.id)}>Dupliquer</button>
                  <button type="button" className="btn btn-sm" onClick={() => remove(current.id)}>Retirer</button>
                </div>
              </div>
            )}
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2" role="group" aria-label="Fond de la planche">
            <span className="text-[13px] text-muted">Fond :</span>
            {BACKGROUNDS.map((b) => (
              <button key={b.id} type="button" aria-pressed={board?.bg === b.id} title={b.name} aria-label={`Fond ${b.name}`}
                className={`h-8 w-8 overflow-hidden rounded-full ring-offset-2 ring-offset-[var(--bg)] ${board?.bg === b.id ? "ring-2 ring-[var(--accent)]" : "ring-1 ring-[var(--line)]"}`}
                onClick={() => setBoard((x) => (x ? { ...x, bg: b.id } : x))}>
                {b.id.startsWith("#") ? <span className="block h-full w-full" style={{ background: b.id }} /> : <span className="block h-full w-full bg-cover" style={{ backgroundImage: `url(${textureUrl(b.id, "diff")})` }} />}
              </button>
            ))}
            <span className="ml-auto flex gap-2">
              <button type="button" className="btn btn-sm" onClick={() => addAt(labelRef(board?.title || "Ma planche"), 0.36, 0.3)}>+ Étiquette</button>
              <button type="button" className="btn btn-sm btn-ghost" onClick={() => { setBoard((b) => (b ? { ...emptyBoard(), title: b.title, bg: b.bg } : b)); setSel(null); }}>Vider</button>
              <button type="button" className="btn btn-sm" onClick={() => openCamille(`Voici ma planche de matières « ${board?.title} » : ${sheet.map((i) => itemName(i.ref)).join(", ")}. Ces matières vont-elles bien ensemble, et dans quelle pièce les utiliser ?`)}>Avis de Camille</button>
            </span>
          </div>
          <p className="mt-2 text-[12.5px] text-muted">Glissez un échantillon pour le déplacer ; posez-le sur un autre pour les superposer. Molette ou pincement pour zoomer jusqu'au grain de la matière, glisser le fond pour se déplacer. Touche R : rotation, Suppr : retirer.</p>
        </div>
      </div>

      {/* Appliquer la planche à une photo de la pièce */}
      <section className="mt-12 grid gap-6 rounded-[28px] bg-surface p-5 shadow-[0_1px_2px_rgba(0,0,0,.04),0_24px_48px_-28px_rgba(0,0,0,.2)] sm:p-8 lg:grid-cols-[minmax(0,.8fr)_minmax(0,1.2fr)]" aria-labelledby="appliquer">
        <div>
          <span className="eyebrow">Ma planche, chez moi</span>
          <h2 id="appliquer" className="mt-1 text-[clamp(1.6rem,3vw,2.2rem)]">Appliquer ma planche <em>à ma pièce</em></h2>
          <p className="mt-3 text-[15px] text-muted">Envoyez une photo de votre pièce : elle est réaménagée avec les matières de votre planche (murs, sol, textiles, métaux), en gardant ses volumes et ses fenêtres.</p>
          <label className="btn mt-5 cursor-pointer">
            <input type="file" accept="image/*" className="sr-only" onChange={(e) => void pickRoom(e.target.files?.[0])} />
            {room ? "Changer de photo" : "Choisir la photo de ma pièce"}
          </label>
          <button type="button" className="btn btn-primary ml-2 mt-5" onClick={() => void applyToRoom()} disabled={!room || !sheet.length || applyBusy || !ready}>
            {applyBusy ? <><span className="spinner" /> Rendu en cours (20 à 40 s)…</> : "Appliquer mes matières"}
          </button>
          {!sheet.length && <p className="mt-3 text-[13px] text-muted">Ajoutez d'abord des matières à votre planche.</p>}
          {applyMsg && <p role="status" className="mt-3 text-[13px] text-muted">{applyMsg}</p>}
          <p className="mt-4 text-[12px] text-muted">Rendu créé par intelligence artificielle, à titre d'inspiration. Votre photo n'est envoyée au service d'images qu'à ce moment-là.</p>
        </div>
        <div>
          {/* eslint-disable @next/next/no-img-element */}
          {room && applied
            ? <><BeforeAfter before={<img src={room} alt="Votre pièce, avant" />} after={<img src={applied} alt="Votre pièce avec les matières de la planche" />} labelAfter="Avec ma planche" />
              <a className="btn btn-sm btn-primary mt-3" href={applied} download="ma-piece-avec-ma-planche.jpg">Télécharger le rendu</a></>
            : room ? <img src={room} alt="Votre pièce" className="aspect-[4/3] w-full rounded-[18px] object-cover" />
              : <div className="grid aspect-[4/3] w-full place-items-center rounded-[18px] border border-dashed border-line text-center text-[14px] text-muted">Votre photo apparaîtra ici</div>}
          {/* eslint-enable @next/next/no-img-element */}
        </div>
      </section>

      {/* Fiche matériaux */}
      {sheet.length > 0 && (
        <section className="mt-12" aria-labelledby="fiche">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div><span className="eyebrow">Fiche matériaux</span><h2 id="fiche" className="mt-1 text-[clamp(1.6rem,3vw,2.2rem)]">Ce qui compose <em>votre planche</em></h2></div>
            <button type="button" className="btn btn-sm" onClick={() => window.print()}>Imprimer la fiche</button>
          </div>
          <ul className="mt-6 grid gap-4 md:grid-cols-2">
            {sheet.map((i) => {
              const v = parseVariant(i.ref), m = materialById.get(i.ref) ?? (v?.family.materialId ? materialById.get(v.family.materialId) : undefined), lm = libModel(i.ref), rt = realTexture(i.ref), shop = shopFor(i.ref);
              return (
                <li key={i.ref} className="panel flex gap-4">
                  <span className="h-24 w-24 shrink-0 overflow-hidden rounded-[12px]"><Thumb refId={i.ref} className="h-full w-full" /></span>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-ui text-[15.5px] font-semibold">{lm ? frenchName(lm) : itemName(i.ref)}</h3>
                    <p className="text-[13px] text-muted">
                      {v ? <>Showroom · {v.family.name} · Réf. {variantCode(v)}</> : m ? <>{m.family} · {m.origin}</> : lm ? <>Modèle 3D {lm.authors.join(", ")} · <a className="underline" href={lm.url} target="_blank" rel="noopener noreferrer">Poly Haven</a> (CC0)</> : <>Teinte {i.ref.toUpperCase()}</>}
                    </p>
                    {m && <p className="mt-1 text-[13px]">{m.priceRange} · <Link className="underline" href={`/matieres/${m.slug}/`}>fiche complète</Link></p>}
                    {rt && <p className="mt-0.5 text-[11.5px] text-muted">Texture : {rt.name}, {rt.authors.join(", ")} (Poly Haven, CC0)</p>}
                    {shop.q && <div className="mt-2"><ShopLinks query={shop.q} kinds={shop.kinds} max={3} title="" compact /></div>}
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {templates && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" role="dialog" aria-modal="true" aria-label="Modèles de planches" onClick={() => setTemplates(false)}>
          <div className="w-full max-w-2xl rounded-[var(--r-l)] bg-[var(--bg)] p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between"><h2 className="text-2xl">Partir d'un modèle</h2><button type="button" className="btn btn-sm btn-ghost" aria-label="Fermer" onClick={() => setTemplates(false)}><IconClose width={16} height={16} /></button></div>
            <ul className="mt-4 grid gap-3 sm:grid-cols-3">
              {TEMPLATES.map((t) => { const b = t.board(); return (
                <li key={t.id}><button type="button" className="panel block w-full p-3 text-left hover:shadow-md" onClick={() => { setBoard(b); setSel(null); setTemplates(false); }}>
                  <span aria-hidden="true" className="grid grid-cols-3 gap-1 overflow-hidden rounded-[10px]">{b.items.filter((i) => !libModel(i.ref)).slice(0, 6).map((i) => <span key={i.id} className="aspect-square overflow-hidden"><Thumb refId={i.ref} className="h-full w-full" /></span>)}</span>
                  <b className="mt-2 block text-[14px]">{t.name}</b><span className="text-[12.5px] text-muted">{t.text}</span>
                </button></li>
              ); })}
              <li><button type="button" className="panel grid h-full w-full place-items-center p-3 text-center hover:shadow-md" onClick={() => { setBoard(emptyBoard()); setSel(null); setTemplates(false); }}><b className="text-[14px]">Planche vierge</b></button></li>
            </ul>
          </div>
        </div>
      )}

      {photo && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/75 p-4" role="dialog" aria-modal="true" aria-label="Photo réaliste de la planche">
          <div className="w-full max-w-5xl rounded-[var(--r-l)] bg-[var(--bg)] p-3">
            {/* eslint-disable @next/next/no-img-element */}
            {photo.image
              ? <BeforeAfter before={<img src={photo.render} alt="Planche en 3D" />} after={<img src={photo.image} alt={`Photo réaliste de la planche « ${board?.title} »`} />} labelAfter="Photo IA" ratio="3 / 2" />
              : <div className="relative"><img src={photo.render} alt="Planche en 3D" className="max-h-[70vh] w-full rounded-[12px] object-contain opacity-70" />{photo.busy && <span className="absolute inset-0 grid place-items-center text-[15px] font-medium"><span><span className="spinner" /> Photographie en cours (20 à 40 s)…</span></span>}</div>}
            {/* eslint-enable @next/next/no-img-element */}
            {photo.msg && <p role="status" className="mt-2 text-[13px] text-muted">{photo.msg}</p>}
            <div className="mt-3 flex flex-wrap justify-end gap-2">
              {photo.image && <a className="btn btn-sm btn-primary" href={photo.image} download={`planche-photo-${(board?.title ?? "piece-revee").toLowerCase().replace(/[^a-z0-9]+/g, "-")}.jpg`}>Télécharger la photo</a>}
              <button type="button" className="btn btn-sm" onClick={() => setPhoto(null)} disabled={photo.busy}>Fermer</button>
            </div>
            <p className="mt-2 text-[11.5px] text-muted">Photo créée par intelligence artificielle à partir de votre planche 3D, à titre d'illustration.</p>
          </div>
        </div>
      )}

      {render && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/75 p-4" role="dialog" aria-modal="true" aria-label="Image haute définition">
          <div className="w-full max-w-5xl rounded-[var(--r-l)] bg-[var(--bg)] p-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={render} alt={`Planche « ${board?.title} » en haute définition`} className="max-h-[72vh] w-full rounded-[12px] object-contain" />
            <div className="mt-3 flex justify-end gap-2">
              <a className="btn btn-sm btn-primary" href={render} download={`planche-${(board?.title ?? "piece-revee").toLowerCase().replace(/[^a-z0-9]+/g, "-")}.jpg`}>Télécharger</a>
              <button type="button" className="btn btn-sm" onClick={() => setRender(null)}>Fermer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
