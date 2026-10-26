# Pièce Rêvée : plan technique

> Version 2 du 26 octobre 2026. Statut : **en attente de validation**.
>
> **Changements de la v2** :
> - prix calés sur la concurrence ;
> - galerie d'inspiration par thème et quiz de style ;
> - Camille devient une experte en architecture d'intérieur **et** en paysagisme, avec ses sources ;
> - extérieurs et logement entier (« Ma maison ») ;
> - objectif de dizaines de milliers de références réelles ;
> - guide de conseils à chaque étape ;
> - exigence de réalisme relevée ;
> - plan qualité « zéro erreur connue ».
>
> Les tarifs Claude viennent de la documentation Anthropic. Les prix des fournisseurs d'images et des concurrents viennent d'agrégateurs consultés le 26/10/2026 : ils seront confirmés sur les sites officiels avant tout choix définitif. Hypothèse de change : 1 $ = 0,90 €.

---

## 1. Positionnement face à la concurrence

| Concurrent | Prix constaté (à confirmer) | Ce qu'il fait bien | Ce qui lui manque |
|---|---|---|---|
| Interior AI | 49 à 199 $/mois (une source indique environ 19 $) | Restyle rapide d'une photo | Anglais, pas de produits achetables, pas de plan d'action |
| ReimagineHome | 14 à 99 $/mois, à crédits | Bonne gamme de prix | Rendus seulement |
| RoomGPT | 9 à 29 $ | Simple | Qualité inégale, rien après l'image |
| Collov AI | 16 $ (60 images), 39 $ (150 images), environ 0,27 $ l'image | Home staging pour les pros | Pas de conseil, pas de shopping réel |
| Homestyler / Planner 5D | Gratuit à 4,99 $/mois | 3D, plus de 300 000 modèles 3D | Modèles 3D, pas d'objets achetables ; pas d'édition de sa propre photo |
| GenRoom et applis « jardin IA » | Crédits gratuits, puis 9 à 18 $/mois | 18 styles de jardin | Visuels conceptuels, pas de plantes adaptées au climat |
| PRO Landscape+ | 90 $/mois | Outil de paysagiste pro | Réservé aux professionnels |

**Notre promesse unique** : aucun concurrent repéré ne combine dans une même appli, en français :
- le rendu photoréaliste de **sa** pièce ou de **son** jardin ;
- de vrais produits achetables, avec un prix daté ;
- des tutos et des conseils à chaque étape ;
- une experte conversationnelle ;
- l'intérieur **et** l'extérieur, pour tout le logement.

**Principe tarifaire** : un essai gratuit généreux qui montre la valeur dès la première étude, un **Pass Projet sans abonnement** (la plupart des gens rénovent une pièce, pas douze), et un abonnement sous le prix des leaders.

### Offres proposées (TTC)

| Offre | Prix | Contenu | Repère concurrent |
|---|---|---|---|
| **Découverte** | Gratuit | 1 étude complète offerte à l'inscription (1 rendu filigrané), puis 3 rendus d'essai par mois. Galerie, bibliothèque et quiz illimités. Camille : 10 messages par jour | Collov : 5 rendus gratuits ; GenRoom : 4 crédits |
| **Pass Projet** | **14,90 €**, une fois, valable 30 jours | 3 études, 30 rendus HD, retouches, PDF, Camille illimitée, guide d'étapes | Aucun équivalent repéré |
| **Plus** | **9,90 €/mois** ou **69 €/an** (−42 %), essai de 7 jours | Usage raisonnable : 10 études et 60 rendus HD par mois, « Ma maison » multi-pièces, tout le reste illimité | Interior AI 19 à 49 $ ; ReimagineHome 14 $ |
| **Crédits** | 4,90 € les 15 rendus | Sans abonnement, valables 12 mois | Collov ≈ 0,27 $ l'image |
| **Pro** | **29 €/mois** | 100 rendus, home staging en lot, export HD sans filigrane, facturation entreprise | Collov 39 $ / 150 images |
| **Pro Agence** | **79 €/mois** | 400 rendus, 3 utilisateurs, marque blanche | Collov Enterprise 225 $ |

---

## 2. Ce que m'apprend le prototype

Les éléments à garder et à dépasser restent ceux de la v1.

