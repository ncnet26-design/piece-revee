import { describe, expect, it } from "vitest";
import { offlineAnswer, searchKnowledge } from "@/lib/camille";

describe("Camille hors ligne (base de connaissances)", () => {
  it("répond aux distances de plantation avec la source du Code civil", () => {
    const a = offlineAnswer("À quelle distance du voisin puis-je planter une haie ?");
    expect(a.content).toContain("2 m");
    expect(a.sources?.some((s) => s.title.includes("Code civil"))).toBe(true);
  });
  it("renvoie vers un professionnel pour un mur porteur", () => {
    const a = offlineAnswer("Puis-je abattre un mur porteur dans mon salon ?");
    expect(a.content).toMatch(/architecte|bureau d'études/);
  });
  it("refuse poliment le hors sujet", () => {
    expect(offlineAnswer("Donne-moi une recette de cuisine").content).toContain("spécialisée");
  });
  it("ne suggère pas de fiches sans rapport", () => {
    const a = offlineAnswer("À quelle distance du voisin puis-je planter une haie ?");
    expect(a.content).not.toContain("[[f-bibendum]]");
  });
  it("trouve l'éclairage et la règle 60-30-10", () => {
    expect(searchKnowledge("éclairer mon salon le soir")[0]?.id).toBe("k-eclairage-couches");
    expect(searchKnowledge("règle 60 30 10 couleurs")[0]?.id).toBe("k-regle-60-30-10");
  });
});
