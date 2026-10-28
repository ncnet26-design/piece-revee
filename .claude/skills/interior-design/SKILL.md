---
name: interior-design
description: Raisonnement d'architecte d'intérieur pour les propositions de Pièce Rêvée : volumes, ouvertures, circulations, échelle du mobilier, palettes, styles, analyse d'une image d'inspiration. À utiliser pour rédiger des briefs IA, composer une scène 3D ou critiquer un rendu.
---

# Architecture intérieure

## Lire une pièce
- Relever : murs, ouvertures (fenêtres, portes), hauteur sous plafond, sens de la lumière, éléments à conserver (cheminée, moulures, radiateurs, sol).
- Distinguer ce qui est **vu** (photo), **mesuré** (donné par l'utilisateur), **estimé** et **inconnu** ; demander ce qui manque plutôt que supposer.

## Règles de composition (repères usuels)
- Passage de circulation : 80–90 cm ; entre canapé et table basse : 40–45 cm ; table basse ≈ 1/2 à 2/3 de la longueur du canapé, hauteur égale ou légèrement inférieure à l'assise.
- Tapis : les pieds avant des assises posés dessus ; 20–30 cm de sol visible autour.
- Éclairage en trois couches : général, d'ambiance (indirect), d'accent.
- Palette 60/30/10 (dominante, secondaire, accent) ; matières en écho (laiton répété 2–3 fois).

## Inspiration (Pinterest, magazine)
Extraire : style, palette (5 couleurs), matières, formes dominantes, ambiance lumineuse — **sans copier la composition**. Dans le code : `lib/photo.ts` (`extractPalette`), `lib/board/fromImage.ts`, brief du worker (`workers/ia/src/prompts.ts`).

## Brief IA (exemple)
« Salon parisien contemporain, table basse sculpturale en travertin adouci, canapé bouclé crème aux formes organiques, fauteuil velours olive, éclairage indirect chaud, parquet chêne point de Hongrie. Mobilier original, sans marque. »

## Contrôle d'un rendu
Fenêtres/portes inchangées ? perspective identique ? proportions crédibles (un canapé ≈ 85–95 cm de profondeur) ? matières lisibles ? Signaler toute modification non demandée de la géométrie et proposer une nouvelle tentative avec plus d'éléments à conserver.
