"use client";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { materialById } from "@/content/lookup";
import { STYLES } from "@/content/styles";
import { openCamille } from "@/lib/camille-bus";
import type { HomeEngine, Mode, Selection } from "@/lib/home3d/engine";
import {
  CATALOG, CATEGORIES, COLORS, FABRICS, FLOOR_MATERIALS_IN, FLOOR_MATERIALS_OUT, PAINTS, PSEUDO_MATERIALS, STORAGE_KEY, STRUCTURES, WALL_MATERIALS,
  decodeState, defaultRoomStyle, defaultState, encodeState, itemDims, parseState, roomArea, syncRoomStyles,
  type HomeState, type Item, type ItemType, type Layout, type Note, type RoomDef, type RoomStyle,
} from "@/lib/home3d/plan";
import { roomAt as roomAtL, viewpoint } from "@/lib/home3d/layout";
import PlanEditor from "./PlanEditor";
import { ITEM_TIPS, ROOM_TIPS } from "@/lib/home3d/tips";
import { IconClose } from "../icons";

type Panel = null | "ajouter" | "astuces";
const uid = (p: string) => `${p}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
const matName = (id: string | undefined) => (id ? materialById.get(id)?.name ?? PSEUDO_MATERIALS[id]?.name ?? id : "");
const matDot = (id: string) => materialById.get(id)?.colors[0] ?? PSEUDO_MATERIALS[id]?.colors[0] ?? "#ccc";
const cm = (m: number) => `${Math.round(m * 100)} cm`;

const NO_ROOM: RoomDef = { id: "", name: "Pièce", kind: "salon", x0: 0, z0: 0, x1: 1, z1: 1 };

function loadLocal(): HomeState | null {
  try { const raw = localStorage.getItem(STORAGE_KEY); return raw ? parseState(JSON.parse(raw)) : null; } catch { return null; }
}

export default function Visite3D() {
  const box = useRef<HTMLDivElement>(null);
  const engine = useRef<HomeEngine | null>(null);
  const pendingSelect = useRef<Selection | null>(null);
  const [state, setState] = useState<HomeState | null>(null);
  const [sel, setSel] = useState<Selection | null>(null);
  const [room, setRoom] = useState("salon");
  const [mode, setMode] = useState<Mode>("visite");
  const [panel, setPanel] = useState<Panel>(null);
  const [roomPanel, setRoomPanel] = useState(false);
  const [toast, setToast] = useState("");
  const [status, setStatus] = useState<"chargement" | "pret" | "erreur">("chargement");
  const [hint, setHint] = useState(false);
  const [coarse, setCoarse] = useState(false);
  const [more, setMore] = useState(false);
  const [draft, setDraft] = useState("");
  const [pendingNote, setPendingNote] = useState<string | null>(null);
  const [planOpen, setPlanOpen] = useState(false);
  const pendingNoteRef = useRef<string | null>(null);
  useEffect(() => { pendingNoteRef.current = pendingNote; }, [pendingNote]);

  const say = useCallback((t: string) => { setToast(t); window.setTimeout(() => setToast((c) => (c === t ? "" : c)), 3200); }, []);

  /* Démarrage : plan partagé (#plan=…), sinon sauvegarde locale, sinon appartement d'exemple. Le moteur 3D est chargé ensuite. */
  useEffect(() => {
    let alive = true;
    void (async () => {
      const hash = window.location.hash.match(/plan=([\w.-]+)/)?.[1];
      let initial: HomeState | null = null, shared = false;
      if (hash) { initial = await decodeState(hash); shared = !!initial; }
      initial ??= loadLocal() ?? defaultState();
      if (!alive) return;
      setState(initial);
      setCoarse(window.matchMedia("(pointer: coarse)").matches);
      try { setHint(localStorage.getItem("pr_home3d_hint") !== "1"); } catch { setHint(true); }
      if (shared) say("Plan partagé chargé. Vos modifications restent sur votre appareil.");
      try {
        const { HomeEngine } = await import("@/lib/home3d/engine");
        if (!alive || !box.current) return;
        const quality = window.matchMedia("(pointer: coarse)").matches || (navigator.hardwareConcurrency ?? 4) < 4 ? "standard" : "haute";
        engine.current = new HomeEngine(box.current, initial, {
          onSelect: (s) => { setSel(s); if (s) { setPanel(null); setRoomPanel(false); } },
          onRoom: (r) => setRoom(r),
          onItemMoved: (id, x, z) => setState((st) => st && { ...st, items: st.items.map((i) => (i.id === id ? { ...i, x, z } : i)) }),
          onNotePlaced: (p) => {
            const text = pendingNoteRef.current; setPendingNote(null);
            if (!text) return;
            const note: Note = { id: uid("n"), roomId: p.roomId, x: p.x, y: p.y, z: p.z, text, at: new Date().toISOString() };
            setState((st) => st && { ...st, notes: [...st.notes, note] });
            say("Astuce épinglée.");
          },
          onModeChange: (m) => setMode(m),
        }, { quality });
        setStatus("pret");
      } catch {
        if (alive) setStatus("erreur");
      }
    })();
    return () => { alive = false; engine.current?.dispose(); engine.current = null; };
  }, [say]);

  /* Chaque modification : moteur mis à jour et sauvegarde locale. */
  useEffect(() => {
    if (!state) return;
    const e = engine.current;
    if (e) {
      e.setState(state);
      if (pendingSelect.current) { e.select(pendingSelect.current); pendingSelect.current = null; }
    }
    const t = window.setTimeout(() => { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch { /* stockage plein ou bloqué */ } }, 300);
    return () => window.clearTimeout(t);
  }, [state, status]);

  const update = (fn: (s: HomeState) => HomeState) => setState((s) => (s ? fn(s) : s));
  const patchItem = (id: string, p: Partial<Item>) => update((s) => ({ ...s, items: s.items.map((i) => (i.id === id ? { ...i, ...p } : i)) }));
  const roomOf = (id: string) => state?.layout.rooms.find((r) => r.id === id);
  const roomAt = (x: number, z: number) => (state ? roomAtL(state.layout, x, z) : undefined);
  const patchRoom = (rid: string, p: Partial<RoomStyle>) => update((s) => ({ ...s, rooms: { ...s.rooms, [rid]: { ...(s.rooms[rid] ?? defaultRoomStyle(s.layout.rooms.find((r) => r.id === rid)?.kind ?? "salon")), ...p } } }));
  const applyPlan = (layout: Layout, items: Item[]) => {
    engine.current?.select(null); setSel(null);
    update((s) => ({ ...s, layout, items, rooms: syncRoomStyles(layout, s.rooms) }));
    setPlanOpen(false);
    const first = layout.rooms.find((r) => r.kind !== "exterieur") ?? layout.rooms[0];
    if (first) window.setTimeout(() => { engine.current?.teleport(first.id, false); setRoom(first.id); }, 50);
    say("Plan appliqué : bonne visite !");
  };

  const addItem = (type: ItemType) => {
    const e = engine.current; if (!e) return;
    const sp = e.spawnPoint();
    const it: Item = { id: uid("i"), type, x: sp.x, z: sp.z, rot: sp.rot };
    pendingSelect.current = { kind: "item", id: it.id };
    update((s) => ({ ...s, items: [...s.items, it] }));
    setPanel(null);
    say(`Ajouté : ${CATALOG[type].label.toLowerCase()}. Faites-le glisser pour le placer.`);
  };
  const removeItem = (id: string) => { update((s) => ({ ...s, items: s.items.filter((i) => i.id !== id) })); engine.current?.select(null); };
  const duplicate = (it: Item) => {
    const copy = { ...it, id: uid("i"), x: Math.round((it.x + 0.5) * 20) / 20, z: Math.round((it.z + 0.5) * 20) / 20 };
    pendingSelect.current = { kind: "item", id: copy.id };
    update((s) => ({ ...s, items: [...s.items, copy] }));
  };

  const applyStyle = (rid: string, styleId: string) => {
    const st = STYLES.find((s) => s.id === styleId); const r = roomOf(rid);
    if (!st || !r) return;
    const floors = r.kind === "exterieur" ? FLOOR_MATERIALS_OUT : FLOOR_MATERIALS_IN;
    const floor = st.materials.find((m) => floors.includes(m));
    const structure = st.materials.find((m) => STRUCTURES.includes(m));
    const fabric = st.materials.find((m) => FABRICS.includes(m));
    const accents = st.palette.slice(1);
    let k = 0;
    update((s) => ({
      ...s,
      rooms: { ...s.rooms, [rid]: { wall: { kind: "peinture", hex: st.palette[0] }, floor: floor ?? (s.rooms[rid] ?? defaultRoomStyle(r.kind)).floor } },
      items: s.items.map((i) => {
        if (roomAtL(s.layout, i.x, i.z)?.id !== rid) return i;
        const e = CATALOG[i.type], p: Partial<Item> = {};
        if (e.color) p.color = accents[k++ % accents.length];
        if (e.structure && structure) p.structure = structure;
        if (e.fabric && fabric) p.fabric = fabric;
        return { ...i, ...p };
      }),
    }));
    say(`Style ${st.name} appliqué : ${r.name.toLowerCase()}.`);
  };

  const share = async () => {
    if (!state) return;
    const url = `${window.location.origin}/visite-3d/#plan=${await encodeState(state)}`;
    try {
      if (navigator.share && coarse) { await navigator.share({ title: "Mon intérieur en 3D", url }); return; }
      await navigator.clipboard.writeText(url); say("Lien copié : envoyez-le, votre plan s'ouvrira tel quel.");
    } catch { say("Copie impossible : autorisez le presse-papiers et réessayez."); }
  };
  const photo = () => {
    const e = engine.current; if (!e) return;
    const a = document.createElement("a"); a.href = e.capture(); a.download = `piece-revee-${room}.png`; a.click();
  };
  const reset = () => {
    if (!window.confirm("Revenir à l'appartement d'origine ? Vos modifications seront effacées.")) return;
    engine.current?.select(null); setState(defaultState()); say("Appartement réinitialisé.");
    if (window.location.hash) history.replaceState(null, "", window.location.pathname);
  };
  const go = (rid: string) => { engine.current?.teleport(rid); setRoom(rid); };
  const switchMode = (m: Mode) => { engine.current?.setMode(m); setMode(m); };
  const dismissHint = () => { setHint(false); try { localStorage.setItem("pr_home3d_hint", "1"); } catch { /* ignoré */ } };
  const startPin = (text: string) => {
    const t = text.trim(); if (t.length < 3) { say("Écrivez votre astuce (3 caractères au moins)."); return; }
    setPendingNote(t); setDraft(""); setPanel(null); engine.current?.select(null);
    engine.current?.setNotePlacement(true); say("Touchez l'endroit de la pièce où épingler votre astuce.");
  };
  const addNoteHere = (text: string) => {
    const t = text.trim(); if (t.length < 3) { say("Écrivez votre astuce (3 caractères au moins)."); return; }
    const r = roomOf(room); if (!r || !state) return;
    const { spawn, look } = viewpoint(state.layout, r), d = Math.hypot(look[0] - spawn[0], look[1] - spawn[1]) || 1;
    update((s) => ({ ...s, notes: [...s.notes, { id: uid("n"), roomId: room, x: spawn[0] + ((look[0] - spawn[0]) / d) * 0.9, y: 2.1, z: spawn[1] + ((look[1] - spawn[1]) / d) * 0.9, text: t, at: new Date().toISOString() }] }));
    setDraft(""); say("Astuce ajoutée à la pièce.");
  };

  const currentRoom = roomOf(room) ?? state?.layout.rooms[0] ?? NO_ROOM;
  const selItem = sel?.kind === "item" ? state?.items.find((i) => i.id === sel.id) : undefined;
  const selNote = sel?.kind === "note" ? state?.notes.find((n) => n.id === sel.id) : undefined;
  const editRoomId = sel?.kind === "wall" || sel?.kind === "room" ? sel.roomId : roomPanel ? room : null;
  const sheetOpen = !!(selItem || selNote || editRoomId || panel);
  const close = () => { engine.current?.select(null); setSel(null); setPanel(null); setRoomPanel(false); };

  return (
    <section aria-label="Visite 3D" className="relative -mx-4 overflow-hidden border-y border-line bg-soft sm:mx-0 sm:rounded-[var(--r-l,20px)] sm:border" style={{ height: "max(460px, calc(100dvh - 190px))" }}>
      <div ref={box} className="absolute inset-0" tabIndex={-1} />
      <p id="aide-3d" className="sr-only">Visite en trois dimensions d'un appartement. Utilisez les boutons des pièces pour vous déplacer, le bouton Pièce pour changer murs et sols, et Ajouter pour placer un meuble. Tous les réglages sont accessibles au clavier.</p>

      {status === "chargement" && <div className="absolute inset-0 grid place-items-center text-sm text-muted"><span><span className="spinner" /> Chargement de la 3D…</span></div>}
      {status === "erreur" && (
        <div className="absolute inset-0 grid place-items-center p-6 text-center">
          <div className="panel max-w-md"><h2 className="text-xl">La 3D ne peut pas s'afficher</h2><p className="mt-2 text-sm text-muted">Votre navigateur ou votre appareil ne prend pas en charge WebGL, ou il est désactivé. Essayez avec un navigateur récent (Chrome, Firefox, Safari, Edge).</p><Link href="/galerie/" className="btn btn-primary mt-4">Voir la galerie à la place</Link></div>
        </div>
      )}

      {/* Barre du haut : pièces et mode */}
      <div className="pointer-events-none absolute inset-x-0 top-0 flex flex-col gap-2 p-2.5 sm:p-3">
        <div className="pointer-events-auto flex items-center gap-2">
          <h1 className="m-0 rounded-full bg-surface/90 px-3 py-1.5 font-display text-[15px] font-bold shadow-sm">Visite 3D</h1>
          <div role="group" aria-label="Mode d'affichage" className="flex rounded-full border border-line bg-surface p-0.5 shadow-sm">
            <button type="button" className="chip border-0" aria-pressed={mode === "visite"} onClick={() => switchMode("visite")}>Visite</button>
            <button type="button" className="chip border-0" aria-pressed={mode === "plan"} onClick={() => switchMode("plan")}>Vue d'ensemble</button>
          </div>
          <button type="button" className="btn btn-sm btn-dark shadow-sm" onClick={() => { close(); setPlanOpen(true); }} disabled={!state}>Mon plan</button>
        </div>
        <nav aria-label="Pièces" className="pointer-events-auto -mx-2.5 flex gap-1.5 overflow-x-auto px-2.5 pb-1 [scrollbar-width:none]">
          {(state?.layout.rooms ?? []).map((r) => <button key={r.id} type="button" className="chip flex-none shadow-sm" aria-current={room === r.id && mode === "visite" ? "page" : undefined} onClick={() => go(r.id)}>{r.name}</button>)}
        </nav>
      </div>

      {/* Actions (sur mobile, les moins utilisées sont regroupées dans « Plus ») */}
      <div className={`absolute right-2.5 top-[96px] flex flex-col items-end gap-1.5 ${sheetOpen ? "sm:right-[384px]" : "sm:right-3"}`}>
        <button type="button" className="btn btn-sm btn-primary shadow-sm" onClick={() => { close(); setPanel("ajouter"); }}>+ Ajouter</button>
        <button type="button" className="btn btn-sm shadow-sm" onClick={() => { close(); setRoomPanel(true); }}>Pièce</button>
        <button type="button" className="btn btn-sm shadow-sm" onClick={() => { close(); setPanel("astuces"); }}>Astuces{state && state.notes.length > 0 ? ` (${state.notes.length})` : ""}</button>
        <button type="button" className="btn btn-sm shadow-sm sm:hidden" aria-expanded={more} onClick={() => setMore((v) => !v)}>{more ? "Moins" : "Plus"}</button>
        <div className={`${more ? "flex" : "hidden"} flex-col items-end gap-1.5 sm:flex`}>
          <button type="button" className="btn btn-sm shadow-sm" onClick={() => void share()}>Partager</button>
          <button type="button" className="btn btn-sm shadow-sm" onClick={photo}>Photo</button>
          <button type="button" className="btn btn-sm btn-ghost bg-surface/70" onClick={reset}>Réinitialiser</button>
        </div>
      </div>

      {hint && status === "pret" && (
        <div className="absolute inset-x-3 bottom-3 mx-auto max-w-md sm:bottom-4">
          <div className="panel shadow-xl">
            <p className="text-sm"><b>Bienvenue chez vous.</b> {coarse ? "Glissez un doigt pour regarder, touchez le sol pour avancer ou utilisez le joystick." : "Glissez la souris pour regarder, avancez avec les flèches ou ZQSD, ou cliquez sur le sol."} Touchez un meuble, un mur ou un sol pour le modifier ; faites glisser un meuble sélectionné pour le déplacer.</p>
            <button type="button" className="btn btn-sm btn-primary mt-3" onClick={dismissHint}>C'est parti</button>
          </div>
        </div>
      )}

      {coarse && mode === "visite" && status === "pret" && !sheetOpen && !hint && <Joystick onChange={(x, y) => engine.current?.setJoystick(x, y)} />}

      {pendingNote && <div className="absolute inset-x-0 top-[96px] mx-auto w-fit rounded-full bg-ink px-4 py-2 text-sm text-bg shadow-lg">Touchez l'endroit où épingler votre astuce <button type="button" className="ml-2 underline" onClick={() => { setPendingNote(null); engine.current?.setNotePlacement(false); }}>Annuler</button></div>}

      {/* Panneau contextuel */}
      {sheetOpen && state && (
        <aside aria-label="Réglages" className="absolute inset-x-0 bottom-0 max-h-[62%] overflow-y-auto rounded-t-[20px] border-t border-line bg-surface p-4 shadow-2xl sm:inset-x-auto sm:bottom-3 sm:right-3 sm:top-3 sm:max-h-none sm:w-[360px] sm:rounded-[18px] sm:border">
          <button type="button" className="btn btn-sm btn-ghost absolute right-2 top-2" aria-label="Fermer le panneau" onClick={close}><IconClose width={16} height={16} /></button>
          {selItem && <ItemEditor it={selItem} size={itemDims(selItem)} roomName={roomAt(selItem.x, selItem.z)?.name ?? ""}
            onPatch={(p) => patchItem(selItem.id, p)} onRemove={() => removeItem(selItem.id)} onDuplicate={() => duplicate(selItem)} />}
          {selNote && (
            <div>
              <h2 className="pr-8 text-lg">Astuce épinglée</h2>
              <p className="mt-2 whitespace-pre-wrap">{selNote.text}</p>
              <p className="mt-1 text-[12.5px] text-muted">Vous · {new Date(selNote.at).toLocaleDateString("fr-FR")} · {roomOf(selNote.roomId)?.name}</p>
              <button type="button" className="btn btn-sm mt-3" onClick={() => { update((s) => ({ ...s, notes: s.notes.filter((n) => n.id !== selNote.id) })); close(); }}>Supprimer l'astuce</button>
            </div>
          )}
          {editRoomId && <RoomEditor roomId={editRoomId} state={state} onPatch={(p) => patchRoom(editRoomId, p)} onStyle={(sid) => applyStyle(editRoomId, sid)}
            onSelectItem={(id) => engine.current?.select({ kind: "item", id })} onEditPlan={() => { close(); setPlanOpen(true); }} />}
          {panel === "ajouter" && <Catalog roomKind={currentRoom.kind} onAdd={addItem} />}
          {panel === "astuces" && (
            <div>
              <h2 className="pr-8 text-lg">Astuces : {currentRoom.name.toLowerCase()}</h2>
              <ul className="mt-3 flex flex-col gap-3">
                {ROOM_TIPS[currentRoom.kind].map((t) => <li key={t.title} className="rounded-xl bg-soft p-3"><b className="text-[14px]">{t.title}</b><p className="mt-1 text-[13.5px] text-muted">{t.text}{t.link && <> <Link href={t.link.href}>{t.link.label}</Link></>}</p></li>)}
              </ul>
              <h3 className="mt-5 text-[15px] font-semibold">Vos astuces</h3>
              {state.notes.length === 0 ? <p className="mt-1 text-[13.5px] text-muted">Aucune pour l'instant. Partagez la vôtre : un rangement malin, une couleur qui marche, une erreur à éviter.</p> : (
                <ul className="mt-2 flex flex-col gap-2">{state.notes.map((n) => <li key={n.id}><button type="button" className="w-full cursor-pointer rounded-xl border border-line bg-surface p-2.5 text-left text-[13.5px]" onClick={() => { go(n.roomId); engine.current?.select({ kind: "note", id: n.id }); }}><span className="text-muted">{roomOf(n.roomId)?.name} · </span>{n.text}</button></li>)}</ul>
              )}
              <label htmlFor="astuce" className="mt-4 block text-[13.5px] font-semibold">Partager une astuce</label>
              <textarea id="astuce" className="input mt-1 min-h-20" maxLength={500} value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Ex. : un rideau tringlé au ras du plafond agrandit la hauteur." />
              <div className="mt-2 flex flex-wrap gap-2">
                <button type="button" className="btn btn-sm btn-primary" onClick={() => startPin(draft)}>Épingler dans la 3D</button>
                <button type="button" className="btn btn-sm" onClick={() => addNoteHere(draft)}>Ajouter à la pièce</button>
              </div>
              <p className="mt-2 text-[12px] text-muted">En démonstration, vos astuces restent sur cet appareil et dans les liens que vous partagez. Le partage avec la communauté, modéré, arrivera avec les comptes.</p>
              <button type="button" className="btn btn-sm mt-3" onClick={() => openCamille(`Quelles sont vos meilleures astuces pour aménager ${currentRoom.kind === "exterieur" ? "une terrasse" : `un(e) ${currentRoom.name.toLowerCase()}`} ?`, { step: "visite-3d" })}>Demander à Camille</button>
            </div>
          )}
        </aside>
      )}

      {planOpen && state && <PlanEditor layout={state.layout} items={state.items} onApply={applyPlan} onCancel={() => setPlanOpen(false)} />}

      <div role="status" aria-live="polite" className={`pointer-events-none absolute left-1/2 top-[60px] -translate-x-1/2 rounded-full bg-ink px-4 py-2 text-[13px] text-bg shadow-lg transition-opacity ${toast ? "opacity-100" : "opacity-0"}`}>{toast}</div>
    </section>
  );
}

