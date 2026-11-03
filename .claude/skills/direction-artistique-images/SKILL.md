---
name: direction-artistique-images
description: Règles d'une photographie d'architecture intérieure professionnelle pour toutes les images de Pièce Rêvée (lumière, verticales, focale, hauteur, grain, ratios, traitement homogène) et grille de rejet. À utiliser pour écrire une consigne d'image, choisir ou recadrer une image, et valider ou rejeter toute image avant publication.
---

# Direction artistique des images

## Rôle
Faire en sorte que chaque image du site semble sortir du même photographe d'architecture : même exigence, même traitement, mêmes formats.

## Règles de prise de vue (à écrire dans chaque consigne)
- **Lumière** : naturelle et latérale, par une fenêtre visible ou hors champ, ou heure dorée. Jamais de lumière plate de face. Les ombres de contact sont visibles sous chaque meuble.
- **Géométrie** : verticales parfaitement droites, sans plongée ni contre-plongée. Une vue frontale ou à deux points de fuite.
- **Optique** : 24 à 35 mm pour une pièce, 50 à 85 mm pour un détail ou une matière.
- **Hauteur** : appareil à hauteur d'œil, entre 1,2 et 1,5 m (1,1 m pour les styles bas, comme le japandi).
- **Rendu** : grain photographique léger, hautes lumières non brûlées, balance des blancs neutre à chaude, couleurs fidèles.
- **Composition** : un sujet principal, une respiration, un premier plan discret. Pas de symétrie parfaite.

## Formats du site (fixes)
| Usage | Ratio | Largeur servie |
|---|---|---|
| Ouverture plein écran | 16:9 (recadrage 21:9 possible) | 2400 px, avec variantes 1600, 1200 et 800 |
| Carte d'inspiration, de style ou d'étude | 4:5 | 1200 px, avec variantes 800 et 480 |
| Image paysage d'article ou d'étude | 3:2 | 1600 px, avec variantes 1200 et 800 |
| Matière | 1:1 | 1200 px, avec variante 600 |

## Traitement homogène (post-traitement identique pour toutes)
1. Recadrage au ratio du format.
2. Balance des blancs ramenée vers 5200–5600 K.
3. Grain léger.
4. Vignette très légère.
5. Export en AVIF et WebP, aux tailles du tableau.

Le script de traitement applique les mêmes réglages partout. On ne retouche jamais une image à la main en dehors de ce traitement.

## Grille de rejet
Une seule case cochée et l'image est **rejetée**, puis régénérée.
- [ ] Objet déformé, fondu, en double ou qui flotte (pieds sans contact, ombre absente)
- [ ] Texte, logo ou étiquette lisible ou pseudo-lisible
- [ ] Perspective fausse : verticales penchées, horizon incohérent, échelle impossible
- [ ] Lumière plate ou incohérente : ombres dans plusieurs directions
- [ ] Symétrie trop parfaite, effet « rendu 3D de catalogue »
- [ ] Matière illisible, plastique ou répétée
- [ ] Style non reconnaissable : moins de 5 marqueurs (`signatures-styles`)
- [ ] Mains, personnes, animaux non demandés

## Notation (audit)
- **A, publiable** : aucune case cochée, style évident, photo crédible.
- **B, à améliorer** : aucune case cochée mais image générique (style peu marqué, composition banale).
- **C, à refaire** : au moins une case cochée.