**À conserver** :
- l'identité visuelle : fond minéral, cobalt `#2747D0`, Bricolage Grotesque, Onest, JetBrains Mono, mode sombre ;
- la navigation : barre d'onglets mobile, bouton flottant de Camille, tiroir latéral ;
- le parcours brief → planche à 6 onglets ;
- le ton éditorial ;
- les visuels de matières générés par canvas, en repli ;
- les contenus de départ : 25 matières, 10 accords, 22 meubles, 14 lieux.

**À dépasser** :
- les produits inventés par le modèle : remplacés par le catalogue réel ;
- les liens Google : remplacés par le redirecteur affilié ;
- le calque CSS : remplacé par de vrais rendus ;
- le `localStorage` : remplacé par Supabase ;
- la validation JSON minimale : remplacée par Zod ;
- l'appel IA côté client : remplacé par des routes serveur ;
- le budget qui additionne les alternatives : corrigé ;
- les défauts d'accessibilité (boutons imbriqués, onglets, tiroir focalisable) : corrigés.

---

## 3. Nouvelles exigences

### 3.1 Tout le logement, dedans et dehors

- **Espaces couverts.**
  - Intérieur : séjour, chambre, chambre d'enfant, cuisine, salle de bain, WC, entrée, couloir, escalier, bureau, dressing, buanderie, combles, sous-sol, studio entier.
  - Extérieur : jardin, terrasse, balcon, loggia, cour, allée, entrée et portail, clôture, façade, abords de piscine, potager, toit-terrasse, véranda.
- **« Ma maison »** : un logement regroupe plusieurs pièces.
  - Un **fil conducteur** (palette, matières, style) assure la cohérence de pièce en pièce.
  - L'étude de chaque nouvelle pièce le respecte, sauf demande contraire.
  - Un budget global et un calendrier des travaux couvrent tout le logement.
