---
name: matieres-4k
description: Matières réalistes en haute définition pour les inspirations, la matériauthèque et la 3D : textures PBR CC0 en 4K (Poly Haven, ambientCG), images natives en 4K, agrandissement (Real-ESRGAN) seulement s'il est signalé, noms de matières précis dans les consignes. À utiliser pour toute image ou texture de matière et pour toute consigne qui cite une matière.
---

# Matières en 4K

## Rôle
Une matière doit être reconnaissable de près : grain du chêne, alvéoles du travertin, éclats du terrazzo, brossage du laiton, froissé du lin, boucles de la bouclette.

## Sources (dans l'ordre)
1. **Poly Haven** et **ambientCG** : licence CC0. On télécharge en 4K les cartes couleur, normale, rugosité, AO et déplacement. Le téléchargement passe par le robot (`scripts/robot-studio.ts --pbr`).
2. **Poliigon** : seulement les matières gratuites. On vérifie leur licence à chaque matière : leurs textures ne doivent pas être redistribuées telles quelles, elles ne servent que dans les rendus.
3. **Images générées en 4K natif** : Nano Banana 2.1 en `image_size: 4K` (environ 0,11 $ par image). On ne le fait qu'avec l'accord du propriétaire.

## Règle sur la 4K
- **Native** : on ne dit « 4K » que si l'image ou la texture est réellement en 3840 px de large ou plus à la source.
- **Agrandie** : Real-ESRGAN (libre, BSD-3) peut agrandir une image 2K vers 4K pour l'affichage. Elle est alors notée « agrandie » dans `docs/ASSETS.md`, jamais « 4K ».
- **Affichage** : le site ne sert jamais le fichier 4K brut. Il sert des variantes AVIF ou WebP avec `srcset` (voir `audit-qualite`).

## Noms précis à utiliser dans les consignes
- **Bois** : chêne huilé, chêne fumé, noyer verni satiné, frêne blanchi, teck patiné.
- **Pierres** : travertin adouci à pores ouverts, marbre de Carrare adouci, marbre Calacatta, terrazzo à gros éclats, ardoise brute, pierre de Bourgogne.
- **Enduits et peintures** : enduit à la chaux taloché, tadelakt ciré, béton ciré, peinture minérale mate.
- **Textiles** : lin lavé froissé, bouclette laine crème, velours côtelé, laine chinée, jute tressé.
- **Métaux** : laiton brossé, laiton patiné, acier noir microbillé, inox brossé.
- **Céramiques** : zellige émaillé irrégulier, grès émaillé mat, terre cuite brute.

## Contrôle
- Gros plan à 100 % : pas de motif répété, pas de flou, pas de plastique.
- Vue générale : l'échelle est juste (une lame de parquet fait environ 12 à 20 cm de large).
