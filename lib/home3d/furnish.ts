import { openingAbs, sideLength, sideLine, type Layout, type RoomDef, type Side } from "./layout";
import type { Item, ItemType } from "./plan";

/**
 * Ameublement automatique d'une pièce : une proposition de départ, à ajuster.
 * Les meubles principaux sont adossés au mur offrant la plus grande longueur libre (sans porte ni fenêtre).
 */
const PI = Math.PI;
const SIDES: Side[] = ["n", "s", "w", "e"];
const opp = (s: Side): Side => (s === "n" ? "s" : s === "s" ? "n" : s === "w" ? "e" : "w");
const ROT: Record<Side, number> = { n: 0, s: PI, w: PI / 2, e: -PI / 2 };
const HALF_WALL = 0.1;

let n = 0;
const mk = (type: ItemType, x: number, z: number, rot: number, extra: Partial<Item> = {}): Item =>
  ({ id: `a${Date.now().toString(36)}${(++n).toString(36)}`, type, x: Math.round(x * 100) / 100, z: Math.round(z * 100) / 100, rot, ...extra });

/** Intervalles libres d'un côté (en coordonnée locale depuis le début du côté), du plus long au plus court. */
function free(l: Layout, r: RoomDef, s: Side): Array<[number, number]> {
  const line = sideLine(r, s), L = line.end - line.start;
  const blocked: Array<[number, number]> = [];
  for (const o of l.openings) {
    const a = openingAbs(l, o);
    if (!a || a.horiz !== line.horiz || Math.abs(a.c - line.c) > 0.01) continue;
    const c = a.center - line.start, m = o.kind === "fenetre" ? 0.1 : 0.25;
    if (c + o.width / 2 + m > 0 && c - o.width / 2 - m < L) blocked.push([c - o.width / 2 - m, c + o.width / 2 + m]);
  }
  blocked.sort((p, q) => p[0] - q[0]);
  const out: Array<[number, number]> = []; let cur = 0.05;
  for (const [a, b] of blocked) { if (a > cur) out.push([cur, a]); cur = Math.max(cur, b); }
  if (cur < L - 0.05) out.push([cur, L - 0.05]);
  return out.sort((p, q) => (q[1] - q[0]) - (p[1] - p[0]));
}

/** Point situé à `t` le long du côté et à `p` du mur vers l'intérieur. */
function at(r: RoomDef, s: Side, t: number, p: number): { x: number; z: number } {
  if (s === "n") return { x: r.x0 + t, z: r.z0 + p };
  if (s === "s") return { x: r.x0 + t, z: r.z1 - p };
  if (s === "w") return { x: r.x0 + p, z: r.z0 + t };
  return { x: r.x1 - p, z: r.z0 + t };
}
/** Objet adossé au mur `s`, centré à `t`, de profondeur `depth`, tourné vers l'intérieur. */
function against(r: RoomDef, s: Side, t: number, depth: number, type: ItemType, extra: Partial<Item> = {}, rotDelta = 0): Item {
  const { x, z } = at(r, s, t, HALF_WALL + depth / 2 + 0.02);
  return mk(type, x, z, ROT[s] + rotDelta, extra);
}
const clampT = (r: RoomDef, s: Side, t: number, half: number) => Math.min(sideLength(r, s) - half - 0.1, Math.max(half + 0.1, t));
const inside = (r: RoomDef, it: Item) => it.x > r.x0 && it.x < r.x1 && it.z > r.z0 && it.z < r.z1;

function bestWalls(l: Layout, r: RoomDef) {
  return SIDES.map((s) => ({ s, iv: free(l, r, s)[0] ?? ([0, 0] as [number, number]) })).sort((a, b) => (b.iv[1] - b.iv[0]) - (a.iv[1] - a.iv[0]));
}

