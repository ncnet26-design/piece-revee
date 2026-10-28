# Contrôle visuel (avant / après)

Captures pleine page, réduites en WebP, aux trois tailles de référence :
- ordinateur 1440 × 900 ;
- tablette 834 × 1112 ;
- mobile 390 × 844.

| Dossier | Contenu |
|---|---|
| `avant/` | Le site avant la refonte « studio premium » (octobre 2026). |
| `apres/` | Le site après la refonte. |
| `comparatif/` | Avant à gauche, après à droite, même page et même taille (`node scripts/qa-comparatif.mjs`). |

## Refaire les captures
1. `pnpm build`
2. `npx serve out -l 4173`
3. `node scripts/qa-captures.mjs docs/qa/apres / /studio/ /galerie/ /showroom/ /planche/`

## Grille de relecture
Chaque capture est relue avec ces questions :
- **Premier écran.** Une image forte, un titre, une action principale. Aucun bloc vide.
- **Images.** Aucune image floue, déformée, pixelisée, en double ou sans crédit. Pas de château ni de maison générique. Pas de meuble au rendu plastique.
- **Typographie.** Titres en Instrument Serif. Texte courant en Onest. Pas plus de trois tailles par écran.
- **Couleurs.** Uniquement les jetons de `docs/DESIGN-SYSTEM.md`. Pas de violet ni de bleu « application ».
- **Mobile.** Rien ne déborde. Les boutons font au moins 36 px. La barre d'onglets ne masque pas d'action.
- **Honnêteté.**
  - Les rendus 3D, planches composées et photographies sont nommés comme tels.
  - Les produits portent une date de vérification.

La validation automatique complète ce contrôle visuel :
- `pnpm test` ;
- `npx playwright test`, qui inclut axe WCAG 2.2 AA et le débordement mobile.
