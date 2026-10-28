import { describe, expect, it } from "vitest";
import { PRODUCTS } from "@/lib/products/schema";
import { MATERIALS } from "@/lib/materials/schema";
import { parseVariant } from "@/lib/showroom/catalog";
import { FURNITURE } from "@/lib/studio/library";
import { byTier, findSimilar, MIN_SCORE, withWants, type ObjectFeatures } from "@/lib/studio/similar";
import { parseIntent } from "@/lib/studio/intent";

/** Table basse dessinée par l'IA : pierre, forme sculpturale, beige. */
const TABLE_IA: ObjectFeatures = { category: "table-basse", style: ["contemporain", "organique", "minimal"], silhouette: ["organique", "basse", "massive"], materials: ["travertin"], colors: ["#DCCBAE"], dims: { w: 110, d: 75, h: 32 }, productId: null };

describe("moteur de produits similaires", () => {
  it("trouve des tables basses ressemblantes (pierre ou effet pierre) et écarte les tables en bois", () => {
    const res = findSimilar(TABLE_IA);
    const ids = res.map((m) => m.product.id);
    expect(ids).toContain("ampm-guimel-travertin");
    expect(ids).toContain("drawer-oris-effet-travertin");
    expect(ids).not.toContain("ikea-borgeby-bouleau-70");
    expect(res.every((m) => m.score >= MIN_SCORE && m.product.category === "table-basse")).toBe(true);
    // Plusieurs gammes représentées.
    const t = byTier(res);
    expect(t.economique.length).toBeGreaterThan(0);
    expect(t.premium.length).toBeGreaterThan(0);
    // Chaque résultat explique sa ressemblance.
    expect(res[0]!.reasons.join(" ")).toMatch(/Matière|Silhouette/);
  });
  it("le vrai travertin passe devant l'imitation à forme égale", () => {
    const res = findSimilar(TABLE_IA);
    const guimel = res.find((m) => m.product.id === "ampm-guimel-travertin")!, oris = res.find((m) => m.product.id === "drawer-oris-effet-travertin")!;
    expect(guimel.score).toBeGreaterThan(oris.score);
  });
  it("filtres : budget, pays de la boutique, matière", () => {
    expect(findSimilar(TABLE_IA, { maxPrice: 400 }).every((m) => (m.product.price?.amount ?? 0) <= 400)).toBe(true);
    expect(findSimilar(TABLE_IA, { market: "FR" }).every((m) => m.product.market === "FR")).toBe(true);
    expect(findSimilar(TABLE_IA, { material: "travertin" }).length).toBeGreaterThan(0);
  });
  it("aucune catégorie voisine n'est mélangée", () => {
    expect(findSimilar({ ...TABLE_IA, category: "lampadaire", materials: ["laiton"], silhouette: ["globe"] }).every((m) => ["lampadaire", "luminaire"].includes(m.product.category))).toBe(true);
  });
});

describe("compréhension des demandes", () => {
  it("« remplace uniquement la table basse par quelque chose de plus sculptural, pour moins de 400 € »", () => {
    const i = parseIntent("Remplace uniquement la table basse par quelque chose de plus sculptural, pour moins de 400 €, et garde tout le reste identique.");
    expect(i).toMatchObject({ action: "remplacer", category: "table-basse", maxPrice: 400, keepRest: true });
    expect(i.wants.silhouette).toContain("organique");
    const res = findSimilar(withWants(TABLE_IA, i.wants), { maxPrice: i.maxPrice });
    expect(res.every((m) => (m.product.price?.amount ?? 0) <= 400)).toBe(true);
  });
  it("comprend un budget en k€ et une couleur", () => {
    const i = parseIntent("trouve-moi un canapé vert en velours sous 1,5k €");
    expect(i.category).toBe("canape");
    expect(i.maxPrice).toBe(1500);
    expect(i.wants.materials).toContain("velours");
    expect(i.wants.colors[0]?.name).toBe("vert");
  });
});

describe("données", () => {
  it("chaque produit cite une source et une date, sans donnée fictive", () => {
    for (const p of PRODUCTS) {
      expect(p.verification.sources.length).toBeGreaterThan(0);
      expect(p.demo).toBe(false);
      if (p.price) expect(p.price.observedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });
  it("les matières renvoient vers des déclinaisons du showroom valides", () => {
    for (const m of MATERIALS) {
      const refs = [m.showroom, m.textures.kind === "showroom" ? m.textures.ref : undefined, m.textures.kind === "photo" ? m.textures.fallbackRef : undefined].filter(Boolean) as string[];
      for (const r of refs) expect(parseVariant(r), `${m.id} → ${r}`).not.toBeNull();
    }
  });
  it("la bibliothèque 3D a des dimensions pour chaque meuble", () => {
    expect(FURNITURE.length).toBeGreaterThanOrEqual(15);
    for (const f of FURNITURE) expect(f.dims, f.id).not.toBeNull();
  });
});
