# Registre des licences des ressources

Généré par `node scripts/inventaire-assets.mjs`. Détail fichier par fichier : [ASSETS.md](./ASSETS.md).

## Répartition

| Licence | Fichiers |
|---|---:|
| CC0 1.0 | 119 |
| Création Pièce Rêvée ; textures sources CC0 1.0 | 53 |
| CC BY-SA 4.0 | 10 |
| CC BY 4.0 | 7 |
| Création Pièce Rêvée | 4 |
| CC BY 4.0 (crédit obligatoire) | 3 |
| Création Pièce Rêvée (image générée par IA, étiquetée) | 2 |

## Sources autorisées et obligations

| Source | Licence | Usage commercial | Crédit obligatoire | Remarques |
|---|---|:-:|:-:|---|
| Poly Haven (textures, modèles, HDRI) | CC0 1.0 | oui | non (crédit donné par courtoisie) | Source prioritaire pour les matières et les meubles. |
| ambientCG (textures) | CC0 1.0 | oui | non | Utilisée quand Poly Haven n'a pas la matière (marbre blanc). |
| Khronos glTF Sample Assets | CC0 1.0 ou CC BY 4.0 selon le modèle | oui | oui pour CC BY | Crédit affiché dans public/3d/LICENCES.txt et dans la fiche du meuble. |
| Wikimedia Commons | CC BY-SA 4.0 (photos retenues) | oui | **oui, sur l'image** | Auteur, licence et lien affichés sous chaque photo. Une image modifiée reste sous CC BY-SA. |
| Pexels / Unsplash | Licences propres, gratuites | oui | non (recommandé) | Nécessitent une clé API gratuite créée par le propriétaire du site. Pas encore utilisées. |
| BlendKit | Royalty Free / CC0 selon l'objet | selon l'objet | selon l'objet | Nécessite un compte. Pas encore utilisé. |
| Polices (Instrument Serif, Onest, Bricolage, JetBrains Mono) | SIL OFL 1.1 | oui | non | Voir public/fonts/LICENCES.txt. |

## Règles
- Aucune image sans auteur, source et licence connus. Une ressource dont la licence est inconnue est retirée.
- Pas d'image de marque, de logo d'enseigne ni de photo de produit reprise d'un site marchand : les fiches produits renvoient vers le site du vendeur.
- Les visuels composés par Pièce Rêvée restent marqués comme tels ; ils ne sont jamais présentés comme des photographies de projets réels.
- Les images générées par IA sont étiquetées « Image générée par IA » avec le fournisseur et la date ; leurs consignes sont conservées dans content/ia/commandes/.
