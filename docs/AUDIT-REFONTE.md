# Audit du site et plan de refonte (3 novembre 2026)

Sources :
- mesures automatiques : `docs/audit/visuel.md`, `docs/audit/qualite.md` (scripts `scripts/audit-visuel.mjs` et `scripts/audit-qualite.mjs`) ;
- planches contact : `docs/audit/planches/` ;
- captures des pages : `docs/audit/pages/`.

Notation selon la compétence `direction-artistique-images` : **A** publiable · **B** générique, à améliorer · **C** à refaire.

## 1. Audit visuel

### Constat principal : les styles se ressemblent
Mesure de palette entre images : 0 = identique, 1 = tout opposé.
- Les paires les plus proches sont toutes dans le même registre, celui de la pièce beige à l'enduit clair :
  - chambre et haussmannien : 0,10 ;
  - chambre et mid-century : 0,11 ;
  - cuisine et haussmannien : 0,11 ;
  - salon et scandinave : 0,12.
- 9 images de style sur 13 et 9 images d'espace sur 11 ont la même base :
  - murs crème ;
  - voilage de lin ;
  - lumière du matin ;
  - pièce presque vide ;
  - caméra frontale.
  C'est le même gabarit de consigne, avec le même paragraphe technique en fin de consigne.

### Notes par image
| Groupe | A | B | C | Détail |
|---|---:|---:|---:|---|
| IA : styles (12 + ouverture) | 5 | 7 | 0 | **A** : Art déco, Haussmannien, Méditerranéen, Campagne, Japandi. **B** (générique, beige, vide) : Parisien contemporain (trop proche du haussmannien), Minimalisme chaleureux, Scandinave (pièce vide, lumière plate), Luxe discret, Contemporain sculptural (trop symétrique), Mid-century (murs beiges ; moutarde et pieds compas peu visibles), Brutalisme raffiné. |
| IA : espaces (11) | 3 | 8 | 0 | **A** : Jardin, Terrasse, Façade. **B** : Salon, Chambre, Cuisine, Salle à manger, Entrée, Salle de bain, Bureau, Dressing. Tous dans la même gamme crème. |
| IA : matières (13) | 12 | 1 | 0 | **B** : Peinture (pot sale, peu valorisant). |
| IA : accueil et Studio (4) | 4 | 0 | 0 | L'image d'ouverture est **la même** que la carte « Art déco » : doublon visible sur le site. |
| Gros plans de textures composés (28) | 8 | 6 | 14 | **C** (aplat sans matière) : faïence blanche, peinture mate, peinture velours, verre clair, verre dépoli, verre fumé, marbre Calacatta, zellige émeraude, laque brillante, velours forêt. **C** (doublon) : tapis laine = bouclé, enduit ≈ peinture velours. **C** (rayures synthétiques) : laiton brossé, bronze brossé. **A** : chêne naturel, noyer, parquet chevron, travertin, terre cuite, pierre naturelle, chêne fumé, terrazzo. |
| Planches de style composées (20) | 0 | 20 | 0 | Même gabarit de carrés pour toutes, mêmes échantillons d'une planche à l'autre. Elles restent utiles en second plan, dans les fiches. |
| Photographies d'architecture (6) | 3 | 1 | 2 | **A** : Villa Tugendhat ×3 (vraies photos, créditées), mais toujours la même maison. **C** : villas-10 (salon tape-à-l'œil), villas-24 (extérieur de rendu 3D). Ces deux-là ne sont plus affichées : à supprimer des données. |
| Anciens visuels 3D (4) | 0 | 0 | 4 | Rendus « jeu vidéo ». Encore utilisés dans la planche par défaut et la maquette 3D. |

### Pages qui montrent des dessins au lieu d'images
Toutes sont notées **C**.
| Page | Éléments | Ce qu'on voit |
|---|---:|---|
| `/styles/` et les fiches style | 20 | Illustrations plates façon dessin animé |
| `/lieux/` | 31 sur 40 | Aplats de couleurs géométriques (seulement 9 lieux ont une photo) |
| `/plantes/` | 51 | Une lettre sur un fond vert |
| `/mobilier/` | 85 | Trois échantillons de matière, sans le meuble |
| `/matieres/` (matériauthèque) | 60 | Échantillons dessinés. La fiche Travertin montre des **dalles** au lieu de la pierre |
| `/accords/` | 30 | Trois échantillons dessinés |

### Incohérences de design
- **Rayons d'angle** : 14 valeurs différentes (0, 6, 8, 10, 12, 14, 16, 18, 22, 28, 32 px, ainsi que `xl`, `2xl` et `lg`).
- **Ratios d'images** : 11 ratios différents sur le site (0,8 ; 1 ; 1,33 ; 1,34 ; 1,49 ; 1,5 ; 1,71 ; 1,78 ; 1,79 ; 2).
- **Titres de page (h1)** : 8 tailles différentes ; **tailles de texte** : 25 valeurs distinctes.
- **Couleurs codées en dur** : 45 dans les composants, hors charte.
- **Deux générations de pages côte à côte.**
  - Les nouvelles (accueil, Inspirations, Boutique, Transformer) sont éditoriales.
  - Les anciennes (matériauthèque, styles, accords, lieux, plantes, mobilier, tarifs) ont des cartes à bordure, des dessins et des pastilles colorées.
