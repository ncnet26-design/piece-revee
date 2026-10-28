---
name: architecture-logicielle
description: Comprendre et faire évoluer le code de Pièce Rêvée sans régression : où placer un module, comment séparer interface, logique, données et services IA, quelles dépendances accepter. À utiliser avant toute modification structurante.
---

# Architecture logicielle — Pièce Rêvée

## Avant de coder
1. Lire `AGENTS.md` (Next.js 16 : lire `node_modules/next/dist/docs/` avant d'écrire du code Next).
2. Repérer le module existant : `docs/STUDIO-AUDIT.md` § 3 donne la carte (moteur 3D `lib/studio/engine.ts`, matières `lib/materials/`, produits `lib/products/`, ressemblance `lib/studio/similar.ts`, service IA `workers/ia/src/`).
3. Vérifier ce qui est réel ou simulé (Supabase non déployé, site en export statique, aucune clé côté site).

## Règles
- Export statique : pas de route serveur Next. Tout appel payant passe par le worker `workers/ia/src` (compilé par `node scripts/build-ia-worker.mjs` en un fichier à coller dans Cloudflare).
- Données de contenu en JSON validé par zod au chargement (`content/data/*.json` + schéma dans `lib/**/schema.ts`). Un champ inconnu = `null`, jamais une valeur inventée.
- Composants = affichage et interactions (`components/studio/*`) ; logique pure testable dans `lib/` (sans DOM quand c'est possible).
- Fournisseurs interchangeables : ajouter un objet `Provider` dans `workers/ia/src/providers.ts`, rien d'autre ne change.
- Dépendance nouvelle : vérifier licence (MIT/Apache/BSD/CC0 pour un SaaS), compatibilité (`npm view <pkg> peerDependencies`), date de publication (> 2 semaines), et qu'elle remplace un vrai manque. Exemple accepté : `three-gpu-pathtracer@0.0.24` (MIT, compatible three ≥ 0.180). Refusés : React Three Fiber (les moteurs impératifs existants feraient doublon), shadcn/ui (système de design déjà en place), bibliothèque d'animation (CSS suffit).
- Erreurs : messages en français, utiles, avec possibilité de réessayer ; jamais d'écran blanc.

## Validation
- `pnpm typecheck && pnpm lint && pnpm test` sans erreur ; `pnpm build` réussi.
- Parcours touchés couverts par Playwright (`tests/e2e/`), sur `desktop` et `mobile`.
- Aucune clé, aucun secret dans le dépôt ni dans le navigateur.