/* ——————————————— Éditeurs ——————————————— */
function Swatch({ hex, name, active, onClick }: { hex: string; name: string; active: boolean; onClick: () => void }) {
  return <button type="button" title={name} aria-label={name} aria-pressed={active} onClick={onClick}
    className={`h-8 w-8 cursor-pointer rounded-full border-2 ${active ? "border-accent ring-2 ring-accent/30" : "border-line"}`} style={{ background: hex }} />;
}
function MatChip({ id, active, onClick }: { id: string; active: boolean; onClick: () => void }) {
  return <button type="button" className="chip text-[12.5px]" aria-pressed={active} onClick={onClick}><i aria-hidden="true" className="inline-block h-3 w-3 rounded-full border border-black/10" style={{ background: matDot(id) }} />{matName(id)}</button>;
}

function ItemEditor({ it, size, roomName, onPatch, onRemove, onDuplicate }: { it: Item; size: { w: number; d: number; h: number }; roomName: string; onPatch: (p: Partial<Item>) => void; onRemove: () => void; onDuplicate: () => void }) {
  const e = CATALOG[it.type];
  const color = it.color ?? e.color, fabric = it.fabric ?? e.fabric, structure = it.structure ?? e.structure;
  const tip = ITEM_TIPS[it.type];
  return (
    <div>
      <h2 className="pr-8 text-lg">{e.label}{it.variant ? ` · ${it.variant}` : ""}</h2>
      <p className="text-[12.5px] text-muted">{roomName} · L {cm(size.w)} × P {cm(size.d)} × H {cm(size.h)}</p>
      {e.variants && <><h3 className="mt-4 text-[13.5px] font-semibold">Modèle</h3><div className="mt-1.5 flex flex-wrap gap-1.5">{e.variants.map((v) => <button key={v} type="button" className="chip text-[12.5px]" aria-pressed={(it.variant ?? e.variants![0]) === v} onClick={() => onPatch({ variant: v })}>{v}</button>)}</div></>}
      {e.color && <>
        <h3 className="mt-4 text-[13.5px] font-semibold">Couleur</h3>
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          {COLORS.map((c) => <Swatch key={c.hex} hex={c.hex} name={c.name} active={color?.toLowerCase() === c.hex.toLowerCase()} onClick={() => onPatch({ color: c.hex })} />)}
          <label className="relative h-8 w-8 cursor-pointer overflow-hidden rounded-full border-2 border-dashed border-line" title="Couleur personnalisée">
            <span className="sr-only">Couleur personnalisée</span>
            <input type="color" value={color ?? "#cccccc"} onChange={(ev) => onPatch({ color: ev.target.value })} className="absolute inset-0 h-full w-full cursor-pointer opacity-0" />
            <span aria-hidden="true" className="grid h-full place-items-center text-[15px] text-muted">+</span>
          </label>
        </div>
      </>}
      {e.fabric && <><h3 className="mt-4 text-[13.5px] font-semibold">Tissu</h3><div className="mt-1.5 flex flex-wrap gap-1.5">{FABRICS.map((f) => <MatChip key={f} id={f} active={fabric === f} onClick={() => onPatch({ fabric: f })} />)}</div></>}
      {e.structure && <><h3 className="mt-4 text-[13.5px] font-semibold">{it.type === "cuisine" || it.type === "ilot" || it.type === "meuble-vasque" ? "Plan de travail" : "Matière"}</h3><div className="mt-1.5 flex flex-wrap gap-1.5">{STRUCTURES.map((s) => <MatChip key={s} id={s} active={structure === s} onClick={() => onPatch({ structure: s })} />)}</div></>}
      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" className="btn btn-sm" onClick={() => onPatch({ rot: it.rot + Math.PI / 4 })}>Tourner</button>
        <button type="button" className="btn btn-sm" onClick={onDuplicate}>Dupliquer</button>
        <button type="button" className="btn btn-sm" onClick={onRemove}>Supprimer</button>
      </div>
      <div className="mt-2 grid w-fit grid-cols-3 gap-1" role="group" aria-label="Déplacer de 10 cm">
        <span /><button type="button" className="btn btn-sm px-2" aria-label="Déplacer vers le haut du plan" onClick={() => onPatch({ z: Math.round((it.z - 0.1) * 20) / 20 })}>↑</button><span />
        <button type="button" className="btn btn-sm px-2" aria-label="Déplacer vers la gauche" onClick={() => onPatch({ x: Math.round((it.x - 0.1) * 20) / 20 })}>←</button>
        <button type="button" className="btn btn-sm px-2" aria-label="Déplacer vers le bas du plan" onClick={() => onPatch({ z: Math.round((it.z + 0.1) * 20) / 20 })}>↓</button>
        <button type="button" className="btn btn-sm px-2" aria-label="Déplacer vers la droite" onClick={() => onPatch({ x: Math.round((it.x + 0.1) * 20) / 20 })}>→</button>
      </div>
      <p className="mt-2 text-[12.5px] text-muted">Astuce : faites glisser l'objet sélectionné directement dans la 3D.</p>
      {tip && <p className="notice mt-4 text-[13.5px]"><b>Le bon repère.</b> {tip}</p>}
      <button type="button" className="btn btn-sm mt-3" onClick={() => openCamille(`Comment bien choisir et placer ${e.label.toLowerCase()} dans ${roomName ? `la pièce « ${roomName} »` : "ma pièce"} ?`, { step: "visite-3d" })}>Demander à Camille</button>
    </div>
  );
}

