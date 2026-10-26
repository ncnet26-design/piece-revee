# Mission : construire, publier et monétiser « Pièce Rêvée »

Tu es l'équipe technique complète d'une startup : lead développeur full-stack, architecte logiciel, designer produit, ingénieur IA / vision, responsable sécurité et conformité. Tu construis **Pièce Rêvée**, une plateforme web (mobile-first, installable en PWA) qui permet à n'importe qui de transformer son intérieur ou son extérieur comme un architecte d'intérieur haut de gamme le ferait, mais de façon réellement faisable : vraies références achetables, rendus photoréalistes de SA pièce, tutos pour tout réaliser, conseillère IA.

Le prototype fonctionnel est fourni dans `reference/piece-revee.html`. C'est la référence de design, de ton et de périmètre fonctionnel. Tu le dépasses en qualité, tu ne le recopies pas tel quel.

---

## 0. Règles de travail (non négociables)

1. **Commence en mode plan.** Lis tout ce document et le prototype, puis rédige `docs/PLAN.md` : architecture, schéma de données, découpage en phases, risques, coûts estimés par utilisateur. Attends ma validation avant d'écrire du code.
2. **Travaille par phases** (section 11). Chaque phase se termine par : tests verts, démo déployée en preview, mise à jour de `docs/CHANGELOG.md`, et un récapitulatif de ce qui reste.
3. **Ne jamais inventer** :
   - aucune donnée produit ;
   - aucun prix ;
   - aucun lien ;
   - aucune image de marque.
   Tout produit affiché provient d'un flux catalogue réel (section 5) ou est explicitement marqué « suggestion à vérifier ».
4. **Vérifie l'état de l'art avant de choisir.** Les modèles d'images, les API et les tarifs évoluent vite : avant d'intégrer un fournisseur, consulte sa documentation officielle actuelle et note dans `docs/DECISIONS.md` la version, le prix unitaire et la raison du choix.
5. **Secrets** :
   - uniquement dans des variables d'environnement, avec un `.env.example` complet et commenté ;
   - aucune clé côté client.
6. **Demande-moi avant toute action irréversible ou payante** : achat de domaine, passage de Stripe en mode live, envoi d'emails réels, suppression de données, souscription à un service payant.
7. **TypeScript strict partout**, aucun `any` non justifié, validation de toutes les entrées et sorties avec Zod, y compris les sorties JSON des modèles d'IA.
8. Quand tu hésites entre deux options, choisis la plus simple à maintenir et documente l'alternative.

---

## 1. Vision produit

- **Promesse** : « Votre intérieur rêvé, réellement faisable. »
- **Public** : particuliers de tout budget (étudiant locataire comme propriétaire exigeant), plus une offre Pro pour agents immobiliers, home stagers et architectes d'intérieur.
- **Parcours principal** :
  1. L'utilisateur envoie 1 photo (et jusqu'à 3 inspirations).
  2. Il décrit son envie, ses styles, son budget, son statut (propriétaire ou locataire) et ce qu'il garde.
  3. Il reçoit en moins de 2 minutes :
     - une **étude d'architecte** : concept, analyse de la photo, palette avec vraies teintes de nuancier, plan annoté sur sa photo, liste d'achats, sur-mesure, budget, ordre des travaux ;
     - **3 rendus photoréalistes de SA pièce transformée**, avec la même géométrie, la même fenêtre et le même point de vue ;
     - des **produits réels cliquables** (vrais SKU, vrais prix, vraies pages produit) ;
     - des **tutos pas à pas** pour tout réaliser.
- **Expériences secondaires** :
  - matériauthèque ;
  - accords de matières ;
  - mobilier culte ;
  - lieux d'exception par thème ;
  - moodboard ;
  - conseillère IA « Camille » disponible partout ;
  - partage public d'un projet ;
  - annuaire d'artisans.

---

## 2. Stack imposée (dernières versions stables, vérifie-les)

