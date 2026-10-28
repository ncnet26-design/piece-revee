---
name: materials-pbr
description: Choisir, préparer et régler les matières PBR de Pièce Rêvée (Poly Haven, ambientCG) : cartes, échelle physique, teinte, rugosité, déplacement. À utiliser pour ajouter une matière à content/data/materials-premium.json ou corriger un rendu plastique.
---

# Matières PBR

## Sources (licences vérifiées)
- Poly Haven — CC0 (API `api.polyhaven.com/files/<id>`), cartes `diff`, `nor_gl`, `rough`, `ao`, `disp`, `metal`.
- ambientCG — CC0 (API `ambientcg.com/api/v2/full_json`), archives `2K-JPG` : `_Color`, `_NormalGL`, `_Roughness`, `_AmbientOcclusion`, `_Displacement`, `_Metalness`.
- Téléchargement uniquement par le robot (`scripts/robot-studio.ts --pbr`) → `public/materiaux/<id>/` en WebP 2048, manifeste `content/data/materials-pbr.json` (source, auteurs, licence).

## Ajouter une matière
Entrée dans `content/data/materials-premium.json` (schéma `lib/materials/schema.ts`) :
- `tileMeters` = taille réelle couverte par la texture (parquet 2 m, tissu 0,3–0,5 m, pierre 1 m) — c'est elle qui évite les répétitions visibles ou l'effet « miniature ».
- `pbr` : `roughness`, `metalness` (0 ou 1, jamais entre pour un vrai métal), `clearcoat` pour vernis/laque, `sheen` pour velours et bouclé, `anisotropy` pour métal brossé, `transmission`/`ior` pour le verre.
- Teinte (`tint`) : la photo est désaturée, ses nuances réglées par `textureContrast` (peinture 0,15, enduit 0,45, tissus 0,9) ; la couleur vient de `baseColor`.
- `roughnessScale` > 1 rend plus mat une carte trop brillante (parquet 1,8).
- Ne jamais remplacer une matière qui a besoin de relief par une couleur unie ; ne pas fabriquer toutes les cartes depuis une seule photo.

## Déplacement
`displacementMap` seulement en gros plan sur une géométrie subdivisée (option `displacement` de `buildMaterial`) ; sinon normal map. Une normal map n'est pas de la géométrie : arrondis et chanfreins se modélisent (ex. biseau de la table galet).

## Validation
`/studio/controle/` + `node scripts/rendu-controle.mjs` : indicateur « détail » en hausse, 0 % de hautes lumières brûlées, aucune tache de couleur, pas de répétition visible en vue générale.
