---
name: pbr-materials
description: Choisir, préparer et régler les matières PBR de Pièce Rêvée (Poly Haven, ambientCG) : sources CC0, cartes, échelle physique, teinte, rugosité, déplacement, contrôle visuel. À utiliser pour ajouter ou corriger une matière de content/data/materials-premium.json, ou quand un rendu paraît plastique.
---

# Matières PBR

## Rôle
Faire en sorte qu'un chêne, un travertin, un bouclé ou un laiton brossé soient reconnaissables au premier coup d'œil, en aperçu comme en rendu final.

## Quand l'utiliser
- Pour ajouter ou modifier une matière (`content/data/materials-premium.json`, schéma `lib/materials/schema.ts`).
- Quand un rendu paraît plastique, trop brillant, trop uniforme, répétitif ou à la mauvaise échelle.
- Pour régénérer les gros plans éditoriaux (`scripts/editorial-assets.mjs`).

## Principes
- **Sources CC0 uniquement** :
  - Poly Haven (`api.polyhaven.com/files/<id>`) ;
  - ambientCG (`ambientcg.com/api/v2/full_json`, archives `2K-JPG`).
  - `prefer: "ambientcg"` quand Poly Haven n'a pas la bonne matière (marbre blanc).
- **Téléchargement par le robot** (`scripts/robot-studio.ts --pbr`, GitHub Actions) vers `public/materiaux/<id>/` en WebP 2048. Le manifeste `content/data/materials-pbr.json` garde la source, les auteurs et la licence.
- **Échelle physique** avec `tileMeters` : parquet 2 m, tissu 0,3 à 0,5 m, pierre 1 m. C'est ce réglage qui évite l'effet miniature ou la répétition visible.
- **Paramètres justes.**
  - `metalness` vaut 0 ou 1.
  - `clearcoat` pour les vernis et les laques.
  - `sheen` pour le velours et le bouclé.
  - `anisotropy` pour le métal brossé.
  - `transmission` et `ior` pour le verre.
  - `roughnessScale` au-dessus de 1 pour mater une carte trop brillante.
- **Matières teintées** (`tint`) : la photo est désaturée et ses nuances sont réglées par `textureContrast` (peinture 0,15, enduit 0,45, tissus 0,9). La couleur vient de `baseColor`.

## Étapes
1. Chercher la matière sur Poly Haven puis sur ambientCG. Vérifier visuellement que c'est la bonne : un « marble » peut être un carrelage beige.
2. Ajouter `textures.search`, `prefer` et `assetId` si connu. Lancer le robot (entrée `studio`) et récupérer la branche `robot/ressources`.
3. Régler `tileMeters`, la rugosité et la teinte. Contrôler dans `/studio/controle/` (vues rapprochées).
4. Mesurer avec `node scripts/rendu-controle.mjs` (détail, hautes lumières, dominante).
5. Régénérer les visuels (`node scripts/editorial-assets.mjs`) et l'inventaire (`node scripts/inventaire-assets.mjs`).

## Erreurs à éviter
- Texture d'une autre matière : plaid au lieu de bouclé, béton fissuré, faux marbre.
- Métal à `metalness` 0,5.
- Couleur unie pour une matière à relief.
- Toutes les cartes fabriquées depuis une seule photo.
- Déplacement sur une géométrie non subdivisée.
- Parquet vernis miroir.

## Critères d'acceptation
- Matière reconnaissable en vue générale et en gros plan, sans répétition visible ni tache de couleur.
- Licence CC0 et source inscrites dans le manifeste et dans `docs/ASSETS.md`.
- Mesures `rendu-controle` stables ou meilleures qu'avant.

## Exemples
- Noyer verni : `oak_veneer`, teinte noyer, `tileMeters` 1,2, `clearcoat` 0,3, rugosité 0,45.
- Bouclé : `curly_teddy_natural`, `baseColor` `#EFE5D3`, `sheen` 0,6, `tileMeters` 0,35.
- Marbre Calacatta : en attente de la texture ambientCG. D'ici là, un aplat sobre ; jamais un faux marbre.
