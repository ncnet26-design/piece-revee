# Avancement — reprise propre du projet (4 novembre 2026)

Concept : choisir une pièce et un style → inspiration réaliste → chaque meuble et matière visibles mènent à un vrai produit achetable, classé petit / moyen / haut de gamme.

## Étape 0 — Diagnostic

### Stack et structure
- Next.js 16.4 (export statique dans `out/`), React 19, TypeScript strict, Tailwind 4, three.js 0.181. Hébergement : Cloudflare (publication automatique à chaque envoi sur `main`).
- Service IA séparé : Cloudflare Worker `workers/ia` (Gemini), déployé par GitHub Actions.
- Robots GitHub Actions : catalogue (chaque nuit), ressources (textures, modèles, photos), images IA (à la main).
- 39 routes, dont : accueil, transformer, galerie, styles, boutique, showroom (matières), matieres/[slug], accords, lieux, plantes, mobilier, studio, planche, visite-3d, experience.
- Images : `public/editorial` (167 fichiers, 15 Mo, surtout générées par IA), `public/materiaux` (88, 63 Mo), `public/textures` (121, 23 Mo, Poly Haven 1024 px), `public/inspirations` (18), `public/visuels` (4), `public/models` (64 modèles 3D + vignettes). Catalogue produits : `public/catalogue/*.json` (29 646 produits relevés par le robot).

### Connecteurs (`claude mcp list` + appel réel)
| Connecteur | État | Cause | Action |
|---|---|---|---|
| Playwright (MCP) | ✗ → réparé | cherchait Google Chrome absent | `.mcp.json` pointé sur le Chromium installé (effectif à la prochaine session) ; Playwright en script fonctionne déjà |
| Chrome DevTools (MCP) | ✗ → réparé | même cause + lancement en root | idem, avec `--no-sandbox` (prochaine session) |
| Context7 | ✗ | réseau de l'environnement : « fetch failed » | ouvrir le réseau (voir plus bas) |
| Firecrawl | ✗ | HTTP 403 (réseau ou crédits) | ouvrir le réseau ; vérifier les crédits sur firecrawl.dev |
| Perplexity | non testé | chaque appel est payant | à utiliser seulement avec votre accord |
| Composio | ✗ | adresse `COMPOSIO_MCP_URL` absente/invalide | coller l'URL fournie par Composio dans les variables de l'environnement |
| Figma, Canva, Notion, Slack, GitHub, Ahrefs, Similarweb, HubSpot, Amplitude, Klaviyo, Linear, Asana, Atlassian, Guru, Intercom, PagerDuty, Supermetrics, SuperMe | ✗ | « proxy refused tunnel 403 » : réseau de l'environnement | ouvrir le réseau |
| Datadog | ! | demande une connexion | inutile pour le site |
| Gamma, Framer, Magic Patterns | ✓ | — | non utilisés (pas utiles au concept ou payants en crédits) |

### Accès internet
- WebSearch : ✓.
- WebFetch : ✗ (`ENOTFOUND` sur ikea.com, habitat.fr, api.polyhaven.com).
- curl depuis la session : ✗ pour api.polyhaven.com, ambientcg.com, api.pexels.com, api.unsplash.com et toutes les enseignes (code 000).
- **Contournement** : les robots GitHub Actions du projet ont un accès internet complet (le robot catalogue lit IKEA, Habitat, Sklum… chaque nuit). Téléchargements de textures et vérifications de produits passent par eux.
- **Mise à jour : réseau complet ouvert le 4 novembre** (Poly Haven, ambientCG, enseignes, Context7 répondent).
- (Ancienne consigne) : sur claude.ai/code, menu de l'environnement dans la barre de titre → Edit → Network access → « Full » (ou ajouter les domaines). Documentation : https://code.claude.com/docs/en/cloud-environments#network-access

### Clés (présence seulement, valeurs jamais affichées)
- Pas de fichier `.env` (seulement `.env.example`). Aucune clé dans l'environnement de la session : PEXELS_API_KEY, UNSPLASH_ACCESS_KEY, REPLICATE_API_TOKEN, FAL_KEY absentes.
- Secrets GitHub : lecture de la liste refusée par le proxy ; GEMINI_API_KEY et CLOUDFLARE_API_TOKEN existent (utilisés avec succès par les robots).

