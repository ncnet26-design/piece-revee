import { describe, expect, it } from "vitest";
import { MATERIALS, PAIRINGS, FURNITURE, PLACES, PLANTS, STYLES, KNOWLEDGE, GUIDES, GALLERY, LIBRARY, materialById, placeById, searchLibrary } from "@/content/index.ts";

const unique = (xs: string[]) => new Set(xs).size === xs.length;

describe("volumes éditoriaux", () => {
  it("atteint les volumes du cahier des charges", () => {
    expect(MATERIALS.length).toBeGreaterThanOrEqual(60);
    expect(PAIRINGS.length).toBeGreaterThanOrEqual(30);
    expect(FURNITURE.length).toBeGreaterThanOrEqual(80);
    expect(PLACES.length).toBeGreaterThanOrEqual(40);
    expect(PLANTS.length).toBeGreaterThanOrEqual(40);
    expect(STYLES.filter((s) => s.scope === "interieur").length).toBe(12);
    expect(STYLES.filter((s) => s.scope === "exterieur").length).toBe(8);
    expect(GALLERY.length).toBe(12 * 6 + 8 * 5);
  });
});

describe("intégrité des références", () => {
  it("identifiants et slugs uniques", () => {
    for (const list of [MATERIALS, PAIRINGS, FURNITURE, PLACES, PLANTS, STYLES, GUIDES]) {
      expect(unique(list.map((x) => x.id))).toBe(true);
      expect(unique(list.map((x) => x.slug))).toBe(true);
    }
    expect(unique(LIBRARY.map((x) => x.id))).toBe(true);
    expect(unique(GALLERY.map((x) => x.id))).toBe(true);
  });
  it("chaque accord et chaque lieu cite des matières existantes", () => {
    for (const p of PAIRINGS) { for (const m of p.materials) expect(materialById.has(m), `${p.id} → ${m}`).toBe(true); if (p.placeId) expect(placeById.has(p.placeId), p.id).toBe(true); }
    for (const p of PLACES) for (const m of p.materials) expect(materialById.has(m), `${p.id} → ${m}`).toBe(true);
    for (const s of STYLES) for (const m of s.materials) expect(materialById.has(m), `${s.id} → ${m}`).toBe(true);
  });
  it("les meubles citent des matières existantes et des éditeurs avec un site https", () => {
    for (const f of FURNITURE) {
      for (const m of f.materials) expect(materialById.has(m), `${f.id} → ${m}`).toBe(true);
      expect(f.editorUrl.startsWith("https://"), f.id).toBe(true);
      expect(f.year).toBeGreaterThan(1800);
      expect(f.year).toBeLessThanOrEqual(2026);
    }
  });
  it("les couleurs sont des hexadécimaux valides", () => {
    const all = [...MATERIALS.flatMap((m) => m.colors), ...PLACES.flatMap((p) => p.palette), ...STYLES.flatMap((s) => s.palette)];
    for (const c of all) expect(c).toMatch(/^#[0-9A-Fa-f]{6}$/);
  });
  it("les fiches plantes sont cohérentes", () => {
    for (const p of PLANTS) {
      expect(p.heightCm[0]).toBeLessThanOrEqual(p.heightCm[1]);
      for (const m of [...p.bloom, ...p.plant, ...p.prune]) { expect(m).toBeGreaterThanOrEqual(1); expect(m).toBeLessThanOrEqual(12); }
    }
  });
  it("chaque passage de connaissance réglementaire a une source", () => {
    for (const k of KNOWLEDGE.filter((x) => x.domain === "reglementation" || x.domain === "securite")) expect(k.sources.length, k.id).toBeGreaterThan(0);
  });
  it("rien n'est marqué relu sans relecture humaine", () => {
    expect([...MATERIALS, ...PAIRINGS, ...FURNITURE, ...PLACES, ...PLANTS, ...KNOWLEDGE].every((x) => x.reviewed === false)).toBe(true);
  });
});

describe("recherche dans la bibliothèque", () => {
  it("trouve par nom, designer ou nom latin", () => {
    expect(searchLibrary("travertin")[0]?.id).toBe("m-travertin");
    expect(searchLibrary("Wegner", "meuble").length).toBeGreaterThanOrEqual(3);
    expect(searchLibrary("lavandula")[0]?.id).toBe("p-lavande-vraie");
    expect(searchLibrary("")).toEqual([]);
  });
});
