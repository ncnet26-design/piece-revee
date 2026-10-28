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
  await page.addInitScript(() => { localStorage.setItem("pr_consent", JSON.stringify({ analytics: false, at: "2026-10-26", version: 1 })); localStorage.setItem("pr_camille_guide", "off"); });
});

test("accueil : promesse, appels à l'action, visite 3D", async ({ page }) => {
  const errors = noJsErrors(page);
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("réellement");
  await expect(page.getByRole("link", { name: "Transformer ma pièce" })).toHaveAttribute("href", /transformer/);
  await expect(page.getByRole("link", { name: "Explorer le showroom" }).first()).toHaveAttribute("href", /showroom/);
  const tools = page.getByRole("list", { name: "Les outils" });
  await expect(tools.getByRole("link", { name: /Créer une planche/ })).toHaveAttribute("href", /planche/);
  await expect(tools.getByRole("link", { name: /Générer un concept/ })).toHaveAttribute("href", /concept/);
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
  const drawer = page.getByRole("complementary", { name: "Camille, designer d'intérieur virtuelle" });
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

for (const url of ["/", "/showroom/", "/transformer/", "/concept/", "/planche/", "/visite-3d/", "/galerie/", "/quiz/", "/projet/nouveau/", "/projet/etude/?id=exemple-salon", "/matieres/", "/tarifs/", "/compte/", "/legal/confidentialite/"]) {
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
  test.setTimeout(90_000);
  for (const url of ["/", "/showroom/", "/transformer/", "/concept/", "/planche/", "/visite-3d/", "/galerie/", "/projet/etude/?id=exemple-terrasse", "/tarifs/", "/matieres/zellige/"]) {
    await page.goto(url);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), url).toBe(true);
  }
});

