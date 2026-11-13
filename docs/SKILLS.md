# Skills du projet (`.claude/skills/`)

Format : `.claude/skills/<nom>/SKILL.md` avec en-tête `name` et `description` (quand l'utiliser), puis la méthode, la check-list de sortie, des exemples du projet et, si besoin, des scripts.
Aucune skill externe installée à ce jour. Toute skill externe sera lue en entier (scripts compris) avant installation et notée ici (source, version, auditeur).

## Existantes (créées dans le projet)

| Skill | Domaine | Couvre dans le plan V3 |
|---|---|---|
| transformation-piece | IA et rendus | méthode, consignes DECLUTTER/REDESIGN, grille de contrôle (base de « rendu-photoréaliste », « prompt-étude-architecte ») |
| signatures-styles, styles-interieurs, anti-rendu-ia, direction-artistique-images, photorealistic-rendering, architectural-lighting, architectural-visualization | IA et rendus | marqueurs de style, réalisme, lumière |
| product-visual-similarity, catalogue-ameublement | Catalogue | base de « correspondance-meuble-produit », « normalisation-catalogue » |
| audit-qualite, audit-visuel, visual-quality-assurance, webapp-testing, qualite-tests-securite | Code / QA | Lighthouse, axe, Playwright |
| systematic-debugging, test-driven-development, verification-before-completion, architecture-logicielle | Code | débogage, tests, vérification |
| charte-graphique, frontend-design, frontend-aesthetics, premium-art-direction, web-design-guidelines | Design | design system, direction premium |
| vercel-react-best-practices, vercel-react-view-transitions | Code | performance React, transitions |
| amenagement-ergonomie, interior-design, matieres-4k, pbr-materials, 3d-asset-quality, furniture-design, editorial-image-curation | Métier | aménagement, matières, 3D, images |
| electricite-eclairage, plomberie-sanitaire, renovation-travaux, exterieur-paysage | Métier | conseils encadrés (jamais de certification) |
| find-skills | Outillage | recherche de skills |

## À créer pour l'étape 1 (priorité)

| Skill | Rôle | Statut |
|---|---|---|
| correspondance-meuble-produit | Lier chaque meuble du rendu au produit exact ou le plus proche ; règles matière/couleur/forme/dimensions ; contrôle par vision ; libellé honnête | à créer |
| controle-qualite-image | Grille notée sur 10, défauts à détecter, nouvel essai, message honnête | à créer (grille déjà dans transformation-piece) |
| banc-d-essai-ia | Constitution du banc (licences), exécution, mesures, rapport `eval/RAPPORT.html` | à créer |
| verification-fiche-produit | Contrôle titre/image/prix contre la page de l'enseigne, pages mortes, rafraîchissement | à créer |
| normalisation-catalogue | Formats français (virgule, ×, Ø, espace insécable avant €), dates avec année, occasion, seuils de budget | à créer |
| redaction-interface | Microcopie française : clarté, honnêteté, messages d'erreur utiles | à créer |

## Ensuite (étapes 2 et 3)
seo, performance-web, accessibilite-rgaa, tests-e2e-playwright, deploiement-cloudflare, revue-de-code, page-d-accueil-qui-convertit, preuves-avant-apres, grille-tarifaire-saas, tunnel-et-ab-tests, sequences-email, rgpd-cookies-cnil, mentions-ia-et-affiliation, publicite-comparative-et-pratiques-interdites, cgv-abonnement-resiliation, maitrise-des-couts-ia, plan-de-tache, compte-rendu-standard, verification-independante.

Les sources officielles (RGAA 4.1, WCAG 2.2, recommandations CNIL, Code de la consommation) seront citées avec leur date dans chaque skill au moment de sa création.
