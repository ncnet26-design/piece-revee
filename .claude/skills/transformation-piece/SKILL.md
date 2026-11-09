---
name: transformation-piece
description: Méthode, consignes (DECLUTTER, REDESIGN) et grille de contrôle de la transformation d'une pièce par IA dans Pièce Rêvée — photo réelle du client → même pièce, même architecture, style choisi, vrais meubles de la boutique, rendu de magazine. À utiliser AVANT de toucher à la transformation (workers/ia, Parcours, Resultat, prompts, plan, sélection des meubles) et pour juger un résultat.
---

# Transformation de pièce

## Principe
La pièce du client reste SA pièce : murs, fenêtres, portes, radiateurs, poteaux, poutres, cheminée, plafond, sol fixe, équipements de plomberie et angle de vue ne bougent pas. On change ce que le client demande, dans le style choisi, avec de VRAIS meubles de la boutique, choisis AVANT le dessin. Chaque point cliquable mène au produit dessiné, sans recherche au hasard. Rendu : photo de magazine de décoration.

## Chaîne (état au 9 nov. 2026)
1. Réception (navigateur, `lib/photo.ts`) : JPEG/PNG/WebP/HEIC (heic2any), rotation EXIF, métadonnées retirées, 2048 px max, refus < 800 px, alertes sombre/floue.
2. Choix du client (`Parcours.tsx`) : pièce (obligatoire), ampleur (léger/équilibré/complet), budget, « Ce que vous voulez changer » (prioritaire), inspirations ou styles.
3. Vrais meubles (`lib/selection-piece.ts`) : emplacements par pièce, produit du budget, bon type (nom), prix plancher, style (signatures), pas de lot ni d'accessoire.
4. Analyse de la photo (`workers/ia/src/plan.ts`, vision) : plan objet par objet (position, catégorie, action), placement de chaque produit.
5. Dessin (`providers.ts`) : FLUX.2 klein 9B si la part gratuite le permet, sinon 4B ; en secours Gemini (plafonds). Consigne : plan d'abord, puis `buildPrompt`.
6. Résultat (`Resultat.tsx`) : image ≤ 68 % de l'écran, points cliquables, « Le meuble de l'image » (produit exact), « Trouver l'identique » (Google Lens sur le meuble découpé), boutique filtrée par matière/couleur/forme (`lib/attributs.ts`), prix de la pièce en 3 budgets, vidéo avant/après.

Cible (cahier des charges, modèles payants à valider) : désencombrement séparé, contrôle qualité noté sur 10 avec nouvel essai, Nano Banana Pro → Seedream 4.5 → GPT Image 1.5 sur fal.ai (`docs/transfo-architecture.md`).

## Consignes (anglais)
DECLUTTER :
"Remove every movable object from this room: furniture, clutter, clothes, boxes, toys, cables, decorations and items on the floor. Keep walls, windows, doors, radiators, columns, beams, fireplace, stairs, ceiling, floor and the exact camera angle, perspective and lighting unchanged. Repair the surfaces revealed behind removed objects so they continue naturally. Result: the same empty room, clean, photorealistic, as photographed by an architectural photographer."

REDESIGN (rempli depuis l'analyse) :
"Keep the room's architecture exactly as shown: [éléments fixes + position]. Same camera angle, perspective and window light from the [direction]. Redesign this [pièce] in a [style] interior: [4 à 6 marqueurs du style]. Furnish with: [4 à 6 meubles réels, chacun matière, couleur, taille, position — ex. 'a 220 cm oatmeal linen sofa against the left wall']. Work around [éléments bloquants] naturally, as a real interior designer would. Materials: [matières précises]. Realistic scale, believable lived-in details, natural daylight, editorial interior photography, 24 mm lens, eye level, no distortion, no text."

Règles d'écriture : < 120 mots pour REDESIGN ; une ancre de taille et de position par meuble ; jamais plus de 3 objets identiques sans emplacement ; pour une retouche, décrire seulement le changement. Un luminaire reste un luminaire ; une salle de bain n'a ni rideaux en tissu (sauf douche) ni canapé ; le désordre est rangé.

## Grille de contrôle (note sur 10, ≥ 8 pour montrer)
- Architecture : fenêtres, portes, éléments fixes au même endroit (3 pts).
- Perspective et cadrage identiques (2 pts).
- Style reconnaissable : ≥ 4 marqueurs (skill signatures-styles) (2 pts).
- Meubles : bons types, échelle juste, posés au sol, pas déformés ni coupés, produits demandés présents (2 pts).
- Rendu : photo de magazine, lumière naturelle, aucun texte (1 pt).
Sous 8 : nouvel essai avec le défaut cité ; après 2 échecs, modèle de secours ; jamais de résultat < 8 sans message honnête et conseil (recul, lumière).

## Tester
- `scripts/test-transfo.ts` via `.github/workflows/test-transfo.yml` (photos Wikimedia, plan + modèles) : regarder chaque avant/après.
- La part gratuite Cloudflare (10 000 unités/jour) est partagée : un 9B ≈ 1 600, un 4B + analyse ≈ 200 ; ne pas l'épuiser en tests.
- Tests unitaires : `tests/unit/selection-piece.test.ts`, `attributs.test.ts`, `ia-worker.test.ts`.
