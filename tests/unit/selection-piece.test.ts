import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { norm } from "@/lib/catalogue";
import { choisirMeubles, consigneProduit } from "@/lib/selection-piece";

const charger = async (f: string) => JSON.parse(readFileSync(`public/boutique/${f}.json`, "utf8"));

describe("vrais meubles choisis avant le dessin", () => {
  for (const [piece, style, g] of [["salon", "Japandi chaleureux chêne lin", "moyen"], ["salle-de-bain", "Wabi-sabi pierre bois", "moyen"], ["chambre", "Scandinave", "petit"], ["cuisine", "Industriel métal noir", "haut"], ["salle-a-manger", "Mid-century noyer", "moyen"]] as const) {
    it(`${piece} (${style}, ${g}) : un produit réel par emplacement, du bon budget, du bon type`, async () => {
      const r = await choisirMeubles(piece, style, g, charger as never);
      console.log(`== ${piece} / ${style} / ${g}\n${r.map((c) => `  ${c.emplacement.id}: ${c.produit.n} | ${c.produit.m} | ${c.produit.p} €`).join("\n")}`);
      expect(r.length).toBeGreaterThanOrEqual(3);
      for (const c of r) {
        expect(c.produit.i).toBeTruthy();
        expect((c.produit as { g?: string }).g).toBe(g);
        const premier = norm(c.emplacement.requete).split(" ")[0]!;
        const SYN: Record<string, string[]> = { tabouret: ["tabou", "barstool", "stool"], canape: ["canap", "sofa"], fauteuil: ["fauteu", "armchair", "lounge"], suspension: ["suspe", "pendant", "lustre"] };
        expect((SYN[premier] ?? [premier.slice(0, 5)]).some((m) => norm(c.produit.n).includes(m))).toBe(true);
        expect(norm(c.produit.n)).not.toMatch(/ensemble|lot de/);
        expect(consigneProduit(c).length).toBeLessThanOrEqual(160);
      }
    });
  }
});