function RoomEditor({ roomId, state, onPatch, onStyle, onSelectItem, onEditPlan }: { roomId: string; state: HomeState; onPatch: (p: Partial<RoomStyle>) => void; onStyle: (id: string) => void; onSelectItem: (id: string) => void; onEditPlan: () => void }) {
  const r = state.layout.rooms.find((x) => x.id === roomId) ?? NO_ROOM; const st = state.rooms[roomId] ?? defaultRoomStyle(r.kind);
  const outdoor = r.kind === "exterieur";
  const floors = outdoor ? FLOOR_MATERIALS_OUT : FLOOR_MATERIALS_IN;
  const styles = useMemo(() => STYLES.filter((s) => s.scope === (outdoor ? "exterieur" : "interieur")), [outdoor]);
  const items = state.items.filter((i) => roomAtL(state.layout, i.x, i.z)?.id === roomId);
  const floorMat = materialById.get(st.floor);
  return (
    <div>
      <h2 className="pr-8 text-lg">{r.name}</h2>
      <p className="text-[12.5px] text-muted">{(r.x1 - r.x0).toFixed(2).replace(".", ",")} × {(r.z1 - r.z0).toFixed(2).replace(".", ",")} m · {roomArea(r).toFixed(1).replace(".", ",")} m² · {items.length} objet{items.length > 1 ? "s" : ""}</p>
      <button type="button" className="btn btn-sm mt-2" onClick={onEditPlan}>Modifier les dimensions, portes et fenêtres</button>
      <h3 className="mt-4 text-[13.5px] font-semibold">Appliquer un style</h3>
      <div className="mt-1.5 flex flex-wrap gap-1.5">{styles.map((s) => <button key={s.id} type="button" className="chip text-[12.5px]" onClick={() => onStyle(s.id)}><i aria-hidden="true" className="inline-flex">{s.palette.slice(0, 3).map((c) => <i key={c} className="inline-block h-3 w-2" style={{ background: c }} />)}</i>{s.name}</button>)}</div>
      <h3 className="mt-4 text-[13.5px] font-semibold">{outdoor ? "Façade" : "Murs"} : peinture</h3>
      <div className="mt-1.5 flex flex-wrap gap-1.5">{PAINTS.map((p) => <Swatch key={p.hex} hex={p.hex} name={p.name} active={st.wall.kind === "peinture" && st.wall.hex.toLowerCase() === p.hex.toLowerCase()} onClick={() => onPatch({ wall: { kind: "peinture", hex: p.hex } })} />)}</div>
      <h3 className="mt-3 text-[13.5px] font-semibold">{outdoor ? "Façade" : "Murs"} : matière</h3>
      <div className="mt-1.5 flex flex-wrap gap-1.5">{WALL_MATERIALS.map((m) => <MatChip key={m} id={m} active={st.wall.kind === "matiere" && st.wall.id === m} onClick={() => onPatch({ wall: { kind: "matiere", id: m } })} />)}</div>
      <h3 className="mt-4 text-[13.5px] font-semibold">Sol</h3>
      <div className="mt-1.5 flex flex-wrap gap-1.5">{floors.map((m) => <MatChip key={m} id={m} active={st.floor === m} onClick={() => onPatch({ floor: m })} />)}</div>
      {floorMat && <p className="mt-2 text-[12.5px] text-muted">{floorMat.name} : {floorMat.priceRange}, à titre indicatif. <Link href={`/matieres/${floorMat.slug}/`}>Voir la fiche</Link></p>}
      {items.length > 0 && <>
        <h3 className="mt-4 text-[13.5px] font-semibold">Objets de la pièce</h3>
        <div className="mt-1.5 flex flex-wrap gap-1.5">{items.map((i) => <button key={i.id} type="button" className="chip text-[12.5px]" onClick={() => onSelectItem(i.id)}>{CATALOG[i.type].label}</button>)}</div>
      </>}
      <h3 className="mt-4 text-[13.5px] font-semibold">Astuces</h3>
      <ul className="mt-1.5 flex flex-col gap-2">{ROOM_TIPS[r.kind].slice(0, 2).map((t) => <li key={t.title} className="text-[13px]"><b>{t.title}.</b> <span className="text-muted">{t.text}</span></li>)}</ul>
    </div>
  );
}

