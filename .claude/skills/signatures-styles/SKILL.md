---
name: signatures-styles
description: Marqueurs visuels obligatoires (5 à 8) et interdits de chaque style d'intérieur, pour que chaque image de style soit reconnaissable au premier regard. À utiliser pour écrire ou valider toute consigne ou image d'inspiration, d'étude ou d'en-tête liée à un style.
---

# Signatures des styles

## Rôle
Empêcher que tous les styles produisent la même pièce beige. Chaque image de style doit montrer **au moins 5 marqueurs** de son style et **aucun interdit**.

## Instructions
1. Charger `signatures.json` : pour chaque style, `obligatoires`, `interdits`, `piece_type`, `lumiere`, `angle`.
2. Dans la consigne, nommer **tous** les marqueurs obligatoires comme éléments visibles, et ajouter les interdits dans la ligne LOCKS (« no chrome, no glossy surfaces… »).
3. Utiliser la pièce, la lumière et l'angle propres au style. Deux styles ne partagent jamais le même trio.
4. Après génération, cocher les marqueurs visibles. Avec moins de 5 marqueurs ou au moins 1 interdit, l'image est rejetée et régénérée.
5. Comparer l'image avec celles des autres styles, en planche contact. Si deux images se ressemblent (même palette dominante, même composition), régénérer la moins typée.

## Exemples
- **Japandi** : bois clair, lignes basses, céramique artisanale, lin, papier washi. Jamais de brillant.
- **Industriel** : brique, acier noir, béton, verrière d'atelier.
- **Haussmannien** : moulures, parquet point de Hongrie, cheminée en marbre, grande hauteur sous plafond.
- **Mid-century** : noyer, pieds compas, moutarde et vert olive.
- **Wabi-sabi** : enduit à la chaux, matières brutes imparfaites, tons terre.
- **Bohème** : rotin, textiles superposés, plantes, motifs.
