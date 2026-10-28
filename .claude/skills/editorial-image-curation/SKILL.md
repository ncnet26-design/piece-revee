---
name: editorial-image-curation
description: Sélectionner, sourcer, créditer, préparer et retirer les images de Pièce Rêvée (photographies d'architecture, gros plans de matières, planches, rendus, images générées) avec licences vérifiées. À utiliser avant d'ajouter, remplacer ou supprimer une image, et pour tenir à jour l'inventaire et le registre des licences.
---

# Curation d'images éditoriales

## Rôle
Ne publier que des images belles, justes et utilisables légalement, chacune avec sa provenance. Une image médiocre ou incertaine est retirée plutôt que gardée « en attendant ».

## Quand l'utiliser
- Pour ajouter une image à la banque d'inspiration, à l'accueil ou à une page.
- Quand une image est floue, hors sujet ou sans licence claire.
- Avant une livraison : régénérer `docs/ASSETS.md` et `docs/LICENCES-RESSOURCES.md`.

## Principes
- **Sources gratuites et autorisées.**
  - Poly Haven et ambientCG (CC0).
  - Wikimedia Commons, en vérifiant la licence fichier par fichier (CC BY-SA : crédit sur l'image).
  - Pexels et Unsplash : licences propres, clé API gratuite à créer par le propriétaire du site.
  - Visuels composés par nos scripts.
- **Interdits.**
  - Images de sites marchands, logos d'enseignes, photos de produits copiées.
  - Images sans auteur ni licence, et captures de réseaux sociaux.
- **Qualité.**
  - Au moins 1400 px de large pour un grand format et 640 px pour une vignette.
  - Ni flou, ni bruit, ni filigrane.
  - Verticales droites et lumière naturelle.
  - Le sujet est un intérieur contemporain ou une matière, jamais un château, une maison générique ou un meuble de catalogue bas de gamme.
- **Étiquetage.**
  - Chaque image dit ce qu'elle est : photographie (auteur · licence · source), planche de matières, rendu 3D ou image générée (fournisseur, date).
  - Une image générée n'est jamais présentée comme une photographie de projet réel.
- **Peu mais mieux.** Une petite série très soignée vaut mieux qu'une grande collection inégale.

## Étapes
1. Définir le besoin : rôle de l'image, format, style ou matière, page.
2. Chercher d'abord dans l'existant : `public/editorial/`, `content/data/inspirations.json`, `content/data/inspiration-bank.json`.
3. Si besoin, sourcer (robot GitHub Actions pour Commons, Poly Haven et ambientCG) et noter l'auteur, l'URL et la licence.
4. Préparer en WebP : 1600 px pour un grand format, 640 px pour une vignette, qualité 80 à 85. Recadrer sans déformer.
5. Composer si nécessaire (`scripts/editorial-assets.mjs`) : gros plans teintés et planches de style.
6. Brancher l'image avec son crédit visible, puis lancer `node scripts/inventaire-assets.mjs` : aucune ligne « non référencé », aucune licence « À VÉRIFIER ».
7. Sans générateur d'images disponible, écrire une consigne détaillée et sans marque dans le champ `prompt` de la banque, et garder l'emplacement prêt.

## Erreurs à éviter
- Garder une image « provisoire » de mauvaise qualité.
- Mélanger dans une même grille des photos de qualités très différentes.
- Oublier le crédit CC BY-SA.
- Agrandir une petite image.
- Prendre une texture mal nommée pour la bonne matière.
- Payer un service ou créer un compte sans l'accord du propriétaire.

## Critères d'acceptation
- 100 % des images de `public/` figurent dans `docs/ASSETS.md` avec rôle, résolution, provenance et licence.
- Aucun fichier non référencé, aucune licence inconnue.
- Le crédit est visible partout où la licence l'exige.

## Exemples
- `public/inspirations/villas-15.webp` : Villa Tugendhat, Wikimedia Commons, CC BY-SA 4.0. Crédit affiché en bas de l'image d'accueil.
- `public/editorial/planches/japandi.webp` : planche composée à partir de chêne fumé, lin lavé, enduit à la chaux et terre cuite (CC0), avec les pastilles de la palette.
- Retrait de cinq anciens visuels non utilisés (`public/visuels/etude.webp`…) lors de la refonte.