### Skills
- 40 skills projet (`.claude/skills`) + 3 utilisateur (`~/.claude/skills` : agent-reach, banana, session-start-hook). Descriptions précises avec déclencheurs.
- Réécrites : `frontend-aesthetics` (anglaise et générique), `direction-artistique-images`, `signatures-styles`, `catalogue-ameublement` (déclenchement « AVANT toute image / tout produit »).

## Étape 1 — CLAUDE.md : fait
42 lignes : concept, obligations de skills (images, matières, produits), règles images, charte, règles du propriétaire.

## Étape 2 — Audit et nettoyage des images : fait (suppression validée le 4 novembre)
- `audit-images.md` : 467 images ; 91 font 2000 px ou plus ; notes A/B/C selon la grille.
- 100 images ratées ou hors sujet supprimées avec votre accord (extérieurs façade/jardin, images IA de matières, aplats de couleur, photos kitsch, textures mal nommées), références corrigées, aucune page ne pointe vers une image disparue. Restent 116 images de moins de 2000 px à remplacer (surtout les images IA de styles et d'espaces, 1600 px) avant de les retirer.
- Ordre prévu : remplacer d'abord (matières 4K, catalogue), puis supprimer, pour ne casser aucune page.
- Erreur évitée : 4 images crues inutilisées étaient en fait chargées par la planche (chemin calculé) ; remises, notée au journal.

## Étape 3 — Matières 4K : fait (18 matières)
- Robot `scripts/matieres-4k.ts` + tâche GitHub « Matières 4K » (internet complet côté GitHub).
- Inventaire Poly Haven + ambientCG fait ; 19 textures choisies sur planches (`content/data/matieres-choix.json`).
- Téléchargement 4K + versions AVIF/WebP 640, 1280, 1920, 3840 ; original 4K gardé pour le zoom.
- Manques réels : **laiton brossé** (aucune texture de laiton dans les deux bibliothèques), **zellige** (remplacé par une vraie terre cuite émaillée, nommée comme telle), lin uniquement en bleu (nommé « Lin lavé, bleu »).
- Matériauthèque : planche de matières (code MAT-xx, échelle réelle, source) + 3 produits par matière (un par gamme). Trous : béton haut de gamme, pierre petit budget.

## Étape 4 — Inspirations : faite (48 vraies photos, 4 novembre)
- Clé Unsplash ajoutée par vous dans GitHub ; robot `scripts/inspirations-photos.ts` (tâche « Photos d'inspiration »).
- 465 candidates de 2000 px ou plus, regardées sur planches puis agrandies ; 6 retenues par style pour leurs marqueurs (signatures-styles).
- Écartés : rendus 3D publiés comme photos (Deconovo, Taitopia Render, Max Harlynking… désormais filtrés par le robot), objets seuls, pièces vides, doublons, photos de produits.
- Affichage depuis Unsplash (règle Unsplash), AVIF/WebP 640 à 2560 px avec srcset, photographe crédité sous chaque photo, utilisation signalée à Unsplash. Liste dans `credits.md`.
- Où : page Inspirations (huit styles, une grande + cinq photos, bouton « Les pièces de ce style, par budget » vers le catalogue filtré), accueil (« Huit styles, en vraies photos »), pages de style japandi, scandinave, industriel, bohème, mid-century.
- Limites : wabi-sabi a peu de vraies photos sur Unsplash (sélection plus « enduit et voûtes » que meubles) ; japandi compte deux pièces japonaises traditionnelles.

## Étape 5 — Catalogue achetable : fait (à enrichir)
- `data/catalogue.json` : 169 produits réels de 20 enseignes, 8 styles, 4 pièces, 3 gammes équilibrées. Champs : nom, enseigne, prix, gamme, styles (déduits, signalés), pièce, dimensions (si publiées), matière, couleur, URL, date de vérification, `affiliate_url` vide.
- Vérification page par page par robot (`scripts/verifier-catalogue.ts`, chaque lundi + à la main) : 169/169 prix relevés le 4 novembre.
- Écartés : imitations (« effet chêne », « aspect lin »), animaux, enfants, lots, petits accessoires.
- Enseignes demandées absentes : Maisons du Monde, La Redoute, AM.PM, Made in Design, Kave Home bloquent les robots (403/429) ; Ligne Roset non lisible. Respecté : pas de contournement. Solution propre : flux d'affiliation (Awin) à créer par vous.
- Page `/catalogue/` : filtres budget, pièce, style, matière ; produits rangés par gamme ; élévation d'architecte au trait + pastille matière (pas de photo d'enseigne) ; « Voir chez [enseigne] ».
- Pages de style reliées : « Le style X, à chaque budget » (3 produits par gamme) + lien vers le catalogue filtré.

## Référence visuelle reçue
- Rayon (rayon.design) : présentations d'architectes d'intérieur au trait (plans, élévations, menuiseries), planches de matières, nomenclatures. Adopté : élévations au trait, codes MAT-xx, nomenclature par gamme.

- Intégré : 18 textures 4K regardées une par une (`public/matieres`, 133 Mo, 6,5 Mo max par fichier), `credits.md` généré. Retirée : terre cuite émaillée (aplat blanc sans caractère, note C). Bouclette nommée honnêtement « Moquette bouclée ».
- Images IA de matières remplacées par les textures réelles : accueil, boutique (couvertures de familles), page Expérience.

## Étape 6 — Vérifications (4 novembre)
- typecheck, lint, 123 tests unitaires, build, 95 tests de parcours (ordinateur + mobile, avec accessibilité) : tout passe.
- Captures ouvertes et regardées : /catalogue (ordinateur, mobile), /matieres (ordinateur, mobile), accueil.

## Refonte de l'accueil et de la navigation (4 novembre, après-midi)
- Accueil : bloc central « Votre pièce, votre style, votre budget » (pièce + style → 3 pièces réelles par gamme, grandes pièces d'abord, lien vers le catalogue filtré). Section « Apprendre des maîtres » retirée.
- Navigation : Transformer ma pièce · Inspirations · Catalogue · Matières. Studio 3D et page Expérience retirés des menus, du pied de page et de l'accueil (pages conservées, suppression du code à décider dans quelques semaines). « Ma pièce composée » reste accessible depuis les parcours.
- Catalogue : vue « Nomenclature » (inspirée de Rayon) ; 170 produits vérifiés le 4 novembre. Trous restants assumés : béton haut de gamme, pierre petit budget (aucun produit réel trouvé, ni par le robot ni par recherche web).
- Matières : bouclette remplacée par un vrai tissu bouclé ; laiton et enduit d'argile essayés puis écartés (rendu plat) ; zellige introuvable en texture libre.

## 5 novembre — photos produits, vraies photos partout, bande des enseignes
- Catalogue : chaque produit montre la photo publiée par son enseigne, chargée depuis le site de l'enseigne (jamais copiée, adresse de notre page non transmise) ; dessin au trait en secours. 169/169 photos relevées par le robot de vérification (qui note désormais l'image à chaque passage). Les images « pas de photo » de certaines enseignes sont écartées.
- La boutique avait toujours ses photos ; c'est le Catalogue (menu) qui n'en avait plus, à cause de l'ancienne règle « pas de photo d'enseigne ».
- Accueil : ouverture et portes d'entrée en vraies photos (Unsplash, crédit affiché) ; bande défilante des 27 enseignes (texte seulement, bouton pause, arrêt si l'appareil demande moins d'animations).
- Boutique : pastilles des familles en vraies photos ; Transformer : styles proposés en vraies photos, vignettes de matières en textures réelles.
- Supprimés : 18 vignettes de matières générées par IA (plus utilisées) et l'ancienne banque d'inspirations de la page Inspirations.
- Images IA restantes (moins de 2000 px) : utilisées seulement par le Studio 3D et la page Expérience (cachés du menu), le comparatif « Même pièce, autre caractère » et « Touchez une pièce » de l'accueil (étiquetées IA). Les retirer demande de supprimer ces deux pages : à décider.
- À faire par vous : la règle de CLAUDE.md « jamais de photo d'enseigne téléchargée » reste à reformuler (« photo affichée depuis le site de l'enseigne, jamais copiée ») ; modification du fichier de règles refusée à l'assistant.

