/**
 * Plan du logement : pièces rectangulaires (vraies mesures, en mètres) et ouvertures rattachées à un côté de pièce.
 * Les murs, cloisons et garde-corps sont déduits automatiquement : deux pièces qui se touchent partagent une cloison,
 * une pièce qui donne sur l'extérieur a un mur de façade, un extérieur qui ne touche rien est bordé d'un garde-corps.
 * Axes : x vers l'est (droite du plan), z vers le sud (bas du plan).
 */

export const WALL_H = 2.6;
export const EYE_H = 1.6;

export type RoomKind = "salon" | "cuisine" | "chambre" | "sdb" | "entree" | "exterieur";
export const ROOM_KINDS: Array<{ kind: RoomKind; label: string }> = [
  { kind: "salon", label: "Séjour" }, { kind: "cuisine", label: "Cuisine" }, { kind: "chambre", label: "Chambre ou bureau" },
  { kind: "sdb", label: "Salle d'eau ou WC" }, { kind: "entree", label: "Entrée ou dégagement" }, { kind: "exterieur", label: "Extérieur (terrasse, balcon, jardin)" },
];

export interface RoomDef {
  id: string; name: string; kind: RoomKind;
  x0: number; z0: number; x1: number; z1: number;
  /** Point de vue de départ (facultatif : calculé sinon). */
  spawn?: [number, number]; look?: [number, number];
}

export type Side = "n" | "s" | "e" | "w";
export const SIDES: Array<{ side: Side; label: string }> = [{ side: "n", label: "Haut du plan" }, { side: "s", label: "Bas du plan" }, { side: "w", label: "Gauche" }, { side: "e", label: "Droite" }];
export type OpeningKind = "porte" | "passage" | "fenetre" | "baie" | "porte-entree";
export const OPENING_KINDS: Array<{ kind: OpeningKind; label: string; width: number; height: number; sill: number }> = [
  { kind: "porte", label: "Porte", width: 0.83, height: 2.04, sill: 0 },
  { kind: "passage", label: "Passage ouvert", width: 1.2, height: 2.1, sill: 0 },
  { kind: "porte-entree", label: "Porte d'entrée", width: 0.93, height: 2.15, sill: 0 },
  { kind: "fenetre", label: "Fenêtre", width: 1.2, height: 1.35, sill: 0.9 },
  { kind: "baie", label: "Porte-fenêtre ou baie", width: 2.4, height: 2.2, sill: 0 },
];

export interface OpeningDef { id: string; roomId: string; side: Side; offset: number; width: number; height: number; sill: number; kind: OpeningKind }
export interface Layout { rooms: RoomDef[]; openings: OpeningDef[] }

/** Ouverture vue depuis un mur : `at` = position du centre depuis le point a du mur. */
export interface Opening { at: number; width: number; height: number; sill: number; kind: OpeningKind }
export interface Wall { a: [number, number]; b: [number, number]; thick: number; openings: Opening[] }
export interface Structure { walls: Wall[]; railings: Array<[[number, number], [number, number]]>; bbox: { x0: number; z0: number; x1: number; z1: number } }

const r2 = (v: number) => Math.round(v * 100) / 100;
export const roomArea = (r: RoomDef) => (r.x1 - r.x0) * (r.z1 - r.z0);
export const hasCeiling = (r: RoomDef) => r.kind !== "exterieur";
export function roomAt(l: Layout, x: number, z: number): RoomDef | undefined {
  return l.rooms.find((r) => x > r.x0 && x < r.x1 && z > r.z0 && z < r.z1);
}
export const sideLength = (r: RoomDef, s: Side) => (s === "n" || s === "s" ? r.x1 - r.x0 : r.z1 - r.z0);
export const isHoriz = (s: Side) => s === "n" || s === "s";
/** Coordonnée de la ligne du côté et origine le long du côté. */
export function sideLine(r: RoomDef, s: Side): { horiz: boolean; c: number; start: number; end: number } {
  if (s === "n") return { horiz: true, c: r.z0, start: r.x0, end: r.x1 };
  if (s === "s") return { horiz: true, c: r.z1, start: r.x0, end: r.x1 };
  if (s === "w") return { horiz: false, c: r.x0, start: r.z0, end: r.z1 };
  return { horiz: false, c: r.x1, start: r.z0, end: r.z1 };
}
/** Vecteur vers l'intérieur de la pièce depuis un côté. */
export const inward = (s: Side): [number, number] => (s === "n" ? [0, 1] : s === "s" ? [0, -1] : s === "w" ? [1, 0] : [-1, 0]);

