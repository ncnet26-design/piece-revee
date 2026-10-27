import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const noJsErrors = (page: import("@playwright/test").Page) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => { if (m.type() === "error" && !m.text().includes("404")) errors.push(m.text()); });
  return errors;
};

test.beforeEach(async ({ page }) => {
  // Choix de cookies déjà fait : le bandeau ne masque pas les éléments testés.
  await page.addInitScript(() => localStorage.setItem("pr_consent", JSON.stringify({ analytics: false, at: "2026-10-26", version: 1 })));
});

test("accueil : promesse, appel à l'action, comparateur", async ({ page }) => {
  const errors = noJsErrors(page);
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("réellement");
  await expect(page.getByRole("link", { name: "Transformer mon espace" })).toBeVisible();
  await page.getByLabel("Comparer avant et après").first().fill("20");
  expect(errors).toEqual([]);
});

test("sans mesure d'audience configurée : aucun bandeau ni traceur", async ({ browser }) => {
  test.skip(!!process.env.NEXT_PUBLIC_POSTHOG_KEY, "mesure d'audience configurée");
  const page = await (await browser.newContext()).newPage();
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  await expect(page.getByRole("region", { name: "Cookies" })).toHaveCount(0);
  expect(await page.evaluate(() => document.getElementById("ph-script"))).toBeNull();
});

test("bandeau cookies : refuser est aussi simple qu'accepter", async ({ browser }) => {
  test.skip(!process.env.NEXT_PUBLIC_POSTHOG_KEY, "bandeau affiché seulement si la mesure d'audience est configurée");
  const page = await (await browser.newContext()).newPage();
  await page.goto("/");
  const region = page.getByRole("region", { name: "Cookies" });
  await expect(region.getByRole("button", { name: "Refuser" })).toBeVisible();
  await expect(region.getByRole("button", { name: "Accepter" })).toBeVisible();
  await region.getByRole("button", { name: "Refuser" }).click();
  await expect(region).toBeHidden();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem("pr_consent") ?? "{}").analytics)).toBe(false);
  await page.reload();
  await expect(page.getByRole("region", { name: "Cookies" })).toBeHidden();
  expect(await page.evaluate(() => document.getElementById("ph-script"))).toBeNull();
});

test("galerie : filtres, fiche, moodboard", async ({ page }) => {
  await page.goto("/galerie/");
  await page.getByRole("button", { name: "Extérieur" }).click();
  await page.getByRole("group", { name: "Styles" }).getByRole("button", { name: "Jardin japonais" }).click();
  await expect(page.locator("article.card")).toHaveCount(5);
  await page.locator("article.card h3 button").first().click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByRole("link", { name: "Je veux ça chez moi" })).toBeVisible();
  await dialog.getByRole("button", { name: "Ajouter au moodboard" }).click();
  await dialog.getByRole("button", { name: "Fermer" }).click();
  await page.goto("/moodboard/");
  await expect(page.locator("article.card")).toHaveCount(1);
});

