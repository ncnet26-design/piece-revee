import { describe, expect, it } from "vitest";
import { accord, attributsObjet } from "@/lib/attributs";

describe("correspondance stricte meuble ↔ produit", () => {
  const table = attributsObjet({ label: "Table basse ronde", materials: ["noyer"], colors: [{ name: "Brun noyer" }], shape: ["ronde"] });
  it("écarte une autre essence de bois", () => {
    expect(accord(table, "Table basse ronde en chêne massif").ok).toBe(false);
  });
  it("garde la même essence et montre les points communs", () => {
    const a = accord(table, "Table basse ronde en noyer massif, 80 cm");
    expect(a.ok).toBe(true);
    expect(a.communs).toEqual(expect.arrayContaining(["noyer", "rond"]));
  });
  it("écarte une autre forme ou une autre couleur", () => {
    expect(accord(table, "Table basse carrée en noyer").ok).toBe(false);
    const canape = attributsObjet({ label: "Canapé courbe", materials: ["velours"], colors: [{ name: "Vert sauge" }] });
    expect(accord(canape, "Canapé 3 places velours bleu marine").ok).toBe(false);
    expect(accord(canape, "Canapé 3 places velours vert olive").ok).toBe(true);
  });
  it("ne pénalise pas un produit qui ne précise pas la matière", () => {
    expect(accord(table, "Table basse ronde").ok).toBe(true);
  });
  it("accepte un produit bicolore qui contient la couleur du meuble", () => {
    const tapis = attributsObjet({ label: "Tapis rayé", colors: [{ name: "Noir" }] });
    expect(accord(tapis, "Tapis rond noir et blanc").ok).toBe(true);
  });
});
