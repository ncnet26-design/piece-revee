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

## Reste à faire
1. Avec votre accord : supprimer les images listées dans `audit-images.md`.
4. Remplacer les images IA restantes (portes de l'accueil, banque « Composer son projet ») par ces photos, puis retirer les 116 images de moins de 2000 px (avec votre accord : plus de 20 fichiers).
5. Captures ordinateur + mobile de chaque page modifiée (étape 6), tests de parcours.
