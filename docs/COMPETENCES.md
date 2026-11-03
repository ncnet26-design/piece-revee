# Compétences et outils de Claude pour ce projet

## Compétences (`.claude/skills/`)

### Compétences maison (écrites pour Pièce Rêvée)
- **Direction et interface** : premium-art-direction, frontend-design.
- **Architecture et rendu** : interior-design, architectural-visualization, architectural-lighting, photorealistic-rendering.
- **Matières, images et 3D** : pbr-materials, editorial-image-curation, 3d-asset-quality, furniture-design.
- **Produits et qualité** : product-visual-similarity, visual-quality-assurance, qualite-tests-securite.
- **Logiciel** : architecture-logicielle.
- **Technique bâtiment** : electricite-eclairage, plomberie-sanitaire, renovation-travaux, exterieur-paysage.

### Compétences open source ajoutées (gratuites)

| Compétence | Rôle | Source | Licence |
|---|---|---|---|
| frontend-aesthetics | Direction visuelle affirmée, typographie, éviter l'effet « modèle » | anthropics/skills (`frontend-design`, renommée), version ca45fc4 | Apache 2.0 |
| webapp-testing | Tester le site dans un vrai navigateur (Playwright) | anthropics/skills, version ca45fc4, avec une note du projet | Apache 2.0 |
| systematic-debugging | Trouver la cause d'un bug avant de corriger | obra/superpowers, version 2ce8aa1 | MIT |
| verification-before-completion | Ne rien déclarer « terminé » sans preuve (tests lancés) | obra/superpowers, version 2ce8aa1 | MIT |
| test-driven-development | Écrire le test avant le code | obra/superpowers, version 2ce8aa1 | MIT |

## Serveurs MCP (`.mcp.json`, chargés au démarrage d'une session)

| Serveur | Clé | Statut | Rôle |
|---|---|---|---|
| playwright | aucune | ✅ testé | Piloter un navigateur |
| chrome-devtools | aucune | ✅ testé (32 outils) | Performances, console, réseau, audits de pages |
| context7 | aucune | ✅ testé | Documentation à jour des bibliothèques (Next.js, React, three.js…) |
| firecrawl | `FIRECRAWL_API_KEY` | connecté | Lire des pages web (consomme des crédits Firecrawl) |
| perplexity | `PERPLEXITY_API_KEY` | connecté | Recherche avec sources (payant à l'usage : jamais utilisé sans accord) |
| composio | `COMPOSIO_MCP_URL`, `COMPOSIO_API_KEY` | ⚠️ adresse invalide | Connexion à d'autres applications (facultatif) |

## Ce qui demande un compte créé par le propriétaire

Ces comptes ne peuvent pas être créés par Claude. Tous sont gratuits à l'inscription.

| Service | Apport | Clé à ranger dans GitHub |
|---|---|---|
| Awin, Effinity (affiliation) | Catalogues officiels avec photos, commissions | à préciser selon la plateforme |
| Amazon Partenaires | Produits Amazon avec photos, commissions | à préciser |
| Sketchfab | Meubles 3D sous licence libre | `SKETCHFAB_TOKEN` |
| Hugging Face | Modèles libres de repérage d'objets et de comparaison d'images | `HF_TOKEN` |
| Cloudflare Workers AI | Images et analyses gratuites dans un quota quotidien | permission « Workers AI » à ajouter à la clé Cloudflare existante |
