---
name: qualite-tests-securite
description: Tester, sécuriser et mesurer Pièce Rêvée : tests unitaires et de parcours, accessibilité, mobile, clés, données personnelles, coûts. À utiliser avant chaque livraison ou déclaration qu'une fonctionnalité est terminée.
---

# Qualité, tests et sécurité

## Commandes
- `pnpm typecheck && pnpm lint && pnpm test` (vitest, `tests/unit/`).
- `pnpm build` puis `npx playwright test` (desktop + mobile, axe) ; parcours Studio : `tests/e2e/studio.spec.ts`.
- Service d'images : `tests/unit/ia-worker.test.ts` (KV en mémoire, fournisseurs simulés) ; `node scripts/build-ia-worker.mjs` pour régénérer le fichier à coller.
- Rendu : `node scripts/rendu-controle.mjs` (site servi sur :4173).

## Sécurité
- Clés uniquement en secrets Cloudflare/GitHub ; origine vérifiée par le worker ; plafonds d'images et de dollars par jour, mois et visiteur.
- Fichiers téléversés : type et taille contrôlés (`lib/photo.ts`, `workers/ia/src/validate.ts`), images réduites avant envoi.
- Partage de projet : sans photos personnelles.

## Règle
Ne jamais déclarer « terminé » ce qui est maquetté, simulé ou testé seulement avec un service factice : le dire explicitement.