- **Étude extérieure** (même parcours, schéma JSON dédié) :
  - analyse : exposition (orientation estimée et confirmée par l'utilisateur), pente, sol visible, ombres, vis-à-vis ;
  - commune ou code postal → **zone de rusticité** et climat ;
  - plan de plantation annoté sur la photo : plantes avec nom latin et nom commun, taille adulte, exposition, arrosage, floraison, toxicité pour les animaux ;
  - calendrier de plantation et d'entretien sur 12 mois ;
  - matériaux extérieurs, éclairage extérieur, arrosage ;
  - **rappels réglementaires** : distances de plantation (Code civil, art. 671), déclaration préalable pour une terrasse surélevée, un abri, une pergola ou une clôture selon le PLU. Ils sont toujours présentés comme « à vérifier en mairie ».
- **Rendu extérieur** : variante saisonnière (été ou hiver) et vue « dans 3 ans », quand les plantes ont poussé.

### 3.2 Galerie d'inspiration par thème

- **Objectif** : que chacun se reconnaisse. Environ 20 styles × 20 espaces (intérieur et extérieur), soit **au moins 1 500 images** au lancement.
- **Filtres** : style, espace, budget, situation (locataire ou propriétaire), surface (petit espace), couleur dominante, ambiance.
- **Origine des images** :
  - images générées par IA à partir de prompts d'architecte, contrôlées par Claude Vision et validées à la main, avec la mention visible « Image générée par IA » et C2PA ;
  - photos sous licence (Unsplash, Pexels, avec attribution) ;
  - plus tard, projets d'utilisateurs partagés **avec consentement explicite** et modération.
- **Chaque image** est cliquable :
  - « **Je veux ça chez moi** » lance une étude avec ce style et cette palette sur la photo de l'utilisateur ;
  - « **Acheter le look** » propose des produits **réels et similaires** du catalogue, par recherche visuelle. Ils sont présentés comme « similaires », jamais comme « identiques » ;
  - « Ajouter au moodboard » ;
  - « Demander à Camille ».
- **Quiz de style** (onboarding et galerie) : 12 à 20 images à garder ou écarter, d'un glissement de doigt. Il en ressort un profil de goûts (styles pondérés, palette, matières) affiché à l'utilisateur, modifiable, et réutilisé par l'étude et par Camille.
- Chaque thème a sa page SEO (« Salon japandi », « Jardin méditerranéen sec »…) avec un texte réellement rédigé et vérifié.

### 3.3 Camille, experte en architecture d'intérieur et en paysagisme

- **Modèle** : Sonnet 5.5 pour la conversation. Les questions complexes (plan, structure, réglementation, projet global) passent à Opus 5.5 grâce à un routage automatique.
- **Base de connaissances vérifiée (RAG)**, chaque passage étant cité :
  - fondamentaux d'architecture d'intérieur : circulations, ergonomie et cotes (hauteurs de plan, dégagements), éclairage par couches, couleur et lumière, acoustique, proportions ;
  - paysagisme : plantes adaptées au climat, sol, exposition, strates, entretien, eau, biodiversité ;
  - réglementation de vulgarisation tirée de sources officielles (service-public.fr, Légifrance, ADEME), avec date de vérification ;
  - toutes les fiches de l'appli (matières, accords, mobilier, lieux, plantes, tutos).
- **Recherche web restreinte** (outil de recherche Anthropic limité à une liste de domaines officiels), pour les questions réglementaires récentes.
- **Outils** : la v1 complétée par `rechercher_plantes`, `lire_maison` (toutes les pièces) et `rechercher_galerie`.
- **Garde-fous** : la v1, plus le renvoi systématique vers un professionnel pour la structure, l'électricité, le gaz, les murs porteurs et les autorisations d'urbanisme. Camille donne alors l'information générale et ne valide jamais elle-même.
- **Qualité mesurée** :
  - un jeu de **100 questions** (60 intérieur, 30 extérieur, 10 injections) ;
  - réponses notées sur l'exactitude, l'utilité, les sources et l'absence de référence inventée ;
  - **relecture par un architecte d'intérieur et un paysagiste diplômés** (question 5) ;
  - 95 % de réponses jugées exactes requis avant la mise en production.

### 3.4 Des dizaines de milliers de références réelles

- **Objectif au lancement** : **au moins 50 000 produits réels**, chez au moins 8 enseignes, dont des jardineries et des pépinières. Au moins 1 000 références dans chacune des 15 catégories principales (assises, rangements, luminaires, textiles, tapis, peinture, sols, carrelage, robinetterie, déco, mobilier de jardin, plantes, pots, éclairage extérieur, matériaux extérieurs).
- **Ce volume dépend de l'approbation des programmes d'affiliation.** Je ne complèterai **jamais** avec des produits inventés. En attendant les flux, c'est le mode « suggestion » signalé.
- **Pour chaque besoin de l'étude** : 1 choix principal et 2 alternatives, puis « **Voir toutes les alternatives** » (jusqu'à plusieurs centaines), avec filtres prix, couleur, matière, dimensions, délai, enseigne et seconde main.
- **Recherche visuelle** : photographier un objet ou cliquer sur un élément d'un rendu fait apparaître les produits similaires (embeddings d'image).
- **Base végétale** : plantes avec leurs caractéristiques horticoles, issues de sources ouvertes à licence compatible (Tela Botanica par exemple, licence à vérifier) et des flux des pépiniéristes.
- **Peintures** : nuanciers des marques, avec la règle de licence de la v1.

### 3.5 Des conseils à chaque étape

Chaque projet devient un **parcours guidé** en 5 étapes. Chaque étape a sa liste de contrôle, ses conseils d'expert, ses « erreurs à éviter » et un bouton « Demander à Camille » qui transmet l'étape en cours.

1. **Préparer** : prendre les mesures (guide illustré), photographier, fixer le budget avec une marge de 10 à 15 %, vérifier les autorisations (copropriété, mairie, bail).
2. **Concevoir** : étude, rendus, affinages, moodboard.
3. **Acheter** : liste d'achats ordonnée par délai de livraison, alertes de prix et de rupture (envoyées seulement avec un consentement email), alternatives.
4. **Réaliser** : ordre des travaux, tutos pas à pas (outils, temps, difficulté, sécurité), demandes de devis aux artisans.
5. **Profiter et entretenir** : entretien des matières et des plantes, calendrier du jardin, photo « après » à comparer au rendu.

Les étapes avancent au fil des actions de l'utilisateur. Des rappels par email optionnels sont prévus (par exemple « c'est le moment de planter vos vivaces »).

