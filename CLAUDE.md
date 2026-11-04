# Pièce Rêvée — consignes permanentes pour Claude

@AGENTS.md

## Le projet
Site d'architecture intérieure et de décoration (Next.js 16 en export statique, Cloudflare). Parcours principal : photo de la pièce et inspirations → moodboard → pièce transformée où chaque meuble, couleur ou matière est cliquable vers de vrais produits. Boutique alimentée par le robot catalogue (`scripts/robot-catalogue.ts`), service IA dans `workers/ia/src` (compilé en `workers/ia/worker.js`, ne jamais modifier ce fichier à la main).

## Règles du propriétaire (toujours)
- Répondre en **français**, simplement, le résultat d'abord. Le propriétaire n'est pas développeur.
- **Rien de payant sans accord explicite** (génération d'images, recherches payantes, services) : chiffrer, montrer la consigne, attendre « oui ».
- **Aucune clé dans la conversation** ni dans le code : secrets GitHub ou Cloudflare uniquement ; ne jamais créer de compte ni acheter à la place du propriétaire.
- **Ne rien inventer** : produits, prix, liens, marques, avis, images de marque. Un prix affiché a toujours sa date de relevé ; une donnée de démonstration est signalée.
- Images : jamais de photo copiée depuis une enseigne ; image générée par IA toujours étiquetée ; « 4K » seulement si natif.
- Technique bâtiment : jamais de certification électrique, de plomberie ou de structure ; une estimation n'est pas un devis.

## Façon de travailler
- **Lire `docs/ERREURS.md` avant de commencer** et y ajouter chaque nouvelle erreur avec sa correction.
- Compétences à utiliser : `charte-graphique`, `direction-artistique-images`, `signatures-styles`, `anti-rendu-ia`, `matieres-4k`, `catalogue-ameublement`, `audit-visuel`, `audit-qualite`, `verification-before-completion`, `systematic-debugging`.
- Avant de dire « terminé » : `pnpm typecheck && pnpm lint && pnpm test`, `pnpm build`, tests de parcours concernés (`npx playwright test`), captures ordinateur et mobile.
- Commits : terminer par les lignes d'attribution demandées par la session ; aucun identifiant de modèle dans le dépôt.