function Catalog({ roomKind, onAdd }: { roomKind: string; onAdd: (t: ItemType) => void }) {
  const order = roomKind === "exterieur" ? ["Extérieur", ...CATEGORIES.filter((c) => c !== "Extérieur")] : CATEGORIES;
  return (
    <div>
      <h2 className="pr-8 text-lg">Ajouter un objet</h2>
      <p className="text-[12.5px] text-muted">Il apparaît devant vous ; faites-le glisser pour le placer.</p>
      {order.map((c) => (
        <div key={c} className="mt-3">
          <h3 className="text-[13.5px] font-semibold">{c}</h3>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {(Object.keys(CATALOG) as ItemType[]).filter((t) => CATALOG[t].category === c).map((t) => <button key={t} type="button" className="chip text-[12.5px]" onClick={() => onAdd(t)}>{CATALOG[t].label}</button>)}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ——————————————— Joystick tactile ——————————————— */
function Joystick({ onChange }: { onChange: (x: number, y: number) => void }) {
  const [knob, setKnob] = useState({ x: 0, y: 0 });
  const base = useRef<HTMLDivElement>(null);
  const R = 46;
  const move = (e: React.PointerEvent) => {
    const r = base.current!.getBoundingClientRect();
    let dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
    const d = Math.hypot(dx, dy); if (d > R) { dx = (dx / d) * R; dy = (dy / d) * R; }
    setKnob({ x: dx, y: dy }); onChange(dx / R, -dy / R);
  };
  const end = () => { setKnob({ x: 0, y: 0 }); onChange(0, 0); };
  return (
    <div ref={base} aria-hidden="true" className="absolute bottom-5 left-5 h-[120px] w-[120px] touch-none rounded-full border border-white/60 bg-black/15 backdrop-blur-sm"
      onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); move(e); }} onPointerMove={(e) => { if (e.buttons || e.pointerType === "touch") move(e); }} onPointerUp={end} onPointerCancel={end}>
      <div className="absolute left-1/2 top-1/2 h-12 w-12 rounded-full bg-white/85 shadow-md" style={{ transform: `translate(calc(-50% + ${knob.x}px), calc(-50% + ${knob.y}px))` }} />
    </div>
  );
}