## 5 novembre (suite) — vendre, attendre joliment, plus d'extérieur
- Transformer : attente animée au moodboard et à la transformation (photo balayée, étapes cochées, barre de progression estimée, durée habituelle) ; frise des étapes 1/2/3 animée.
- Panneau d'un meuble : recherche internet par l'IA en premier (déjà en place : Gemini + recherche Google, jusqu'à 8 produits avec prix relevés sur la page) ; la boutique en complément repliée, avec « voir plus » ; recherches directes chez les enseignes et Google Shopping.
- Boutique : 1 785 produits d'extérieur retirés (jardin, terrasse, outdoor, parasols…), le robot ne les reprendra plus ; 7 retirés du catalogue par budget (162 restent). Photos centrées sur fond beige, produits sans photo en fin de liste.
- Menu : Transformer ma pièce · Inspirations · Catalogue · Boutique · Tarifs (Matières retiré du menu, de l'accueil et du pied de page ; la page reste accessible par lien).
- Vendre : page Tarifs refaite (promesse, réassurance, contenu d'une étude, offres pro à part, FAQ sur les objections, appel final) ; « Le plus choisi » remplacé par « Recommandé » (aucune donnée ne le prouvait) ; encart des offres sur l'accueil et après une transformation ; accueil réordonné (essai gratuit en premier).
- Écarté volontairement : faux avis, faux compteurs, fausse urgence.

## 5 novembre (fin) — Studio 3D et Expérience supprimés (accord du propriétaire)
- Pages /studio et /experience supprimées, avec leur code (scène 3D, explorateur, labo qualité). La liste d'achats est gardée sur une page simple : /ma-piece/.
- 114 images trop petites générées par IA supprimées (plus utilisées nulle part). Restent 2 images IA étiquetées sur l'accueil (« Même pièce, autre caractère » et « Touchez une pièce ») : elles montrent ce que fait la transformation, elles ne peuvent pas être de vraies photos.
- Audit des images régénéré : 418 images, aucune hors sujet, 4 en note C (visuels techniques).
- Visite 3D (/visite-3d) supprimée aussi, avec son moteur et l'éditeur de plan ; les bibliothèques de meubles 3D restent (planche, concept).
- CLAUDE.md : règle des photos d'enseigne mise à jour (affichées depuis le site de l'enseigne, jamais copiées).

## 5 novembre — recherche en ligne accélérée (mise en ligne avec accord)
- Service IA : modèle léger « Gemini 3.5 Flash Lite » à réflexion courte pour la recherche de produits (secours automatique vers le modèle habituel), une seule recherche Google, lecture des pages limitée à 4 s au total, liens Google suivis en 2,5 s maximum ; côté site, recherches identiques partagées. Mis en ligne le 5 novembre ; aucun essai payant fait, à juger sur une vraie transformation.

## 5 novembre — Catalogue et Boutique fusionnés, sélection d'exception
- Une seule page « Boutique » : en tête, la sélection vérifiée par pièce, style et budget (8 pièces par budget, « voir plus ») ; dessous, toute la boutique (recherche, familles, budget, enseigne). Les anciens liens /catalogue/ y mènent avec leurs filtres.
- Tri (scripts/selection-boutique.ts, refait à chaque publication) : 30 944 produits relevés → 3 992 références de 17 éditeurs et maisons (Roche Bobois, Audo, Sarah Lavoine, Sentou, Pomax, Ferm Living, The Socialite Family, Selency, Habitat, Westwing, Fleux, Drawer, Bobochic, Sklum, Tediber, IKEA, HEMA) ; photo, prix en euros, pas épuisé, pas de lots ni d'imitations, une déclinaison par modèle, 40 modèles max par enseigne et par famille ; gamme par famille.
- Écartés : Gifi, Brico Dépôt, Vente-unique, Castorama (produits génériques) ; enseignes américaines ; GUBI (relevé en dollars) et Caravane (prix mal relevés) tant que le robot n'est pas corrigé. Sélection vérifiée : 141 pièces (21 de marques génériques retirées).
- Menu : Transformer ma pièce · Inspirations · Boutique · Tarifs.

## 5 novembre — Pour tout le monde, recherche IA précise, nouvel en-tête
- Boutique ouverte à toutes les enseignes relevées (4 799 références, 21 enseignes, tous budgets). Leroy Merlin et BUT interdisent les robots ; Maisons du Monde, Conforama, La Redoute, Alinéa, Zara Home, H&M bloquent : non forcés. Ils sont couverts par la recherche IA (Google).
- Recherche IA : description précise du meuble (matières, couleurs, forme, taille), toutes les enseignes et tous les budgets demandés, 9 résultats rangés en petit budget / budget moyen / haut de gamme ; panneau simplifié (« Chercher ailleurs » replié). À mettre en ligne côté service (accord du propriétaire requis).
- Classement corrigé : un nom qui commence par coussin, plaid, tableau, reproduction… est de la déco ; accoudoirs et modules écartés de la boutique.
- Accueil : nouvel en-tête « Votre pièce refaite, et tout est à acheter » ; à droite, une pièce dont on touche les meubles (points animés), chaque meuble montre 3 vrais produits (un par budget) ; l'ancienne section « Touchez une pièce » est fondue dedans.

## 6 novembre — Accueil et Tarifs refaits comme une page de vente
- Accueil, dans l'ordre : promesse (« Voyez votre pièce refaite avant d'acheter un seul meuble ») + démonstration à toucher ; enseignes ; le problème (se projeter, chercher, budget) ; la solution en 3 étapes illustrées ; avant/après ; comparatif (seul / décorateur / Pièce Rêvée) ; preuves vérifiables (références, enseignes, prix revérifiés, 0 € payé par les marques) ; essai sans photo par pièce, style et budget ; styles ; prix ; 6 objections ; dernier appel. Aucun faux avis, compteur ou urgence.
- Tarifs : tableau comparatif exact (tiré des quotas réels des offres), questions harmonisées.

## 6 novembre — GUBI et Caravane, recherche IA par photo, nouvelle image d'accueil
- Robot : GUBI lu sur ses pages françaises (/fr/fr/, prix en euros), Caravane forcé sur le marché France (cookie) ; garde-fou : pas de prix en dollars chez une enseigne française ou européenne. Réintégrés dans la boutique dès le prochain passage du robot.
- Recherche IA : la photo du meuble, découpée dans l'image transformée (512 px), est envoyée avec la description ; l'IA cherche ce qui lui ressemble vraiment. Coût : quelques centimes de plus au plus par recherche (une petite image).
- Accueil : image d'en-tête fournie par le propriétaire ; ses 15 pastilles sont cliquables (10 sur mobile, trop proches sinon), chaque meuble montre un vrai produit par budget.

## 6 novembre — Vrai avant / après
- Deux images créées par l'IA du site (Gemini, 0,06 $ chacune, accord du propriétaire) à partir de l'image d'en-tête : « avant » (même pièce, vieux canapé en cuir, cartons, murs nus) et « après » (la même, sans les pastilles). Alignement vérifié (fenêtres, corniche, parquet continus).
- Accueil : section « La même pièce, méconnaissable » avec curseur Avant/Après ; « Comment ça marche » raconte la même pièce (étape 1 = avant, étape 3 = après).

## Reste à faire
1. Avec votre accord : supprimer les images listées dans `audit-images.md`.
5. Captures ordinateur + mobile de chaque page modifiée (étape 6), tests de parcours.

## 2026-11-08 — Prix de la pièce en 3 budgets
- Nouveau bloc « Le prix de cette pièce refaite » (components/PrixPiece.tsx) : total petit / moyen / haut de gamme, liste des produits du budget choisi, « Garder toute la liste ». Affiché dans le héro, les inspirations IA et le résultat de « Transformer ».
- Choix des produits partagé serveur/navigateur (lib/choisir-produit.ts, lib/boutique-client.ts).
- Test de l'IA gratuite Cloudflare (test-ia-gratuite.yml) : bloqué, la clé Cloudflare de GitHub n'a pas la permission « Workers AI ».
- IA gratuite de Cloudflare testée (flux-2-klein-4b : transformation réaliste en 6 s ; Llama vision : repérage correct mais moins précis que Gemini ; bge-m3 OK). Branchée dans le service : essayée en premier pour chaque transformation (60 images gratuites/jour, réglable par IMAGES_GRATUITES_JOUR), Gemini en relais dans les plafonds existants. Service mis en ligne le 2026-11-08 (fournisseurs : gemini + cloudflare).
- Accueil réorganisé en page de vente : haut de page = promesse + bouton + garanties + avant/après (preuve) ; enseignes ; 3 étapes ; exemple à toucher avec prix total ; comparatif ; styles ; prix ; FAQ ; appel final. Sur mobile l'avant/après passe juste sous le titre.
