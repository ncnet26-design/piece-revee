---
name: audit-visuel
description: Inventaire de chaque image affichée par le site, mesures automatiques (format, ratio, poids, couleurs, ressemblance entre images) et notation A/B/C selon la grille de direction-artistique-images, avec la liste de ce qui doit être remplacé. À utiliser avant une refonte, après un lot d'images et avant chaque livraison importante.
---

# Audit visuel

## Instructions
1. Lancer `node scripts/audit-visuel.mjs`. Le script écrit `docs/audit/visuel.md`, `docs/audit/visuel.json` et des planches contact dans `docs/audit/planches/`. Il mesure :
   - l'inventaire des images publiques et les pages qui les affichent ;
   - la taille, le ratio, le poids et le format de chaque image ;
   - les couleurs dominantes, la saturation et la luminosité ;
   - les quasi-doublons, par empreinte perceptuelle ;
   - la ressemblance entre les images de styles différents. Si deux styles sont trop proches, aucun des deux n'est reconnaissable.
2. Regarder chaque planche contact et noter chaque image avec la grille de `direction-artistique-images` :
   - **A** : publiable ;
   - **B** : générique, à améliorer ;
   - **C** : défaut de la grille de rejet, à refaire.
   La raison est écrite en une ligne.
3. Relever aussi les pages qui affichent des **illustrations dessinées** à la place d'images : matériauthèque, styles, accords, lieux sans photo, plantes, mobilier.
4. Produire la liste de remplacement, par page et par priorité, avec pour chaque image : la raison, le style visé et la consigne à suivre (`signatures-styles`, `anti-rendu-ia`).

## Règle
Une note se fonde sur ce que l'on voit, jamais sur l'intention. Les mesures automatiques aident, mais c'est la relecture des planches qui décide.
