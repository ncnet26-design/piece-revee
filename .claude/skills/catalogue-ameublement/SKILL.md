---
name: catalogue-ameublement
description: Structure et alimentation de la base d'ameublement de Pièce Rêvée (champs, gammes de prix, styles, pièces, sources : robot schema.org et flux d'affiliation Awin, Amazon Partenaires…), mise à jour des prix, détection des liens morts, recherche par budget, pièce et style. À utiliser pour modifier le robot, importer un flux, enrichir les produits ou construire une page de recherche de produits.
---

# Catalogue d'ameublement

## Rôle
Une base de produits réels, à tous les prix, qu'on peut filtrer par budget, pièce et style, pour que chacun puisse refaire son intérieur. Aucune donnée n'est inventée.

## Structure d'un produit (cible)
| Champ | Exemple | Source |
|---|---|---|
| `id` | empreinte de l'adresse | calculé |
| `nom` | « Table basse ovale en travertin » | page ou flux |
| `enseigne`, `marque` | Westwing, — | page ou flux |
| `prix`, `devise` | 489, EUR | page ou flux, avec date |
| `gamme` | petit budget / milieu / haut de gamme | calculée par famille, sur les tiers des prix observés |
| `famille` | table-basse | nom (règles de `lib/catalogue.ts`) |
| `pieces` | salon | déduites de la famille (canapé → salon ; lit → chambre…) |
| `styles` | contemporain, wabi-sabi | déduits des matières et formes (`signatures-styles`) ; indiqués « déduit » |
| `dimensions`, `matiere`, `couleur` | 120 × 60 × 32 cm, travertin, beige | flux ou page, si publiés |
| `lien` | adresse de la fiche | page ou flux |
| `image` (`i`) | adresse de l'image publiée par l'enseigne (JSON-LD `image` ou `og:image`), **affichée depuis son site, jamais copiée ni stockée** ; ou image fournie par un flux d'affiliation | page ou flux |
| `maj`, `zone` | 2026-11-03, FR / EU / US | robot |

## Sources
1. **Robot** (`scripts/robot-catalogue.ts`, chaque nuit) :
   - plans de site des enseignes, robots.txt respecté, données schema.org de la page ;
   - **aucune photo copiée** ;
   - un lien mort (404 ou 410) est retiré à la visite suivante ;
   - une enseigne qui refuse les robots (403 ou 429) n'est plus visitée.
2. **Flux d'affiliation** (Awin, Effinity, Amazon Partenaires) : seule source autorisée pour les **photos**. Il faut que le propriétaire ait créé ses comptes. Le flux est importé chaque nuit ; une ligne absente du flux est retirée.
3. **Sélection vérifiée** à la main (`content/data/products.json`).

## Règles
- On ne copie jamais les photos des enseignes : on affiche l'image qu'elles publient depuis leur propre serveur (lien direct, sans transmettre l'adresse de notre page), toujours accompagnée du lien vers la fiche. Une enseigne qui bloque cet affichage voit son image remplacée par un fond neutre. Les flux d'affiliation restent la source préférée quand ils existent.
- Un prix est toujours affiché avec sa date de relevé. Sans prix relevé, on affiche « prix sur le site ».
- Aucun classement payé. Le tri par défaut alterne les familles et les enseignes.
- Les accessoires et consommables sont exclus (`estAccessoire`).

## Recherche par budget (page cible)
- **Entrées** :
  - budget total ou par pièce ;
  - pièce (salon, chambre, cuisine, salle de bain, entrée, bureau, extérieur) ;
  - style.
- **Sortie** : une liste composée, par exemple un canapé, une table basse, un tapis, un luminaire et deux objets de déco. Les produits respectent les styles et la pièce, et le total ne dépasse pas le budget. Il y a trois propositions (petit budget, milieu, haut de gamme), modifiables article par article.