export function furnishRoom(l: Layout, r: RoomDef): Item[] {
  const items: Item[] = [];
  const walls = bestWalls(l, r);
  const w1 = walls[0]!, s1 = w1.s, [a1, b1] = w1.iv, len1 = b1 - a1, m1 = (a1 + b1) / 2;
  const E1 = sideLength(r, s1 === "n" || s1 === "s" ? "w" : "n"); // profondeur perpendiculaire au mur principal
  const w2 = walls.find((w) => w.s !== s1 && w.s !== opp(s1)) ?? walls[1]!;
  const corner = (k: number) => ({ x: k % 2 ? r.x1 - 0.45 : r.x0 + 0.45, z: k < 2 ? r.z0 + 0.45 : r.z1 - 0.45 });
  const rugRot = s1 === "n" || s1 === "s" ? 0 : PI / 2;

  switch (r.kind) {
    case "salon": {
      if (len1 >= 1.7) items.push(against(r, s1, m1, 0.4, "meuble-tv"));
      const pSofa = Math.min(E1 - HALF_WALL - 0.48, HALF_WALL + 0.4 + 2.6 + 0.46);
      if (pSofa > 1.8) {
        const c = at(r, s1, m1, pSofa);
        items.push(mk("canape", c.x, c.z, ROT[s1] + PI, { variant: sideLength(r, s1) >= 3 ? "3 places" : "2 places" }));
        const t = at(r, s1, m1, pSofa - 0.46 - 0.75); items.push(mk("table-basse", t.x, t.z, rugRot));
        const g = at(r, s1, m1, pSofa - 1.0); items.push(mk("tapis", g.x, g.z, rugRot, { variant: E1 > 4 ? "200 × 300" : "160 × 230" }));
        const lt = clampT(r, s1, m1 + 1.35, 0.25), lp = at(r, s1, lt, pSofa); items.push(mk("lampadaire", lp.x, lp.z, 0));
      }
      const c0 = corner(0); items.push(mk("plante", c0.x, c0.z, 0, { variant: "Grande" }));
      if (w2 && w2.iv[1] - w2.iv[0] >= 1.4) items.push(against(r, w2.s, (w2.iv[0] + w2.iv[1]) / 2, 0.35, "bibliotheque"));
      break;
    }
    case "chambre": {
      const big = len1 >= 2.8 && E1 >= 3.2;
      const bw = big ? 1.74 : 1.54, bl = big ? 2.1 : 2.0;
      if (len1 >= bw + 0.2 && E1 >= bl + 0.6) {
        items.push(against(r, s1, m1, bl, "lit", { variant: big ? "160 × 200" : "140 × 190" }));
        const g = at(r, s1, m1, HALF_WALL + 1.2); items.push(mk("tapis", g.x, g.z, rugRot + PI / 2, { variant: "160 × 230", color: "#E9E2D3" }));
        for (const d of [-1, 1]) { const t = m1 + d * (bw / 2 + 0.28); if (t > a1 + 0.2 && t < b1 - 0.2) items.push(against(r, s1, t, 0.4, "chevet")); }
      }
      if (w2 && w2.iv[1] - w2.iv[0] >= 1.4) items.push(against(r, w2.s, (w2.iv[0] + w2.iv[1]) / 2, 0.6, "armoire"));
      const c3 = corner(3); items.push(mk("plante", c3.x, c3.z, 0, { variant: "Grande" }));
      break;
    }
    case "cuisine": {
      const run = len1 >= 3.1 ? 3.0 : 2.4, variant = run === 3 ? "3 m" : "2,40 m";
      const tRun = clampT(r, s1, a1 + run / 2 + 0.02, run / 2);
      items.push(against(r, s1, tRun, 0.62, "cuisine", { variant }));
      if (tRun + run / 2 + 0.66 < b1) items.push(against(r, s1, tRun + run / 2 + 0.33, 0.65, "refrigerateur"));
      else if (w2 && w2.iv[1] - w2.iv[0] > 0.7) items.push(against(r, w2.s, w2.iv[0] + 0.35, 0.65, "refrigerateur"));
      const pIlot = HALF_WALL + 0.62 + 1.1 + 0.52;
      if (E1 >= pIlot + 0.52 + 0.9 && len1 >= 2.4) {
        const c = at(r, s1, tRun, pIlot); items.push(mk("ilot", c.x, c.z, ROT[s1]));
        for (const d of [-0.6, 0, 0.6]) { const st = at(r, s1, tRun + d, pIlot + 0.75); items.push(mk("tabouret", st.x, st.z, 0)); }
      } else if (E1 >= 2.6 && sideLength(r, s1) >= 2.4) {
        const c = at(r, s1, sideLength(r, s1) / 2, (HALF_WALL + 0.62 + E1) / 2 + 0.2); items.push(mk("table", c.x, c.z, 0, { variant: "Ronde" }));
      }
      break;
    }
    case "sdb": {
      const tV = clampT(r, s1, a1 + 0.5, 0.42);
      items.push(against(r, s1, tV, 0.48, "meuble-vasque"));
      const m = at(r, s1, tV, HALF_WALL + 0.04); items.push(mk("miroir", m.x, m.z, ROT[s1], { variant: "Rectangulaire" }));
      const L2 = w2 ? w2.iv[1] - w2.iv[0] : 0;
      if (w2 && L2 >= 1.75 && sideLength(r, opp(w2.s)) >= 1.2) items.push(against(r, w2.s, w2.iv[0] + 0.88, 0.75, "baignoire"));
      else if (w2 && L2 >= 0.95) items.push(against(r, w2.s, w2.iv[0] + 0.48, 0.9, "douche"));
      if (len1 >= 2.2) items.push(against(r, s1, b1 - 0.32, 0.6, "wc"));
      else { const w3 = walls.find((w) => w.s !== s1 && w.s !== w2?.s); if (w3) items.push(against(r, w3.s, (w3.iv[0] + w3.iv[1]) / 2, 0.6, "wc")); }
      break;
    }
    case "entree": {
      if (len1 >= 1.1) {
        items.push(against(r, s1, m1, 0.35, "console"));
        const m = at(r, s1, m1, HALF_WALL + 0.04); items.push(mk("miroir", m.x, m.z, ROT[s1], { variant: "Rond" }));
      }
      if (w2 && w2.iv[1] - w2.iv[0] >= 1.0) items.push(against(r, w2.s, (w2.iv[0] + w2.iv[1]) / 2, 0.22, "porte-manteau"));
      break;
    }
    case "exterieur": {
      const w = r.x1 - r.x0, d = r.z1 - r.z0;
      if (w >= 2.4 && d >= 2.6) {
        const cx = r.x0 + w * 0.7, cz = r.z0 + d * 0.5;
        items.push(mk("salon-jardin", cx, cz, 0)); if (w * d >= 15) items.push(mk("parasol", cx, cz, 0));
      }
      if (w >= 3.5 && d >= 2.4) for (const k of [0, 1]) items.push(mk("transat", r.x0 + 0.9 + k * 1.1, r.z0 + Math.min(d / 2, 1.4), PI));
      const c = corner(0); items.push(mk("plante", c.x + 0.2, c.z + 0.2, 0, { variant: "Olivier" }));
      break;
    }
  }
  return items.filter((it) => inside(r, it));
}

/** Remplace le mobilier d'une pièce par une proposition automatique. */
export function refurnish(l: Layout, items: Item[], roomId: string): Item[] {
  const r = l.rooms.find((x) => x.id === roomId); if (!r) return items;
  return [...items.filter((it) => !inside(r, it)), ...furnishRoom(l, r)];
}
export function furnishAll(l: Layout): Item[] { return l.rooms.flatMap((r) => furnishRoom(l, r)); }