/** Position absolue d'une ouverture. */
export function openingAbs(l: Layout, o: OpeningDef): { horiz: boolean; c: number; center: number; room: RoomDef } | null {
  const r = l.rooms.find((x) => x.id === o.roomId); if (!r) return null;
  const line = sideLine(r, o.side);
  return { horiz: line.horiz, c: line.c, center: line.start + o.offset, room: r };
}

/** Pièces voisines le long d'un côté (partage de mur). */
export function neighbours(l: Layout, r: RoomDef, s: Side): RoomDef[] {
  const line = sideLine(r, s);
  return l.rooms.filter((o) => {
    if (o.id === r.id) return false;
    const opp = s === "n" ? "s" : s === "s" ? "n" : s === "w" ? "e" : "w";
    const ol = sideLine(o, opp);
    return Math.abs(ol.c - line.c) < 0.01 && Math.min(ol.end, line.end) - Math.max(ol.start, line.start) > 0.05;
  });
}

/** Point de vue d'une pièce : derrière la porte principale, tourné vers l'intérieur. */
export function viewpoint(l: Layout, r: RoomDef): { spawn: [number, number]; look: [number, number] } {
  if (r.spawn && r.look) return { spawn: r.spawn, look: r.look };
  const prio: OpeningKind[] = ["porte-entree", "porte", "passage", "baie"];
  const doors = l.openings.map((o) => ({ o, a: openingAbs(l, o) })).filter((x) => x.a && prio.includes(x.o.kind));
  // Ouvertures sur le pourtour de cette pièce (déclarées par elle ou par une voisine).
  const mine: Array<{ x: number; z: number; n: [number, number]; rank: number }> = [];
  for (const { o, a } of doors) {
    if (!a) continue;
    for (const s of ["n", "s", "e", "w"] as Side[]) {
      const line = sideLine(r, s);
      if (line.horiz === a.horiz && Math.abs(line.c - a.c) < 0.01 && a.center > line.start && a.center < line.end) {
        const [nx, nz] = inward(s);
        mine.push({ x: a.horiz ? a.center : a.c, z: a.horiz ? a.c : a.center, n: [nx, nz], rank: prio.indexOf(o.kind) });
      }
    }
  }
  mine.sort((p, q) => p.rank - q.rank);
  const w = r.x1 - r.x0, d = r.z1 - r.z0;
  const d0 = mine[0];
  if (d0) {
    const depth = Math.min(0.8, (Math.abs(d0.n[0]) ? w : d) * 0.3);
    const sx = d0.x + d0.n[0] * depth, sz = d0.z + d0.n[1] * depth;
    return { spawn: [sx, sz], look: [sx + d0.n[0] * 5 + (r.x0 + w / 2 - sx) * 0.4, sz + d0.n[1] * 5 + (r.z0 + d / 2 - sz) * 0.4] };
  }
  return { spawn: [r.x0 + w * 0.82, r.z0 + d * 0.82], look: [r.x0 + w * 0.2, r.z0 + d * 0.25] };
}

