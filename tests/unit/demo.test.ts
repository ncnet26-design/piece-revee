import { describe, expect, it } from "vitest";
import { parseStudy } from "@core/schemas/study.ts";
import { DEMO_EXTERIOR, DEMO_INTERIOR } from "@/lib/demo-studies";
import { plantById } from "@/content/index";

describe("études d'exemple", () => {
  it("respectent le schéma validé côté serveur", () => {
    expect(parseStudy(DEMO_INTERIOR)).toMatchObject({ ok: true });
    expect(parseStudy(DEMO_EXTERIOR)).toMatchObject({ ok: true });
  });
  it("ne citent que des plantes de la base", () => {
    for (const p of DEMO_EXTERIOR.plants) expect(plantById.has(p.plantId), p.plantId).toBe(true);
  });
});
