# Journal des modifications

## 0.4.0 — 27 octobre 2026

- Visite 3D plus réaliste : éclairage photographique HDRI (Poly Haven, CC0) avec un parc visible par les fenêtres,
  relief sur tous les sols, murs et meubles (lames, joints, briques), tissus au reflet velouté, miroirs qui reflètent la pièce.
- Premiers modèles 3D photoréalistes sous licence libre : canapé en velours (5 coloris), fauteuil (2 coloris), plante en pot.
- Mode allégé automatique sur les appareils sans carte graphique.

## 0.3.0 — 27 octobre 2026

- **Mon plan** : chacun dessine son propre logement aux vraies mesures (pièces, portes, fenêtres, baies, passages, terrasse ou jardin),
  à la souris, au doigt ou en saisissant les cotes. Les cloisons, façades et garde-corps se créent automatiquement quand les pièces se touchent.
- Quatre modèles de départ (studio, deux-pièces, maison avec jardin, partir de zéro) en plus de l'appartement d'exemple.
- Ameublement automatique de chaque pièce (lit contre un mur plein, cuisine sur le plus grand linéaire libre, etc.), à ajuster ensuite.
- Le plan dessiné se visite aussitôt en 3D, se modifie, s'enregistre et se partage par lien.
- Nouveau revêtement « Pelouse » pour les jardins.

## 0.2.0 — 27 octobre 2026

- **Visite 3D** (`/visite-3d/`) : appartement complet de 6 espaces (entrée, salon, cuisine, chambre, salle de bain, terrasse)
  où l'on se déplace librement (souris, clavier ZQSD ou flèches, toucher du sol, joystick sur mobile) ou en vue d'ensemble façon maquette.
- Tout se modifie : couleur, tissu, matière et modèle de 33 types d'objets ; peinture ou enduit des murs ; sol choisi dans la matériauthèque ;
  style appliqué à une pièce en un geste ; déplacement des meubles par glisser-déposer, rotation, duplication, ajout depuis un catalogue.
- Astuces d'aménagement par pièce et par objet, astuces personnelles épinglées dans la 3D, Camille accessible pendant la visite.
- Plan enregistré sur l'appareil, partage par simple lien (sans serveur), capture photo de la vue.
- Offres : les fonctions pas encore livrées sont affichées « bientôt » et ne sont plus vendues.

## 0.1.0 — 27 octobre 2026

Première version complète, utilisable en mode démonstration sans aucune clé.

- Site public : accueil, galerie d'inspiration par thème (intérieur et extérieur), quiz de style,
  60 matières, 30 accords, 85 meubles cultes, 40 lieux, 51 plantes, 20 styles, 10 guides, tarifs, pages légales.
- Application : nouveau projet (photo, pièce ou extérieur, styles, budget), étude (palette, plan par zones,
  besoins, plantes, tutos, étapes), affinage avec historique de versions, rendus avant/après, export PDF,
  « Ma maison », moodboard, partage public, compte, administration.
- Camille : assistante IA en architecture d'intérieur et paysage, sources citées, garde-fous (structure, électricité, gaz, urbanisme).
- Serveur Supabase : schéma, RLS stricte, Edge Functions (étude, Camille, rendus, Stripe, RGPD), tâches planifiées.
- Offres : Découverte gratuite, Pass Projet 14,90 €, Plus 9,90 €/mois ou 69 €/an, Crédits 4,90 €, Pro 29 €, Pro Agence 79 €.
- Qualité : TypeScript strict, Zod, tests unitaires et SQL, tests de bout en bout avec contrôle d'accessibilité, CI GitHub.