type Edge = { a: number; b: number; hi: boolean; room: RoomDef };
/** Déduit murs, cloisons et garde-corps du plan. */
export function deriveStructure(l: Layout): Structure {
  const lines = new Map<string, { horiz: boolean; c: number; edges: Edge[] }>();
  const push = (horiz: boolean, c: number, e: Edge) => {
    const k = `${horiz ? "h" : "v"}:${r2(c).toFixed(2)}`;
    const L = lines.get(k) ?? { horiz, c: r2(c), edges: [] }; L.edges.push(e); lines.set(k, L);
  };
  for (const r of l.rooms) {
    push(true, r.z0, { a: r.x0, b: r.x1, hi: true, room: r }); push(true, r.z1, { a: r.x0, b: r.x1, hi: false, room: r });
    push(false, r.x0, { a: r.z0, b: r.z1, hi: true, room: r }); push(false, r.x1, { a: r.z0, b: r.z1, hi: false, room: r });
  }
  const abs = l.openings.map((o) => ({ o, a: openingAbs(l, o) })).filter((x) => x.a) as Array<{ o: OpeningDef; a: NonNullable<ReturnType<typeof openingAbs>> }>;
  const walls: Wall[] = [];
  const railings: Structure["railings"] = [];
  for (const L of lines.values()) {
    const pts = [...new Set(L.edges.flatMap((e) => [r2(e.a), r2(e.b)]))].sort((p, q) => p - q);
    type Seg = { s: number; t: number; cls: "ext" | "int" | "rail" };
    const segs: Seg[] = [];
    for (let i = 0; i < pts.length - 1; i++) {
      const p = pts[i]!, q = pts[i + 1]!, m = (p + q) / 2;
      const lo = L.edges.find((e) => !e.hi && e.a < m && e.b > m)?.room, hi = L.edges.find((e) => e.hi && e.a < m && e.b > m)?.room;
      let cls: Seg["cls"] | null = null;
      if (lo && hi) {
        const lx = lo.kind === "exterieur", hx = hi.kind === "exterieur";
        cls = lx && hx ? null : lx || hx ? "ext" : "int";
      } else if (lo || hi) cls = (lo ?? hi)!.kind === "exterieur" ? "rail" : "ext";
      if (!cls) continue;
      const last = segs.at(-1);
      if (last && last.cls === cls && Math.abs(last.t - p) < 1e-6) last.t = q; else segs.push({ s: p, t: q, cls });
    }
    for (const sg of segs) {
      const a: [number, number] = L.horiz ? [sg.s, L.c] : [L.c, sg.s], b: [number, number] = L.horiz ? [sg.t, L.c] : [L.c, sg.t];
      if (sg.cls === "rail") { railings.push([a, b]); continue; }
      const len = sg.t - sg.s, ops: Opening[] = [];
      for (const { o, a: oa } of abs) {
        if (oa.horiz !== L.horiz || Math.abs(oa.c - L.c) > 0.01 || oa.center <= sg.s || oa.center >= sg.t) continue;
        const w = Math.min(o.width, len - 0.1), at = Math.min(len - w / 2 - 0.05, Math.max(w / 2 + 0.05, oa.center - sg.s));
        if (w < 0.3 || ops.some((x) => Math.abs(x.at - at) < 0.1)) continue;
        if (ops.some((x) => Math.abs(x.at - at) < (x.width + w) / 2)) continue; // chevauchement : on garde la première
        ops.push({ at, width: w, height: Math.min(o.height, WALL_H - 0.1 - o.sill), sill: o.sill, kind: o.kind });
      }
      walls.push({ a, b, thick: sg.cls === "ext" ? 0.2 : 0.1, openings: ops });
    }
  }
  const xs = l.rooms.flatMap((r) => [r.x0, r.x1]), zs = l.rooms.flatMap((r) => [r.z0, r.z1]);
  return { walls, railings, bbox: { x0: Math.min(...xs), x1: Math.max(...xs), z0: Math.min(...zs), z1: Math.max(...zs) } };
}

/** Problèmes du plan à signaler (sans bloquer). */
export function planWarnings(l: Layout): string[] {
  const out: string[] = [];
  for (let i = 0; i < l.rooms.length; i++) for (let j = i + 1; j < l.rooms.length; j++) {
    const a = l.rooms[i]!, b = l.rooms[j]!;
    const ox = Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0), oz = Math.min(a.z1, b.z1) - Math.max(a.z0, b.z0);
    if (ox > 0.01 && oz > 0.01) out.push(`« ${a.name} » et « ${b.name} » se chevauchent.`);
  }
  for (const r of l.rooms) {
    if (r.kind !== "exterieur" && !l.openings.some((o) => o.kind !== "fenetre" && touches(l, r, o)))
      out.push(`« ${r.name} » n'a pas de porte ni de passage.`);
  }
  return out;
}
function touches(l: Layout, r: RoomDef, o: OpeningDef): boolean {
  const a = openingAbs(l, o); if (!a) return false;
  return (["n", "s", "e", "w"] as Side[]).some((s) => { const line = sideLine(r, s); return line.horiz === a.horiz && Math.abs(line.c - a.c) < 0.01 && a.center > line.start && a.center < line.end; });
}