- **Légendes** : « Image générée par IA » est posé tantôt sur l'image, tantôt dessous.

## 2. Audit qualité (Lighthouse mobile simulé, en local)
| Page | Perf. | LCP | TBT | Remarque |
|---|---:|---|---|---|
| Accueil | **42** | 7,9 s | 3 s | Image d'ouverture de 2400 px servie au mobile ; le « shop the look » charge et trie 450 Ko de catalogue |
| Boutique | 76 | 0,9 s | 0,2 s | **CLS 0,53** : la page saute pendant le chargement du catalogue |
| Matières (Showroom) | 70 | 0,9 s | **12,9 s** | Scènes 3D chargées toutes ensemble |
| Planches | 55 | 2,5 s | **19,8 s** | Idem |
| Matériauthèque | 68 | 3,4 s | 1,2 s | |
| Fiche matière | 64 | 3,1 s | 3,1 s | |
| Styles | 72 | 0,9 s | 2,1 s | Dessins générés dans la page |
| Inspirations, Transformer, Lieux, Plantes, Accords | 89 à 100 | | | |

- **Accessibilité** : 96 à 100 partout. Les tests axe passent, et il n'y a aucun débordement sur mobile.
- **Images** :
  - **aucune image n'a de `srcset`** ;
  - sur ordinateur, les images sont trop lourdes (1600 px servis pour environ 330 px affichés) ;
  - sur mobile, les vignettes sont **floues** (640 px pour 358 px × 3 de densité) ;
  - aucun AVIF.
- **Fichiers 4K** : il n'y en a aucun aujourd'hui. Les images IA sont en 2K natif, et les textures PBR du Studio en 2K.

## 3. Plan de refonte, par ordre de priorité

1. **Charte graphique v2** (gratuit), selon la compétence `charte-graphique` :
   - jetons revus ;
   - 3 rayons seulement : 0 pour les images, 2 pour les cartes, 999 pour les boutons ;
   - une échelle de titres ;
   - 4 ratios d'images ;
   - légendes sous les images.

   Les anciennes pages sont réalignées sur la même grille.
2. **Chaîne d'images** (gratuit) :
   - un script qui produit des variantes AVIF et WebP (480 à 2400 px) avec le même traitement (grain, balance des blancs, vignette) ;
   - un composant `<Photo>` avec `srcset`, ratio fixe et légende.

   Ça corrige le flou sur mobile, le poids sur ordinateur et la lenteur de l'accueil. Le « shop the look » sera calculé à l'avance, et la page de la boutique ne sautera plus pendant son chargement.
3. **Images par style** (payant, accord requis) :
   - **les 8 familles de la compétence `styles-interieurs`**, chacune avec sa pièce, sa lumière et son angle propres, ses 5 à 8 marqueurs et ses interdits ;
   - 3 images par style (ouverture 16:9, carte 4:5, détail 3:2), soit 24 images ;
   - les 8 espaces génériques refaits avec des styles variés.

   Les nouvelles consignes suivent `anti-rendu-ia` : imperfections, variété, jamais le même gabarit. Quand c'est possible, on part d'une vraie photo de pièce libre de droits retouchée. La grille de rejet est appliquée, et les images refusées sont régénérées.
4. **Matières en haute définition** :
   - **gratuit** : rendus des matières à partir des textures CC0 en 4K (Poly Haven, ambientCG) ;
   - **payant** : natures mortes IA seulement pour les matières sans texture libre fidèle (verre, zellige, laque, Calacatta, peintures), soit environ 12 images.
5. **Pages à dessins** :
   - **styles** : les nouvelles images (étape 3) ;
   - **matériauthèque** : textures réelles (étape 4) ;
   - **accords** : composés à partir des photos de matières (gratuit) ;
   - **lieux, plantes, mobilier culte** : **vraies photos libres de droits** (Wikimedia Commons, auteur et licence affichés), collectées par le robot (gratuit). À défaut de photo libre, une carte typographique sobre plutôt qu'un dessin.
6. **Catalogue d'ameublement et recherche par budget** (gratuit) :
   - **enrichissement** : gamme (petit budget, milieu, haut de gamme), pièce et style déduits pour chaque produit ;
   - **nouvelle page « Composer ma pièce »** : budget, pièce et style donnent trois paniers complets (petit, milieu, haut), modifiables article par article.

   Les photos des produits arriveront avec les flux d'affiliation, ce qui suppose les comptes créés par le propriétaire.
7. **Contrôle** : les deux audits sont relancés, avec des captures sur ordinateur et sur mobile avant chaque livraison.

### Coût des images (étapes 3 et 4)
| Option | Images | Coût estimé |
|---|---:|---:|
| 2K natif (2048 px, suffisant pour le site avec `srcset`) | ~44 | **~2,40 $** |
| 4K natif (3840 px) | ~44 | **~5,30 $** |

Ce plan remplace le lot de 119 images préparé avant : celui-ci ne sera pas lancé.