test("visite 3D : pièces, style, modification d'un meuble, sauvegarde", async ({ page }) => {
  test.setTimeout(150_000);
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
  test.setTimeout(180_000);
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
  test.setTimeout(120_000);
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  const errors = noJsErrors(page);
  await page.goto("/planche/");
  await expect(page.getByText("Préparation de la planche")).toHaveCount(0, { timeout: 30000 });
  await expect(page.getByRole("heading", { name: /Ce qui compose/ })).toBeVisible();
  const before = await page.locator('section[aria-labelledby="fiche"] > ul > li').count();
  // Ajout d'une matière depuis la bibliothèque : elle est sélectionnée et apparaît dans la fiche.
  await page.getByRole("tab", { name: "Matières" }).click();
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

test("showroom : familles, déclinaisons, fiche 3D et ajout à la planche", async ({ page }) => {
  test.setTimeout(120_000);
  const errors = noJsErrors(page);
  await page.goto("/showroom/?f=zellige");
  await expect(page.getByRole("heading", { level: 2, name: "Zellige" })).toBeVisible();
  // Changer de format met à jour les déclinaisons.
  await page.getByRole("group", { name: "Format" }).getByRole("button", { name: "Hexagone" }).click();
  const card = page.getByRole("button", { name: /^Vert émeraude Hexagone/ });
  await expect(card).toBeVisible();
  await card.click();
  const dlg = page.getByRole("dialog", { name: /Zellige vert émeraude/ });
  await expect(dlg).toBeVisible();
  await dlg.getByRole("group", { name: "Joint" }).getByRole("button", { name: "Joint foncé" }).click();
  await expect(dlg.getByRole("heading", { level: 2 })).toHaveText("Zellige vert émeraude");
  await expect(page).toHaveURL(/v=sr%3Azellige%3Aemeraude%3Ahexagone%3Abrillant%3Afonce/);
  await expect(dlg.getByRole("link", { name: /IKEA/ })).toHaveAttribute("href", /ikea\.com.*zellige/);
  await dlg.getByRole("button", { name: "Ajouter à ma planche" }).click();
  await expect(page.getByRole("status")).toContainText("ajouté à votre planche");
  await page.keyboard.press("Escape");
  await expect(dlg).toHaveCount(0);
  // Autre famille : les peintures sont classées par couleur.
  await page.getByRole("navigation", { name: "Familles de matières" }).getByRole("button", { name: "Peintures" }).click();
  await expect(page.getByRole("heading", { level: 3, name: "Verts" })).toBeVisible();
  // La déclinaison ajoutée est dans la planche, modifiable.
  await page.goto("/planche/").catch(() => page.goto("/planche/"));
  await expect(page.locator('section[aria-labelledby="fiche"]')).toContainText("Zellige vert émeraude");
  expect(errors).toEqual([]);
});

test("transformer : photo et trois inspirations donnent planche, références et budget", async ({ page, isMobile }) => {
  test.skip(isMobile, "parcours long, vérifié sur ordinateur");
  test.setTimeout(240_000);
  const errors = noJsErrors(page);
  await page.goto("/transformer/");
  await page.getByRole("button", { name: "Créer mon projet" }).click();
  await expect(page.getByText("Ajoutez d'abord une photo de votre pièce.")).toBeVisible({ timeout: 20_000 });
  const img = "public/visuels/hero-3d.webp";
  await page.getByLabel("Choisir la photo de votre pièce").setInputFiles(img);
  await page.getByLabel("Choisir l'inspiration 1").setInputFiles("public/visuels/planche-sombre.webp");
  await page.getByLabel("Choisir l'inspiration 2").setInputFiles("public/visuels/etude.webp");
  await page.getByRole("button", { name: "Créer mon projet" }).click();
  await expect(page.getByText(/Ajoutez trois inspirations/)).toBeVisible({ timeout: 20_000 });
  await page.getByLabel("Choisir l'inspiration 3").setInputFiles("public/visuels/visite-3d.webp");
  await page.getByRole("button", { name: "Cuisine" }).click();
  await page.getByRole("button", { name: "Créer mon projet" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Cuisine", { timeout: 200_000 });
  await expect(page.getByRole("img", { name: /Planche projet/ })).toBeVisible();
  await expect(page.getByRole("link", { name: "Télécharger l'image HD" })).toHaveAttribute("href", /^data:image\/jpeg/);
  await expect(page.getByRole("heading", { name: /références/ })).toBeVisible();
  // Rendu photoréaliste : le service d'images est simulé (aucun appel payant pendant les tests).
  await page.route("https://piece-revee-ia.ewanesteves26.workers.dev/redesign", async (route) => {
    const body = route.request().postDataJSON() as { photo: string; inspirations: string[]; brief: string };
    expect(body.photo).toMatch(/^data:image\/jpeg;base64,/);
    expect(body.inspirations).toHaveLength(3);
    expect(body.brief).toContain("Pièce : Cuisine");
    await route.fulfill({ status: 200, contentType: "application/json", headers: { "Access-Control-Allow-Origin": "*" }, body: JSON.stringify({ image: body.photo, restant: 5 }) });
  });
  await page.getByRole("button", { name: "Créer le rendu de ma pièce" }).click();
  await expect(page.getByRole("link", { name: "Télécharger le rendu" })).toBeVisible({ timeout: 60_000 });
  await expect(page.getByText("Il vous reste 5 rendus aujourd'hui.")).toBeVisible();
  // Budget : modifier un poste met à jour le total.
  const first = page.getByLabel(/^Mon budget :/).first();
  await first.fill("1000");
  await expect(page.locator("tfoot")).toContainText("€");
  expect(errors).toEqual([]);
});

test("générer un concept : phrase → image, palette et matières par rôle", async ({ page }) => {
  test.setTimeout(120_000);
  const errors = noJsErrors(page);
  const fs = await import("node:fs");
  const img = `data:image/webp;base64,${fs.readFileSync("public/visuels/visite-3d.webp").toString("base64")}`;
  // Le service d'images est simulé (aucun appel payant pendant les tests).
  await page.route("https://piece-revee-ia.ewanesteves26.workers.dev/concept", async (route) => {
    const body = route.request().postDataJSON() as { brief: string; aspect: string };
    expect(body.brief).toContain("velours");
    expect(body.aspect).toBe("4:5");
    await route.fulfill({ status: 200, contentType: "application/json", headers: { "Access-Control-Allow-Origin": "*" }, body: JSON.stringify({ image: img, restant: 4 }) });
  });
  await page.goto("/concept/");
  await page.getByRole("button", { name: /Salon lambrissé de noyer/ }).click();
  await page.getByRole("button", { name: "Créer le concept" }).click();
  await expect(page.getByRole("heading", { level: 2, name: "Salon boisé" })).toBeVisible({ timeout: 60_000 });
  await expect(page.getByText("Il vous reste 4 images aujourd'hui.")).toBeVisible();
  await expect(page.getByText("Canapé", { exact: true })).toBeVisible();
  await expect(page.getByText("Lambris", { exact: true })).toBeVisible();
  const dl = page.waitForEvent("download", { timeout: 60_000 });
  await page.getByRole("button", { name: "Télécharger la fiche HD" }).click();
  expect((await dl).suggestedFilename()).toMatch(/^concept-salon-bois.*\.jpg$/);
  await page.getByRole("button", { name: "Ouvrir dans ma planche" }).click();
  await expect(page).toHaveURL(/planche/);
  expect(errors).toEqual([]);
});

test("générer un concept : message clair si le service refuse", async ({ page }) => {
  await page.route("https://piece-revee-ia.ewanesteves26.workers.dev/concept", (route) => route.fulfill({ status: 429, contentType: "application/json", headers: { "Access-Control-Allow-Origin": "*" }, body: JSON.stringify({ erreur: "Le nombre d'images du jour est atteint. Revenez demain." }) }));
  await page.goto("/concept/");
  await page.getByLabel("Votre ambiance").fill("Chambre indigo et lin lavé");
  await page.getByRole("button", { name: "Créer le concept" }).click();
  await expect(page.getByText("Le nombre d'images du jour est atteint. Revenez demain.")).toBeVisible();
});

test("Camille : se présente avec son avatar et guide selon l'étape", async ({ page }) => {
  await page.addInitScript(() => localStorage.removeItem("pr_camille_guide"));
  await page.goto("/showroom/");
  const bubble = page.getByRole("region", { name: "Conseil de Camille" });
  await expect(bubble).toContainText("Choisissez une famille", { timeout: 25_000 });
  await expect(bubble).toContainText("designer d'intérieur virtuelle");
  await bubble.getByRole("button", { name: "Me guider" }).click();
  const drawer = page.getByRole("complementary", { name: "Camille, designer d'intérieur virtuelle" });
  await expect(drawer).toContainText("Je suis une intelligence artificielle");
  await expect(drawer.getByRole("button", { name: "Quel zellige pour une cuisine lumineuse ?" })).toBeVisible();
  await page.keyboard.press("Escape");
  await page.reload();
  await page.waitForTimeout(2500);
  await expect(page.getByRole("region", { name: "Conseil de Camille" })).toHaveCount(0);
});

test("showroom : nouvelles familles, référence et maisons de niche", async ({ page }) => {
  test.setTimeout(120_000);
  const errors = noJsErrors(page);
  await page.goto("/showroom/?f=quincaillerie");
  await expect(page.getByRole("heading", { level: 2, name: "Quincaillerie" })).toBeVisible();
  await page.getByRole("button", { name: /^Bouton moleté/ }).click();
  const dlg = page.getByRole("dialog", { name: /Bouton moleté/ });
  await expect(dlg).toContainText(/Réf\. PR-QUI-02·01·01/);
  await expect(dlg.getByRole("link", { name: /Buster \+ Punch/ })).toHaveAttribute("href", /google\.com\/search/);
  await page.keyboard.press("Escape");
  await page.goto("/showroom/?f=objets");
  await expect(page.getByRole("heading", { level: 2, name: "Objets de design" })).toBeVisible();
  await expect(page.getByRole("button", { name: /^Vase amphore/ })).toBeVisible();
  expect(errors).toEqual([]);
});

test("planche : appliquer mes matières à la photo de ma pièce (service simulé)", async ({ page, isMobile }) => {
  test.skip(isMobile, "parcours bureau");
  test.setTimeout(120_000);
  const errors = noJsErrors(page);
  await page.route("https://piece-revee-ia.ewanesteves26.workers.dev/redesign", async (route) => {
    const body = route.request().postDataJSON() as { photo: string; inspirations: string[]; brief: string };
    expect(body.brief).toContain("Appliquer la planche de matières");
    expect(body.inspirations).toHaveLength(1);
    await route.fulfill({ status: 200, contentType: "application/json", headers: { "Access-Control-Allow-Origin": "*" }, body: JSON.stringify({ image: body.photo, restant: 3 }) });
  });
  await page.goto("/planche/");
  await expect(page.getByText("Préparation de la planche")).toHaveCount(0, { timeout: 30000 });
  await page.getByLabel("Choisir la photo de ma pièce").setInputFiles("public/visuels/visite-3d.webp");
  await page.getByRole("button", { name: "Appliquer mes matières" }).click();
  await expect(page.getByRole("link", { name: "Télécharger le rendu" })).toBeVisible({ timeout: 60_000 });
  await expect(page.getByText("Il vous reste 3 rendus aujourd'hui.")).toBeVisible();
  expect(errors).toEqual([]);
});

test("plan : importer le plan de son logement comme calque", async ({ page, isMobile }) => {
  test.skip(isMobile, "parcours bureau");
  test.setTimeout(150_000);
  await page.addInitScript(() => localStorage.setItem("pr_home3d_hint", "1"));
  await page.goto("/visite-3d/");
  await expect(page.getByText("Chargement de la 3D")).toBeHidden({ timeout: 30_000 });
  await page.getByRole("button", { name: "Mon plan" }).click();
  const dlg = page.getByRole("dialog", { name: "Plan de mon logement" });
  await dlg.getByLabel("Importer mon plan").setInputFiles("public/visuels/planche-hero.webp");
  await expect(dlg.getByRole("heading", { name: "Calque de mon plan" })).toBeVisible({ timeout: 20_000 });
  await expect(dlg.getByText(/Plan importé/)).toBeVisible();
  await dlg.getByRole("button", { name: "Retirer le calque" }).click();
  await expect(dlg.getByRole("heading", { name: "Calque de mon plan" })).toHaveCount(0);
});

test("planche : composer une planche à partir d'une image", async ({ page, isMobile }) => {
  test.skip(isMobile, "parcours bureau");
  test.setTimeout(120_000);
  const errors = noJsErrors(page);
  await page.goto("/planche/");
  await expect(page.getByText("Préparation de la planche")).toHaveCount(0, { timeout: 30000 });
  await page.getByLabel("À partir d'une image").setInputFiles("public/visuels/hero-3d.webp");
  await expect(page.getByRole("textbox", { name: "Titre de la planche" })).toHaveValue("Ma planche inspirée", { timeout: 20_000 });
  const fiche = page.locator('section[aria-labelledby="fiche"]');
  await expect(fiche).toContainText("Réf. PR-PEI-");
  await expect(fiche).toContainText("Réf. PR-QUI-");
  // Les modèles « curated » sont proposés.
  await page.getByRole("button", { name: "Modèles" }).click();
  await page.getByRole("dialog").getByRole("button", { name: /Vert terrazzo/ }).click();
  await expect(page.getByRole("textbox", { name: "Titre de la planche" })).toHaveValue("Vert terrazzo");
  expect(errors).toEqual([]);
});

test("inspirations : photo d'ambiance par collection, puis moodboard (service simulé)", async ({ page }) => {
  test.setTimeout(120_000);
  const fs = await import("node:fs");
  const img = `data:image/webp;base64,${fs.readFileSync("public/visuels/hero-3d.webp").toString("base64")}`;
  await page.route("https://piece-revee-ia.ewanesteves26.workers.dev/concept", (route) => route.fulfill({ status: 200, contentType: "application/json", headers: { "Access-Control-Allow-Origin": "*" }, body: JSON.stringify({ image: img, restant: 4 }) }));
  await page.goto("/galerie/");
  await page.getByRole("group", { name: "Collections" }).getByRole("button", { name: "Villas", exact: true }).click();
  await page.getByRole("button", { name: "Générer une photo" }).click();
  await page.getByRole("button", { name: /^Villas :/ }).first().click();
  await page.getByRole("dialog").getByRole("button", { name: "Créer un moodboard" }).click();
  await expect(page).toHaveURL(/planche/, { timeout: 30_000 });
  await expect(page.getByRole("textbox", { name: "Titre de la planche" })).toHaveValue("Villas", { timeout: 30_000 });
});

test("showroom : teinte sur mesure (matières sans limite)", async ({ page }) => {
  await page.goto("/showroom/?f=peinture&v=sr%3Apeinture%3Ax-6b3e7a%3Asatin");
  const dlg = page.getByRole("dialog");
  await expect(dlg).toContainText("Teinte sur mesure #6B3E7A");
  await expect(dlg).toContainText(/Réf\. PR-PEI-6B3E7A·03/);
});