| Besoin | Choix |
|---|---|
| Framework | Next.js (App Router, Server Components, Server Actions), TypeScript strict |
| UI | Tailwind CSS + composants maison (shadcn/ui autorisé comme base, restylé), Framer Motion avec parcimonie |
| Base de données | Supabase (Postgres + pgvector, Auth, Storage, Row Level Security), région UE |
| Tâches longues | Trigger.dev ou Inngest (génération d'étude et de rendus en arrière-plan, reprise sur erreur) |
| IA texte / vision / agent | API Claude via le SDK officiel `@anthropic-ai/sdk` : `claude-opus-5-5` pour l'étude, `claude-sonnet-5-5` pour Camille, `claude-haiku-5-5` pour les tâches courtes (tags, classification). Vérifie les identifiants dans la doc Anthropic. |
| Images | Couche d'abstraction `ImageProvider` avec au moins 2 fournisseurs interchangeables (section 4) |
| Paiement | Stripe (Checkout, Customer Portal, Billing, Stripe Tax, webhooks) |
| Emails | Resend + React Email |
| Analytics | PostHog hébergé en UE, chargé seulement après consentement |
| Erreurs | Sentry |
| Limitation de débit | Upstash Redis |
| Hébergement | Vercel (preview par PR, production sur `main`) |
| CI | GitHub Actions : lint, typecheck, tests unitaires, tests e2e Playwright, Lighthouse CI |
| Contenu éditorial | Tables Postgres + interface d'admin interne (pas de CMS externe sauf justification) |

---

## 3. Fonctionnalités détaillées

### 3.1 Comptes et onboarding
- Connexion par lien magique, Google et Apple.
- Onboarding en 3 écrans : style préféré (quiz visuel de 8 images), budget habituel, statut.
- Profil de goûts stocké et réutilisé par l'étude et par Camille.

### 3.2 Étude de projet (cœur du produit)
- **Upload** :
  - formats HEIC, JPG, PNG, WebP ;
  - conversion et redimensionnement côté serveur ;
  - suppression des métadonnées EXIF (GPS) ;
  - détection de qualité : photo trop sombre, floue, ou sans pièce → message clair.
- **Analyse vision** (Claude) produisant un JSON validé par Zod :
  - type de pièce, dimensions estimées, orientation de la lumière ;
  - éléments existants avec boîtes englobantes en % ;
  - contraintes et points forts.
- **Étude** (Claude) en JSON validé :
  - concept : titre, résumé, ambiance, principes ;
  - palette avec marque, nom et numéro exacts du nuancier, et hex ;
  - zones avec coordonnées en % ;
  - besoins produits décrits par **attributs** (catégorie, style, matière, couleur, dimensions max, fourchette de prix, gamme) et **non par des noms inventés** ;
  - sur-mesure, tutos, plan des travaux, budget.
- **Appariement produits** : chaque besoin est résolu par une recherche hybride (pgvector + filtres SQL) dans le catalogue réel (section 5). Pour chaque besoin :
  - 1 choix principal ;
  - 2 alternatives, du plus accessible au plus haut de gamme ;
  - si aucun produit ne correspond, le besoin est affiché comme « à chercher » avec des critères précis, jamais avec un faux produit.
- **Écran résultat**, onglets :
  - plan sur photo avec repères ;
  - rendus (curseur avant/après, plein écran, zoom) ;
  - concept et palette ;
  - shopping (filtres, liste d'achats, total en temps réel) ;
  - tutos ;
  - sur-mesure et artisans ;
  - budget et étapes.
- **Affiner** :
  - par chat : « plus lumineux », « remplace le canapé », « budget divisé par deux » → nouvelle version de l'étude, avec historique ;
  - par zone : l'utilisateur sélectionne un élément sur le rendu et demande un remplacement, ce qui déclenche un inpainting (4.3).
- **Export** :
  - PDF haut de gamme généré côté serveur (couverture, rendus, palette, liste d'achats avec QR codes, tutos) ;
  - lien de partage public avec image Open Graph générée.

### 3.3 Camille, conseillère IA (agent)
- Panneau latéral sur desktop, plein écran sur mobile, réponses en streaming, photo jointe possible.
- Utilisation d'outils (tool use Claude), chaque outil étant validé côté serveur :
  - `rechercher_catalogue` ;
  - `rechercher_bibliotheque` (matières, accords, meubles, lieux) ;
  - `lire_projet` ;
  - `ajouter_moodboard` ;
  - `lancer_rendu` (avec confirmation de l'utilisateur et décompte de crédits) ;
  - `trouver_artisan`.
- Les références citées s'affichent en cartes cliquables (produit réel, matière, lieu).
- **Garde-fous** :
  - prompt système versionné dans `prompts/` ;
  - protection contre l'injection de consignes (le contenu des pages et des produits est traité comme de la donnée) ;
  - refus poli hors sujet ;
  - aucun conseil électrique ou structurel dangereux sans renvoi vers un professionnel ;
  - limite de messages par offre.
- **Mémoire** : résumé du profil de goûts et des projets, que l'utilisateur peut consulter et effacer.

### 3.4 Contenus éditoriaux
- **Matériauthèque** : 60 matières au lancement. Pour chacune :
  - origine, usages, entretien, prix au m² ;
  - alternative petit budget ;
  - accords possibles ;
  - produits réels liés ;
  - tuto de pose.
- **Accords** : 30 trios, avec explication, proportions, pièces adaptées, rendu d'ambiance.
- **Mobilier culte** : 80 pièces. Pour chacune :
  - designer, année, éditeur officiel ;
  - histoire ;
  - lien éditeur et revendeurs agréés ;
  - vintage authentifié ;
  - alerte contrefaçons.
- **Lieux d'exception** : 40 lieux classés par thème, avec les leçons à emprunter et la palette.
- Chaque fiche est une page **SEO** statique (ISR), avec données structurées schema.org, Open Graph et maillage interne.

### 3.5 Moodboard
- Glisser-déposer, palette extraite automatiquement.
- Analyse par Camille.
- Bouton « Transformer ma pièce avec ce moodboard ».

### 3.6 Artisans (génération de leads)
- Annuaire par département, profession et spécialité.
- Formulaire de demande de devis à partir d'un élément sur-mesure de l'étude, transmis par email à 3 artisans maximum.
- Profils artisans vérifiés : SIRET, assurance décennale déclarée, photos de réalisations.

### 3.7 Espace Pro
- Home staging virtuel en lot (jusqu'à 50 photos d'un bien).
- Export HD sans filigrane, marque blanche (logo de l'agence), facturation entreprise.

### 3.8 Admin interne
- Gestion des contenus, des flux catalogue, des utilisateurs et des signalements.
- Tableau de bord des coûts IA par étude et des marges.
- Modération des projets publics.

---

## 4. Rendus photoréalistes (exigence maximale)

L'objectif : un rendu qu'on ne distingue pas d'une photo d'architecture intérieure professionnelle, **fidèle à la pièce réelle de l'utilisateur**.

### 4.1 Exigences de qualité
- **Géométrie conservée à l'identique** : murs, fenêtres, portes, plafond, perspective, point de vue.
- Les éléments que l'utilisateur garde restent reconnaissables.
- **Lumière cohérente** avec les fenêtres réelles : ombres physiquement plausibles, reflets corrects sur les matières brillantes.
- **Matières crédibles** : grain du bois, veinage du marbre, tissage du lin, aucune texture « plastique ».
- **Aucun artefact** :
  - pas de meubles fondus ou flottants ;
  - pas de pieds de chaise déformés ;
  - pas de texte illisible ;
  - pas de lignes droites ondulées.
- Sortie en 2048 px minimum (offres payantes), 1024 px avec filigrane (offre gratuite).

### 4.2 Pipeline à implémenter
1. **Préparation** : redressement de l'horizon et des verticales si nécessaire, estimation de profondeur, détection des lignes architecturales et segmentation (murs, sol, plafond, fenêtres, mobilier).
2. **Prompt de rendu** généré par Claude à partir de l'étude :
   - description précise par zone, avec matières, couleurs hex et mobilier choisi ;
   - prompt négatif ;
   - consignes de lumière et d'objectif photo, par exemple : « photographie d'architecture intérieure, objectif 24 mm, lumière naturelle de fin d'après-midi venant de la fenêtre gauche, profondeur de champ réaliste ».
3. **Génération** via `ImageProvider`, avec **conditionnement structurel obligatoire**. Évalue et compare au minimum :
   - un modèle d'édition d'image guidé par instruction (famille FLUX.1 Kontext de Black Forest Labs, Gemini Image, GPT Image, Seedream ou leurs successeurs actuels) ;
   - un pipeline diffusion + ControlNet (profondeur + lignes MLSD/Canny) via Replicate ou fal.ai.
4. **3 variantes** par étude, de styles légèrement différents.
5. **Post-traitement** :
   - super-résolution ;
   - correction colorimétrique pour respecter les hex de la palette sur les murs ;
   - vérification automatique par Claude Vision (géométrie conservée ? artefacts ? cohérence avec l'étude ?) ;
   - si le score est insuffisant, régénération (2 tentatives maximum), sinon on affiche la meilleure version.

### 4.3 Retouche par zone
- L'utilisateur sélectionne un élément sur le rendu (segmentation au clic) et décrit le changement.
- Inpainting ciblé sur cet élément, le reste de l'image restant intact au pixel près.

### 4.4 Banc d'essai obligatoire
- Constitue `eval/` avec 30 photos de pièces variées : petites, sombres, grand-angle, extérieurs, salles de bain, cuisines.
- Je fournirai mes photos ou des photos sous licence libre ; jamais d'images récupérées sans droits.
- Script `pnpm eval:renders` qui génère les rendus avec chaque fournisseur et produit un rapport HTML côte à côte, avec scores automatiques et temps et coût par image.
- Choisis le fournisseur par défaut à partir de ces résultats et documente-le.

### 4.5 Visuels éditoriaux (matières, lieux, accords)
- Photos sous licence uniquement :
  - banques d'images avec licence commerciale (Unsplash, Pexels via leur API, avec attribution) ;
  - kits presse fournis par les marques et lieux, **avec autorisation écrite archivée** ;
  - ou images générées par IA.
- Pour les lieux célèbres : jamais de reproduction d'une photo protégée ; une image générée est une **interprétation « inspirée de »** étiquetée comme telle, et un lien renvoie vers les vraies photos et le site officiel.
- Toute image générée par IA porte une mention visible « Image générée par IA » et des métadonnées C2PA si le fournisseur les propose. Vérifie les obligations de transparence de l'AI Act européen en vigueur.
- Aucune personne réelle identifiable, aucun logo ni design protégé reproduit dans les images générées.

---

## 5. Catalogue produits réel (la clé des « liens précis »)

- **Ingestion de flux produits d'affiliation** (CSV, XML, API), synchronisés chaque nuit :
  - réseaux à évaluer : Awin, Effiliation, Kwanko, Rakuten Advertising, Amazon Partenaires, plus les programmes en direct des marques ;
  - enseignes prioritaires : La Redoute / AM.PM, Maisons du Monde, Made in Design, Westwing, Leroy Merlin, Castorama, IKEA (vérifier l'existence d'un programme), Sklum, Tikamoon, Selency, Pamono, Fermob, Habitat, plus les éditeurs design disponibles via des revendeurs affiliés.
- **Normalisation** :
  - catégorie, style, matière, couleur, dimensions, prix, stock, livraison, marque ;
  - embeddings texte, et image si autorisé par le flux ;
  - déduplication.
- **Données affichées** :
  - uniquement celles du flux (prix, image produit, lien affilié) ;
  - date de mise à jour visible ;
  - produit retiré si le flux ne le contient plus.
- **Peintures** : base de nuanciers réels (Farrow & Ball, Little Greene, Ressource, Tollens, Zolpan, Dulux Valentine…) avec nom, numéro et hex approchant. Source documentée dans `docs/DATA_SOURCES.md` ; ne jamais copier un nuancier dont la licence l'interdit, utiliser les données publiques ou obtenir l'accord.
- **Tant que les flux ne sont pas branchés** : mode « suggestion » avec lien vers la recherche sur le site officiel de la marque, clairement signalé.

---

## 6. Monétisation

### 6.1 Offres (prix à valider avec moi, affichés TTC)

| Offre | Prix indicatif | Contenu |
|---|---|---|
| Découverte | Gratuit | 2 études par mois, 1 rendu par étude en 1024 px filigrané, 20 messages Camille par jour |
| Plus | ≈ 9,90 €/mois ou 79 €/an | Études illimitées (usage raisonnable), 3 rendus HD par étude, retouche par zone, export PDF, Camille illimitée |
| Pro | ≈ 39 €/mois | Home staging en lot, 300 rendus par mois, marque blanche, facturation entreprise |
| Crédits | ≈ 4,90 € les 10 | Rendus supplémentaires sans abonnement |

### 6.2 Implémentation Stripe
- Checkout, Customer Portal, essai gratuit de 7 jours sur Plus.
- Stripe Tax pour la TVA UE, factures automatiques.
- Webhooks idempotents et signés, synchronisés dans une table `subscriptions`.
- Compteur de quotas côté serveur, jamais côté client.

### 6.3 Sources de revenus complémentaires
- **Affiliation** :
  - tous les liens produits passent par un redirecteur interne `/go/[id]` qui journalise le clic et ajoute le tracking ;
  - mention « lien affilié » visible et page d'explication.
- **Leads artisans** : abonnement artisan ou paiement par demande qualifiée.
- **Placements de marques** : toujours étiquetés « sponsorisé », jamais mélangés aux recommandations sans mention.

### 6.4 Pilotage
- Tableau de bord admin :
  - MRR, conversion gratuit → payant, churn ;
  - coût IA moyen par étude, marge par offre ;
  - clics et revenus d'affiliation.
- **Garde-fous de coûts** :
  - plafond de dépense IA par utilisateur et par jour ;
  - alerte email si le coût moyen d'une étude dépasse un seuil configurable ;
  - mise en cache des analyses.

---

## 7. Design

- Reprends l'identité du prototype :
  - fond minéral clair ;
  - accent bleu cobalt `#2747D0` ;
  - typographies Bricolage Grotesque (titres), Onest (texte) et JetBrains Mono (références) ;
  - mode sombre complet.
- Ambiance : magazine d'architecture contemporain, beaucoup d'air, l'image d'abord, interface invisible.
- **Mobile d'abord** : barre de navigation en bas, upload depuis l'appareil photo, gestes (swipe entre rendus, pincer pour zoomer).
- **Micro-interactions soignées** :
  - progression de l'étude en étapes lisibles ;
  - squelettes de chargement ;
  - transitions de page ;
  - respect de `prefers-reduced-motion`.
- **Accessibilité** : WCAG 2.2 AA / RGAA (contrastes, focus visible, navigation clavier, textes alternatifs, lecteurs d'écran testés).
- Langue : français d'abord, architecture i18n prête pour l'anglais.

---

## 8. Légal et conformité (France / UE)

À livrer en brouillons et à faire relire par un juriste. Signale-le-moi explicitement.

- **Documents** :
  - mentions légales ;
  - CGU et CGV, avec droit de rétractation pour les contenus numériques et consentement à l'exécution immédiate ;
  - politique de confidentialité et politique cookies.
- **RGPD** :
  - registre des traitements ;
  - données en UE quand c'est possible ;
  - liste des sous-traitants avec leurs DPA ;
  - export et suppression de compte en un clic ;
  - photos supprimées automatiquement au bout de N mois (configurable) ;
  - **jamais d'utilisation des photos utilisateurs pour entraîner un modèle** sans consentement explicite séparé.
- **Cookies (CNIL)** : bannière conforme, refus aussi simple que l'acceptation, aucun traceur avant consentement.
- **Transparence** : affiliation et contenus sponsorisés signalés, IA générative signalée (AI Act), prix indiqués comme indicatifs avec date.
- **Marques et droit d'auteur** :
  - vérification de disponibilité du nom « Pièce Rêvée » à l'INPI et du nom de domaine (me présenter les options, ne rien acheter) ;
  - aucune reproduction de design protégé ;
  - noms de designers et d'éditeurs utilisés à titre informatif uniquement.
- **Sécurité** :
  - RLS sur toutes les tables ;
  - validation MIME réelle des uploads et taille maximale ;
  - limitation de débit par IP et par compte ;
  - en-têtes de sécurité (CSP stricte, HSTS) ;
  - audit des dépendances en CI.

---

## 9. Qualité, performance et SEO

- **Tests** :
  - Vitest pour la logique (quotas, appariement, parsing JSON, webhooks) ;
  - Playwright pour les parcours critiques (inscription, étude complète avec fournisseurs simulés, paiement en mode test, partage, suppression de compte).
- **Performance** :
  - Lighthouse ≥ 90 sur toutes les catégories, mobile ;
  - LCP < 2,5 s ;
  - images en AVIF/WebP via `next/image`, CDN.
- **SEO** :
  - sitemap, robots, balises canoniques, données structurées ;
  - pages programmatiques utiles (par style, pièce, matière, budget) avec contenu réellement rédigé et vérifié, pas de remplissage ;
  - blog de conseils.
- **Observabilité** : Sentry (erreurs et traces), journalisation structurée des appels IA (modèle, tokens, coût, latence, résultat de validation), sans données personnelles.

---

## 10. Publication

- Environnements séparés `development`, `preview` et `production`, chacun avec son propre projet Supabase et ses propres clés Stripe (test, puis live).
- Migrations SQL versionnées, seed de contenus éditoriaux.
- `docs/RUNBOOK.md` :
  - déployer, restaurer une sauvegarde ;
  - changer de fournisseur d'images ;
  - faire tourner une clé ;
  - gérer un pic de charge.
- **Checklist de lancement**, à valider avec moi point par point :
  - domaine et emails transactionnels (SPF, DKIM, DMARC) ;
  - Stripe live ;
  - pages légales relues ;
  - Search Console ;
  - sauvegardes vérifiées ;
  - alertes de coûts actives.

---

## 11. Phases et critères d'acceptation

| Phase | Contenu | Terminé quand… |
|---|---|---|
| 1. Fondations | Repo, CI, design system, auth, base de données + RLS, déploiement preview | Une page d'accueil fidèle au prototype est en ligne en preview, tests CI verts |
| 2. Étude | Upload, analyse, étude JSON validée, écran résultat complet, export PDF | Sur 10 photos d'`eval/`, 10 études valides sans erreur de schéma, en moins de 90 s |
| 3. Rendus | `ImageProvider` avec 2 fournisseurs, pipeline complet, banc d'essai, retouche par zone | Rapport d'évaluation livré ; sur 30 photos, au moins 85 % des rendus sont jugés fidèles et sans artefact majeur |
| 4. Catalogue | Ingestion d'au moins 2 flux réels, appariement hybride, redirecteur d'affiliation | 100 % des produits affichés ont un lien et un prix réels ; clics tracés |
| 5. Camille | Agent avec outils, streaming, mémoire, garde-fous | Jeu de 40 questions test : réponses pertinentes, aucune référence inventée, injections bloquées |
| 6. Éditorial | Matières, accords, mobilier, lieux, moodboard, pages SEO, admin | Volumes de la section 3.4 atteints, contenus vérifiés, Lighthouse ≥ 90 |
| 7. Monétisation | Offres, Stripe, quotas, crédits, tableau de bord | Parcours d'abonnement, résiliation et remboursement testés en mode test Stripe |
| 8. Conformité et lancement | Légal, cookies, sécurité, runbook, checklist | Checklist validée avec moi, passage en production |

---

## 12. Livrables attendus à la fin

- Code source propre et commenté là où c'est utile.
- Documentation :
  - `README.md` (installation en moins de 10 minutes) ;
  - `.env.example` ;
  - les fichiers `docs/` : PLAN, DECISIONS, DATA_SOURCES, RUNBOOK, CHANGELOG, et COSTS (coût unitaire de chaque fonctionnalité et marge par offre).
- Rapport d'évaluation des rendus.
- Liste de ce qui reste à faire par moi : comptes à créer, contrats d'affiliation à signer, relecture juridique, photos d'évaluation à fournir.

Commence maintenant par la lecture du prototype et la rédaction de `docs/PLAN.md`. Pose-moi en une seule fois les questions bloquantes (5 maximum), puis attends ma validation.
