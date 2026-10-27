# Sources des données et des images

## Contenus éditoriaux (`content/`)

Rédigés pour le projet à partir de sources publiques citées dans `content/sources.ts`
(Légifrance, Service-Public.fr, Fédération des CAUE, ADEME, France Rénov', Tela Botanica, Office français de la biodiversité,
Promotelec, INRS) et de connaissances générales sur le design, l'histoire du mobilier et la botanique.
Les liens pointent pour l'instant vers la page d'accueil de chaque organisme : l'adresse exacte de chaque fiche reste à vérifier.
Chaque fiche de connaissances et chaque conseil de Camille renvoie à sa source.

**À faire** : les URL officielles n'ont pas pu toutes être ouvertes depuis l'environnement de construction ;
le champ `consulted` vaut `null` tant qu'un humain n'a pas vérifié le lien. À dater après vérification.

| Corpus | Volume |
|---|---|
| Matières | 60 |
| Accords de matières | 30 |
| Mobilier culte (designers, années, éditeurs) | 85 |
| Lieux d'inspiration | 40 |
| Plantes (exposition, rusticité, entretien) | 51 |
| Styles | 12 intérieurs, 8 extérieurs |
| Guides et étapes de projet | 10 guides + parcours en étapes |
| Fiches de connaissances (base de Camille) | 31 |
| Galerie d'inspiration | 112 thèmes |

Aucune image de marque ni aucun visuel de produit n'est reproduit.
Les meubles cultes et les lieux sont illustrés par des dessins génératifs (palette et formes), jamais par des photos sous droits.

## Images libres (`scripts/import-images.ts`)

| Source | Licence | Obligation |
|---|---|---|
| Unsplash API | Licence Unsplash (usage commercial libre) | Créditer l'auteur et Unsplash ; déclencher l'URL de téléchargement |
| Pexels API | Licence Pexels | Créditer l'auteur et Pexels (recommandé) |
| Openverse | CC0, CC BY, CC BY-SA uniquement | Créditer l'auteur, la licence et le lien |
| Wikimedia Commons | Licences libres uniquement | Idem |

Le script enregistre pour chaque photo : auteur, lien vers l'œuvre, licence, source. La galerie et les pages lieux affichent ce crédit.
Les fichiers `content/data/gallery-photos.json` et `place-photos.json` sont **vides** tant que l'import n'a pas tourné
(l'environnement de construction n'avait pas accès à ces API) : la galerie affiche alors des illustrations dessinées.

## Catalogue produits (`scripts/ingest-catalog.ts`)

Uniquement des flux CSV fournis par les plateformes d'affiliation (Awin, Effiliation…) : nom, prix, image et lien viennent du flux,
rien n'est inventé. Les produits sont dédoublonnés, catégorisés et vectorisés (gte-small) pour l'appariement avec les besoins de l'étude.
Tant qu'aucun flux n'est branché, l'étude propose des fourchettes de prix et des liens vers les pages d'accueil des enseignes.
