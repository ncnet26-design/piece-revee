import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const noJsErrors = (page: import("@playwright/test").Page) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => { if (m.type() === "error" && !m.text().includes("404") && !/ERR_TUNNEL|ERR_NAME_NOT_RESOLVED|ERR_CONNECTION/.test(m.text())) errors.push(m.text()); });
  return errors;
};

test.beforeEach(async ({ page }) => {
  // Choix de cookies déjà fait : le bandeau ne masque pas les éléments testés.
  await page.addInitScript(() => localStorage.setItem("pr_consent", JSON.stringify({ analytics: false, at: "2026-10-26", version: 1 })));
});

test("accueil : promesse, appels à l'action, visite 3D", async ({ page }) => {
  const errors = noJsErrors(page);
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("réellement");
  await expect(page.getByRole("link", { name: "Créer ma planche" })).toHaveAttribute("href", /planche/);
  await expect(page.getByRole("link", { name: "Visiter en 3D" }).first()).toHaveAttribute("href", /visite-3d/);
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

for (const url of ["/", "/planche/", "/visite-3d/", "/galerie/", "/quiz/", "/projet/nouveau/", "/projet/etude/?id=exemple-salon", "/matieres/", "/tarifs/", "/compte/", "/legal/confidentialite/"]) {
  test(`accessibilité (axe, WCAG 2.2 AA) : ${url}`, async ({ page }) => {
    test.setTimeout(90_000);
    await page.goto(url);
    await page.waitForLoadState("networkidle");
    const r = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).exclude("canvas").analyze();
    expect(r.violations.map((v) => `${v.id} (${v.nodes.length}) ${v.nodes[0]?.target.join(" ")}`)).toEqual([]);
  });
}

test("aucun débordement horizontal sur mobile", async ({ page, isMobile }) => {
  test.skip(!isMobile, "mobile uniquement");
  for (const url of ["/", "/planche/", "/visite-3d/", "/galerie/", "/projet/etude/?id=exemple-terrasse", "/tarifs/", "/matieres/zellige/"]) {
    await page.goto(url);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), url).toBe(true);
  }
});

test("visite 3D : pièces, style, modification d'un meuble, sauvegarde", async ({ page }) => {
  test.setTimeout(90_000);
  const errors = noJsErrors(page);
  await page.addInitScript(() => localStorage.setItem("pr_home3d_hint", "1"));
  await page.goto("/visite-3d/");
  await expect(page.getByRole("heading", { level: 1, name: "Visite 3D" })).toBeVisible();
  await expect(page.getByText("Chargement de la 3D")).toBeHidden({ timeout: 30_000 });
  await expect(page.getByText("La 3D ne peut pas s'afficher")).toHaveCount(0);
  await page.getByRole("navigation", { name: "Pièces" }).getByRole("button", { name: "Chambre" }).click();
  await page.getByRole("button", { name: "Pièce", exact: true }).click();
  const panel = page.getByRole("complementary", { name: "Réglages" });
  await expect(panel.getByRole("heading", { name: "Chambre" })).toBeVisible();
  await panel.getByRole("button", { name: "Scandinave" }).click();
  await panel.getByRole("button", { name: "Lit" }).click();
  await expect(panel.getByRole("heading", { name: /Lit/ })).toBeVisible();
  await panel.getByRole("button", { name: "180 × 200" }).click();
  await panel.getByRole("button", { name: "Bleu nuit" }).click();
  await expect(panel.getByText("L 194 cm")).toBeVisible();
  await page.waitForTimeout(600);
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("pr_home3d_v1") ?? "{}"));
  const bed = saved.items.find((i: { type: string }) => i.type === "lit");
  expect(bed).toMatchObject({ variant: "180 × 200", color: "#232F4A" });
  expect(saved.rooms.chambre.wall).toEqual({ kind: "peinture", hex: "#F2F2EE" });
  await page.reload();
  await expect(page.getByText("Chargement de la 3D")).toBeHidden({ timeout: 30_000 });
  const again = await page.evaluate(() => JSON.parse(localStorage.getItem("pr_home3d_v1") ?? "{}"));
  expect(again.items.find((i: { type: string }) => i.type === "lit").color).toBe("#232F4A");
  expect(errors).toEqual([]);
});

test("visite 3D : ajouter un objet et une astuce", async ({ page }) => {
  test.setTimeout(90_000);
  await page.addInitScript(() => localStorage.setItem("pr_home3d_hint", "1"));
  await page.goto("/visite-3d/");
  await expect(page.getByText("Chargement de la 3D")).toBeHidden({ timeout: 30_000 });
  const before = await page.evaluate(() => JSON.parse(localStorage.getItem("pr_home3d_v1") ?? "{\"items\":[]}").items.length);
  await page.getByRole("button", { name: "+ Ajouter" }).click();
  await page.getByRole("complementary", { name: "Réglages" }).getByRole("button", { name: "Lampadaire" }).click();
  await expect(page.getByRole("complementary", { name: "Réglages" }).getByRole("heading", { name: "Lampadaire" })).toBeVisible();
  await page.getByRole("button", { name: "Astuces" }).click();
  await page.getByLabel("Partager une astuce").fill("Une lampe dans chaque coin sombre.");
  await page.getByRole("button", { name: "Ajouter à la pièce" }).click();
  await page.waitForTimeout(600);
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("pr_home3d_v1") ?? "{}"));
  expect(saved.items.length).toBeGreaterThan(before === 0 ? 50 : before);
  expect(saved.notes.map((n: { text: string }) => n.text)).toContain("Une lampe dans chaque coin sombre.");
});

