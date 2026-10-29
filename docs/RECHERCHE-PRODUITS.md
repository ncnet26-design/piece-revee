# Trouver où acheter chaque élément de la pièce

Quand une pièce est transformée, l'analyse repère chaque élément achetable : meubles, luminaires, tapis, coussins, vases, cadres, plantes, poignées, robinets. Elle repère aussi les surfaces : murs, sol, rideaux. Pour chaque élément, elle rédige une requête d'achat précise, par exemple « vase en grès beige mat 30 cm ».

En touchant un élément, le client voit trois sources de produits réels.

## 1. Trouvés sur internet (à chaque clic)

- **Recherche.** Le service (`workers/ia/src/recherche.ts`) interroge Gemini avec la recherche Google, en **2 recherches au plus par clic**. Il ne garde que les pages réellement trouvées par Google : les redirections de Google sont suivies jusqu'à la page, les liens inventés et les liens d'images sont écartés.
- **Lecture des pages.** Le service ouvre chaque page et y lit les données publiées par le vendeur (schema.org Product) : nom, marque, prix, disponibilité.
  - Un prix n'est affiché que s'il a été lu sur la page, avec la date du relevé.
  - Si la page bloque la lecture, ce qui est fréquent chez les grandes enseignes, le lien est gardé avec la mention « prix sur le site ».
- **Règles de Google.**
  - Les résultats ne sont montrés qu'à la personne qui a cherché, avec les suggestions de recherche Google affichées telles quelles.
  - Ces résultats ne sont jamais stockés.
- **Coût.**
  - 5 000 recherches gratuites par mois, puis 14 $ les 1 000 ([tarifs Google](https://ai.google.dev/gemini-api/docs/pricing)).
  - S'y ajoute un peu d'usage du modèle (une fraction de centime par clic).
  - Chaque recherche est comptée dans le plafond de dépense du visiteur et du mois.
  - Les recherches sont mémorisées pendant la visite : rouvrir le même élément ne relance pas de recherche.

## 2. Dans notre catalogue (mis à jour chaque nuit)

- **Collecte.** Le robot (`scripts/robot-catalogue.ts`, tâche planifiée `.github/workflows/catalogue.yml`, chaque nuit à 2 h 17 UTC) parcourt les plans de site publiés par les enseignes de maison, de déco et de bricolage.
- **Règles de politesse.**
  - Il lit le fichier `robots.txt` de chaque enseigne et ne visite jamais une adresse interdite.
  - Il attend au moins 2 secondes entre deux pages, et plus si l'enseigne le demande.
  - Il s'identifie comme « PieceReveeBot ».
- **Données gardées.** Il ne garde que les faits publiés par le vendeur (nom, marque, prix, disponibilité, adresse, date du relevé). Il ne copie ni photo ni texte descriptif.
- **Mise à jour.** Chaque nuit, il ajoute de nouvelles pages et revérifie les plus anciennes. Un produit disparu est retiré.
- **Fichiers produits.**
  - `public/catalogue/<famille>.json`, que le site lit à la demande ;
  - `public/catalogue/index.json`, pour les compteurs ;
  - `content/data/catalogue-etat.json`, pour l'état et le rapport par enseigne ;
  - le rapport de chaque passage est dans la branche `robot/catalogue`.

### État au 29 octobre 2026
- **2 221 produits** relevés : Habitat 604, Westwing 478, Selency 448, IKEA 376, Castorama 220, Sklum 95.
- **Croissance prévue** : environ 1 500 à 2 000 produits par nuit, jusqu'à 4 000 pages suivies par enseigne.
- **Enseignes qui refusent les robots** ou ne publient pas de plan de site lisible, et que le robot ne visite donc pas :
  - BUT et Leroy Merlin (refus 403) ;
  - La Redoute, Conforama, Alinéa, ManoMano, Made in Design et Kave Home (plan de site refusé) ;
  - Maisons du Monde (plan de site absent) ;
  - Amazon (aucun plan de site public).
- Ces enseignes restent couvertes par la recherche sur internet, ou le seront par leurs flux d'affiliation.

## 3. Notre sélection vérifiée

Il s'agit des 22 produits vérifiés à la main (`content/data/products.json`), classés par ressemblance et par gamme, avec leurs sources.

## En complément

- Le bouton **Google Lens** ouvre l'image dans Google Lens, pour chercher sur tout le web.
- Les boutons d'enseignes ouvrent leur moteur de recherche avec la requête de l'élément.

## Étape suivante conseillée : les flux des plateformes d'affiliation

Les catalogues officiels des enseignes, fournis par les plateformes d'affiliation (Awin, Effinity, Amazon Partenaires…), donnent :
- des dizaines de milliers de produits avec leurs photos (autorisées) ;
- des prix à jour chaque jour ;
- une commission sur les ventes.

L'inscription est gratuite, mais c'est au propriétaire du site de créer ces comptes. Une fois les clés d'accès rangées dans les secrets GitHub, le robot pourra importer ces flux chaque nuit.
