---
name: premium-art-direction
description: Direction artistique haut de gamme de Pièce Rêvée (studio d'architecture et de design, pas un jeu ni une boutique) : ton, palette, typographie, choix et mise en page des images, rythme éditorial. À utiliser avant toute nouvelle page, section, image ou refonte, et pour arbitrer « est-ce assez premium ? ».
---

# Direction artistique premium

## Rôle
Garantir que chaque écran ressemble à la publication d'une agence d'architecture intérieure. Il doit évoquer une monographie, une revue d'architecture ou le site d'un éditeur de mobilier. Il ne doit jamais évoquer un jeu vidéo, un configurateur grand public ou un site de dropshipping.

## Quand l'utiliser
- Avant de créer ou de refondre une page ou une section.
- Avant d'ajouter une image, une illustration, une icône ou une animation.
- Quand un écran « fait cheap » et qu'il faut dire pourquoi.

## Principes
1. **L'image d'abord.** Une grande image juste vaut mieux que six vignettes. Chaque section a au plus un visuel dominant.
2. **Calme.** Grandes marges, peu d'éléments, une seule action principale par écran. Je préfère cinq pages exceptionnelles à dix modules médiocres.
3. **Typographie éditoriale.**
   - Titres en *Instrument Serif* (corps 400), avec une partie en italique atténuée pour le rythme. Exemple : « L'intérieur, dessiné *avant d'être construit.* »
   - Texte courant en *Onest*. Surtitres en petites capitales espacées.
4. **Palette minérale.**
   - Papier `#F4F1EB`, surface `#FBFAF7`, encre `#1B1A17`, gris `#625C53`, filet `#DDD6CB`.
   - Un seul accent bronze `#7A5B30`, rare.
   - Jamais de violet, de bleu « application » ni de dégradés vifs.
5. **Matières vraies.**
   - Montrer des matières photographiées (textures CC0) ou des photographies d'architecture créditées.
   - Pas d'illustrations 3D « jouet », de clipart ou de rendu plastique.
6. **Honnêteté visible.** Chaque image dit ce qu'elle est : photographie (auteur, licence), planche composée, rendu 3D ou image générée.
7. **Aucune marque mise en avant.**
   - Pas de mur de logos d'enseignes.
   - Les produits réels n'apparaissent que comme alternatives à un meuble dessiné.

## Étapes
1. Formuler en une phrase ce que l'écran doit faire ressentir et faire faire.
2. Choisir l'image maîtresse :
   - dans `content/data/inspiration-bank.json` ;
   - dans `public/editorial/` ;
   - ou dans les photographies créditées de `content/data/inspirations.json`.
3. Construire la hiérarchie : surtitre, titre serif, une phrase, une action principale et au plus une action secondaire.
4. Appliquer les jetons de `docs/DESIGN-SYSTEM.md`, sans valeur de couleur codée en dur.
5. Capturer à trois tailles (`node scripts/qa-captures.mjs`) et relire avec la grille de `docs/qa/README.md`.

## Erreurs à éviter
- Sections vides en attente d'une animation de défilement.
- Cartes toutes identiques en grille infinie.
- Badges multicolores.
- Emoji décoratifs.
- Vocabulaire marketing (« révolutionnaire », « magique », « IA ultra-puissante »).
- Images de châteaux, de maisons génériques ou de meubles de catalogue bas de gamme.
- Images floues ou à la licence incertaine.
- Présenter un outil incomplet comme un produit fini. On le nomme « première version » ou on le retire du menu.

## Critères d'acceptation
- Le premier écran comporte une image forte, un titre serif et une action. Rien ne clignote et rien n'est vide.
- Toutes les couleurs viennent des jetons, et le contraste du texte est d'au moins 4,5:1 (axe vert).
- Chaque image a une provenance et une licence dans `docs/ASSETS.md`.
- Sur mobile, la hiérarchie est intacte et rien ne déborde.

## Exemples
- Accueil (`app/page.tsx`) :
  - photographie de la villa Tugendhat créditée en plein cadre ;
  - titre « L'intérieur, dessiné *avant d'être construit.* » ;
  - un seul bouton principal, « Commencer un projet ».
- Section « Un meuble dessiné, *trois façons de l'avoir.* » : un meuble original au centre et trois produits réels datés autour. Les produits ne sont jamais au premier plan.