### 3.6 Des rendus ultra-réalistes

- **Seuil relevé** : au moins **90 %** des rendus jugés fidèles et sans artefact majeur sur les 30 photos d'évaluation (contre 85 % dans le brief), avec une notation humaine en plus des scores automatiques.
- **Résolutions** : 2048 px par défaut pour les offres payantes, **4K** pour Pro, Pass et Plus quand le fournisseur retenu le permet. L'offre gratuite garde 1024 px avec filigrane.
- **Régénération gratuite** quand l'utilisateur signale un défaut. Les signalements alimentent le banc d'essai.
- Le pipeline de la v1 reste (prétraitement, prompt par zone, conditionnement structurel, super-résolution, correction de couleur, contrôle par Claude Vision). S'y ajoutent les **prompts de lumière par heure de la journée** et la cohérence des ombres extérieures avec l'orientation.

### 3.7 Un site abouti et sans erreur connue

Aucun logiciel ne peut garantir « zéro bug ». Je m'engage en revanche sur **zéro erreur connue au lancement**, et sur une détection et une correction rapides de celles qui apparaissent ensuite.

- **Tests unitaires** : TypeScript strict, Zod sur toutes les frontières, couverture ≥ 90 % sur la logique métier (quotas, facturation, appariement, parsing des sorties IA).
- **Tests de bout en bout** : Playwright sur tous les parcours (inscription, quiz, étude intérieure et extérieure, rendus, retouche, Ma maison, achat de Pass, abonnement, crédits, partage, suppression de compte), sur mobile et sur desktop.
- **Régression visuelle** : captures Playwright comparées à chaque PR.
- **Accessibilité** : `axe` automatisé et test manuel au lecteur d'écran (VoiceOver, NVDA).
- **Performance** : Lighthouse ≥ 90 dans toutes les catégories, budgets de poids par page.
- **Contrôle des liens** : un robot vérifie chaque nuit les liens produits, les liens éditoriaux et les pages.
- **Déploiement** : environnement de recette, feature flags, Sentry avec alertes, tableau des erreurs.
- **Avant le lancement** : une session de chasse aux bugs, à mener avec vous.

---

## 4. Architecture

Inchangée par rapport à la v1, avec ces ajouts :
- un index RAG (pgvector) pour la base de connaissances ;
- des embeddings d'image pour la recherche visuelle ;
- une tâche nocturne qui contrôle les liens ;
- une table `plants`.

```
Navigateur / PWA ─► Next.js sur Vercel (cdg1) : pages ISR SEO, app connectée, /api/camille (SSE), /go/[id], webhooks Stripe
                    │
                    ├─► Supabase UE : Postgres + pgvector (produits, galerie, connaissances), Auth, Storage privé, RLS
                    ├─► Trigger.dev : étude, rendus, retouches, PDF, lots Pro, ingestion catalogue, génération galerie, purge RGPD, contrôle des liens
                    ├─► Anthropic API : Opus 5.5 (étude, questions complexes), Sonnet 5.5 (Camille, prompts, contrôles), Haiku 5.5 (classement, tags)
                    ├─► ImageProvider : au moins 2 fournisseurs interchangeables (édition guidée + ControlNet), super-résolution, SAM 2
                    ├─► Voyage AI : embeddings texte et image
                    └─► Stripe · Resend · Sentry · PostHog UE · Upstash
```