test("quiz : 16 réponses donnent un profil", async ({ page }) => {
  await page.goto("/quiz/");
  for (let i = 0; i < 16; i++) await page.getByRole("button", { name: i % 2 ? "J'aime" : "Pas pour moi" }).click();
  await expect(page.getByRole("heading", { name: "Votre profil est prêt" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Lancer mon étude" })).toBeVisible();
});

test("étude complète en démonstration : création, progression, onglets, guide, PDF", async ({ page }) => {
  const errors = noJsErrors(page);
  await page.goto("/projet/nouveau/");
  await page.getByLabel("Espace").selectOption("Terrasse");
  await page.getByLabel("Code postal (pour le climat et les plantes)").fill("13100");
  await page.getByRole("button", { name: "Lancer l'étude" }).click();
  await expect(page).toHaveURL(/\/projet\/etude\/\?id=/);
  await expect(page.getByRole("heading", { name: "Nous préparons votre étude" })).toBeVisible();
  await expect(page.getByRole("tab", { name: "Plantes" })).toBeVisible({ timeout: 15_000 });
  for (const t of ["Plan sur photo", "Concept et palette", "Achats", "Plantes", "Tutos", "Sur-mesure", "Guide d'étapes", "Budget"]) {
    await page.getByRole("tab", { name: t }).click();
    await expect(page.getByRole("tabpanel")).toBeVisible();
  }
  await page.getByRole("tab", { name: "Guide d'étapes" }).click();
  const first = page.getByRole("tabpanel").getByRole("checkbox").first();
  await first.check();
  await expect(first).toBeChecked();
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Exporter en PDF" }).click();
  expect((await download).suggestedFilename()).toMatch(/\.pdf$/);
  await page.getByLabel("Demander une modification").fill("plus lumineux");
  await page.getByRole("button", { name: "Affiner" }).click();
  await expect(page.locator(".eyebrow", { hasText: "version 2" })).toBeVisible();
  expect(errors).toEqual([]);
});

test("Camille répond avec ses sources, et renvoie vers un pro pour la structure", async ({ page, isMobile }) => {
  await page.goto("/");
  await page.getByRole("button", { name: isMobile ? "Camille" : "Demander à Camille", exact: true }).click();
  const drawer = page.getByRole("complementary", { name: "Camille, assistante IA" });
  await drawer.getByLabel("Votre message").fill("Puis-je abattre un mur porteur dans mon salon ?");
  await drawer.getByRole("button", { name: "Envoyer" }).click();
  await expect(drawer.getByText(/architecte ou un bureau d'études/).first()).toBeVisible();
  await drawer.getByLabel("Votre message").fill("À quelle distance du voisin planter une haie ?");
  await drawer.getByRole("button", { name: "Envoyer" }).click();
  await expect(drawer.getByText(/Code civil/).first()).toBeVisible();
});

test("tarifs : 7 offres, paiement désactivé proprement en démonstration", async ({ page }) => {
  await page.goto("/tarifs/");
  await expect(page.locator("article.panel")).toHaveCount(7);
  await page.getByRole("button", { name: "Choisir" }).first().click();
  await expect(page.locator("p[role=alert]")).toContainText("pas encore activé");
});

test("compte : export des données et suppression avec confirmation", async ({ page }) => {
  await page.goto("/compte/");
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Exporter toutes mes données" }).click();
  expect((await download).suggestedFilename()).toBe("piece-revee-donnees.json");
  await page.getByRole("button", { name: "Supprimer", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("SUPPRIMER");
  await page.getByLabel("Tapez SUPPRIMER pour confirmer").fill("SUPPRIMER");
  await page.getByRole("button", { name: "Supprimer", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("effacées");
});

test("pages éditoriales et SEO", async ({ page }) => {
  for (const [url, h1] of [["/matieres/travertin/", "Travertin"], ["/mobilier/togo/", "Togo"], ["/lieux/savoye/", "Villa Savoye"], ["/plantes/lavande-vraie/", "Lavande vraie"], ["/styles/japandi/", "Japandi"], ["/guides/creer-un-jardin-sec/", "jardin sec"], ["/legal/cgv/", "Conditions générales de vente"]] as const) {
    await page.goto(url);
    await expect(page.getByRole("heading", { level: 1 })).toContainText(h1);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", /piece-revee/);
    expect(await page.locator('script[type="application/ld+json"]').count()).toBeGreaterThan(0);
  }
  const res = await page.goto("/sitemap.xml");
  expect(await res?.text()).toContain("/matieres/travertin/");
});

test("404 utile", async ({ page }) => {
  await page.goto("/page-qui-nexiste-pas/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("n'existe pas");
});

for (const url of ["/", "/galerie/", "/quiz/", "/projet/nouveau/", "/projet/etude/?id=exemple-salon", "/matieres/", "/tarifs/", "/compte/", "/legal/confidentialite/"]) {
  test(`accessibilité (axe, WCAG 2.2 AA) : ${url}`, async ({ page }) => {
    await page.goto(url);
    await page.waitForLoadState("networkidle");
    const r = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).exclude("canvas").analyze();
    expect(r.violations.map((v) => `${v.id} (${v.nodes.length}) ${v.nodes[0]?.target.join(" ")}`)).toEqual([]);
  });
}

test("aucun débordement horizontal sur mobile", async ({ page, isMobile }) => {
  test.skip(!isMobile, "mobile uniquement");
  for (const url of ["/", "/galerie/", "/projet/etude/?id=exemple-terrasse", "/tarifs/", "/matieres/zellige/"]) {
    await page.goto(url);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), url).toBe(true);
  }
});
