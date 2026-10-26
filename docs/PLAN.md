# Pièce Rêvée : plan technique

> Version 1 du 26 octobre 2026. Statut : **en attente de validation**. Aucune ligne de code applicatif n'est écrite tant que ce plan n'est pas validé.
>
> Les tarifs cités viennent de la documentation Anthropic (modèles Claude) et d'agrégateurs de prix (fournisseurs d'images), consultés le 26/10/2026. Ceux des fournisseurs d'images restent **à confirmer sur les pages officielles** au moment de l'intégration ; ils seront alors consignés dans `docs/DECISIONS.md`. Hypothèse de change : 1 $ = 0,90 €.

---

## 1. Ce que m'apprend le prototype

`reference/piece-revee.html` est une page unique de 1 000 lignes : HTML, CSS et JS sans framework.

**À conserver (identité et périmètre)**
- Les jetons de design : fond minéral `#F4F4EF`, accent cobalt `#2747D0` (`#93A6FF` en sombre), Bricolage Grotesque, Onest, JetBrains Mono, rayons de 14 et 8 px, mode sombre complet.
- La structure : barre supérieure et barre d'onglets mobile à 5 entrées (Accueil, Projet, Explorer, Moodboard, Camille), le bouton flottant « Demander à Camille » et le tiroir latéral, qui passe en plein écran sur mobile.
- Le parcours du projet : brief à gauche, planche à droite, avec 6 onglets (Plan sur photo, Concept et palette, Shopping, Tutos, Sur-mesure, Budget), un champ « Affiner » et la liste d'achats.
- Le ton éditorial : fiches matière (origine, usages, entretien, prix, version petit budget), accords (proportions, raisons), mobilier (éditeur officiel, alerte contrefaçon), lieux (leçons à emprunter, palette).
- Les visuels de matières générés par canvas. Ce ne sont ni des photos ni des images d'IA, et ils sont très légers : je les garde en **repli** et comme vignettes de nuancier, en attendant les vraies photos sous licence.
- Le contenu : 25 matières, 10 accords, 22 meubles et 14 lieux. C'est la base du seed, qui reste à compléter jusqu'aux volumes de la section 3.4.

**À dépasser (écarts avec le cahier des charges)**

| Prototype | Problème | Cible |
|---|---|---|
| Produits « réels » inventés par le modèle (`nom`, `marque`, `prix_min/max`) | Enfreint la règle 3 : risque d'hallucination | Besoins décrits par attributs, appariés au catalogue réel ; sinon « à chercher » |
| Liens Google Shopping et recherche générique | Pas de lien produit précis ni d'affiliation | Redirecteur `/go/[id]` vers un lien affilié tiré du flux |
| « Aperçu des couleurs » = calque teinté en CSS | Aucun rendu réel | Pipeline de rendu photoréaliste (section 5) |
| État dans `localStorage` (étude, chat, moodboard) | Perdu en changeant d'appareil, pas de compte | Supabase + RLS |
| Photo non conservée | Plan inutilisable au retour | Stockage privé UE, purge configurable |
| JSON IA vérifié par 2 tests (`concept`, `produits`) | Sorties partielles possibles | Sorties structurées + Zod strict + réparation et nouvel essai |
| Camille via `window.claude.sample` côté client | Ne marche que dans Claude, prompt exposé | Route serveur, SDK Anthropic, outils validés |
| Budget = somme des min/max de tous les produits | Additionne les alternatives | Total = choix principaux + liste d'achats |

**Dette d'accessibilité repérée (à corriger dès la phase 1)**
- Cartes en `role="button"` qui contiennent un autre bouton (le cœur) : éléments interactifs imbriqués.
- Onglets sans `aria-controls` ni navigation aux flèches.
- Tiroir masqué par `aria-hidden` mais encore focalisable.
- `dialog` sans `aria-labelledby`.
- La recherche re-rend toute la vue à chaque frappe, ce qui fait perdre le focus.

---

## 2. Architecture