/* ——————————————— Modèles de logement ——————————————— */
let seq = 0;
const oid = () => `o${(++seq).toString(36)}${Math.random().toString(36).slice(2, 5)}`;
const op = (roomId: string, side: Side, offset: number, kind: OpeningKind, over: Partial<OpeningDef> = {}): OpeningDef => {
  const d = OPENING_KINDS.find((k) => k.kind === kind)!;
  return { id: oid(), roomId, side, offset, width: d.width, height: d.height, sill: d.sill, kind, ...over };
};

export function exampleLayout(): Layout {
  return {
    rooms: [
      { id: "entree", name: "Entrée", kind: "entree", x0: 0, z0: 5, x1: 3, z1: 9, spawn: [1.45, 8.3], look: [1.45, 3] },
      { id: "salon", name: "Salon", kind: "salon", x0: 0, z0: 0, x1: 7, z1: 5, spawn: [6.55, 3.3], look: [1.0, 3.4] },
      { id: "cuisine", name: "Cuisine", kind: "cuisine", x0: 7, z0: 0, x1: 12, z1: 5, spawn: [7.6, 1.0], look: [10.5, 4.2] },
      { id: "chambre", name: "Chambre", kind: "chambre", x0: 3, z0: 5, x1: 8, z1: 9, spawn: [7.2, 5.8], look: [4, 7.6] },
      { id: "sdb", name: "Salle de bain", kind: "sdb", x0: 8, z0: 5, x1: 12, z1: 9, spawn: [8.7, 6.5], look: [11.5, 8.2] },
      { id: "terrasse", name: "Terrasse", kind: "exterieur", x0: 0, z0: -4, x1: 12, z1: 0, spawn: [3.5, -0.5], look: [6, -6] },
    ],
    openings: [
      op("salon", "n", 3.5, "baie", { width: 3, height: 2.25 }),
      op("salon", "w", 2.5, "fenetre", { width: 1.4 }),
      op("salon", "s", 1.45, "passage", { width: 0.9, height: 2.04 }),
      op("salon", "s", 6.4, "porte"),
      op("salon", "e", 2.4, "passage", { width: 2, height: 2.2 }),
      op("cuisine", "n", 2.8, "fenetre", { width: 1.4, sill: 1.0, height: 1.25 }),
      op("cuisine", "e", 2.4, "fenetre", { width: 1.2, sill: 1.0, height: 1.25 }),
      op("entree", "s", 1.45, "porte-entree"),
      op("chambre", "s", 2.6, "fenetre", { width: 1.4 }),
      op("chambre", "e", 1.5, "porte", { width: 0.8 }),
      op("sdb", "e", 2, "fenetre", { width: 0.7, sill: 1.5, height: 0.6 }),
    ],
  };
}

