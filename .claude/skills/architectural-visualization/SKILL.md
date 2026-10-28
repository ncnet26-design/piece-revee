---
name: architectural-visualization
description: Mise en image d'un intérieur comme un photographe d'architecture dans Pièce Rêvée : cadrage, focale, hauteur de caméra, verticales, composition, mise en scène, lumière, rendu final 3D et consignes aux générateurs d'images. À utiliser pour régler une caméra du Studio, produire un rendu de présentation ou écrire une consigne d'image.
---

# Visualisation architecturale

## Rôle
Produire des images d'intérieur crédibles et désirables, comme celles d'une revue d'architecture, à partir de la scène 3D ou d'un générateur.

## Quand l'utiliser
- Pour régler les vues : `QA_VIEWS` et les caméras de `lib/studio/scene.ts`, la caméra de `lib/studio/engine.ts`.
- Pour lancer un rendu final (`lib/studio/final-render.ts`) ou préparer une image éditoriale (`public/editorial/rendus/`).
- Pour rédiger une consigne d'image (champ `prompt` de la banque d'inspiration, worker IA).

## Principes
- **Caméra.**
  - Hauteur de 1,10 à 1,40 m (œil assis à debout).
  - Focale de 24 à 35 mm équivalent pour une vue générale, 50 à 85 mm pour un détail.
  - Verticales droites : pas de plongée ni de contre-plongée sur une vue générale.
- **Composition.**
  - Une vue frontale ou à deux points de fuite.
  - Un premier plan léger, un sujet principal au tiers, une respiration.
  - Les ouvertures sont visibles quand elles portent la lumière.
- **Lumière.**
  - Une source dominante (fenêtre), douce et latérale, avec des ombres de contact.
  - Exposition sans hautes lumières brûlées ; balance des blancs neutre à chaude.
- **Mise en scène.** Peu d'objets, de vraies échelles, des objets à la vie plausible (un livre, une céramique). Pas d'accumulation.
- **Niveaux de rendu.** Il faut distinguer :
  - l'aperçu interactif ;
  - le rendu final par lancer de rayons (GPU de l'utilisateur) ;
  - l'image générée.
  - On ne nomme jamais « 4K » une image agrandie (voir `photorealistic-rendering`).

## Étapes
1. Choisir le récit de l'image : la pièce entière, un coin ou un détail de matière.
2. Placer la caméra (hauteur, focale, verticales), puis vérifier la composition au tiers.
3. Régler la lumière :
   - environnement HDR intérieur (`public/3d/apartment.exr`) ;
   - soleil latéral ;
   - exposition, puis contrôle de l'histogramme.
4. Rendre l'aperçu, relire, puis lancer le rendu final si un GPU est disponible.
5. Légender : « Rendu 3D, Pièce Rêvée », la résolution native et la date.

## Erreurs à éviter
- Grand-angle extrême (< 20 mm) qui déforme les meubles.
- Caméra au plafond.
- Lumière plate sans ombre.
- Brouillard ou flou de profondeur pour masquer une géométrie pauvre.
- Image IA présentée comme rendu 3D.
- Changement de la géométrie de la pièce dans une transformation de photo.

## Critères d'acceptation
- Verticales droites à ±1°.
- Aucune zone brûlée (indicateur `rendu-controle` à 0 %).
- Ombres de contact visibles sous les meubles.
- Légende honnête du type d'image et de sa résolution native.

## Exemples
- Rendu « Bouclé et noyer » de l'accueil : caméra à 1,2 m, vue frontale, canapé bouclé au tiers gauche, buffet en noyer au fond, lumière latérale douce.
- Consigne d'image : « Vue frontale à hauteur d'œil, focale 28 mm, verticales droites, lumière naturelle latérale douce, ombres de contact, aucune personne, aucun texte, aucune marque. »
