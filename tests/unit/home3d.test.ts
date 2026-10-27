import { describe, expect, it } from "vitest";
import { CATALOG, decodeState, defaultState, encodeState, itemDims, parseLayout, parseState, roomAt, type ItemType } from "@/lib/home3d/plan";
import { TEMPLATES, deriveStructure, exampleLayout, planWarnings, viewpoint } from "@/lib/home3d/layout";
import { furnishAll } from "@/lib/home3d/furnish";
import { ITEM_TIPS, ROOM_TIPS } from "@/lib/home3d/tips";
import { materialById } from "@/content/lookup";
import { FABRICS, FLOOR_MATERIALS_IN, FLOOR_MATERIALS_OUT, PSEUDO_MATERIALS, STRUCTURES, WALL_MATERIALS } from "@/lib/home3d/plan";

describe("visite 3D : plan", () => {
  it("chaque objet par défaut est dans une pièce", () => {
    const st = defaultState();
    for (const it of st.items) expect(roomAt(st.layout, it.x, it.z), `${it.type} (${it.x}, ${it.z})`).toBeDefined();
  });
  it("toutes les matières proposées existent dans la matériauthèque", () => {
    for (const id of [...FABRICS, ...FLOOR_MATERIALS_IN, ...FLOOR_MATERIALS_OUT, ...STRUCTURES, ...WALL_MATERIALS]) expect(materialById.has(id) || id in PSEUDO_MATERIALS, id).toBe(true);
    for (const r of Object.values(defaultState().rooms)) {
      expect(materialById.has(r.floor)).toBe(true);
      if (r.wall.kind === "matiere") expect(materialById.has(r.wall.id)).toBe(true);
    }
    for (const e of Object.values(CATALOG)) for (const id of [e.fabric, e.structure]) if (id) expect(materialById.has(id), id).toBe(true);
  });
  it("chaque type d'objet a des dimensions, et chaque pièce des astuces", () => {
    for (const t of Object.keys(CATALOG) as ItemType[]) {
      for (const v of CATALOG[t].variants ?? [undefined]) { const d = itemDims({ type: t, variant: v }); expect(d.w * d.d * d.h, t).toBeGreaterThan(0); }
    }
    for (const r of exampleLayout().rooms) expect(ROOM_TIPS[r.kind].length).toBeGreaterThan(1);
    expect(Object.keys(ITEM_TIPS).length).toBeGreaterThan(20);
  });
  it("les ouvertures tiennent dans leur mur", () => {
    for (const w of deriveStructure(exampleLayout()).walls) {
      const L = Math.abs(w.b[0] - w.a[0]) + Math.abs(w.b[1] - w.a[1]);
      for (const o of w.openings) { expect(o.at - o.width / 2).toBeGreaterThan(0); expect(o.at + o.width / 2).toBeLessThan(L); }
    }
  });
});

describe("visite 3D : sauvegarde et partage", () => {
  it("rejette les données invalides", () => {
    expect(parseState(null)).toBeNull();
    expect(parseState({ v: 2 })).toBeNull();
    const s = parseState({ v: 1, rooms: { salon: { wall: { kind: "peinture", hex: "javascript:alert(1)" }, floor: "<script>" } }, items: [{ type: "fusee", x: 1, z: 1, rot: 0 }, { type: "canape", x: 1e9, z: 2, rot: 0, color: "rouge" }], notes: [] });
    expect(s).not.toBeNull();
    expect(s!.rooms.salon!.wall).toEqual(defaultState().rooms.salon!.wall);
    expect(s!.rooms.salon!.floor).toBe("m-chene");
    expect(s!.items).toHaveLength(1);
    expect(s!.items[0]!.x).toBe(61);
    expect(s!.items[0]!.color).toBeUndefined();
  });
  it("un plan encodé dans un lien se relit à l'identique", async () => {
    const s = defaultState();
    s.items[0]!.color = "#123456";
    s.notes.push({ id: "n1", roomId: "salon", x: 1, y: 1.5, z: 2, text: "Astuce « test » éàü", at: "2026-10-27T10:00:00.000Z" });
    const code = await encodeState(s);
    expect(code.length).toBeLessThan(4000);
    expect(await decodeState(code)).toEqual(s);
    expect(await decodeState("z.nimportequoi")).toBeNull();
  });
});

describe("plan du logement", () => {
  it("déduit façades, cloisons, garde-corps et ouvertures de l'appartement d'exemple", () => {
    const st = deriveStructure(exampleLayout());
    expect(st.railings).toHaveLength(3);
    expect(st.walls.filter((w) => w.thick === 0.2).length).toBeGreaterThanOrEqual(4);
    expect(st.walls.filter((w) => w.thick === 0.1).length).toBeGreaterThanOrEqual(4);
    expect(st.walls.flatMap((w) => w.openings)).toHaveLength(11);
    expect(st.bbox).toEqual({ x0: 0, x1: 12, z0: -4, z1: 9 });
  });
  for (const t of TEMPLATES) {
    it(`modèle « ${t.name} » : cohérent et meublé`, () => {
      const l = t.build();
      expect(planWarnings(l)).toEqual([]);
      const items = furnishAll(l);
      expect(items.length).toBeGreaterThan(l.rooms.length);
      for (const it of items) expect(roomAt(l, it.x, it.z), `${t.id}: ${it.type}`).toBeDefined();
      for (const r of l.rooms) { const v = viewpoint(l, r); expect(roomAt(l, v.spawn[0], v.spawn[1])?.id, `${t.id}: ${r.id}`).toBe(r.id); }
      const ops = l.openings.length, derived = deriveStructure(l).walls.flatMap((w) => w.openings).length;
      expect(derived).toBe(ops);
    });
  }
  it("signale chevauchements et pièces sans porte", () => {
    const l = exampleLayout();
    l.rooms.push({ id: "x", name: "Bureau", kind: "chambre", x0: 1, z0: 1, x1: 3, z1: 3 });
    const w = planWarnings(l);
    expect(w.some((m) => m.includes("se chevauchent"))).toBe(true);
    expect(w.some((m) => m.includes("Bureau") && m.includes("porte"))).toBe(true);
  });
  it("rejette un plan malformé et borne les valeurs", () => {
    expect(parseLayout({ rooms: [], openings: [] })).toBeNull();
    const l = parseLayout({ rooms: [{ id: "a b<script>", kind: "salon", x0: 0, z0: 0, x1: 3, z1: 3 }, { id: "ok", name: "  Séjour  ", kind: "salon", x0: 0, z0: 0, x1: 999, z1: 0.2 }, { id: "p", kind: "piscine", x0: 0, z0: 0, x1: 3, z1: 3 }, { id: "c", kind: "cuisine", x0: 0, z0: 0, x1: 4, z1: 3 }],
      openings: [{ roomId: "c", side: "n", offset: 1, width: 99, height: 2, sill: 0, kind: "porte" }, { roomId: "zz", side: "n", offset: 1, width: 1, height: 2, sill: 0, kind: "porte" }, { roomId: "c", side: "haut", offset: 1, width: 1, height: 2, sill: 0, kind: "porte" }] });
    expect(l!.rooms.map((r) => r.id)).toEqual(["c"]);
    expect(l!.openings).toHaveLength(1);
    expect(l!.openings[0]!.width).toBe(6);
  });
  it("un état sans plan (ancienne sauvegarde) retrouve l'appartement d'exemple", () => {
    const s = parseState({ v: 1, rooms: {}, items: [], notes: [] });
    expect(s!.layout.rooms).toHaveLength(6);
  });
});
