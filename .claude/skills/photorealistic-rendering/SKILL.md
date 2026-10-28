---
name: photorealistic-rendering
description: Distinguer et piloter les trois niveaux de rendu de Pièce Rêvée (image IA, aperçu 3D interactif, rendu final par lancer de rayons), leurs résolutions et leurs limites. À utiliser avant d'annoncer une qualité ou une résolution à l'utilisateur.
---

# Rendu photoréaliste

| Niveau | Où | Usage | Résolution |
|---|---|---|---|
| Image IA | `workers/ia` (OpenAI / Gemini / fal / Replicate) | Ambiance, transformation de photo | Native du fournisseur (OpenAI GPT Image 2.x : jusqu'à 3840 × 2160, au-delà de 2560 × 1440 « expérimental ») |
| Aperçu 3D | `lib/studio/engine.ts` | Interaction, sélection, édition | Taille d'écran, densité ≤ 2 |
| Rendu final | `lib/studio/final-render.ts` | Image de qualité de la scène 3D | Native : 1920 × 1080, 2560 × 1440, 3840 × 2160 |

## Règles
- Ne jamais dire « 4K » pour une image agrandie : indiquer la résolution native et, si un agrandissement est fait, le dire.
- Une image IA n'est pas une scène 3D : ses meubles cliquables sont des zones, ses dimensions des estimations.
- Une amélioration IA ne doit pas changer les meubles, proportions ou finitions demandés : consignes « keep » + masque pour les éditions locales.
- Résolution de texture ≠ résolution de rendu ≠ résolution finale.

## Contrôle
Banc `/studio/controle/` (6 vues) avant toute annonce d'amélioration ; garder les mesures dans `docs/rendu-controle/mesures.json`.
