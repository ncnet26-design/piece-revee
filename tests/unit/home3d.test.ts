import { describe, expect, it } from "vitest";
import { CATALOG, ROOMS, WALLS, decodeState, defaultState, encodeState, itemDims, parseState, roomAt, type ItemType } from "@/lib/home3d/plan";
import { ITEM_TIPS, ROOM_TIPS } from "@/lib/home3d/tips";
import { materialById } from "@/content/lookup";
import { FABRICS, FLOOR_MATERIALS_IN, FLOOR_MATERIALS_OUT, STRUCTURES, WALL_MATERIALS } from "@/lib/home3d/plan";

describe("visite 3D : plan", () => {
  it("chaque objet par défaut est dans une pièce", () => {
    for (const it of defaultState().items) expect(roomAt(it.x, it.z), `${it.type} (${it.x}, ${it.z})`).toBeDefined();
  });
  it("toutes les matières proposées existent dans la matériauthèque", () => {
    for (const id of [...FABRICS, ...FLOOR_MATERIALS_IN, ...FLOOR_MATERIALS_OUT, ...STRUCTURES, ...WALL_MATERIALS]) expect(materialById.has(id), id).toBe(true);
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
    for (const r of ROOMS) expect(ROOM_TIPS[r.kind].length).toBeGreaterThan(1);
    expect(Object.keys(ITEM_TIPS).length).toBeGreaterThan(20);
  });
  it("les ouvertures tiennent dans leur mur", () => {
    for (const w of WALLS) {
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
    expect(s!.items[0]!.x).toBe(13);
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
