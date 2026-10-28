# Pièce Rêvée — audit, positionnement, architecture cible et plan (28 octobre 2026)

Ce document fait le point vérifié de l'application, compare les plateformes de référence à partir de ce que leurs pages disent réellement, fixe l'architecture cible et l'ordre des travaux. Tout ce qui est marqué « vérifié » a été exécuté ou lu ; le reste est indiqué comme hypothèse.

## 1. Audit de l'existant

| Domaine | Constat vérifié |
|---|---|
| Framework | Next.js 16.4 (export statique `out/`), React 19.3, TypeScript strict, Tailwind 4, pnpm |
| Hébergement | Cloudflare (worker statique `odd-bar-c583`), déploiement automatique à chaque push sur `main` |
| Service IA | Worker Cloudflare séparé `piece-revee-ia` (à coller à la main dans Cloudflare), compteur KV `QUOTA`. Clé Gemini en secret. Le site n'a aucune clé. |
| Base de données / comptes | Supabase prévu (migrations SQL, RLS, Edge Functions, Stripe) mais **non déployé** : le site tourne en « mode démo », les projets vivent sur l'appareil (localStorage). |
| Moteur 3D | three.js 0.181, trois moteurs impératifs : planche de matières, Visite 3D (appartement), et désormais le Studio. |
| Rendu final | `three-gpu-pathtracer` 0.0.24 (MIT), lancer de rayons dans le navigateur, résolution native jusqu'à 3840 × 2160. |
| Ressources | Textures PBR 2K complètes (couleur, normales, rugosité, occlusion, relief) pour 24 des 37 matières (Poly Haven et ambientCG, CC0), 1K ou calculées pour les autres ; 64 modèles 3D (Poly Haven CC0, Wayfair/Khronos CC BY 4.0 / CC0). |
| Tests | Vitest (106 tests unitaires), Playwright desktop + mobile avec axe (accessibilité). |
| Robot de ressources | GitHub Actions (`ressources.yml`) : seul endroit avec Internet libre (le bac à sable de développement ne joint pas la plupart des sites). |

**Ce qui est simulé ou incomplet** : comptes et sauvegarde serveur (Supabase non déployé) ; photos de produits (aucun flux autorisé) ; génération d'images tant que le worker v2 n'est pas recollé dans Cloudflare avec une clé ; analyse automatique des meubles (nécessite la clé OpenAI).

### Pourquoi les images paraissaient « jeu vidéo » (causes techniques)
1. Matières en **couleurs unies** ou textures 1K sans cartes complètes (pas de rugosité ni d'occlusion photographiées).
2. **Pas d'éclairage d'intérieur photographié** (HDR) ni d'occlusion ambiante : ombres dures, surfaces plastiques.
3. **Rasterisation seule** : pas de lumière indirecte, pas de rebonds ni de reflets physiques.
4. Géométrie générique (meubles Poly Haven de qualité inégale), visuels de l'accueil = captures de la Visite 3D.
5. Génération IA en 1K avec des consignes peu contraignantes ; images gratuites (Pollinations) basse résolution et filigranées — écartées du site.

### Mesure avant/après (banc d'essai `/studio/controle/`, script `scripts/rendu-controle.mjs`)
Indicateur « détail » = énergie moyenne du laplacien (micro-relief visible) ; mesure faite en rendu logiciel (sans carte graphique), donc sans l'occlusion ambiante haute qualité.

| Vue | Détail avant | Détail après | Gain | Hautes lumières brûlées après |
|---|---|---|---|---|
| Vue générale | 3,40 | 9,46 | ×3 | 0,12 % |
| Noyer verni | 1,06 | 11,97 | ×11 | 0,00 % |
| Peinture et enduit | 0,11 | 4,69 | ×43 | 0,00 % |
| Travertin | 3,21 | 10,70 | ×3 | 0,02 % |
| Laiton brossé | 1,68 | 6,36 | ×4 | 0,00 % |
| Bouclé | 2,00 | 14,25 | ×7 | 0,00 % |

Planche visuelle : `docs/rendu-controle/planche-avant-apres.jpg`. Défauts corrigés après relecture des mesures : enduit taché de vert (teinte recalculée sur une photo désaturée), parquet trop brillant (rugosité multipliée), texture « bouclé » qui était en fait un tissu à carreaux (remplacée), béton fissuré (écarté).

## 2. Plateformes de référence (pages lues par le robot le 28/10/2026, `docs/veille/`)

| Plateforme | Ce que la page affirme | Intérêt pour nous | Limite / friction |
|---|---|---|---|
| RoomRecipe | Photo d'une pièce → chaque meuble retrouvé comme produit réel, prix et liens, puis placé dans votre pièce ; « 2 analyses gratuites ». Les prix d'exemple sont « illustrative matches ». | Analyse d'image → liste d'achats | Ne crée pas le design : part d'une image existante |
| GENA Interior | Mesure la pièce **en centimètres** depuis une photo, puis meuble ; « fit check » de chaque produit contre le mur mesuré ; 26 styles, 17 types de pièces dont extérieurs ; plan en entrée et plan coté en sortie ; « Photo 3D » avec points d'achat. | La plus forte différenciation technique (mesure + compatibilité) | Mesure précise réservée aux offres payantes ; estimation avec tolérance |
| Ouda | Photo → même pièce meublée ; **chaque objet vient d'un catalogue de détaillants partenaires** ; « illustrative prices ». | Exactitude produit = image | Le design est imposé par le catalogue (l'inverse de notre modèle) |
| airender.ai | Restyle en ~60 s, liste d'articles « in stock » avec prix et liens (IKEA, Amazon, Wayfair…), total de la pièce ; gratuit 2 fois, puis **19 $ par pièce** ou **75 $ le logement** (paiement unique). | Total de la pièce, prix unique | Catalogue US, design orienté produits |
| Easy Room AI | **API publique** : `POST /api/v1/generations` (Bearer, JSON, suivi par interrogation), redesign, staging, extérieurs, suppression de meubles, édition de zone ; incluse dans l'offre Ultra **99,90 $/mois, 10 000 crédits ≈ 1 000 images**. | Fournisseur alternatif possible | Coût mensuel fixe, qualité non testée |
| DecorViz | **API** `partner-generate` / `partner-status` (asynchrone, 10–30 s, échec non facturé) : place une photo produit dans une photo de pièce ; clés délivrées sur demande. | « Essayer ce produit chez moi » | Accès sur contact, licence des photos produits à régler |
| Roomagine, InteriorCapsule, ReSpace, Mattoboard, Monart | **Non consultés** (pas encore récupérés par le robot) : aucune affirmation ici. | À ajouter au prochain passage du robot | — |