export const TEMPLATES: Array<{ id: string; name: string; desc: string; build: () => Layout }> = [
  { id: "exemple", name: "Appartement d'exemple", desc: "5 pièces et une terrasse, 60 m²", build: exampleLayout },
  { id: "studio", name: "Studio", desc: "Pièce de vie, coin nuit, salle d'eau, 26 m²", build: () => ({
    rooms: [
      { id: "piece", name: "Pièce de vie", kind: "salon", x0: 0, z0: 0, x1: 5, z1: 4 },
      { id: "entree", name: "Entrée et cuisine", kind: "cuisine", x0: 2.2, z0: 4, x1: 5, z1: 6.2 },
      { id: "sdb", name: "Salle d'eau", kind: "sdb", x0: 0, z0: 4, x1: 2.2, z1: 6.2 },
      { id: "balcon", name: "Balcon", kind: "exterieur", x0: 0.6, z0: -1.4, x1: 4.4, z1: 0 },
    ],
    openings: [op("piece", "n", 2.5, "baie", { width: 2.2 }), op("piece", "s", 3.6, "passage", { width: 1.4 }), op("entree", "s", 1.6, "porte-entree"), op("sdb", "e", 1.1, "porte", { width: 0.73 }), op("piece", "w", 2, "fenetre")],
  }) },
  { id: "t2", name: "Deux-pièces", desc: "Séjour, cuisine ouverte, chambre, 50 m²", build: () => ({
    rooms: [
      { id: "sejour", name: "Séjour", kind: "salon", x0: 0, z0: 0, x1: 5, z1: 4.2 },
      { id: "cuisine", name: "Cuisine", kind: "cuisine", x0: 5, z0: 0, x1: 7.6, z1: 4.2 },
      { id: "chambre", name: "Chambre", kind: "chambre", x0: 0, z0: 4.2, x1: 3.6, z1: 7.4 },
      { id: "sdb", name: "Salle de bain", kind: "sdb", x0: 3.6, z0: 4.2, x1: 5.6, z1: 7.4 },
      { id: "entree", name: "Entrée", kind: "entree", x0: 5.6, z0: 4.2, x1: 7.6, z1: 7.4 },
    ],
    openings: [
      op("sejour", "n", 2.5, "baie", { width: 2.4 }), op("sejour", "w", 2.1, "fenetre"), op("sejour", "e", 2.1, "passage", { width: 1.8 }), op("cuisine", "n", 1.3, "fenetre", { sill: 1.0, height: 1.2 }),
      op("chambre", "w", 1.6, "fenetre"), op("chambre", "n", 3.0, "porte"), op("sdb", "e", 0.7, "porte", { width: 0.73 }), op("entree", "s", 1.0, "porte-entree"), op("entree", "n", 1.0, "passage", { width: 1.0 }),
    ],
  }) },
  { id: "maison", name: "Maison avec jardin", desc: "Plain-pied, 2 chambres, jardin, 85 m²", build: () => ({
    rooms: [
      { id: "sejour", name: "Séjour", kind: "salon", x0: 0, z0: 0, x1: 6, z1: 5 },
      { id: "cuisine", name: "Cuisine", kind: "cuisine", x0: 6, z0: 0, x1: 10, z1: 5 },
      { id: "chambre1", name: "Chambre parentale", kind: "chambre", x0: 0, z0: 5, x1: 4, z1: 9 },
      { id: "chambre2", name: "Chambre enfant", kind: "chambre", x0: 4, z0: 5, x1: 7, z1: 9 },
      { id: "entree", name: "Entrée", kind: "entree", x0: 7, z0: 5, x1: 10, z1: 7 },
      { id: "sdb", name: "Salle de bain", kind: "sdb", x0: 7, z0: 7, x1: 10, z1: 9 },
      { id: "jardin", name: "Jardin", kind: "exterieur", x0: -1, z0: -8, x1: 11, z1: 0 },
    ],
    openings: [
      op("sejour", "n", 3, "baie", { width: 3 }), op("cuisine", "n", 2, "fenetre", { width: 1.4, sill: 1.0, height: 1.25 }), op("sejour", "e", 2.5, "passage", { width: 2 }),
      op("chambre1", "n", 2.2, "porte"), op("chambre1", "w", 2, "fenetre", { width: 1.4 }), op("chambre2", "n", 1.8, "porte"), op("chambre2", "s", 1.5, "fenetre", { width: 1.2 }),
      op("sdb", "n", 1.4, "porte", { width: 0.8 }), op("sdb", "e", 1.0, "fenetre", { width: 0.7, sill: 1.5, height: 0.6 }), op("entree", "e", 1.0, "porte-entree"), op("entree", "n", 1.5, "passage", { width: 1.0 }),
    ],
  }) },
  { id: "vide", name: "Partir de zéro", desc: "Une seule pièce de 4 × 4 m à agrandir", build: () => ({
    rooms: [{ id: "piece", name: "Séjour", kind: "salon", x0: 0, z0: 0, x1: 4, z1: 4 }],
    openings: [op("piece", "s", 2, "porte-entree"), op("piece", "n", 2, "fenetre", { width: 1.4 })],
  }) },
];

export function newOpening(roomId: string, side: Side, offset: number, kind: OpeningKind): OpeningDef { return op(roomId, side, offset, kind); }
