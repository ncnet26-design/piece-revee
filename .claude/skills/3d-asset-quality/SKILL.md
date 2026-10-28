---
name: 3d-asset-quality
description: Juger, choisir, optimiser et retirer les modèles 3D (GLB) et meubles calculés de Pièce Rêvée : densité de géométrie, arrondis, proportions, matières, poids, licence. À utiliser pour ajouter un meuble à la bibliothèque, remplacer un modèle « plastique » ou « jeu vidéo », ou auditer content/data/furniture.json.
---

# Qualité des ressources 3D

## Rôle
Ne garder dans le Studio que des meubles qui tiennent un gros plan. Un modèle pauvre est remplacé ou retiré : on ne le cache pas sous une texture.

## Quand l'utiliser
- Pour ajouter un modèle (`content/data/models.json`, `content/data/furniture.json`, `public/models/`, `public/3d/`).
- Pour modéliser un objet calculé `proc:*` dans `lib/studio/engine.ts`.
- Pour auditer la bibliothèque (vignettes `scripts/model-thumbs.mjs`, dimensions `scripts/model-dims.ts`).

## Principes
- **Sources** : Poly Haven (CC0) et Khronos glTF Sample Assets (CC0 ou CC BY 4.0, avec crédit). BlendKit seulement si le propriétaire crée un compte. Jamais de modèle sans licence.
- **Géométrie.**
  - Arêtes adoucies (biseau ou chanfrein réel).
  - Épaisseurs réalistes : plateau bois de 2 à 4 cm, pierre de 3 à 6 cm.
  - Jonctions visibles, assez de segments sur les courbes (au moins 64 sur un cercle visible), coussins avec du volume.
- **Matières** : PBR complètes (couleur, normale, rugosité, AO). Le velours et le bouclé ont du `sheen`, le métal `metalness` 1.
- **Échelle** : dimensions réelles en mètres. Canapé de 80 à 95 cm de profondeur, assise à 42–45 cm.
- **Poids** :
  - `gltf-transform optimize --texture-compress webp --texture-size 1024` ;
  - viser moins de 3 Mo par meuble courant ;
  - le chargement est toujours différé.
- **Style** : formes contemporaines, éditoriales et intemporelles. Pas de Chesterfield générique, de chaise de bureau, de lustre de château ni de meuble « jeu vidéo ».

## Étapes
1. Vérifier la licence et noter l'auteur et l'URL.
2. Générer la vignette et l'examiner à 100 % : arêtes, coutures, textures étirées, faces manquantes.
3. Mesurer les dimensions et corriger l'échelle si besoin.
4. Optimiser, puis tester dans le Studio 3D : sélection, déplacement, changement de matière et ombres.
5. Renseigner l'entrée de `furniture.json` : catégorie, style, silhouette, matières, couleurs. `productId` n'est rempli que pour un produit commercial vérifié.
6. Régénérer l'inventaire (`node scripts/inventaire-assets.mjs`).

## Erreurs à éviter
- Arêtes vives à 90° partout.
- Cylindres à 8 faces.
- Textures basse définition étirées.
- Échelle fantaisiste.
- Plus de 10 Mo pour un objet secondaire.
- Garder un modèle laid « pour avoir du choix ».
- Associer un modèle libre à un produit réel sans vérification.

## Critères d'acceptation
- La vignette tient un gros plan sans défaut visible.
- Les dimensions sont dans les repères.
- La licence est inscrite et le crédit est affiché si la licence l'exige.
- Le meuble est sélectionnable, déplaçable et ses matières sont modifiables sans erreur dans la console.

## Exemples
- Retenus :
  - `canape-glam-velours` (Khronos, Wayfair, CC BY 4.0) ;
  - `proc:table-galet` (travertin, biseau de 4 cm, 96 segments) ;
  - `pouf-soie` (soie, Poly Haven).
- Retirés lors de la refonte : Chesterfield, canapé en lin classique, chaise de bureau, tables et consoles ornementées, lustre.