### Matrice fonctionnelle (✔ vérifié chez nous · ◐ partiel · ✖ absent)

| Fonctionnalité | Qui la propose (d'après leurs pages) | Chez nous | Difficulté | Valeur | Différenciation possible |
|---|---|---|---|---|---|
| Créer une pièce originale par IA | RoomRecipe, Ouda (via catalogue) | ◐ code prêt, clé à configurer | Faible | Forte | Design indépendant des marques |
| Transformer sa photo en gardant la géométrie | GENA, Ouda, airender | ◐ consignes + masque, à tester avec clé | Moyenne | Forte | Choix précis des éléments à garder |
| Meubles cliquables sur l'image | RoomRecipe, GENA, Ouda | ✔ zones manuelles ; ◐ détection auto (clé OpenAI) | Moyenne | Forte | Fiche « création originale » + alternatives |
| Alternatives réelles à 3 gammes | airender (liste), RoomRecipe | ✔ 22 produits vérifiés, 5 catégories | Moyenne (données) | Forte | Classement par ressemblance expliquée, sans favoritisme |
| Vérification de compatibilité (dimensions) | GENA | ◐ filtre largeur max | Forte (mesure) | Forte | À construire : mesure manuelle puis assistée |
| Vraie scène 3D manipulable | aucun (d'après les pages lues) | ✔ Studio 3D | Forte | Forte | **Différenciation majeure** |
| Rendu final 4K natif | aucun ne l'affirme | ✔ lancer de rayons 3840 × 2160 | Moyenne | Moyenne | Honnêteté « natif, non agrandi » |
| Bibliothèque de matières PBR | Mattoboard (non consulté) | ✔ 37 matières, 24 en 2K complet | Moyenne | Forte | Planche + 3D + rendu dans un seul outil |
| Liste d'achats + budget | airender, RoomRecipe | ✔ | Faible | Forte | Budget par devise, prix datés |
| Versions et comparaison | — | ✔ | Faible | Moyenne | — |
| Partage de projet | — | ✔ lien sans photos personnelles | Faible | Moyenne | — |
| Plans techniques (électricité, plomberie) | non trouvés | ✖ | Forte | Forte (pro) | Avec niveaux de confiance et validation pro |
| Travaux et estimation | non trouvés | ✖ (ancien module d'étude démo) | Forte | Forte | Hypothèses explicites, pas de « devis » |
| Extérieurs et jardin | GENA (types de pièces) | ◐ (pages Lieux/Plantes éditoriales) | Moyenne | Moyenne | Saisons, entretien, vérifs d'urbanisme |

**Proposition de valeur** : *concevoir une pièce originale, la voir telle qu'elle serait vraiment, la manipuler en 3D, puis trouver où acheter chaque élément — en sachant toujours ce qui est vérifié, estimé ou supposé.*

## 3. Architecture cible (modules séparés, fournisseurs interchangeables)

```
app/studio/…                 interface (Explorer, Créer, 3D, Ma liste, contrôle qualité)
components/studio/*          composants d'interface uniquement
lib/studio/engine.ts         moteur de scène 3D (three.js) : objets, sélection, édition, rendu
lib/studio/final-render.ts   rendu final par lancer de rayons
lib/studio/library.ts        bibliothèque de mobilier 3D (métadonnées + fichiers GLB)
lib/materials/*              moteur de matières PBR (fiches, cartes, construction three.js)
lib/products/schema.ts       base de produits commerciaux (sources et dates obligatoires)
lib/studio/similar.ts        recherche de produits ressemblants (attributs ; visuel à venir)
lib/studio/intent.ts         compréhension des demandes en français
lib/studio/project.ts        projet, versions, liste d'achats, partage
lib/ia-jobs.ts               client des tâches d'images (aucune clé)
workers/ia/src/*             service serveur : fournisseurs (OpenAI, Gemini, fal, Replicate), tâches, stockage, budget, analyse
scripts/robot-studio.ts      robot : textures PBR, vérification des fiches, veille
```

Prochaines couches (non commencées, dans cet ordre) : modèle de données du logement (pièces, murs, ouvertures, réseaux, avec niveau de confiance par donnée) → comptes et sauvegarde serveur (Supabase existant) → plans techniques indicatifs → travaux → extérieurs.

**Niveaux de confiance** (à appliquer à toute donnée du logement) : fourni par l'utilisateur · mesuré et vérifié · estimé · hypothèse générée · validation professionnelle requise.

## 4. MVP défini

1. Créer ou importer une pièce → 2. toucher un meuble → 3. voir des produits réels ressemblants (3 gammes, prix datés, liens vérifiés) → 4. les ajouter à une liste avec budget → 5. explorer et modifier la même pièce en 3D → 6. rendu final de qualité. **État : 1 à 6 fonctionnent et sont testés**, la génération IA en ligne demande la mise à jour du service (voir § 6).

## 5. Tâches dans l'ordre

1. ✔ Service d'images v2 (tâches, budget, stockage, 4 fournisseurs, analyse, édition masquée) — testé par 12 tests unitaires, **non testé avec de vraies clés**.
2. ✔ Moteur de matières (37 fiches), banc d'essai et mesure.
3. ✔ Studio : Explorer, Créer, 3D, Ma liste ; 12 tests de parcours (ordinateur + mobile) et axe.
4. ☐ Coller le nouveau service dans Cloudflare, ajouter une clé, tester une vraie génération (vous).
5. ☐ Images de démonstration haut de gamme pour « Explorer » (vos images IA ou génération payante validée).
6. ◐ Textures 2K : 24 matières faites ; reste cuir, métaux et verres (calculés), zellige et faïence (calculés), béton ciré (la seule texture trouvée était fissurée : écartée, retour au béton 1K).
7. ☐ Modèle de données du logement + mesures manuelles + vérification « ça rentre ».
8. ☐ Flux produits autorisés (photos) : programmes d'affiliation (Awin, Effiliation) ou API d'enseignes.
9. ☐ Recherche visuelle par empreintes d'images (dès que les photos produits sont autorisées).
10. ☐ Plans techniques indicatifs (électricité, puis plomberie), travaux, extérieurs.

## 6. API, coûts connus et inconnus

| Service | Statut | Coût (source) |
|---|---|---|
| OpenAI Images (`gpt-image-2.5-sunburst` / `-flare`, `gpt-image-2`) | Intégré (paramètres lus dans le SDK officiel openai 7.45.1), non testé | Facturé au jeton : 5 $ / M jetons texte, 8 $ / M jetons image en entrée, 30 $ / M en sortie (recherche web, à confirmer sur la page tarifs d'OpenAI). Estimations tierces : ≈ 0,01 à 0,09 $ par image selon la qualité. |
| Google Gemini (actuel) | En service sur l'ancien worker | ≈ 0,034 $ l'image 1K (commentaire existant, à reconfirmer) |
| fal.ai / Replicate (FLUX Kontext Pro) | Intégrés, non testés | ≈ 0,04 $ l'image (agrégateurs tiers, non confirmés) |
| Easy Room AI | Non intégré | 99,90 $/mois (page officielle) |
| DecorViz | Non intégré | Tarif API non publié (contact) |
| Cloudflare Workers | En place | Gratuit avec limites ; l'offre payante (≈ 5 $/mois) est conseillée pour le temps de calcul des images (à vérifier sur Cloudflare) |
| Poly Haven, ambientCG | En place | Gratuit, CC0 |

Plafonds intégrés : 30 images/jour, 6 par visiteur, 15 $/mois au total et 1,50 $/mois par visiteur (réglables par variables Cloudflare).

## 7. Limites restantes (honnêtes)
- Aucune génération IA réelle n'a été testée depuis cet environnement (pas de clé, réseau fermé) : seulement des tests avec un service simulé.
- Les photos de produits ne sont pas affichées (droits) ; 4 fiches La Redoute bloquent la vérification automatique (403).
- La recherche est fondée sur des attributs décrits (forme, matière, couleur, style, dimensions), pas encore sur la comparaison d'images.
- Les meubles 3D sont des modèles génériques ; aucun ne correspond à un produit commercial vérifié (cas « produit exact » prévu mais vide).
- Le rendu par lancer de rayons dépend de la carte graphique de l'utilisateur ; sur téléphone, préférer 1920 × 1080.
- Électricité, plomberie, travaux et extérieurs : non commencés (volontairement, voir l'ordre ci-dessus).

---

## 8. Refonte « studio premium » : audit des modules et décisions

**Constat de départ.** Les captures sont dans `docs/qa/avant/`.
- L'accueil avait :
  - des sections vides qui attendaient une animation ;
  - des illustrations 3D « jeu » ;
  - un mur de logos d'enseignes, qui donnait une impression de dropshipping.
- La galerie mélangeait des châteaux, des maisons génériques et des cartes « Générer une photo » à moitié vides.
- Six entrées de menu se recouvraient.

| Module | Rôle constaté | Décision | Où |
|---|---|---|---|
| **Studio** | Créer, explorer une image, 3D, comparateur, liste | **Gardé, espace principal.** Il s'ouvre sur un salon 3D original dont les meubles sont cliquables. On peut y entrer directement par une étape (`?etape=creer`, `3d`, `liste`, `explorer`). | `/studio/` |
| **Inspirations** (ancienne galerie) | Photos hétérogènes | **Refait** en banque structurée : 12 styles, 11 espaces et 13 matières, avec recherche, filtres, favoris et « Créer un projet avec ce style ». | `/galerie/` |
| **Matières** (ancien Showroom) | Familles et déclinaisons de matières | **Gardé, renommé** « Matières » dans la navigation. Les liens vers les enseignes sont repliés. | `/showroom/` |
| **Planches** | Planche 3D de matières exportable | **Gardée.** Les liens vers les enseignes sont repliés sous « Chercher chez un revendeur ». | `/planche/` |
| **Transformer** | Photo et inspirations vers une image | **Fusionné dans le Studio** (Créer avec une photo). La page reste, avec le bandeau « Première version », et n'est plus accessible que par le pied de page. | `/transformer/` |
| **Concept** | Texte vers une image et une fiche | **Redondant avec Studio › Créer.** Même traitement : bandeau et pied de page. | `/concept/` |
| **Visite 3D** | Appartement procédural générique | **Pas présentée comme complète.** Renommée « Maquette d'appartement 3D », avec un bandeau honnête. Elle est retirée du menu principal. | `/visite-3d/` |

**Navigation.**
- Ordinateur : 4 entrées (Studio, Inspirations, Matières, Planches) et une action « Commencer un projet ».
- Mobile : la barre d'onglets reprend les mêmes entrées, plus Camille.

**Visuels.**
- Retirés :
  - les meubles « plastique » et « jeu » (Chesterfield, chaise de bureau, consoles et tables ornementées, lustre) ;
  - 5 anciens visuels inutilisés ;
  - 9 composants morts.
- Ajoutés :
  - 28 gros plans de matières et 20 planches de style, composés à partir de textures CC0 ;
  - des photographies d'architecture créditées (Villa Tugendhat, CC BY-SA 4.0) ;
  - des rendus 3D honnêtement légendés.
- Inventaire : `docs/ASSETS.md` et `docs/LICENCES-RESSOURCES.md`.

**Direction artistique.** Elle est décrite dans `docs/DESIGN-SYSTEM.md` et dans les compétences `premium-art-direction`, `frontend-design` et `visual-quality-assurance`.

**Encore imparfait.**
- Le rendu 3D en temps réel reste un aperçu ; le rendu final par lancer de rayons demande le GPU de l'utilisateur.
- Aucune image éditoriale générée par IA n'a été faite : il faut l'accord du propriétaire et sa clé. Les consignes sont prêtes dans le champ `prompt` de chaque inspiration.
- Pexels et Unsplash demandent une clé gratuite à créer. BlendKit demande un compte.
- Marbre Calacatta : le robot a trouvé « Marble 012 » (ambientCG, CC0), mais c'est un marbre gris-bleu marbré, pas un Calacatta. Il n'est pas intégré, et un aplat sobre reste en place.