```
                         ┌────────────────────────────── Vercel (région cdg1, Paris) ─────────────────────────────┐
 Navigateur / PWA  ───►  │ Next.js App Router (RSC, Server Actions, Route Handlers)                                │
 (mobile d'abord)        │  • pages publiques ISR (SEO : matières, accords, mobilier, lieux, blog)                 │
                         │  • app connectée (projet, moodboard, compte)                                           │
                         │  • /api/camille (streaming SSE)   • /go/[id] (redirecteur)   • /api/stripe/webhook     │
                         │  • middleware : CSP à nonce, Upstash rate-limit, session Supabase                     │
                         └──────────────┬──────────────────────────┬──────────────────────────┬──────────────────┘
                                        │                          │                          │
                     ┌──────────────────▼───────┐   ┌──────────────▼──────────┐   ┌───────────▼──────────┐
                     │ Supabase (UE, Francfort  │   │ Trigger.dev (tâches     │   │ Stripe (Checkout,    │
                     │ ou Paris)                │◄──┤ longues, reprise)       │   │ Portal, Billing, Tax)│
                     │ Postgres + pgvector, RLS │   │  • étude (analyse→JSON) │   └──────────────────────┘
                     │ Auth (lien magique,      │   │  • rendus (3 variantes) │
                     │   Google, Apple)         │   │  • retouche par zone    │   ┌──────────────────────┐
                     │ Storage (privé, UE)      │   │  • PDF, OG, lots Pro    │──►│ Anthropic API        │
                     └──────────────────────────┘   │  • ingestion catalogue  │   │ Opus/Sonnet/Haiku 5.5│
                                                    │    (cron nocturne)      │   └──────────────────────┘
                                                    │  • purge RGPD (cron)    │   ┌──────────────────────┐
                                                    └─────────┬───────────────┘──►│ ImageProvider        │
                                                              │                   │ (fal / Replicate /   │
                                                              ▼                   │  Google / OpenAI …)  │
                                         Resend (emails) · Sentry · PostHog UE    └──────────────────────┘
```

