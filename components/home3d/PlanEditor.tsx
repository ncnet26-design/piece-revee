"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { furnishAll, refurnish } from "@/lib/home3d/furnish";
import {
  OPENING_KINDS, ROOM_KINDS, SIDES, TEMPLATES, deriveStructure, neighbours, newOpening, openingAbs, planWarnings, roomArea, sideLength,
  type Layout, type OpeningDef, type OpeningKind, type RoomDef, type RoomKind, type Side,
} from "@/lib/home3d/layout";
import { CATALOG, itemDims, type Item } from "@/lib/home3d/plan";

interface Work { layout: Layout; items: Item[] }
type Sel = { kind: "room"; id: string } | { kind: "opening"; id: string } | null;
type Drag =
  | { t: "pan"; sx: number; sy: number; cx: number; cz: number }
  | { t: "move"; id: string; wx: number; wz: number; room: RoomDef; items: Item[]; moved: boolean }
  | { t: "resize"; id: string; side: Side; wx: number; wz: number; room: RoomDef; ops: OpeningDef[]; moved: boolean }
  | { t: "opening"; id: string; wx: number; wz: number; offset: number; moved: boolean };

const TINT: Record<RoomKind, string> = { salon: "#EEE6D8", cuisine: "#E3EBDD", chambre: "#E4E6F0", sdb: "#DDEBEF", entree: "#EFE3DC", exterieur: "#DCE8D2" };
const snap = (v: number, step = 0.05) => Math.round(Math.round(v / step) * step * 100) / 100;
const fmt = (v: number) => v.toLocaleString("fr-FR", { maximumFractionDigits: 2 });
const rid = () => `r${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;
const insideRect = (r: RoomDef, it: { x: number; z: number }) => it.x > r.x0 && it.x < r.x1 && it.z > r.z0 && it.z < r.z1;

export default function PlanEditor({ layout, items, onApply, onCancel }: { layout: Layout; items: Item[]; onApply: (l: Layout, items: Item[]) => void; onCancel: () => void }) {
  const [work, setWork] = useState<Work>({ layout, items });
  const [past, setPast] = useState<Work[]>([]);
  const [sel, setSel] = useState<Sel>(null);
  const [view, setView] = useState({ cx: 6, cz: 3, ppm: 40 });
  const [size, setSize] = useState({ w: 800, h: 500 });
  const [addKind, setAddKind] = useState<RoomKind>("chambre");
  // Calque : le plan de l'utilisateur (photo, capture ou scan), à décalquer à l'échelle réelle.
  const [trace, setTraceState] = useState<{ url: string; ratio: number; w: number; x: number; z: number; op: number } | null>(() => {
    try { const r = typeof window !== "undefined" ? localStorage.getItem("pr_plan_calque") : null; return r ? JSON.parse(r) : null; } catch { return null; }
  });
  const [traceMsg, setTraceMsg] = useState<string | null>(null);
  const setTrace = (t: typeof trace) => { setTraceState(t); try { if (t) localStorage.setItem("pr_plan_calque", JSON.stringify(t)); else localStorage.removeItem("pr_plan_calque"); } catch { setTraceMsg("Le calque ne sera pas conservé après fermeture (mémoire pleine)."); } };
  const importPlan = async (f: File | undefined) => {
    if (!f) return;
    if (f.type === "application/pdf") { setTraceMsg("Pour un PDF, faites une capture d'écran de la page du plan (ou exportez-la en image), puis importez cette image."); return; }
    if (!f.type.startsWith("image/")) { setTraceMsg("Importez une image du plan (JPEG, PNG ou WebP)."); return; }
    const url = await new Promise<string>((res, rej) => { const fr = new FileReader(); fr.onload = () => res(String(fr.result)); fr.onerror = rej; fr.readAsDataURL(f); });
    const img = new Image(); img.src = url; await img.decode();
    const k = Math.min(1, 2000 / Math.max(img.naturalWidth, img.naturalHeight)), c = document.createElement("canvas");
    c.width = Math.round(img.naturalWidth * k); c.height = Math.round(img.naturalHeight * k); c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
    const b = deriveStructure(workRef.current.layout).bbox;
    setTrace({ url: c.toDataURL("image/jpeg", 0.85), ratio: c.height / c.width, w: Math.max(4, Math.round((b.x1 - b.x0 + 1) * 10) / 10), x: b.x0 - 0.5, z: b.z0 - 0.5, op: 0.55 });
    setTraceMsg("Plan importé. Réglez sa largeur réelle (mesurez un mur connu), puis dessinez vos pièces par-dessus.");
  };
  const box = useRef<HTMLDivElement>(null);
  const drag = useRef<Drag | null>(null);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const pinch = useRef<{ d: number; ppm: number } | null>(null);
  const fitted = useRef(false);
  const workRef = useRef(work); useEffect(() => { workRef.current = work; }, [work]);

  const L = work.layout;
  const st = useMemo(() => deriveStructure(L), [L]);
  const warnings = useMemo(() => planWarnings(L), [L]);
  const changed = work.layout !== layout || work.items !== items;

  const fit = useCallback((w = size.w, h = size.h, l = workRef.current.layout) => {
    const b = deriveStructure(l).bbox, mw = b.x1 - b.x0 + 2, mh = b.z1 - b.z0 + 2;
    setView({ cx: (b.x0 + b.x1) / 2, cz: (b.z0 + b.z1) / 2, ppm: Math.max(8, Math.min(140, Math.min(w / mw, h / mh))) });
  }, [size.w, size.h]);

  useEffect(() => {
    const el = box.current; if (!el) return;
    const ro = new ResizeObserver(([e]) => {
      if (!e) return;
      const w = e.contentRect.width, h = e.contentRect.height;
      setSize({ w, h });
      if (!fitted.current && w > 0) { fitted.current = true; fit(w, h); }
    });
    ro.observe(el); return () => ro.disconnect();
  }, [fit]);

  /** Modification avec historique (annulable). */
  const commit = (fn: (w: Work) => Work) => { setPast((p) => [...p.slice(-49), workRef.current]); setWork((w) => fn(w)); };
  const undo = () => setPast((p) => { const last = p.at(-1); if (last) setWork(last); return p.slice(0, -1); });
  const room = (id: string) => L.rooms.find((r) => r.id === id);
  const selRoom = sel?.kind === "room" ? room(sel.id) : undefined;
  const selOpening = sel?.kind === "opening" ? L.openings.find((o) => o.id === sel.id) : undefined;

  /* ——— Coordonnées ——— */
  const vw = size.w / view.ppm, vh = size.h / view.ppm, vx = view.cx - vw / 2, vz = view.cz - vh / 2;
  const px = (n: number) => n / view.ppm;
  const toWorld = (cx: number, cy: number) => { const r = box.current!.getBoundingClientRect(); return { x: vx + (cx - r.left) / view.ppm, z: vz + (cy - r.top) / view.ppm }; };

  /** Aimantation : colle un bord aux bords des autres pièces à moins de 25 cm. */
  const magnet = (id: string, v: number, axis: "x" | "z") => {
    let best = v, dist = 0.25;
    for (const r of workRef.current.layout.rooms) { if (r.id === id) continue; for (const c of axis === "x" ? [r.x0, r.x1] : [r.z0, r.z1]) if (Math.abs(c - v) < dist) { dist = Math.abs(c - v); best = c; } }
    return best;
  };

  const setRoomGeom = (w: Work, id: string, g: Partial<RoomDef>, moveItemsFrom?: { room: RoomDef; items: Item[] }): Work => {
    const rooms = w.layout.rooms.map((r) => (r.id === id ? { ...r, ...g, spawn: undefined, look: undefined } : r));
    const nr = rooms.find((r) => r.id === id)!;
    let its = w.items;
    if (moveItemsFrom) {
      const dx = nr.x0 - moveItemsFrom.room.x0, dz = nr.z0 - moveItemsFrom.room.z0;
      const ids = new Set(moveItemsFrom.items.filter((it) => insideRect(moveItemsFrom.room, it)).map((it) => it.id));
      its = moveItemsFrom.items.map((it) => (ids.has(it.id) ? { ...it, x: Math.round((it.x + dx) * 100) / 100, z: Math.round((it.z + dz) * 100) / 100 } : it));
    }
    return { layout: { ...w.layout, rooms }, items: its };
  };

  /* ——— Pointeur ——— */
  const onDown = (e: React.PointerEvent<SVGSVGElement>) => {
    (e.currentTarget as Element).setPointerCapture(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()] as [{ x: number; y: number }, { x: number; y: number }];
      pinch.current = { d: Math.hypot(a.x - b.x, a.y - b.y), ppm: view.ppm }; drag.current = null; return;
    }
    const t = (e.target as Element).closest("[data-k]") as SVGElement | null;
    const w = toWorld(e.clientX, e.clientY), k = t?.dataset.k, id = t?.dataset.id ?? "";
    const cur = workRef.current;
    if (k === "handle") { const r = cur.layout.rooms.find((x) => x.id === id)!; drag.current = { t: "resize", id, side: t!.dataset.side as Side, wx: w.x, wz: w.z, room: r, ops: cur.layout.openings, moved: false }; return; }
    if (k === "opening") { const o = cur.layout.openings.find((x) => x.id === id)!; setSel({ kind: "opening", id }); drag.current = { t: "opening", id, wx: w.x, wz: w.z, offset: o.offset, moved: false }; return; }
    if (k === "room") { const r = cur.layout.rooms.find((x) => x.id === id)!; setSel({ kind: "room", id }); drag.current = { t: "move", id, wx: w.x, wz: w.z, room: r, items: cur.items, moved: false }; return; }
    drag.current = { t: "pan", sx: e.clientX, sy: e.clientY, cx: view.cx, cz: view.cz };
  };
  const onMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!pointers.current.has(e.pointerId)) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pinch.current && pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()] as [{ x: number; y: number }, { x: number; y: number }];
      const d = Math.hypot(a.x - b.x, a.y - b.y); setView((v) => ({ ...v, ppm: Math.max(8, Math.min(160, pinch.current!.ppm * (d / pinch.current!.d))) })); return;
    }
    const d = drag.current; if (!d) return;
    if (d.t === "pan") { setView((v) => ({ ...v, cx: d.cx - (e.clientX - d.sx) / v.ppm, cz: d.cz - (e.clientY - d.sy) / v.ppm })); return; }
    const w = toWorld(e.clientX, e.clientY), dx = w.x - d.wx, dz = w.z - d.wz;
    if (!d.moved) { if (Math.hypot(dx, dz) * view.ppm < 4) return; d.moved = true; setPast((p) => [...p.slice(-49), workRef.current]); }
    if (d.t === "move") {
      const r = d.room, W = r.x1 - r.x0, D = r.z1 - r.z0;
      let x0 = snap(r.x0 + dx), z0 = snap(r.z0 + dz);
      const mx0 = magnet(d.id, x0, "x"), mx1 = magnet(d.id, x0 + W, "x"); x0 = mx0 !== x0 ? mx0 : mx1 !== x0 + W ? mx1 - W : x0;
      const mz0 = magnet(d.id, z0, "z"), mz1 = magnet(d.id, z0 + D, "z"); z0 = mz0 !== z0 ? mz0 : mz1 !== z0 + D ? mz1 - D : z0;
      setWork((cw) => setRoomGeom(cw, d.id, { x0, z0, x1: Math.round((x0 + W) * 100) / 100, z1: Math.round((z0 + D) * 100) / 100 }, { room: r, items: d.items }));
    } else if (d.t === "resize") {
      const r = d.room, g: Partial<RoomDef> = {};
      if (d.side === "w") g.x0 = Math.min(r.x1 - 1, magnet(d.id, snap(r.x0 + dx), "x"));
      if (d.side === "e") g.x1 = Math.max(r.x0 + 1, magnet(d.id, snap(r.x1 + dx), "x"));
      if (d.side === "n") g.z0 = Math.min(r.z1 - 1, magnet(d.id, snap(r.z0 + dz), "z"));
      if (d.side === "s") g.z1 = Math.max(r.z0 + 1, magnet(d.id, snap(r.z1 + dz), "z"));
      setWork((cw) => {
        const next = setRoomGeom(cw, d.id, g);
        const nr = next.layout.rooms.find((x) => x.id === d.id)!;
        // Les ouvertures gardent leur position réelle ; on les ramène dans le mur si besoin.
        const openings = d.ops.map((o) => {
          if (o.roomId !== d.id) return o;
          const shift = isH(o.side) ? nr.x0 - r.x0 : nr.z0 - r.z0, Ln = sideLength(nr, o.side);
          return { ...o, offset: Math.min(Ln - o.width / 2 - 0.05, Math.max(o.width / 2 + 0.05, Math.round((o.offset - shift) * 100) / 100)), width: Math.min(o.width, Ln - 0.1) };
        });
        const its = next.items.map((it) => (insideRect(r, it) ? { ...it, x: Math.min(nr.x1 - 0.2, Math.max(nr.x0 + 0.2, it.x)), z: Math.min(nr.z1 - 0.2, Math.max(nr.z0 + 0.2, it.z)) } : it));
        return { layout: { ...next.layout, openings }, items: its };
      });
    } else if (d.t === "opening") {
      setWork((cw) => {
        const o = cw.layout.openings.find((x) => x.id === d.id); if (!o) return cw;
        const r = cw.layout.rooms.find((x) => x.id === o.roomId); if (!r) return cw;
        const Ls = sideLength(r, o.side), off = Math.min(Ls - o.width / 2 - 0.05, Math.max(o.width / 2 + 0.05, snap(d.offset + (isH(o.side) ? dx : dz))));
        return { ...cw, layout: { ...cw.layout, openings: cw.layout.openings.map((x) => (x.id === d.id ? { ...x, offset: off } : x)) } };
      });
    }
  };
  const onUp = (e: React.PointerEvent<SVGSVGElement>) => {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) pinch.current = null;
    const d = drag.current; drag.current = null;
    if (d?.t === "pan" && Math.hypot(e.clientX - d.sx, e.clientY - d.sy) < 4) setSel(null);
  };
  const onWheel = (e: React.WheelEvent<SVGSVGElement>) => {
    const w = toWorld(e.clientX, e.clientY), k = Math.exp(-e.deltaY * 0.0015);
    setView((v) => { const ppm = Math.max(8, Math.min(160, v.ppm * k)); return { ppm, cx: w.x - (w.x - v.cx) * (v.ppm / ppm), cz: w.z - (w.z - v.cz) * (v.ppm / ppm) }; });
  };

  /* ——— Actions ——— */
  const bbox = () => deriveStructure(workRef.current.layout).bbox;
  /** Emprise des pièces intérieures : une nouvelle pièce se colle au logement, pas au jardin. */
  const houseBox = () => {
    const rs = workRef.current.layout.rooms.filter((r) => r.kind !== "exterieur");
    if (!rs.length) return bbox();
    return { x0: Math.min(...rs.map((r) => r.x0)), x1: Math.max(...rs.map((r) => r.x1)), z0: Math.min(...rs.map((r) => r.z0)), z1: Math.max(...rs.map((r) => r.z1)) };
  };
  const addRoom = () => {
    const b = addKind === "exterieur" ? bbox() : houseBox(), id = rid(), label = ROOM_KINDS.find((k) => k.kind === addKind)!.label.split(" ")[0]!;
    const count = L.rooms.filter((r) => r.kind === addKind).length + 1;
    const r: RoomDef = { id, name: count > 1 ? `${label} ${count}` : label, kind: addKind, x0: b.x1, z0: b.z0, x1: b.x1 + 3, z1: b.z0 + 3 };
    commit((w) => {
      const lay = { ...w.layout, rooms: [...w.layout.rooms, r] };
      const ops = [...lay.openings];
      if (neighbours(lay, r, "w").length) ops.push(newOpening(id, "w", 1.5, "porte"));
      if (addKind !== "exterieur") ops.push(newOpening(id, "e", 1.5, "fenetre"));
      return { ...w, layout: { ...lay, openings: ops } };
    });
    setSel({ kind: "room", id });
  };
  const addOpening = (r: RoomDef, kind: OpeningKind) => {
    const sides: Side[] = ["n", "s", "e", "w"];
    const used = (s: Side) => L.openings.some((o) => o.roomId === r.id && o.side === s);
    const pick = kind === "fenetre" || kind === "baie"
      ? sides.find((s) => !neighbours(L, r, s).length && !used(s)) ?? sides.find((s) => !neighbours(L, r, s).length) ?? "n"
      : sides.find((s) => neighbours(L, r, s).length && !used(s)) ?? sides.find((s) => neighbours(L, r, s).length) ?? "s";
    const o = newOpening(r.id, pick, Math.round((sideLength(r, pick) / 2) * 100) / 100, kind);
    o.width = Math.min(o.width, sideLength(r, pick) - 0.2);
    commit((w) => ({ ...w, layout: { ...w.layout, openings: [...w.layout.openings, o] } }));
    setSel({ kind: "opening", id: o.id });
  };
  const patchRoom = (id: string, g: Partial<RoomDef>) => commit((w) => {
    const r = w.layout.rooms.find((x) => x.id === id)!;
    if (g.x1 !== undefined || g.z1 !== undefined || g.x0 !== undefined || g.z0 !== undefined) {
      const moved = g.x0 !== undefined && g.x1 !== undefined && Math.abs((g.x1 - g.x0) - (r.x1 - r.x0)) < 1e-6 && Math.abs(g.z1! - g.z0! - (r.z1 - r.z0)) < 1e-6;
      return setRoomGeom(w, id, g, moved ? { room: r, items: w.items } : undefined);
    }
    return { ...w, layout: { ...w.layout, rooms: w.layout.rooms.map((x) => (x.id === id ? { ...x, ...g } : x)) } };
  });
  const patchOpening = (id: string, g: Partial<OpeningDef>) => commit((w) => ({ ...w, layout: { ...w.layout, openings: w.layout.openings.map((o) => (o.id === id ? { ...o, ...g } : o)) } }));
  const removeRoom = (r: RoomDef) => {
    if (L.rooms.length <= 1) return;
    if (!window.confirm(`Supprimer « ${r.name} » et ses meubles ?`)) return;
    commit((w) => ({ layout: { rooms: w.layout.rooms.filter((x) => x.id !== r.id), openings: w.layout.openings.filter((o) => o.roomId !== r.id) }, items: w.items.filter((it) => !insideRect(r, it)) }));
    setSel(null);
  };
  const duplicateRoom = (r: RoomDef) => {
    const b = r.kind === "exterieur" ? bbox() : houseBox(), id = rid(), W = r.x1 - r.x0, D = r.z1 - r.z0;
    const copy: RoomDef = { ...r, id, name: `${r.name} (copie)`, x0: b.x1, z0: b.z0, x1: b.x1 + W, z1: b.z0 + D, spawn: undefined, look: undefined };
    commit((w) => ({ ...w, layout: { rooms: [...w.layout.rooms, copy], openings: [...w.layout.openings, ...w.layout.openings.filter((o) => o.roomId === r.id).map((o) => ({ ...o, id: `${o.id}c${Math.random().toString(36).slice(2, 5)}`, roomId: id }))] } }));
    setSel({ kind: "room", id });
  };
  const applyTemplate = (tid: string) => {
    const t = TEMPLATES.find((x) => x.id === tid); if (!t) return;
    if (!window.confirm(`Remplacer votre plan par « ${t.name} » ? Les meubles seront proposés automatiquement.`)) return;
    const lay = t.build();
    commit(() => ({ layout: lay, items: furnishAll(lay) }));
    setSel(null); fit(size.w, size.h, lay);
  };
  const furnish = (r: RoomDef) => commit((w) => ({ ...w, items: refurnish(w.layout, w.items, r.id) }));
  const close = () => { if (!changed || window.confirm("Quitter sans appliquer vos modifications du plan ?")) onCancel(); };

  const onKey = (e: React.KeyboardEvent) => {
    if ((e.target as HTMLElement).closest("input, select, textarea")) return;
    if ((e.key === "z" || e.key === "Z") && (e.ctrlKey || e.metaKey)) { e.preventDefault(); undo(); return; }
    if (!selRoom) return;
    const step = e.shiftKey ? 0.5 : 0.1, m: Record<string, [number, number]> = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
    const v = m[e.key];
    if (v) { e.preventDefault(); const r = selRoom; patchRoom(r.id, { x0: Math.round((r.x0 + v[0]) * 100) / 100, x1: Math.round((r.x1 + v[0]) * 100) / 100, z0: Math.round((r.z0 + v[1]) * 100) / 100, z1: Math.round((r.z1 + v[1]) * 100) / 100 }); }
    if (e.key === "Delete" || e.key === "Backspace") { e.preventDefault(); removeRoom(selRoom); }
  };

  const total = L.rooms.filter((r) => r.kind !== "exterieur").reduce((s, r) => s + roomArea(r), 0);
  const outside = L.rooms.filter((r) => r.kind === "exterieur").reduce((s, r) => s + roomArea(r), 0);

  return (
    <div className="absolute inset-0 z-30 flex flex-col bg-bg" role="dialog" aria-modal="true" aria-label="Plan de mon logement" onKeyDown={onKey}>
      {/* Barre d'outils */}
      <div className="border-b border-line bg-surface p-2">
        <div className="flex items-center gap-1.5">
          <h2 className="mr-1 text-[16px] font-bold">Mon plan</h2>
          <span className="ml-auto flex gap-1.5">
            <button type="button" className="btn btn-sm btn-ghost" onClick={close}>Fermer</button>
            <button type="button" className="btn btn-sm btn-primary" onClick={() => onApply(work.layout, work.items)}>Voir en 3D</button>
          </span>
        </div>
        <div className="-mx-2 mt-1.5 flex items-center gap-1.5 overflow-x-auto px-2 pb-0.5 [scrollbar-width:none]">
          <label className="sr-only" htmlFor="modele">Partir d'un modèle</label>
          <select id="modele" className="input h-9 flex-none rounded-full py-0 text-[13px]" style={{ width: 190 }} value="" onChange={(e) => applyTemplate(e.target.value)}>
            <option value="">Partir d'un modèle…</option>
            {TEMPLATES.map((t) => <option key={t.id} value={t.id}>{t.name} ({t.desc})</option>)}
          </select>
          <label className="sr-only" htmlFor="type-piece">Type de pièce à ajouter</label>
          <select id="type-piece" className="input h-9 flex-none rounded-full py-0 text-[13px]" style={{ width: 170 }} value={addKind} onChange={(e) => setAddKind(e.target.value as RoomKind)}>
            {ROOM_KINDS.map((k) => <option key={k.kind} value={k.kind}>{k.label}</option>)}
          </select>
          <button type="button" className="btn btn-sm flex-none" onClick={addRoom}>+ Pièce</button>
          <button type="button" className="btn btn-sm flex-none" onClick={undo} disabled={!past.length}>Annuler</button>
          <button type="button" className="btn btn-sm flex-none px-2.5" aria-label="Dézoomer" onClick={() => setView((v) => ({ ...v, ppm: Math.max(8, v.ppm / 1.25) }))}>−</button>
          <button type="button" className="btn btn-sm flex-none px-2.5" aria-label="Zoomer" onClick={() => setView((v) => ({ ...v, ppm: Math.min(160, v.ppm * 1.25) }))}>+</button>
          <button type="button" className="btn btn-sm flex-none" onClick={() => fit()}>Ajuster</button>
          <label className="btn btn-sm flex-none cursor-pointer">
            <input type="file" accept="image/*,application/pdf" className="sr-only" onChange={(e) => { void importPlan(e.target.files?.[0]); e.target.value = ""; }} />
            Importer mon plan
          </label>
        </div>
      </div>

      <div className="relative flex min-h-0 flex-1 flex-col sm:flex-row">
        {/* Plan */}
        <div ref={box} className="relative min-h-0 flex-1 overflow-hidden bg-[#F7F6F2]" tabIndex={0} aria-label="Plan : glissez une pièce pour la déplacer, ses poignées pour la redimensionner. Flèches pour déplacer la pièce sélectionnée.">
          <svg className="absolute inset-0 h-full w-full touch-none select-none" viewBox={`${vx} ${vz} ${vw} ${vh}`} aria-hidden="true"
            onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp} onWheel={onWheel}>
            <defs>
              <pattern id="g1" width="1" height="1" patternUnits="userSpaceOnUse"><path d="M1 0H0V1" fill="none" stroke="#DDDCD3" strokeWidth={px(1)} /></pattern>
            </defs>
            <rect x={vx} y={vz} width={vw} height={vh} fill="url(#g1)" />
            {trace && <image href={trace.url} x={trace.x} y={trace.z} width={trace.w} height={trace.w * trace.ratio} opacity={trace.op} preserveAspectRatio="none" pointerEvents="none" />}
            {L.rooms.map((r) => {
              const active = sel?.kind === "room" && sel.id === r.id, W = r.x1 - r.x0, D = r.z1 - r.z0;
              return (
                <g key={r.id} data-k="room" data-id={r.id} className="cursor-move">
                  <rect x={r.x0} y={r.z0} width={W} height={D} fill={TINT[r.kind]} stroke={active ? "#2747D0" : "none"} strokeWidth={px(2)} />
                </g>
              );
            })}
            {/* Meubles (emprise au sol) */}
            <g pointerEvents="none">
              {work.items.filter((it) => !CATALOG[it.type].mount && it.type !== "tapis").map((it) => {
                const d = itemDims(it);
                return <rect key={it.id} x={-d.w / 2} y={-d.d / 2} width={d.w} height={d.d} rx={px(2)} transform={`translate(${it.x} ${it.z}) rotate(${(-it.rot * 180) / Math.PI})`}
                  fill="rgba(255,255,255,.55)" stroke="#A3A79D" strokeWidth={px(1)} />;
              })}
            </g>
            {st.walls.map((w, i) => {
              const horiz = w.a[1] === w.b[1], x = Math.min(w.a[0], w.b[0]) - (horiz ? w.thick / 2 : w.thick / 2), z = Math.min(w.a[1], w.b[1]) - w.thick / 2;
              const len = horiz ? w.b[0] - w.a[0] : w.b[1] - w.a[1];
              return (
                <g key={i} pointerEvents="none">
                  <rect x={horiz ? x : w.a[0] - w.thick / 2} y={horiz ? w.a[1] - w.thick / 2 : z} width={horiz ? len + w.thick : w.thick} height={horiz ? w.thick : len + w.thick} fill="#2B2B2B" />
                  {w.openings.map((o, j) => {
                    const s = o.at - o.width / 2, ox = horiz ? w.a[0] + s : w.a[0] - w.thick / 2 - 0.01, oz = horiz ? w.a[1] - w.thick / 2 - 0.01 : w.a[1] + s;
                    const ow = horiz ? o.width : w.thick + 0.02, oh = horiz ? w.thick + 0.02 : o.width;
                    return (
                      <g key={j}>
                        <rect x={ox} y={oz} width={ow} height={oh} fill="#F7F6F2" />
                        {o.kind === "fenetre" || o.kind === "baie" ? <rect x={ox} y={oz} width={ow} height={oh} fill="#CFE3EA" stroke="#5B6E7E" strokeWidth={px(1)} /> : null}
                        {o.kind === "porte" || o.kind === "porte-entree" ? (horiz
                          ? <path d={`M${ox} ${w.a[1]} L${ox} ${w.a[1] + o.width} A${o.width} ${o.width} 0 0 0 ${ox + o.width} ${w.a[1]}`} fill="none" stroke="#5A5650" strokeWidth={px(1)} />
                          : <path d={`M${w.a[0]} ${oz} L${w.a[0] + o.width} ${oz} A${o.width} ${o.width} 0 0 1 ${w.a[0]} ${oz + o.width}`} fill="none" stroke="#5A5650" strokeWidth={px(1)} />) : null}
                      </g>
                    );
                  })}
                </g>
              );
            })}
            {st.railings.map(([a, b], i) => <line key={i} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke="#3B3D3F" strokeWidth={px(2)} strokeDasharray={`${px(6)} ${px(4)}`} pointerEvents="none" />)}
            {/* Noms et surfaces, au-dessus des meubles */}
            <g pointerEvents="none">
              {L.rooms.map((r) => {
                const W = r.x1 - r.x0, D = r.z1 - r.z0, fs = Math.min(px(14), Math.min(W, D) / 5, (W * 0.9) / (Math.max(r.name.length, 12) * 0.56));
                return (
                  <g key={r.id} paintOrder="stroke" stroke="rgba(255,255,255,.85)" strokeWidth={fs * 0.25} strokeLinejoin="round">
                    <text x={r.x0 + W / 2} y={r.z0 + D / 2 - fs * 0.3} textAnchor="middle" fontSize={fs} fontWeight={600} fill="#1B1B1B">{r.name}</text>
                    <text x={r.x0 + W / 2} y={r.z0 + D / 2 + fs * 1.0} textAnchor="middle" fontSize={fs * 0.8} fill="#5A5650">{fmt(W)} × {fmt(D)} m · {fmt(Math.round(roomArea(r) * 10) / 10)} m²</text>
                  </g>
                );
              })}
            </g>
            {/* Ouvertures : zones de sélection et de glissement */}
            {L.openings.map((o) => {
              const a = openingAbs(L, o); if (!a) return null;
              const active = sel?.kind === "opening" && sel.id === o.id, t = 0.32;
              const x = a.horiz ? a.center - o.width / 2 : a.c - t / 2, z = a.horiz ? a.c - t / 2 : a.center - o.width / 2;
              return <rect key={o.id} data-k="opening" data-id={o.id} x={x} y={z} width={a.horiz ? o.width : t} height={a.horiz ? t : o.width} rx={px(3)}
                fill={active ? "rgba(39,71,208,.35)" : "rgba(39,71,208,.06)"} stroke={active ? "#2747D0" : "transparent"} strokeWidth={px(1.5)} className="cursor-grab" />;
            })}
            {/* Poignées de redimensionnement */}
            {selRoom && (["n", "s", "e", "w"] as Side[]).map((s) => {
              const r = selRoom, cx = s === "e" ? r.x1 : s === "w" ? r.x0 : (r.x0 + r.x1) / 2, cz = s === "s" ? r.z1 : s === "n" ? r.z0 : (r.z0 + r.z1) / 2;
              return <circle key={s} data-k="handle" data-id={r.id} data-side={s} cx={cx} cy={cz} r={px(9)} fill="#fff" stroke="#2747D0" strokeWidth={px(2.5)} className={s === "e" || s === "w" ? "cursor-ew-resize" : "cursor-ns-resize"} />;
            })}
            {/* Échelle */}
            <g pointerEvents="none">
              <line x1={vx + px(16)} y1={vz + vh - px(18)} x2={vx + px(16) + 1} y2={vz + vh - px(18)} stroke="#1B1B1B" strokeWidth={px(2)} />
              <text x={vx + px(16)} y={vz + vh - px(24)} fontSize={px(11)} fill="#1B1B1B">1 m</text>
            </g>
          </svg>
          <p className="pointer-events-none absolute bottom-2 right-3 rounded-full bg-surface/90 px-3 py-1 text-[12px] text-muted shadow-sm">
            {fmt(Math.round(total * 10) / 10)} m² habitables{outside ? ` · ${fmt(Math.round(outside))} m² extérieurs` : ""}
          </p>
        </div>

        {/* Panneau */}
        <aside aria-label="Propriétés" className="max-h-[42%] overflow-y-auto border-t border-line bg-surface p-3.5 sm:max-h-none sm:w-[320px] sm:border-l sm:border-t-0">
          {selRoom ? (
            <div className="flex flex-col gap-2.5">
              <h3 className="text-[15px] font-semibold">Pièce</h3>
              <Field label="Nom"><input className="input" value={selRoom.name} maxLength={40} onChange={(e) => patchRoom(selRoom.id, { name: e.target.value })} /></Field>
              <Field label="Type">
                <select className="input" value={selRoom.kind} onChange={(e) => patchRoom(selRoom.id, { kind: e.target.value as RoomKind })}>
                  {ROOM_KINDS.map((k) => <option key={k.kind} value={k.kind}>{k.label}</option>)}
                </select>
              </Field>
              <div className="grid grid-cols-2 gap-2">
                <Num label="Largeur (m)" value={selRoom.x1 - selRoom.x0} min={1} onChange={(v) => patchRoom(selRoom.id, { x1: Math.round((selRoom.x0 + v) * 100) / 100 })} />
                <Num label="Profondeur (m)" value={selRoom.z1 - selRoom.z0} min={1} onChange={(v) => patchRoom(selRoom.id, { z1: Math.round((selRoom.z0 + v) * 100) / 100 })} />
                <Num label="Position gauche (m)" value={selRoom.x0} onChange={(v) => patchRoom(selRoom.id, { x0: v, x1: Math.round((v + selRoom.x1 - selRoom.x0) * 100) / 100, z0: selRoom.z0, z1: selRoom.z1 })} />
                <Num label="Position haut (m)" value={selRoom.z0} onChange={(v) => patchRoom(selRoom.id, { z0: v, z1: Math.round((v + selRoom.z1 - selRoom.z0) * 100) / 100, x0: selRoom.x0, x1: selRoom.x1 })} />
              </div>
              <p className="text-[12.5px] text-muted">{fmt(Math.round(roomArea(selRoom) * 10) / 10)} m². Astuce : faites glisser la pièce contre une autre, elles se collent et partagent une cloison.</p>
              <div className="flex flex-wrap gap-1.5">
                <button type="button" className="btn btn-sm" onClick={() => addOpening(selRoom, "porte")}>+ Porte</button>
                <button type="button" className="btn btn-sm" onClick={() => addOpening(selRoom, "fenetre")}>+ Fenêtre</button>
                <button type="button" className="btn btn-sm" onClick={() => addOpening(selRoom, "passage")}>+ Passage</button>
                <button type="button" className="btn btn-sm" onClick={() => addOpening(selRoom, "baie")}>+ Baie</button>
              </div>
              {L.openings.some((o) => o.roomId === selRoom.id) && (
                <div className="flex flex-wrap gap-1.5">{L.openings.filter((o) => o.roomId === selRoom.id).map((o) => <button key={o.id} type="button" className="chip text-[12px]" onClick={() => setSel({ kind: "opening", id: o.id })}>{OPENING_KINDS.find((k) => k.kind === o.kind)?.label} · {SIDES.find((s) => s.side === o.side)?.label.toLowerCase()}</button>)}</div>
              )}
              <div className="flex flex-wrap gap-1.5 border-t border-line pt-2.5">
                <button type="button" className="btn btn-sm btn-primary" onClick={() => furnish(selRoom)}>Meubler automatiquement</button>
                <button type="button" className="btn btn-sm" onClick={() => duplicateRoom(selRoom)}>Dupliquer</button>
                <button type="button" className="btn btn-sm" onClick={() => removeRoom(selRoom)} disabled={L.rooms.length <= 1}>Supprimer</button>
              </div>
            </div>
          ) : selOpening ? (
            <OpeningPanel o={selOpening} room={room(selOpening.roomId)} onPatch={(g) => patchOpening(selOpening.id, g)}
              onRemove={() => { commit((w) => ({ ...w, layout: { ...w.layout, openings: w.layout.openings.filter((x) => x.id !== selOpening.id) } })); setSel(null); }} />
          ) : (
            <div className="flex flex-col gap-2.5 text-[13.5px]">
              <h3 className="text-[15px] font-semibold">Dessinez votre logement</h3>
              <ol className="ml-4 list-decimal space-y-1 text-muted">
                <li>Importez votre plan (photo, capture ou scan) pour le décalquer, ou partez d'un modèle.</li>
                <li>Saisissez les vraies mesures (largeur, profondeur) ou tirez les poignées.</li>
                <li>Collez les pièces entre elles : les cloisons se créent toutes seules.</li>
                <li>Ajoutez portes et fenêtres, puis « Meubler automatiquement ».</li>
                <li>Cliquez sur « Voir en 3D » pour visiter.</li>
              </ol>
              <h3 className="mt-1 text-[14px] font-semibold">Pièces</h3>
              <div className="flex flex-wrap gap-1.5">{L.rooms.map((r) => <button key={r.id} type="button" className="chip text-[12.5px]" onClick={() => setSel({ kind: "room", id: r.id })}>{r.name}</button>)}</div>
              <button type="button" className="btn btn-sm w-fit" onClick={() => commit((w) => ({ ...w, items: furnishAll(w.layout) }))}>Meubler tout le logement</button>
            </div>
          )}
          {trace && (
            <div className="mt-3 flex flex-col gap-2 border-t border-line pt-3">
              <h3 className="text-[14px] font-semibold">Calque de mon plan</h3>
              <div className="grid grid-cols-2 gap-2">
                <Num label="Largeur réelle (m)" value={trace.w} min={1} onChange={(v) => setTrace({ ...trace, w: Math.max(1, Math.min(80, v)) })} />
                <label className="flex flex-col gap-1 text-[12px] text-muted">Opacité
                  <input type="range" min={0.1} max={1} step={0.05} value={trace.op} onChange={(e) => setTrace({ ...trace, op: Number(e.target.value) })} />
                </label>
                <Num label="Décalage gauche (m)" value={Math.round(trace.x * 100) / 100} onChange={(v) => setTrace({ ...trace, x: v })} />
                <Num label="Décalage haut (m)" value={Math.round(trace.z * 100) / 100} onChange={(v) => setTrace({ ...trace, z: v })} />
              </div>
              <button type="button" className="btn btn-sm w-fit" onClick={() => setTrace(null)}>Retirer le calque</button>
            </div>
          )}
          {traceMsg && <p role="status" className="mt-2 text-[12.5px] text-muted">{traceMsg}</p>}
          {warnings.length > 0 && <ul className="notice mt-3 text-[12.5px]">{warnings.map((w) => <li key={w}>{w}</li>)}</ul>}
          <p className="mt-3 text-[11.5px] text-muted">Mesures indicatives : vérifiez toujours sur place avant tous travaux ou achats. Pour les murs porteurs, consultez un professionnel.</p>
        </aside>
      </div>
    </div>
  );
}

const isH = (s: Side) => s === "n" || s === "s";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="flex flex-col gap-1 text-[12.5px] font-medium">{label}{children}</label>;
}
function Num({ label, value, onChange, min }: { label: string; value: number; onChange: (v: number) => void; min?: number }) {
  const [txt, setTxt] = useState<string | null>(null);
  const shown = txt ?? String(Math.round(value * 100) / 100).replace(".", ",");
  const done = () => {
    if (txt === null) return;
    const v = Number(txt.replace(",", ".").replace(/\s/g, ""));
    if (Number.isFinite(v) && (min === undefined || v >= min) && Math.abs(v) <= 60) onChange(Math.round(v * 100) / 100);
    setTxt(null);
  };
  return (
    <Field label={label}>
      <input className="input" inputMode="decimal" value={shown} onChange={(e) => setTxt(e.target.value)} onBlur={done} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); done(); } }} />
    </Field>
  );
}

function OpeningPanel({ o, room, onPatch, onRemove }: { o: OpeningDef; room: RoomDef | undefined; onPatch: (g: Partial<OpeningDef>) => void; onRemove: () => void }) {
  const Ls = room ? sideLength(room, o.side) : 10;
  return (
    <div className="flex flex-col gap-2.5">
      <h3 className="text-[15px] font-semibold">Ouverture{room ? ` · ${room.name}` : ""}</h3>
      <Field label="Type">
        <select className="input" value={o.kind} onChange={(e) => { const k = OPENING_KINDS.find((x) => x.kind === e.target.value)!; onPatch({ kind: k.kind, width: Math.min(k.width, Ls - 0.2), height: k.height, sill: k.sill }); }}>
          {OPENING_KINDS.map((k) => <option key={k.kind} value={k.kind}>{k.label}</option>)}
        </select>
      </Field>
      <Field label="Mur">
        <select className="input" value={o.side} onChange={(e) => { const s = e.target.value as Side, L2 = room ? sideLength(room, s) : 10; onPatch({ side: s, offset: Math.round(Math.min(L2 - o.width / 2 - 0.05, Math.max(o.width / 2 + 0.05, o.offset)) * 100) / 100 }); }}>
          {SIDES.map((s) => <option key={s.side} value={s.side}>{s.label}</option>)}
        </select>
      </Field>
      <div className="grid grid-cols-2 gap-2">
        <Num label="Centre depuis le coin (m)" value={o.offset} min={0} onChange={(v) => onPatch({ offset: Math.min(Ls - o.width / 2 - 0.05, Math.max(o.width / 2 + 0.05, v)) })} />
        <Num label="Largeur (m)" value={o.width} min={0.3} onChange={(v) => onPatch({ width: Math.min(v, Ls - 0.1) })} />
        <Num label="Hauteur (m)" value={o.height} min={0.3} onChange={(v) => onPatch({ height: Math.min(v, 2.5 - o.sill) })} />
        {(o.kind === "fenetre") && <Num label="Allège (m)" value={o.sill} min={0} onChange={(v) => onPatch({ sill: Math.min(v, 2.0) })} />}
      </div>
      <p className="text-[12.5px] text-muted">Faites glisser l'ouverture le long du mur pour la déplacer.</p>
      <button type="button" className="btn btn-sm w-fit" onClick={onRemove}>Supprimer l'ouverture</button>
    </div>
  );
}
