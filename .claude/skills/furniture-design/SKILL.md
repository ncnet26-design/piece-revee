---
name: furniture-design
description: Concevoir ou choisir des meubles 3D crédibles pour Pièce Rêvée : proportions, épaisseurs, arrondis, jonctions, métadonnées de la bibliothèque. À utiliser pour ajouter un meuble à content/data/furniture.json ou modéliser un objet procédural.
---

# Conception de mobilier

## Bibliothèque (`content/data/furniture.json`, `lib/studio/library.ts`)
Chaque meuble : `id` stable, `model` (GLB de `content/data/models.json` ou objet calculé `proc:*`), catégorie, style, couleurs, matières, silhouette, détails, `productId` **seulement** si le modèle représente un produit commercial vérifié.
Sources de modèles : Poly Haven (CC0), Khronos glTF Sample Assets / Wayfair (CC BY 4.0 → crédit affiché). Optimisation : `gltf-transform optimize --texture-compress webp --texture-size 1024`.

## Qualité géométrique
- Plateaux : 2–4 cm (bois), 3–6 cm (pierre) ; arêtes adoucies (biseau réel, pas une texture).
- Pieds et jonctions visibles et proportionnés ; assises 42–45 cm, canapé 80–95 cm de profondeur.
- Exemple procédural : `proc:table-galet` (galet de travertin, `ExtrudeGeometry` avec biseau de 4 cm, 96 segments).
- Un modèle trop pauvre se remplace ; on ne masque pas une mauvaise géométrie par une texture 4K.

## Validation
Vignettes (`scripts/model-thumbs.mjs`) relues ; dimensions calculées (`scripts/model-dims.ts`) cohérentes avec la réalité ; sélection et remplacement testés dans le Studio 3D.