**Choix structurants (à reporter dans DECISIONS.md, avec la version vérifiée au moment de l'installation)**

| Sujet | Choix | Raison | Alternative documentée |
|---|---|---|---|
| Tâches longues | **Trigger.dev** (v4) | Pas de limite de durée, dépendances lourdes possibles (sharp, libheif, PDF), lots de 50 photos, reprise par étape | Inngest : plus léger sur Vercel, mais chaque étape reste soumise aux limites de durée des fonctions |
| Embeddings | **Voyage AI** (`voyage-3.5` ou successeur, multimodal si besoin), recommandé par Anthropic, qui n'a pas d'API d'embeddings | Texte et image, qualité de recherche, données hébergeables via DPA | OpenAI `text-embedding-3-small`, ou un modèle open source sur Replicate |
| PDF | **@react-pdf/renderer** côté tâche | Sans Chromium, typographies intégrées, QR via `qrcode` | Puppeteer dans Trigger.dev si la mise en page l'exige |
| HEIC | `heic-convert` (libheif en WASM), puis `sharp` | Le binaire précompilé de sharp ne décode pas le HEIC | Conversion par le fournisseur d'images |
| i18n | `next-intl`, français par défaut, clés prêtes pour l'anglais | Compatible App Router et RSC | — |
| UI | Tailwind 4 + shadcn/ui restylé + Radix (accessibilité) | Base accessible, peu de dépendances | — |
| ORM | **Aucun** : client Supabase typé (`supabase gen types`) + SQL dans les migrations | RLS naturelle, une seule source de vérité | Drizzle si la logique SQL grossit |
| Tests | Vitest, Playwright, Lighthouse CI, `pnpm audit` + Dependabot | Imposé | — |

**Organisation du dépôt (un seul projet Next.js, pnpm)**

```
app/              routes (fr) : (public)/, (app)/, api/, go/[id]/
components/       design system + composants métier
lib/
  ai/             client Anthropic, schémas Zod, journalisation des coûts, garde-fous
  images/         ImageProvider + adaptateurs, prétraitement, post-traitement, vérification
  catalog/        ingestion, normalisation, appariement hybride
  billing/        Stripe, quotas, crédits
  security/       rate-limit, validation des uploads, CSP
prompts/          prompts versionnés (study.v1.md, camille.v1.md, render.v1.md…)
trigger/          tâches Trigger.dev
supabase/         migrations/, seed/, policies testées
emails/           React Email
eval/             banc d'essai des rendus (photos sous licence + manifest)
tests/            unit/, e2e/
docs/             PLAN, DECISIONS, DATA_SOURCES, RUNBOOK, CHANGELOG, COSTS, LEGAL/
```

---

## 3. Schéma de données (Postgres, RLS sur toutes les tables)

Conventions : `uuid` en clé primaire, `created_at` et `updated_at`, suppression logique (`deleted_at`) pour les données utilisateur, purge physique par tâche cron.

**Comptes et facturation**
- `profiles` (id = `auth.users.id`, nom, langue, `taste_profile jsonb`, `budget_band`, `tenure` propriétaire ou locataire, `onboarding_done`, `consent_training bool default false`, `photo_retention_months`)
- `user_roles` (user_id, rôle : `admin` ou `moderator`)
- `subscriptions` (user_id, stripe_customer_id, stripe_subscription_id, plan, statut, fin de période, fin d'essai, `cancel_at`)
- `stripe_events` (id de l'événement Stripe en clé primaire, type, `processed_at`) : **idempotence des webhooks**
- `credit_ledger` (user_id, delta, motif, référence) : solde = somme, jamais modifiée côté client
- `usage_events` (user_id, type : étude, rendu, message, retouche…, `period`) et une vue agrégée par période pour les quotas
- `organizations`, `org_members` (offre Pro : logo, raison sociale, n° de TVA)

**Projets et études**
- `projects` (propriétaire, org_id optionnel, titre, type d'espace, statut, `is_public`, `share_slug`, `moderation_status`)
- `project_photos` (projet, type pièce ou inspiration, chemin de stockage, dimensions, `quality jsonb`, `exif_stripped`, `expires_at`)
- `project_briefs` (envie, styles[], budget, situation, éléments gardés, surface)
- `photo_analyses` (photo, modèle, `prompt_version`, `input_hash` pour le cache, `result jsonb` validé)
- `study_versions` (projet, numéro, parent, instruction d'affinage, `result jsonb`, `schema_version`, `prompt_version`) : **historique des affinages**
- `product_needs` (version d'étude, zone, attributs : catégorie, style, matière, couleur, dimensions max, fourchette de prix, gamme ; `embedding vector`)
- `need_matches` (besoin, produit, rang : principal, alternative 1 ou 2, score) ; un besoin sans correspondance porte `status = 'a_chercher'` et ses critères
- `renders` (version d'étude, variante 1 à 3, fournisseur, modèle, prompt, prompt négatif, graine, tentatives, `scores jsonb`, chemin, dimensions, filigrane, C2PA, `cost_usd`)
- `render_edits` (rendu, masque, consigne, résultat, coût)
- `job_runs` (projet, type, statut, étape, erreur) : alimente l'écran de progression

**Catalogue et affiliation**
- `merchants` (enseigne, réseau, identifiant de programme, commission, actif)
- `feeds` (enseigne, format CSV, XML ou API, référence de secret, dernière synchro, statut, nombre de lignes)
- `products` (enseigne, `external_id`, GTIN, titre, marque, catégorie, styles[], matières[], couleurs[], `dims jsonb`, `price_cents`, devise, stock, livraison, `image_url`, `product_url`, `affiliate_url`, `feed_seen_at`, `removed_at`, `embedding vector`, `dedup_group`)
- `affiliate_clicks` (produit, user_id optionnel, projet optionnel, `ip_hash` salé, date) : aucune IP en clair
- `sponsored_placements` (marque, produit, période, emplacement) : toujours affichés avec la mention « sponsorisé »
- `paint_colors` (marque, collection, nom, code, `hex_approx`, source, note de licence)

**Éditorial, moodboard, Camille, artisans**
- `materials`, `pairings`, `furniture_icons`, `places`, et des tables de liaison entre eux et avec les produits
- `media_assets` (chemin, source : banque, kit presse ou IA ; licence, attribution, `authorization_doc`, `ai_generated`, `c2pa`)
- `moodboards`, `moodboard_items` (élément de la bibliothèque, produit ou image importée, position), palette extraite
- `chat_threads`, `chat_messages` (rôle, contenu jsonb, appels d'outils), `user_memory` (résumé consultable et effaçable par l'utilisateur)
- `artisans` (SIRET, date de vérification, décennale déclarée, assureur, départements[], métiers[], spécialités[]), `artisan_photos`
- `quote_requests`, `quote_request_recipients` (3 au maximum, imposé par une contrainte)
- `reports` (signalements), `ai_calls` (fonction, modèle, jetons, coût, latence, résultat de validation, **sans contenu ni donnée personnelle**)

**Principes RLS**
- Données utilisateur : `owner_id = auth.uid()` ; membres d'une organisation via `org_members`.
- Éditorial et produits actifs : lecture publique, écriture réservée aux admins.
- Projet partagé : lecture publique uniquement via une fonction `get_shared_project(slug)` en `security definer`, qui ne renvoie que les champs publics.
- Les tâches tournent avec la clé service, uniquement côté serveur.
- Chaque politique est couverte par un test pgTAP ou Vitest (« l'utilisateur B ne lit pas le projet de A »).

---

## 4. Le cœur : étude de projet

```
upload ─► contrôle (MIME réel, taille, HEIC→JPEG, EXIF retirés, redimensionnement 2048 px)
       ─► qualité (luminance, netteté par variance du laplacien, Haiku 5.5 : « est-ce une pièce ? »)
       ─► analyse vision (Opus 5.5) ─► JSON validé + mis en cache par hash
       ─► étude (Opus 5.5, sorties structurées) ─► JSON validé (sinon réparation, 1 nouvel essai)
       ─► appariement : besoins → embedding → pgvector + filtres SQL → principal + 2 alternatives | « à chercher »
       ─► rendus (section 5), en parallèle de l'affichage de l'étude
```

- **Objectif : moins de 90 s** pour l'étude (critère de la phase 2). L'étude s'affiche dès qu'elle est prête et les rendus arrivent ensuite, sans bloquer l'écran.
- Progression en étapes lisibles (lecture, palette, sélection, tutos, rendus), alimentée par `job_runs` (Realtime Supabase).
- Sorties structurées de l'API (`output_config.format`) **et** validation Zod. Les schémas Zod sont la source unique ; le JSON Schema en est dérivé.
- Palette : le modèle choisit **dans `paint_colors`**, qui lui est fourni filtré par teinte. Il ne cite donc jamais un numéro de nuancier inventé ; une teinte absente de la base est marquée « à vérifier ».
- Affiner : nouvelle `study_version` à partir de la précédente et de la consigne, avec un diff visible.
- Export PDF et partage public avec image Open Graph générée (`next/og`).

---

## 5. Rendus photoréalistes

**Interface `ImageProvider`** (TypeScript) : `edit(input)`, `generateControlled(input)`, `inpaint(input)`, `upscale(input)`, avec un retour normalisé (url, dimensions, coût, latence, C2PA). Le fournisseur est choisi par configuration, avec bascule automatique en cas de panne.

**Candidats à évaluer au banc d'essai** (prix indicatifs à confirmer)

| Famille | Exemple actuel | Prix indicatif | Atout |
|---|---|---|---|
| Édition guidée par instruction | FLUX.1 Kontext [pro] (BFL ou fal) | ≈ 0,04 $ / image | Bonne conservation de la scène |
| Édition guidée par instruction | Gemini « Nano Banana 2.1 » / 2 | ≈ 0,03 à 0,10 $ selon la résolution | Bon rapport qualité-prix, sortie jusqu'en 4K |
| Édition guidée par instruction | GPT Image 2 | ≈ 0,05 $ (moyen) à 0,21 $ (haut) | Respect des consignes |
| Édition guidée par instruction | Seedream 5.0 Pro Edit | ≈ 0,07 $ (1,5K) à 0,135 $ (2K) | Sortie 2K native |
| Diffusion + ControlNet | FLUX ou SDXL + profondeur et MLSD/Canny (fal ou Replicate) | ≈ 0,02 à 0,05 $ | Géométrie contrainte explicitement |

**Pipeline** : prétraitement (redressement des verticales, Depth Anything, MLSD, segmentation SAM 2) → prompt par zone rédigé par Sonnet 5.5 (hex, matières, objectif 24 mm, lumière cohérente avec les fenêtres détectées) → génération avec conditionnement structurel → super-résolution → correction colorimétrique des murs vers les hex de la palette (masque « mur » de la segmentation) → contrôle par Claude Vision (géométrie, artefacts, cohérence) → au plus 2 nouvelles tentatives, puis affichage de la meilleure version.

**Retouche par zone** : clic → masque SAM 2 → inpainting sur le masque → recomposition **au pixel près** (la zone hors masque est recopiée depuis l'original, et non régénérée).

**Banc d'essai** : `pnpm eval:renders` produit un rapport HTML côte à côte avec les scores automatiques (SSIM des contours, cohérence de profondeur, score de Claude Vision), le temps et le coût par image. Le fournisseur par défaut sera choisi à partir de ce rapport.

---

## 6. Catalogue réel

- Adaptateurs d'ingestion par réseau (Awin, Effiliation, Kwanko, Rakuten, Amazon), avec un format commun validé par Zod.
- Normalisation : catégories mappées, styles, matières et couleurs extraits par Haiku 5.5 **à partir du texte du flux uniquement**, dimensions parsées, embeddings, déduplication (GTIN, puis titre, marque et dimensions).
- Cron nocturne : tout produit absent du flux reçoit `removed_at` et disparaît de l'affichage. Le prix affiché porte la date de mise à jour.
- **Tant qu'aucun flux n'est branché** : mode « suggestion » clairement signalé, avec un lien vers la recherche du site officiel de la marque, sans prix ni image.

---

## 7. Camille

- Route serveur en streaming, Sonnet 5.5, prompt versionné dans `prompts/camille.vN.md`, mise en cache du préfixe (système, outils, index de la bibliothèque).
- Outils typés par Zod et revalidés côté serveur : `rechercher_catalogue`, `rechercher_bibliotheque`, `lire_projet`, `ajouter_moodboard`, `lancer_rendu` (confirmation explicite dans l'interface et débit de crédits), `trouver_artisan`.
- Garde-fous :
  - les résultats d'outils et les fiches produits sont encadrés comme **données**, jamais comme instructions ;
  - un produit n'est cité que s'il vient d'un outil (identifiant vérifié avant affichage en carte) ;
  - renvoi vers un professionnel pour l'électricité, le gaz et la structure ;
  - refus poli des demandes hors sujet ;
  - quotas par offre.
- Jeu de 40 questions de test, dont des injections, exécuté en CI de manière non bloquante, puis bloquante en phase 5.

---

## 8. Découpage en phases

Les 8 phases du brief, dans l'ordre. Un ajustement est proposé : **démarrer les candidatures d'affiliation dès la fin de la phase 1**. Les réseaux exigent un site public avec du contenu et l'approbation prend plusieurs semaines ; sans cela, la phase 4 serait bloquée.

| Phase | Contenu | Fin de phase | Dépendances externes |
|---|---|---|---|
| 1. Fondations | Dépôt, CI, design system (jetons du prototype), auth, migrations + RLS, accueil, preview Vercel | Accueil fidèle en preview, CI verte | GitHub, Vercel, Supabase |
| 2. Étude | Upload, contrôle qualité, analyse, étude JSON, écran résultat complet, PDF, partage | 10/10 études valides en moins de 90 s sur `eval/` | Clé Anthropic, 10 photos d'`eval/` |
| 3. Rendus | `ImageProvider` (2 fournisseurs ou plus), pipeline, banc d'essai, retouche | Rapport livré, au moins 85 % de rendus jugés fidèles sur 30 photos | Comptes fal, Replicate ou autres ; budget d'essai |
| 4. Catalogue | 2 flux réels ou plus, appariement hybride, `/go/[id]` | 100 % des produits affichés avec lien et prix réels, clics tracés | Programmes d'affiliation approuvés, clé Voyage |
| 5. Camille | Agent, outils, streaming, mémoire, garde-fous | 40 questions réussies, injections bloquées | — |
| 6. Éditorial | 60 matières, 30 accords, 80 meubles, 40 lieux, moodboard, SEO, admin | Volumes atteints et vérifiés, Lighthouse ≥ 90 | Relecture humaine, images sous licence |
| 7. Monétisation | Offres, Stripe test, quotas, crédits, tableau de bord | Abonnement, résiliation et remboursement testés | Compte Stripe (mode test) |
| 8. Conformité et lancement | Légal (brouillons), cookies, sécurité, runbook, checklist | Checklist validée avec vous | Juriste, domaine, Stripe live |

Chaque phase se termine par : tests verts, preview déployée, `CHANGELOG.md` mis à jour, récapitulatif de ce qui reste.

---

## 9. Coûts estimés par utilisateur

Estimations à recalibrer avec les mesures réelles de `ai_calls` dès la phase 2. Modèles imposés : Opus 5.5 (4 $ / 20 $ par million de jetons en entrée et en sortie), Sonnet 5.5 (2 $ / 10 $), Haiku 5.5 (0,10 $ / 0,50 $).

**Coût unitaire**

| Opération | Détail | Coût |
|---|---|---|
| Contrôle qualité photo | Haiku 5.5 | < 0,001 € |
| Analyse vision | Opus 5.5, environ 10 k jetons en entrée (4 images), 5 k en sortie avec réflexion | ≈ 0,14 € |
| Étude complète | Opus 5.5, environ 15 k en entrée, environ 16 k en sortie avec réflexion | ≈ 0,34 € |
| Prompts de rendu (×3) | Sonnet 5.5, un seul appel | ≈ 0,04 € |
| Prétraitement (profondeur, lignes, segmentation) | — | ≈ 0,01 € |
| 3 rendus HD (1,5 tentative en moyenne) + super-résolution + 4 à 5 contrôles Sonnet | — | ≈ 0,37 € |
| **Étude Plus (3 rendus HD)** | | **≈ 0,90 €** |
| **Étude gratuite (1 rendu 1024 px)** | | **≈ 0,60 €** |
| Affinage (nouvelle version, sans rendu) | — | ≈ 0,30 € |
| Retouche par zone | — | ≈ 0,07 € |
| Message à Camille (cache actif, outils compris) | — | ≈ 0,013 € |
| Rendu Pro (lot, 2K, contrôle inclus) | — | ≈ 0,11 € |

**Marge par offre** (prix TTC → HT avec une TVA à 20 %, frais Stripe et Stripe Tax d'environ 2 % + 0,25 € déduits)

| Offre | Revenu net | Usage type | Coût IA | Marge |
|---|---|---|---|---|
| Gratuit, usage complet | 0 € | 2 études + 30 messages | ≈ 1,60 € / mois | **−1,60 €** |
| Plus mensuel (9,90 €) | ≈ 7,80 € | 2 études, 2 affinages, 3 retouches, 60 messages | ≈ 3,50 € | ≈ +4,30 € (55 %) |
| Plus, gros utilisateur | ≈ 7,80 € | 8 études, 8 affinages, 150 messages | ≈ 12 € | **≈ −4 €** |
| Pro (39 €) au quota plein | ≈ 31,70 € | 300 rendus | ≈ 33 € | **≈ −1 €** |
| Pro à 50 % du quota | ≈ 31,70 € | 150 rendus | ≈ 16,50 € | ≈ +15 € |
| Crédits (4,90 € les 10) | ≈ 3,75 € | 10 rendus | ≈ 1,10 € | ≈ +2,65 € (70 %) |

Trois points à corriger avant de fixer les prix (question 1 ci-dessous) :
1. Le gratuit tel qu'écrit coûte cher : à 5 % de conversion, chaque abonné finance environ 19 gratuits.
2. Il faut un « usage raisonnable » chiffré pour Plus.
3. Le Pro à 300 rendus est déficitaire au quota plein.

Les commissions d'affiliation (environ 3 à 8 % sur des paniers de mobilier) compensent une partie de ces coûts, mais ne doivent pas servir de base au modèle tant qu'elles ne sont pas mesurées.

**Garde-fous** : plafond de dépense IA par utilisateur et par jour, alerte email si le coût moyen d'une étude dépasse un seuil, cache des analyses par hash de photo, API Batch (−50 %) pour l'enrichissement du catalogue.

---

## 10. Risques principaux

| Risque | Impact | Parade |
|---|---|---|
| Approbation des programmes d'affiliation lente ou refusée (Amazon exige des ventes rapides, IKEA n'a peut-être pas de programme en France) | Phase 4 bloquée | Candidater dès la phase 1, mode « suggestion » en attendant |
| Fidélité géométrique des rendus inférieure à 85 % | Promesse produit | Banc d'essai, conditionnement structurel, comparaison des contours, plusieurs fournisseurs |
| Licences des modèles d'images (certains poids FLUX sont non commerciaux hors API sous licence) | Juridique | N'utiliser que des API à licence commerciale, vérification consignée dans DECISIONS.md |
| Données de nuanciers (droits sur les noms et les hex) | Juridique | Données publiques uniquement, hex marqués « approchant », accord des marques si nécessaire, sources dans DATA_SOURCES.md |
| Coûts IA du gratuit et des gros utilisateurs | Marge | Quotas serveur, plafonds quotidiens, prix à valider (question 1) |
| AI Act (article 50, transparence) et éventuels reports en cours | Conformité | Mention « Image générée par IA » + C2PA partout dès le départ, vérification du texte en vigueur en phase 8 |
| Hébergement des données hors UE (Anthropic, fournisseurs d'images) | RGPD | DPA et clauses contractuelles types, registre des sous-traitants, photos jamais utilisées pour l'entraînement, options de traitement en UE vérifiées |
| Volume éditorial (environ 210 fiches vérifiées) | Délai de la phase 6 | Brouillons assistés par IA, **vérification humaine obligatoire**, statut « relu » en admin |
| Disponibilité du nom « Pièce Rêvée » (INPI, domaine) | Marque | Recherche en phase 1, options présentées, aucun achat sans votre accord |

---

## 11. Questions bloquantes

1. **Prix et quotas.** Je propose : gratuit = 1 étude par mois (1 rendu filigrané) et 10 messages à Camille par jour ; Plus = usage raisonnable fixé à 10 études et 60 rendus HD par mois ; Pro = 150 rendus par mois à 39 €, ou 300 rendus à 59 €. Validez-vous, ou préférez-vous d'autres valeurs ?
2. **Structure juridique et comptes.** Existe-t-il déjà une société (SIRET, n° de TVA) ? Stripe, les réseaux d'affiliation et les mentions légales en ont besoin. Quels comptes existent déjà (GitHub, Vercel, Supabase, Anthropic, Stripe, Resend, Sentry, PostHog, Upstash, Trigger.dev) et lesquels dois-je vous lister à créer ?
3. **Dépôt GitHub.** Cette session n'est rattachée à aucun dépôt. Où dois-je créer et pousser le code (compte ou organisation, nom du dépôt) ?
4. **Photos d'évaluation.** Fournissez-vous les 30 photos d'`eval/` (et dans quel délai), ou m'autorisez-vous à en sélectionner sur Unsplash ou Pexels sous licence, avec attribution et licence archivées ? Les 10 premières sont nécessaires dès la phase 2.
5. **Budget d'essai payant.** Le banc d'essai de la phase 3 représente environ 30 photos × 4 à 5 fournisseurs × 3 variantes, soit environ 400 images et **30 à 60 € de crédits API**, auxquels s'ajoutent environ 20 € d'appels Claude en phases 2 et 3. Validez-vous ce budget et la création des comptes fournisseurs concernés ?

Après validation de ce plan et de ces réponses, je démarre la phase 1.