test("plan : dessiner son logement puis le visiter en 3D", async ({ page }) => {
  test.setTimeout(120_000);
  const errors = noJsErrors(page);
  page.on("dialog", (d) => void d.accept());
  await page.addInitScript(() => localStorage.setItem("pr_home3d_hint", "1"));
  await page.goto("/visite-3d/");
  await expect(page.getByText("Chargement de la 3D")).toBeHidden({ timeout: 30_000 });
  await page.getByRole("button", { name: "Mon plan" }).click();
  const dlg = page.getByRole("dialog", { name: "Plan de mon logement" });
  await expect(dlg).toBeVisible();
  const axe = await new AxeBuilder({ page }).include('[role="dialog"]').withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
  expect(axe.violations.map((v) => v.id)).toEqual([]);
  await dlg.getByLabel("Partir d'un modèle").selectOption("t2");
  await expect(dlg.getByRole("button", { name: "Séjour" })).toBeVisible();
  await dlg.getByLabel("Type de pièce à ajouter").selectOption("chambre");
  await dlg.getByRole("button", { name: "+ Pièce" }).click();
  await expect(dlg.getByLabel("Nom")).toHaveValue("Chambre 2");
  await dlg.getByLabel("Largeur (m)").fill("3,6");
  await dlg.getByLabel("Largeur (m)").press("Enter");
  await expect(dlg.getByText("10,8 m²", { exact: false }).first()).toBeVisible();
  await dlg.getByRole("button", { name: "Meubler automatiquement" }).click();
  await dlg.getByRole("button", { name: "Voir en 3D" }).click();
  await expect(dlg).toBeHidden();
  const rooms = page.getByRole("navigation", { name: "Pièces" });
  await expect(rooms.getByRole("button", { name: "Chambre 2" })).toBeVisible();
  await expect(rooms.getByRole("button", { name: "Cuisine" })).toBeVisible();
  await page.waitForTimeout(600);
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("pr_home3d_v1") ?? "{}"));
  expect(saved.layout.rooms).toHaveLength(6);
  const ch2 = saved.layout.rooms.find((r: { name: string }) => r.name === "Chambre 2");
  expect(ch2.x1 - ch2.x0).toBeCloseTo(3.6);
  expect(saved.items.some((i: { type: string; x: number; z: number }) => i.type === "lit" && i.x > ch2.x0 && i.x < ch2.x1 && i.z > ch2.z0 && i.z < ch2.z1)).toBe(true);
  await rooms.getByRole("button", { name: "Chambre 2" }).click();
  expect(errors).toEqual([]);
});

test("planche 3D : ajouter, modifier, retirer, fiche matériaux et partage", async ({ page, context, isMobile }) => {
  test.skip(isMobile, "parcours souris");
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  const errors = noJsErrors(page);
  await page.goto("/planche/");
  await expect(page.getByText("Préparation de la planche")).toHaveCount(0, { timeout: 30000 });
  await expect(page.getByRole("heading", { name: /Ce qui compose/ })).toBeVisible();
  const before = await page.locator('section[aria-labelledby="fiche"] > ul > li').count();
  // Ajout d'une matière depuis la bibliothèque : elle est sélectionnée et apparaît dans la fiche.
  await page.getByRole("searchbox", { name: "Rechercher une matière" }).fill("ardoise");
  await page.getByRole("button", { name: /Ardoise/ }).first().click();
  const sel = page.getByRole("region", { name: "Élément sélectionné" });
  await expect(sel).toContainText("Ardoise");
  await sel.getByRole("button", { name: "Galet" }).click();
  await expect(sel.getByRole("button", { name: "Galet" })).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator('section[aria-labelledby="fiche"] > ul > li')).toHaveCount(before + 1);
  await expect(page.locator('section[aria-labelledby="fiche"] > ul').getByRole("link", { name: /IKEA/ }).first()).toHaveAttribute("href", /ikea\.com/);
  // Peinture, puis retrait.
  await page.getByRole("tab", { name: "Peintures" }).click();
  await page.getByRole("button", { name: /Sauge/ }).click();
  await expect(sel).toContainText("Peinture sauge");
  await sel.getByRole("button", { name: "Retirer" }).click();
  await expect(sel).toHaveCount(0);
  // Modèle de planche et partage par lien.
  await page.getByRole("button", { name: "Modèles" }).click();
  await page.getByRole("dialog").getByRole("button", { name: /Terre cuite/ }).click();
  await expect(page.getByRole("textbox", { name: "Titre de la planche" })).toHaveValue("Terre cuite et tadelakt");
  await page.getByRole("button", { name: "Partager" }).click();
  const link = await page.evaluate(() => navigator.clipboard.readText());
  expect(link).toMatch(/\/planche\/#p=/);
  await page.goto(link.replace(/^https?:\/\/[^/]+/, ""));
  await expect(page.getByRole("textbox", { name: "Titre de la planche" })).toHaveValue("Terre cuite et tadelakt");
  expect(errors).toEqual([]);
});