**Choix techniques** (détaillés dans DECISIONS.md au moment de l'intégration) :
- Trigger.dev pour les tâches longues (alternative : Inngest) ;
- Voyage AI pour les embeddings ;
- @react-pdf pour le PDF ;
- heic-convert puis sharp pour les photos ;
- next-intl pour les langues ;
- Tailwind, shadcn/ui et Radix pour l'interface ;
- le client Supabase typé, sans ORM.

---

## 5. Schéma de données

Le schéma de la v1 reste (comptes, facturation, projets, études versionnées, besoins et correspondances, rendus, catalogue, affiliation, éditorial, moodboard, Camille, artisans, journal des coûts IA). Il est complété par :

- `homes` (propriétaire, nom, code postal, zone de rusticité, `common_thread jsonb` pour le fil conducteur) ; `projects.home_id` rattache chaque pièce à son logement ;
- `project_steps` (projet, étape 1 à 5, éléments de la liste de contrôle cochés, dates) ;
- `gallery_images` (style, espace, budget, situation, couleurs, `media_asset_id`, embedding d'image, statut de validation, `ai_generated`) ;
- `style_quiz_answers` (utilisateur, image, choix) et `profiles.taste_profile` ;
- `plants` (nom latin, noms communs, rusticité, exposition, sol, arrosage, taille adulte, floraison, persistance, toxicité, source et licence), et `products.plant_id` pour les produits de pépinière ;
- `knowledge_chunks` (source, URL, date de vérification, domaine intérieur ou extérieur, texte, embedding, statut de relecture) ;
- `price_alerts` (utilisateur, produit, seuil, consentement) ;
- `link_checks` (URL, statut, date).

RLS sur toutes les tables, avec les mêmes principes que la v1 : propriétaire, organisation, lecture publique de l'éditorial et de la galerie validée, partage par fonction dédiée.

---

## 6. Phases

| Phase | Contenu | Fin de phase |
|---|---|---|
| 1. Fondations | Dépôt, CI, design system, auth, migrations et RLS, accueil, squelette du quiz de style, preview | Accueil fidèle en preview, CI verte. **Candidatures d'affiliation déposées** |
| 2. Étude | Upload, contrôle qualité, études intérieure **et extérieure**, Ma maison, guide en 5 étapes, écran résultat, PDF, partage | 10/10 études valides en moins de 90 s, dont 3 en extérieur |
| 3. Rendus | ImageProvider, pipeline, rendus saisonniers en extérieur, banc d'essai, retouche | Au moins 90 % de rendus jugés fidèles sur 30 photos, rapport livré |
| 4. Catalogue | Au moins 8 flux, dont jardinerie ; base végétale ; appariement ; recherche visuelle ; `/go/[id]` ; contrôle des liens | Au moins 50 000 produits réels (selon les approbations), 100 % avec lien et prix réels |
| 5. Camille experte | RAG, outils, recherche web restreinte, mémoire, garde-fous, routage Opus | 100 questions, ≥ 95 % exactes, injections bloquées, relecture par les pros |
| 6. Éditorial et galerie | 60 matières, 30 accords, 80 meubles, 40 lieux, fiches plantes, **galerie de 1 500 images ou plus**, quiz complet, pages SEO par thème, admin | Volumes atteints et relus, Lighthouse ≥ 90 |
| 7. Monétisation | Découverte, Pass, Plus, Crédits, Pro et Agence ; Stripe en mode test ; quotas ; tableau de bord | Achat, abonnement, résiliation et remboursement testés |
| 8. Qualité et lancement | Légal, cookies, sécurité, régression visuelle complète, chasse aux bugs, runbook, checklist | Zéro bug connu bloquant ou majeur, checklist validée avec vous |

---

## 7. Coûts et marges

### Coût unitaire

| Opération | Coût v1 | Objectif après optimisation |
|---|---|---|
| Étude (analyse et étude Opus 5.5) | ≈ 0,48 € | ≈ 0,35 € : un seul appel vision et étude, effort ajusté, cache |
| 3 rendus HD avec contrôles | ≈ 0,37 € | ≈ 0,28 € : premier contrôle par Haiku, Sonnet seulement en cas de doute |
| **Étude Plus complète** | **≈ 0,90 €** | **≈ 0,65 €** |
| Étude gratuite (1 rendu) | ≈ 0,60 € | ≈ 0,45 € |
| Rendu seul (2K, contrôlé) | ≈ 0,11 € | ≈ 0,08 € |
| Message à Camille | ≈ 0,013 € | ≈ 0,013 € (environ 0,05 € si la question passe à Opus) |
| Image de galerie (génération et contrôle) | ≈ 0,06 € | — |

### Marges par offre (coûts v1, donc prudents ; prix TTC ramenés en HT, frais Stripe déduits)

| Offre | Revenu net | Usage type | Coût IA | Marge |
|---|---|---|---|---|
| Découverte | 0 € | 1 étude de bienvenue (une seule fois), puis 3 rendus et 20 messages par mois | 0,60 € une fois, puis ≈ 0,60 €/mois | Coût d'acquisition maîtrisé |
| Pass Projet (14,90 €) | ≈ 11,90 € | 3 études, 2 affinages, 5 retouches, 80 messages | ≈ 4,70 € | ≈ +7,20 € (60 %) |
| Plus mensuel (9,90 €) | ≈ 7,80 € | 2 études, 2 affinages, 3 retouches, 60 messages | ≈ 3,50 € | ≈ +4,30 € (55 %) |
| Plus annuel (69 €) | ≈ 4,70 €/mois | Usage plus faible en moyenne | ≈ 2,50 € | ≈ +2,20 € par mois |
| Crédits (4,90 € les 15) | ≈ 3,75 € | 15 rendus | ≈ 1,65 € | ≈ +2,10 € (55 %) |
| Pro (29 €) au quota plein | ≈ 23,50 € | 100 rendus | ≈ 11 € | ≈ +12,50 € |
| Pro Agence (79 €) au quota plein | ≈ 64 € | 400 rendus | ≈ 44 € | ≈ +20 € |

**Garde-fous** : usage raisonnable chiffré, plafond de dépense IA de 1,50 € par jour et par utilisateur (configurable), alerte de coût moyen, cache des analyses, API Batch pour le catalogue et la galerie.

**Coûts ponctuels de mise en route (payants, à valider)** :
- banc d'essai des rendus : 30 à 60 € ;
- génération de la galerie (environ 1 500 images retenues sur environ 2 000 générées) : environ 100 à 150 € ;
- appels Claude pendant le développement : environ 50 € ;
- enrichissement du catalogue (Batch) : environ 20 € par tranche de 50 000 produits.

---

## 8. Risques principaux

| Risque | Parade |
|---|---|
| Le volume de références dépend des approbations d'affiliation | Candidater dès la phase 1, viser 15 enseignes pour en obtenir 8, mode « suggestion » en attendant |
| Une experte IA peut se tromper | RAG sourcé, citations, routage vers Opus, 100 questions de test, **relecture par des professionnels**, renvoi aux pros sur les sujets à risque |
| Réalisme : artefacts résiduels | Banc d'essai, plusieurs fournisseurs, contrôle automatique, régénération gratuite sur signalement |
| Galerie d'images générées : uniformité ou erreurs | Prompts variés par architecte, validation humaine, mélange avec des photos sous licence |
| Droits (images, nuanciers, données de plantes, licences des modèles) | Sources et licences consignées dans DATA_SOURCES.md, aucune image sans droits |
| Réglementation (urbanisme, Code civil) mal résumée | Uniquement des sources officielles, datées, et la mention « à vérifier en mairie » |
| Coûts IA | Quotas serveur, plafonds, optimisations ci-dessus |
| AI Act et RGPD | Mention IA et C2PA partout, DPA, photos jamais utilisées pour l'entraînement sans consentement séparé |
| Ampleur du projet | Livraison par phases, chaque phase utilisable et démontrable |

---

## 9. Questions bloquantes

1. **Société et comptes.** Existe-t-il une société (SIRET, n° de TVA) ? Stripe, l'affiliation et les mentions légales en ont besoin. Quels comptes existent déjà (GitHub, Vercel, Supabase, Anthropic, Stripe, Resend, Sentry, PostHog, Upstash, Trigger.dev, Voyage AI) ?
2. **Dépôt GitHub.** Sur quel compte ou organisation, et sous quel nom dois-je créer le dépôt ? Sans dépôt, le travail de cette session n'est pas sauvegardé.
3. **Photos d'évaluation.** Fournissez-vous les 30 photos (dont au moins 8 extérieures), ou puis-je les choisir sur Unsplash ou Pexels avec la licence archivée ?
4. **Budget de démarrage.** Validez-vous environ **250 € de crédits API** au total (banc d'essai, galerie, développement, catalogue) et la création des comptes fournisseurs d'images ?
5. **Relecture experte.** Avez-vous accès à un architecte d'intérieur et à un paysagiste pour relire les contenus et les réponses test de Camille (quelques jours, rémunérés) ? Sans eux, je ne peux pas présenter Camille comme « experte » sans réserve.

Les prix de la section 1 sont ma proposition d'après la concurrence : dites-moi seulement si vous voulez les changer.
