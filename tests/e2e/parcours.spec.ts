import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const noJsErrors = (page: import("@playwright/test").Page) => {
  const errors: string[] = [];
  // Le cadre isolé des suggestions Google refuse les scripts d'initialisation des tests : ce n'est pas une erreur du site.
  const sandbox = (t: string) => /sandboxed|about:srcdoc/.test(t);
  page.on("pageerror", (e) => { if (!sandbox(e.message)) errors.push(e.message); });
  page.on("console", (m) => { if (m.type() === "error" && !sandbox(m.text()) && !m.text().includes("404") && !/ERR_TUNNEL|ERR_NAME_NOT_RESOLVED|ERR_CONNECTION/.test(m.text())) errors.push(m.text()); });
  return errors;
};

test.beforeEach(async ({ page }) => {
  // Choix de cookies déjà fait : le bandeau ne masque pas les éléments testés.
  await page.addInitScript(() => { localStorage.setItem("pr_consent", JSON.stringify({ analytics: false, at: "2026-10-26", version: 1 })); localStorage.setItem("pr_camille_guide", "off"); });
});

test("accueil : promesse, démonstration à toucher, sections éditoriales", async ({ page }) => {
  const errors = noJsErrors(page);
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("achetez chaque meuble");
  await expect(page.getByRole("link", { name: "Essayer gratuitement" }).first()).toHaveAttribute("href", "/transformer/");
  await expect(page.getByRole("link", { name: "Transformer ma pièce" }).first()).toHaveAttribute("href", "/transformer/");
  const mobile = (page.viewportSize()?.width ?? 1200) < 1024;
  if (mobile) await expect(page.getByRole("navigation", { name: "Navigation mobile" }).getByRole("link")).toHaveText(["Transformer", "Inspirations", "Boutique", "Tarifs"]);
  else await expect(page.getByRole("navigation", { name: "Navigation principale" }).getByRole("link")).toHaveText(["Transformer ma pièce", "Inspirations", "Boutique", "Tarifs"]);
  await page.getByRole("button", { name: /^Tables basses en marbre : voir les produits par budget/ }).click();
  await expect(page.getByText("Tables basses en marbre · en vente maintenant")).toBeVisible();
  for (const g of ["Petit budget", "Budget moyen", "Haut de gamme"]) await expect(page.getByRole("link", { name: new RegExp(g) }).first()).toHaveAttribute("target", "_blank");
  await expect(page.getByRole("slider", { name: /Avant/ })).toBeVisible();
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

for (const url of ["/", "/boutique/", "/showroom/", "/transformer/", "/concept/", "/planche/", "/galerie/", "/quiz/", "/projet/nouveau/", "/projet/etude/?id=exemple-salon", "/matieres/", "/tarifs/", "/compte/", "/legal/confidentialite/"]) {
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
    for (const url of ["/", "/boutique/", "/showroom/", "/transformer/", "/concept/", "/planche/", "/galerie/", "/projet/etude/?id=exemple-terrasse", "/tarifs/", "/matieres/zellige/"]) {
    await page.goto(url);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), url).toBe(true);
  }
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
  await expect(page.locator('section[aria-labelledby="fiche"] > ul').getByRole("link", { name: /IKEA/, includeHidden: true }).first()).toHaveAttribute("href", /ikea\.com/);
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

test("transformer : ma pièce et mes inspirations donnent un moodboard, puis une pièce transformée entièrement cliquable", async ({ page }) => {
  test.setTimeout(120_000);
  const errors = noJsErrors(page);
  const H = { "Access-Control-Allow-Origin": "*" };
  let jobBody: { photo?: string; references?: string[]; inspirations?: boolean; mode?: string; brief?: string } = {};
  // Service d'images simulé : aucun appel payant pendant les tests.
  await page.route("**/v2/moodboard", (r) => r.fulfill({ status: 200, contentType: "application/json", headers: H, body: JSON.stringify({
    style: "Japandi chaleureux", summary: "Bois fumé, lin et lumière douce.", palette: [{ name: "Lin", hex: "#E6DCCB" }, { name: "Chêne fumé", hex: "#5C4636" }],
    materials: ["chene-fume", "lin-lave"], objects: [{ type: "table-basse", label: "Table basse ronde en chêne", materials: ["bois"], colors: [], shape: ["ronde"] }],
    brief_fr: "Salon apaisé.", brief_en: "Calm japandi living room.",
  }) }));
  await page.route("**/v2/jobs", async (r) => {
    jobBody = r.request().postDataJSON();
    const now = new Date().toISOString();
    await r.fulfill({ status: 201, contentType: "application/json", headers: H, body: JSON.stringify({ id: "22222222-2222-4222-8222-222222222222", status: "terminee", mode: "transform", provider: "gemini", model: "nano", quality: "premium", brief: "x", keep: [], width: 1600, height: 893, createdAt: now, updatedAt: now, attempts: 1, costUsd: 0.06, imageUrl: "http://localhost:4173/editorial/ia/salon-boucle-noyer.webp" }) });
  });
  await page.route("**/v2/analyse", (r) => r.fulfill({ status: 200, contentType: "application/json", headers: H, body: JSON.stringify({
    objects: [{ id: "table-basse_001", type: "table-basse", label: "Table basse galet en travertin", query: "table basse galet travertin", design_source: "ai_detected", shape: ["organique", "basse"], materials: ["travertin"], colors: [{ name: "Travertin", hex: "#E3D2B4" }], style: ["minimal"], estimated_dimensions_cm: { width: 110, depth: 70, height: 32 }, zone: { x: 47, y: 71, w: 25, h: 18 } }],
    surfaces: [{ id: "mur_1", kind: "mur", label: "Mur à la chaux", colors: [{ name: "Blanc chaud", hex: "#EEE8DD" }], material: "enduit à la chaux", finish: "mat", zone: { x: 20, y: 0, w: 80, h: 50 } }],
  }) }));
  const recherches: string[] = [];
  await page.route("**/v2/recherche", async (r) => {
    const q = (r.request().postDataJSON() as { query: string }).query; recherches.push(q);
    await r.fulfill({ status: 200, contentType: "application/json", headers: H, body: JSON.stringify({
      produits: [{ title: "Table basse ovale en travertin", url: "https://boutique-exemple.fr/table-travertin", merchant: "boutique-exemple.fr", price: 489, currency: "EUR", availability: "InStock", brand: null, checkedAt: new Date().toISOString(), source: "page" },
        { title: "Table basse pierre naturelle", url: "https://autre-boutique.fr/table", merchant: "autre-boutique.fr", price: null, currency: null, availability: null, brand: null, checkedAt: null, source: "recherche" }],
      suggestions: "<div>table basse travertin</div>", requetes: ["table basse travertin"] }) });
  });
  await page.goto("/transformer/");
  await expect(page.getByRole("button", { name: "Créer mon moodboard" })).toBeDisabled();
  await page.getByLabel("Choisir la photo de ma pièce").setInputFiles("public/matieres/noyer/1280.webp");
  await page.getByLabel("Ajouter des inspirations").setInputFiles(["public/matieres/travertin/1280.webp", "public/matieres/lin-lave/1280.webp"]);
  await expect(page.getByRole("img", { name: "Inspiration 2" })).toBeVisible();
  await page.getByRole("button", { name: "Créer mon moodboard" }).click();
  await expect(page.getByRole("heading", { name: "Japandi chaleureux" })).toBeVisible({ timeout: 20_000 });
  await expect(page.getByText("Chêne fumé").first()).toBeVisible();
  await expect(page.getByText("Table basse ronde en chêne")).toBeVisible();
  await page.getByRole("button", { name: "Transformer ma pièce" }).click();
  await expect(page.getByTestId("piece-transformee")).toBeVisible({ timeout: 30_000 });
  expect(jobBody).toMatchObject({ mode: "transform", inspirations: true });
  expect(jobBody.references).toHaveLength(2);
  expect(jobBody.photo).toMatch(/^data:image\/jpeg;base64,/);
  expect(jobBody.brief).toContain("Calm japandi living room.");
  // Un meuble : des produits réels ressemblants, avec leur lien.
  await page.getByRole("button", { name: /Table basse galet en travertin : voir les modèles ressemblants/ }).click();
  const meuble = page.getByRole("complementary", { name: "Table basse galet en travertin" });
  await expect(meuble.getByText("Table basse ovale en travertin")).toBeVisible();
  await expect(meuble.getByText("489 €")).toBeVisible();
  await expect(meuble.getByRole("link", { name: /Voir chez boutique-exemple\.fr/ })).toHaveAttribute("href", "https://boutique-exemple.fr/table-travertin");
  await expect(meuble.getByText("Prix sur le site")).toBeVisible();
  await expect(meuble.getByTitle("Suggestions de recherche Google")).toBeVisible();
  await meuble.getByRole("button", { name: "Ajouter à ma pièce" }).first().click();
  await expect(meuble.getByRole("button", { name: "✓ Dans ma pièce" })).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("link", { name: /Ma pièce composée : 1 article · 489 €/ })).toBeVisible();
  expect(recherches).toContain("table basse galet travertin");
  // Résultats rangés par budget ; « chercher ailleurs » replié.
  await expect(meuble.getByText("Autres modèles").or(meuble.getByText("Petit budget")).first()).toBeVisible();
  await meuble.getByText("Chercher ailleurs").click();
  await expect(meuble.getByRole("link", { name: /Google Shopping/ })).toHaveAttribute("target", "_blank");
  await page.keyboard.press("Escape");
  // Une surface : sa teinte, des matières proches et où la trouver.
  await page.getByRole("button", { name: "Mur à la chaux" }).click();
  const mur = page.getByRole("complementary", { name: "Mur à la chaux" });
  await expect(mur.getByText(/teinte approchante/)).toBeVisible();
  await expect(mur.getByText("Matières proches")).toBeVisible();
  await expect(mur.getByRole("link").first()).toHaveAttribute("target", "_blank");
  await page.keyboard.press("Escape");
  // N'importe où ailleurs : la couleur du point.
  const box = (await page.getByTestId("piece-transformee").boundingBox())!;
  await page.getByTestId("piece-transformee").click({ position: { x: box.width * 0.05, y: box.height * 0.9 } });
  await expect(page.getByRole("complementary", { name: /^Couleur / })).toBeVisible();
  // La liste d'achats reprend le produit trouvé en ligne, avec son lien.
  await page.goto("/ma-piece/");
  await expect(page.getByText("Table basse ovale en travertin", { exact: true })).toBeVisible({ timeout: 15_000 });
  await expect(page.getByRole("link", { name: /Acheter Table basse ovale en travertin/ })).toHaveAttribute("href", "https://boutique-exemple.fr/table-travertin");
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

test("inspirations : huit styles en vraies photos, photographe crédité, reliés au catalogue", async ({ page }) => {
  await page.goto("/galerie/");
  for (const s of ["japandi", "scandinave", "industriel", "haussmannien", "mid-century", "wabi-sabi", "boheme", "contemporain"]) {
    const sec = page.locator(`#style-${s}`);
    await expect(sec.locator("img")).toHaveCount(6);
    await expect(sec.getByRole("link", { name: "Unsplash" })).toHaveCount(6);
    await expect(sec.getByRole("link", { name: "Les pièces de ce style, par budget" })).toHaveAttribute("href", `/boutique/?style=${s}#selection`);
  }
  const src = await page.locator("#style-japandi img").first().getAttribute("srcset");
  expect(src).toMatch(/images\.unsplash\.com.*2560w/);
});

test("showroom : teinte sur mesure (matières sans limite)", async ({ page }) => {
  await page.goto("/showroom/?f=peinture&v=sr%3Apeinture%3Ax-6b3e7a%3Asatin");
  const dlg = page.getByRole("dialog");
  await expect(dlg).toContainText("Teinte sur mesure #6B3E7A");
  await expect(dlg).toContainText(/Réf\. PR-PEI-6B3E7A·03/);
});

test("boutique : sélection d'exception, recherche, budget et ajout à ma pièce", async ({ page }) => {
  const errors = noJsErrors(page);
  await page.goto("/boutique/");
  await expect(page.getByText(/références choisies chez \d+ enseignes/)).toBeVisible();
  const tout = page.getByRole("region", { name: /Chercher, comparer/ });
  await tout.getByRole("textbox", { name: "Rechercher un produit" }).fill("table basse");
  await expect(tout.getByText(/^\d[\d\s ]* références?$/)).toBeVisible({ timeout: 20_000 });
  const first = tout.getByRole("link", { name: /^Voir chez / }).first();
  await expect(first).toHaveAttribute("target", "_blank");
  await tout.getByRole("button", { name: "Ajouter à ma pièce" }).first().click();
  await expect(tout.getByRole("button", { name: "✓ Dans ma pièce" }).first()).toHaveAttribute("aria-pressed", "true");
  await tout.getByRole("group", { name: "Budget" }).getByRole("button", { name: "Haut de gamme" }).click();
  await expect(tout.getByText("Haut de gamme").nth(1)).toBeVisible();
  await tout.getByRole("button", { name: "Canapés", exact: true }).click();
  await expect(tout.getByRole("button", { name: "Canapés", exact: true })).toHaveAttribute("aria-pressed", "true");
  expect(errors).toEqual([]);
});

test("catalogue : filtres budget, pièce, style, matière ; liens vers les enseignes ; photos chargées depuis l'enseigne", async ({ page }) => {
  const errors = noJsErrors(page);
  await page.goto("/catalogue/?style=japandi");
  await expect(page).toHaveURL(/\/boutique\/\?style=japandi#selection/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("à chaque budget");
  const sel = page.getByRole("region", { name: /Votre pièce, votre style/ });
  await expect(sel.getByRole("button", { name: "Japandi" })).toHaveAttribute("aria-pressed", "true");
  await sel.getByRole("button", { name: "Haut de gamme" }).click();
  await expect(page.getByRole("heading", { name: "Haut de gamme", level: 2 })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Petit budget", level: 2 })).toHaveCount(0);
  const lien = page.getByRole("link", { name: /^Voir chez / }).first();
  await expect(lien).toHaveAttribute("href", /^https:\/\//);
  await expect(lien).toHaveAttribute("rel", /nofollow/);
  expect(page.url()).toContain("gamme=haut");
  // Photos d'enseigne : chargées depuis leur site (jamais copiées), en https, sans transmettre l'adresse de la page.
  const imgs = await page.locator("main img").evaluateAll((l) => l.map((i) => [(i as HTMLImageElement).src, i.getAttribute("referrerpolicy")]));
  for (const [src, rp] of imgs.filter(([s]) => !/^https?:\/\/(localhost|127\.0\.0\.1)/.test(s!))) { expect(src).toMatch(/^https:\/\//); expect(rp).toBe("no-referrer"); }
  const r = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
  expect(r.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).slice(0, 3).join(" | ")}`)).toEqual([]);
  expect(errors).toEqual([]);
});

test("accueil : bande des enseignes, avec bouton pause", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /viennent de \d+ enseignes/ })).toBeVisible();
  const b = page.getByRole("button", { name: "Mettre en pause" });
  await b.click();
  await expect(page.getByRole("button", { name: "Relancer le défilement" })).toHaveAttribute("aria-pressed", "true");
});

test("transformer : attente animée pendant le moodboard (étapes, progression)", async ({ page }) => {
  await page.route("**/v2/moodboard", async (r) => { await new Promise((x) => setTimeout(x, 4000)); await r.fulfill({ status: 500, headers: { "Access-Control-Allow-Origin": "*" }, body: "{}" }); });
  await page.goto("/transformer/");
  await page.getByLabel("Choisir la photo de ma pièce").setInputFiles("public/matieres/noyer/1280.webp");
  await page.getByLabel("Ajouter des inspirations").setInputFiles(["public/matieres/travertin/1280.webp"]);
  await page.getByRole("button", { name: "Créer mon moodboard" }).click();
  await expect(page.getByRole("status", { name: /Votre moodboard se compose/ })).toBeVisible();
  await expect(page.getByText(/durée habituelle 10 à 20 s/)).toBeVisible();
});

test("tarifs : offres, contenu d'une étude, appel à l'essai gratuit", async ({ page }) => {
  await page.goto("/tarifs/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("pour le prix d'un coussin");
  await expect(page.getByText("Recommandé").first()).toBeVisible();
  await expect(page.getByText("Le plus choisi")).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Faire mon étude offerte" })).toHaveAttribute("href", "/transformer/");
});
