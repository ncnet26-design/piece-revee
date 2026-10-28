import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => { try { localStorage.setItem("pr_camille_guide", "off"); localStorage.setItem("pr_camille_vu", "1"); } catch { /* */ } });
});

test("studio : une image importée, un meuble désigné, des alternatives réelles, la liste et le budget", async ({ page }) => {
  await page.goto("/studio/");
  await page.locator('input[type="file"]').first().setInputFiles("public/inspirations/villas-14.webp");
  await expect(page.getByRole("button", { name: "Désigner un meuble" })).toBeVisible({ timeout: 15_000 });
  await page.getByRole("button", { name: "Désigner un meuble" }).click();
  await page.locator('img[alt="villas-14"]').click({ position: { x: 200, y: 200 } });
  await page.getByRole("button", { name: "Table basse", exact: true }).click();
  await page.getByRole("button", { name: "travertin", exact: true }).click();
  await page.getByRole("button", { name: "Organique", exact: true }).click();
  await page.getByRole("button", { name: "Chercher des modèles ressemblants" }).click();
  const panel = page.getByRole("complementary", { name: "Table basse" });
  await expect(panel).toBeVisible();
  await expect(panel.getByText("Table basse travertin, Guimel", { exact: true })).toBeVisible();
  // Lien marchand réel, ouvert dans un nouvel onglet.
  const link = panel.getByRole("link", { name: /Table basse travertin, Guimel/ });
  await expect(link).toHaveAttribute("href", "https://www.laredoute.fr/ppdp/prod-602053824.aspx");
  await expect(link).toHaveAttribute("target", "_blank");
  // Une table en bouleau n'est pas assez ressemblante.
  await expect(panel.getByText(/BORGEBY/)).toHaveCount(0);
  // Gammes et filtre de budget.
  await expect(panel.getByRole("heading", { name: "Économique" })).toBeVisible();
  await expect(panel.getByRole("heading", { name: "Premium" })).toBeVisible();
  await panel.getByText("Filtres").click();
  await panel.getByLabel("Budget max.").selectOption("400");
  await expect(panel.getByText("Table basse travertin, Guimel", { exact: true })).toHaveCount(0);
  await expect(panel.getByText("Table basse organique effet travertin 120 × 65 cm, Oris", { exact: true })).toBeVisible();
  await panel.getByRole("button", { name: "Ajouter à ma liste" }).first().click();
  await page.getByRole("button", { name: "Fermer la fiche" }).click();
  await page.getByRole("button", { name: /Ma liste/ }).click();
  await expect(page.getByText("Table basse organique effet travertin 120 × 65 cm, Oris", { exact: true })).toBeVisible();
  await expect(page.getByRole("complementary", { name: "Budget" })).toContainText("119,99");
});

test("studio : une demande en langage naturel est comprise", async ({ page }) => {
  await page.goto("/studio/");
  await page.getByRole("textbox", { name: /Demander une modification/ }).fill("Remplace uniquement la table basse par quelque chose de plus sculptural, pour moins de 400 €");
  await page.getByRole("button", { name: "Demander", exact: true }).click();
  await expect(page.getByText(/Compris : Objet : la table basse · Budget : moins de 400 €/)).toBeVisible();
});

test("studio : création par IA (service simulé), suivi de la tâche et nouvelle version", async ({ page }) => {
  const fs = await import("node:fs");
  const png = `data:image/webp;base64,${fs.readFileSync("public/inspirations/villas-14.webp").toString("base64")}`;
  let polls = 0;
  await page.route("**/v2/jobs", (r) => r.fulfill({ status: 201, contentType: "application/json", headers: { "Access-Control-Allow-Origin": "*" }, body: JSON.stringify({ id: "11111111-1111-4111-8111-111111111111", status: "en_cours", mode: "generate", provider: "openai", model: "gpt-image", quality: "standard", brief: "x", keep: [], width: 1536, height: 1024, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), attempts: 1, costUsd: 0.06, imageUrl: null }) }));
  await page.route("**/v2/jobs/11111111-1111-4111-8111-111111111111", (r) => { polls++; r.fulfill({ status: 200, contentType: "application/json", headers: { "Access-Control-Allow-Origin": "*" }, body: JSON.stringify({ id: "11111111-1111-4111-8111-111111111111", status: polls > 1 ? "terminee" : "en_cours", mode: "generate", provider: "openai", model: "gpt-image", quality: "standard", brief: "x", keep: [], width: 1536, height: 1024, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), attempts: 1, costUsd: 0.06, imageUrl: polls > 1 ? png : null }) }); });
  await page.goto("/studio/");
  await page.getByRole("button", { name: "Créer", exact: true }).click();
  await page.getByRole("button", { name: "Utiliser l'exemple" }).click();
  await page.getByRole("combobox", { name: /Propositions/ }).selectOption("1").catch(() => page.locator("select").first().selectOption("1"));
  await page.getByRole("button", { name: "Créer la pièce" }).click();
  await expect(page.getByText(/Création en cours/)).toBeVisible();
  await expect(page.getByText("Création 1")).toBeVisible({ timeout: 20_000 });
  await page.getByRole("button", { name: "Explorer les meubles" }).click();
  await expect(page.getByRole("button", { name: "Désigner un meuble" })).toBeVisible();
});

test("studio : erreur du service affichée clairement", async ({ page }) => {
  await page.route("**/v2/jobs", (r) => r.fulfill({ status: 503, contentType: "application/json", headers: { "Access-Control-Allow-Origin": "*" }, body: JSON.stringify({ erreur: "Aucun fournisseur d'images n'est configuré (clé manquante)." }) }));
  await page.goto("/studio/");
  await page.getByRole("button", { name: "Créer", exact: true }).click();
  await page.getByRole("button", { name: "Créer la pièce" }).click();
  await expect(page.getByText(/clé manquante/)).toBeVisible();
});

test("studio 3D : toucher la table basse ouvre sa fiche et des tables réelles ressemblantes", async ({ page, isMobile }) => {
  test.setTimeout(150_000);
  await page.goto("/studio/");
  await page.getByRole("button", { name: "3D", exact: true }).click();
  await expect(page.getByTestId("scene-3d").locator("canvas")).toBeVisible({ timeout: 30_000 });
  await expect(page.getByText("Chargement des meubles et des matières…")).toHaveCount(0, { timeout: 120_000 });
  await page.waitForTimeout(800);
  const pos = await page.evaluate(() => (window as unknown as { __studio: { screenPosition(u: string): { x: number; y: number } | null } }).__studio.screenPosition("table-basse-1"));
  expect(pos).not.toBeNull();
  // Sur mobile : un vrai toucher (événements tactiles), sur ordinateur : un clic.
  if (isMobile) await page.touchscreen.tap(pos!.x, pos!.y); else await page.mouse.click(pos!.x, pos!.y);
  const panel = page.getByRole("complementary", { name: "Table basse galet en travertin" });
  await expect(panel).toBeVisible({ timeout: 15_000 });
  await expect(panel.getByText(/table-basse-1/)).toBeVisible();
  await expect(panel.getByText("Table basse travertin, Guimel", { exact: true })).toBeVisible();
});

test("studio : accessibilité (axe)", async ({ page }) => {
  await page.goto("/studio/");
  await page.getByRole("button", { name: "Créer", exact: true }).click();
  const r = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).exclude("canvas").analyze();
  expect(r.violations.map((v) => `${v.id}: ${v.nodes.length}`)).toEqual([]);
});
