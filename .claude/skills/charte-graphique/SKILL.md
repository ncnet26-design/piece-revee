---
name: charte-graphique
description: Charte graphique de Pièce Rêvée (palette, polices, échelle typographique, espacements, rayons, ratios d'images, composants) : l'état actuel déduit du site et la version haut de gamme proposée « studio de Los Angeles ». À utiliser pour toute nouvelle page ou composant, toute refonte d'écran, et pour juger la cohérence visuelle.
---

# Charte graphique

## Rôle
Une seule façon de faire les choses partout : mêmes couleurs, mêmes tailles, mêmes rayons, mêmes formats d'images. La source technique est `app/globals.css` ; la documentation détaillée est dans `docs/DESIGN-SYSTEM.md`.

## État actuel (déduit du site, novembre 2026)
- **Couleurs** :
  - fond papier `#F4F1EB`, surface `#FBFAF7`, doux `#EAE5DC` ;
  - encre `#1B1A17`, gris `#625C53`, filet `#DDD6CB` ;
  - bronze `#7A5B30`, rare.
- **Polices** :
  - Instrument Serif pour les titres h1 et h2 ;
  - Onest pour l'interface et le texte ;
  - JetBrains Mono pour les données.
- **Écarts constatés** (voir l'audit) :
  - rayons d'angle utilisés : 6, 8, 10, 12, 14, 16, 18, 22, 28 et 32 px ;
  - tailles de titre très variées d'une page à l'autre ;
  - ratios d'images multiples (4:3, 4:5, 16:9, 16:11, 3:2, carré) ;
  - pages anciennes (matériauthèque, styles, accords, lieux, plantes) avec des illustrations dessinées et des cartes d'une autre génération.

## Version proposée « studio haut de gamme » (à valider par le propriétaire)
- **Couleurs** :
  - papier `#F3F0EA`, encre `#141412`, gris `#5E5850`, filet `#D9D2C6` ;
  - un seul accent, le bronze profond `#6E5230`, réservé aux numéros et aux états actifs ;
  - en sombre : fond `#121210`, texte `#EEE9E0`.
- **Typographie** :
  - Instrument Serif pour l'affichage uniquement : h1 de 56 à 128 px, h2 de 40 à 72 px, interlettrage −1 % ;
  - Onest pour tout le reste : 16 px pour le texte, interlignage 1,6 ;
  - surtitres en capitales 11 px, espacement 0,2 em.
  - Pas plus de 3 tailles par écran.
- **Espacements** : échelle 4, 8, 12, 16, 24, 32, 48, 64, 96, 144. Sections de 96 à 144 sur ordinateur, 64 sur mobile.
- **Rayons** : 0 pour les images (angles nets, comme une photo imprimée), 2 px pour les cartes et les champs, 999 pour les boutons et pastilles. Plus aucun autre rayon.
- **Images** : uniquement les 4 formats de `direction-artistique-images` (16:9, 4:5, 3:2, 1:1) et le même traitement partout. La légende (crédit ou « Image générée par IA ») est en 11 px gris, sous l'image et non par-dessus, sauf pour l'ouverture plein écran.
- **Grilles** : 12 colonnes, largeur maximale 1440 px, gouttière de 24 px (16 px sur mobile).
- **Composants** :
  - bouton principal plein encre, bouton secondaire au filet, lien texte souligné ;
  - cartes sans ombre ni bordure (l'image fait la carte) ;
  - panneaux latéraux à fond surface et filet ;
  - fenêtres plein écran sur mobile.
- **Mouvement** : fondu et léger zoom des images au survol (700 ms), aucune animation de défilement qui cache le contenu.

## Instructions
1. Toute nouvelle page utilise les jetons et les composants ci-dessus, sans couleur ni rayon codés en dur.
2. Avant de livrer, faire les captures sur ordinateur et sur mobile (`visual-quality-assurance`) et les comparer aux pages existantes.
3. Tant que la version proposée n'est pas validée, appliquer l'état actuel. Une fois validée, mettre à jour `app/globals.css`, puis `docs/DESIGN-SYSTEM.md`.
