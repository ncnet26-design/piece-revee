---
name: visual-quality-assurance
description: Contrôle qualité visuel de Pièce Rêvée : captures avant/après à trois tailles d'écran, grille de relecture premium, mesures de rendu 3D, accessibilité, honnêteté des images. À utiliser avant de déclarer une page ou un rendu « terminé » ou « amélioré », et avant chaque livraison.
---

# Contrôle qualité visuel

## Rôle
Prouver une amélioration par des images comparables et des mesures, plutôt que l'affirmer.

## Quand l'utiliser
- Avant et après toute refonte d'écran ou réglage du rendu 3D.
- Avant un commit qui touche l'interface, les images ou les matières.
- Quand l'utilisateur demande « montre-moi ce qui a changé ».

## Principes
- **Mêmes conditions.** Même page, même taille d'écran et même contenu de départ (stockage local réinitialisé, Camille masquée).
- **Trois tailles** : ordinateur 1440 × 900, tablette 834 × 1112, mobile 390 × 844.
- **Mesurer le rendu 3D** avec `scripts/rendu-controle.mjs` (détail, hautes lumières brûlées, dominante de couleur), sur la scène `/studio/controle/`.
- **Relire comme un directeur artistique**, avec la grille de `docs/qa/README.md` : premier écran, images, typographie, couleurs, mobile, honnêteté.
- **Les tests automatiques sont obligatoires mais pas suffisants.** axe et l'absence de débordement ne disent rien de la beauté.

## Étapes
1. Avant de modifier : `pnpm build`, `npx serve out -l 4173`, puis `node scripts/qa-captures.mjs docs/qa/avant <pages>`.
2. Modifier.
3. Après : `node scripts/qa-captures.mjs docs/qa/apres <pages>`.
4. Comparer les paires, noter chaque défaut et le corriger, puis recommencer.
5. Rendu 3D : `node scripts/rendu-controle.mjs`. Garder les mesures dans `docs/rendu-controle/`.
6. Lancer `npx playwright test` seul (pas en parallèle d'autres navigateurs) et `node scripts/inventaire-assets.mjs`.
7. Rendre compte : ce qui a changé, les captures, les tests lancés et leur résultat, et ce qui reste imparfait.

## Erreurs à éviter
- Comparer des captures de tailles différentes.
- Captures prises avant le chargement des images différées (le script fait défiler toute la page).
- Déclarer « 4K » ou « photoréaliste » sans mesure.
- Cacher un test qui échoue.
- Vignettes WebGL vides en capture automatique prises pour un bug du site sans vérifier dans un vrai navigateur.

## Critères d'acceptation
- Captures avant et après présentes pour chaque page modifiée, aux trois tailles.
- Mesures de rendu stables ou meilleures.
- Tous les tests au vert.
- Inventaire sans fichier non référencé.
- Rapport qui nomme aussi les limites restantes.

## Exemples
- Refonte de l'accueil : `docs/qa/avant/accueil-ordinateur.webp` contre `docs/qa/apres/accueil-ordinateur.webp`.
  - Avant : sections vides et illustrations « jeu ».
  - Après : photographie d'architecture créditée, titre serif, meuble original et trois gammes.
- Matières : `parquet-chevron` passé à `roughnessScale` 2,8. Les hautes lumières brûlées tombent à 0 % sur la vue sol.
