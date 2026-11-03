---
name: anti-rendu-ia
description: Techniques pour qu'une image générée ressemble à une vraie photo d'architecture et non à une image d'IA (partir de vraies photos, imperfections volontaires, variété des pièces, angles et lumières, consignes jamais réutilisées d'un style à l'autre, post-traitement). À utiliser pour chaque image d'inspiration, d'étude ou d'en-tête, avant et après génération.
---

# Éviter l'effet « image d'IA »

## Rôle
Le défaut principal actuel : toutes les images partagent le même gabarit (pièce beige, lumière du matin, objets alignés, consigne identique). Cette compétence casse ce gabarit.

## Instructions
1. **Partir d'une vraie photo quand c'est possible.**
   - Avec notre fournisseur (Gemini, Nano Banana), il n'y a pas de ControlNet. L'équivalent est la **retouche à partir d'une photo de référence** : une vraie photo de pièce libre de droits (Wikimedia Commons, CC BY ou CC0), dont on conserve la géométrie et que l'on rhabille selon le style.
   - Si un moteur avec ControlNet (profondeur) est ajouté plus tard (Workers AI, Replicate), utiliser la carte de profondeur de la vraie photo.
2. **Ajouter des imperfections volontaires**, 2 ou 3 par image et différentes à chaque fois :
   - un plaid froissé, un livre ouvert, une tasse entamée, une chaise légèrement tirée ;
   - l'usure d'un parquet, un pli de rideau, un câble de lampe visible, une plante pas parfaitement symétrique.
3. **Varier systématiquement** la pièce (salon, cuisine, chambre, entrée, bureau), l'angle (frontal, diagonal, coin, plongée légère interdite), l'heure (matin, midi voilé, heure dorée, soir) et la focale.
   - La pièce, la lumière et l'angle viennent de `signatures-styles` (`piece_type`, `lumiere`, `angle`).
4. **Ne jamais réutiliser le même gabarit de consigne d'un style à l'autre.**
   - Chaque style a sa propre phrase d'ouverture, son propre ordre de description et son propre vocabulaire.
   - Interdit : le même paragraphe technique collé à la fin de toutes les consignes.
5. **Demander une « photo de magazine »** : « photographed by an architectural photographer for a design magazine, real location, lived-in », sans adjectifs vides (« stunning », « beautiful »).
6. **Post-traitement** (même chaîne pour toutes) : grain léger, balance des blancs, légère vignette, voir `direction-artistique-images`.
7. **Relecture** : planche contact de toutes les images d'une série. Rejeter celles qui se ressemblent ou qui échouent à la grille de rejet.

## Erreurs typiques à corriger
- Tout est neuf, propre et aligné.
- Une seule lumière (matin doux) pour tous les styles.
- Les mêmes objets partout : vase, branche, bol, livre fermé.
- Des murs lisses sans aucune texture.
- La caméra toujours au centre et de face.
