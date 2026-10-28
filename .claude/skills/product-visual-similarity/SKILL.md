---
name: product-visual-similarity
description: Associer les meubles d'un rendu à des produits réellement achetables dans Pièce Rêvée : base de produits sourcée, recherche par ressemblance, gammes, filtres, honnêteté des données. À utiliser pour ajouter des produits ou modifier lib/studio/similar.ts.
---

# Produits et ressemblance visuelle

## Principe
Le design est créé par notre IA, indépendamment des marques. Les produits commerciaux sont des **alternatives** classées par ressemblance, jamais par partenariat (l'affiliation éventuelle ne touche pas au classement).

## Ajouter un produit (`content/data/products.json`, schéma `lib/products/schema.ts`)
- Source officielle (fiche de la marque ou de l'enseigne) + date (`verification.at`) ; prix avec devise, région et date ; dimensions si publiées ; `demo: true` uniquement pour une donnée fictive (aucune aujourd'hui).
- Photo : seulement avec une licence (flux d'affiliation, presse) — sinon `image: null`.
- Relecture automatique : `scripts/robot-studio.ts --produits` (données schema.org) ; un 404 ou une redirection vers une liste = lien mort à retirer.

## Ressemblance (`lib/studio/similar.ts`)
Score /100 : silhouette 30, matières 25 (affinités : imitation travertin ≈ 0,7 travertin), couleur 20 (écart perçu), style 15, dimensions 10. Seuil `MIN_SCORE` = 45 : en dessous, on n'affiche rien et on l'explique. Répartition économique / intermédiaire / premium ; gamme vide → « Pas d'alternative assez ressemblante ».
Étape suivante : empreintes d'images (embeddings) dès que des photos produits sont autorisées.

## Validation
`tests/unit/studio.test.ts` : la table sculpturale en travertin trouve Guimel et Oris, écarte Borgeby (bois) ; filtres budget/pays/matière.
