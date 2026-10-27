import { describe, expect, it } from "vitest";
import { MAPPINGS, categorize, dedupKey, normalizeRow, parseCsv, parseDims, parsePrice } from "@core/feed.ts";

// Données de test uniquement (fictives) : jamais affichées sur le site.
const CSV = `aw_product_id;product_name;search_price;aw_deep_link;merchant_deep_link;merchant_image_url;brand_name;ean;merchant_category;colour;in_stock;description;dimensions
T1;"Tapis en jute naturel, 200 x 290 cm";149,00;https://aff.test/t1;https://shop.test/t1;https://img.test/t1.jpg;Test;3700000000017;Tapis;naturel;1;Tapis tissé main en jute;200 x 290
T2;Suspension papier Ø 60;"59.90";https://aff.test/t2;https://shop.test/t2;https://img.test/t2.jpg;Test;;Luminaires;blanc;0;Suspension en papier;
T3;Objet mystère;10;https://aff.test/t3;;https://img.test/t3.jpg;;;;;1;;
T4;Canapé 3 places;;https://aff.test/t4;;https://img.test/t4.jpg;;;Canapés;gris;1;;
T5;Fauteuil rotin;250;http://aff.test/t5;;https://img.test/t5.jpg;;;Fauteuils;naturel;1;;`;

describe("ingestion des flux", () => {
  const rows = parseCsv(CSV);
  it("lit un CSV à point-virgule avec guillemets", () => {
    expect(rows).toHaveLength(5);
    expect(rows[0]?.product_name).toBe("Tapis en jute naturel, 200 x 290 cm");
  });
  it("normalise un produit complet", () => {
    const r = normalizeRow(rows[0]!, MAPPINGS.awin!);
    expect(r).toMatchObject({ ok: true, product: { category: "Tapis", priceCents: 14900, inStock: true, gtin: "3700000000017", dimsCm: { w: 200, d: 290, h: null }, materials: ["jute"] } });
  });
  it("garde le stock du flux", () => {
    expect(normalizeRow(rows[1]!, MAPPINGS.awin!)).toMatchObject({ ok: true, product: { category: "Luminaire", priceCents: 5990, inStock: false } });
  });
  it("rejette les lignes incomplètes au lieu d'inventer", () => {
    expect(normalizeRow(rows[2]!, MAPPINGS.awin!)).toEqual({ ok: false, reason: "catégorie non reconnue" });
    expect(normalizeRow(rows[3]!, MAPPINGS.awin!)).toEqual({ ok: false, reason: "prix manquant" });
    expect(normalizeRow(rows[4]!, MAPPINGS.awin!)).toEqual({ ok: false, reason: "lien affilié non https" });
  });
  it("prix, dimensions, catégories et déduplication", () => {
    expect(parsePrice("1.299,00 €")).toBe(129900);
    expect(parsePrice("gratuit")).toBeNull();
    expect(parseDims("L 120 x P 45 x H 80")).toEqual({ w: 120, d: 45, h: 80 });
    expect(categorize("Lampadaire arc laiton")).toBe("Luminaire");
    expect(categorize("Parasol déporté 3 m")).toBe("Ombrage");
    const a = normalizeRow(rows[0]!, MAPPINGS.awin!); const b = normalizeRow({ ...rows[0]!, aw_product_id: "T9" }, MAPPINGS.awin!);
    if (a.ok && b.ok) expect(dedupKey(a.product)).toBe(dedupKey(b.product));
  });
});
