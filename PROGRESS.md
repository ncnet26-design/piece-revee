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
- **Pour tout débloquer (à faire par vous, 1 minute)** : sur claude.ai/code, menu de l'environnement dans la barre de titre → Edit → Network access → « Full » (ou ajouter les domaines). Documentation : https://code.claude.com/docs/en/cloud-environments#network-access

### Clés (présence seulement, valeurs jamais affichées)
- Pas de fichier `.env` (seulement `.env.example`). Aucune clé dans l'environnement de la session : PEXELS_API_KEY, UNSPLASH_ACCESS_KEY, REPLICATE_API_TOKEN, FAL_KEY absentes.
- Secrets GitHub : lecture de la liste refusée par le proxy ; GEMINI_API_KEY et CLOUDFLARE_API_TOKEN existent (utilisés avec succès par les robots).

### Skills
- 40 skills projet (`.claude/skills`) + 3 utilisateur (`~/.claude/skills` : agent-reach, banana, session-start-hook). Descriptions précises avec déclencheurs.
- Réécrites : `frontend-aesthetics` (anglaise et générique), `direction-artistique-images`, `signatures-styles`, `catalogue-ameublement` (déclenchement « AVANT toute image / tout produit »).

## Étapes suivantes
Voir plus bas (mis à jour au fil du travail).
