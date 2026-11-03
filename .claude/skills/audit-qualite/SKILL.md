---
name: audit-qualite
description: Audit technique du site Pièce Rêvée : performance (Lighthouse, Core Web Vitals LCP, CLS, TBT), accessibilité (WCAG 2.2 AA via axe), rendu mobile, poids et formats des images (AVIF et WebP, srcset, taille servie par rapport à la taille affichée). À utiliser avant une refonte, après chaque modification importante et avant une mise en production.
---

# Audit qualité

## Instructions
1. Construire et servir le site : `pnpm build`, puis `npx serve out -l 4173`.
2. Lancer `node scripts/audit-qualite.mjs`. Le script écrit `docs/audit/qualite.md` et `docs/audit/qualite.json`. Pour chaque page principale, il relève :
   - les scores Lighthouse sur mobile (performance, accessibilité, bonnes pratiques, SEO) et les mesures LCP, CLS et TBT ;
   - chaque image affichée : taille réelle par rapport à la taille affichée (× densité d'écran), format, présence de `srcset` et de `loading="lazy"` hors du premier écran ;
   - le poids total transféré et les plus gros fichiers ;
   - le débordement horizontal sur mobile.
3. Lancer aussi `npx playwright test`, qui comprend axe WCAG 2.2 AA et le contrôle du débordement mobile.

## Seuils visés
- Lighthouse mobile : performance ≥ 85, accessibilité ≥ 95, bonnes pratiques ≥ 95, SEO ≥ 95.
- LCP < 2,5 s, CLS < 0,1, TBT < 200 ms en conditions mobiles simulées.
- Aucune image servie à plus de 1,5 fois sa taille affichée (densité comprise) ; AVIF ou WebP partout ; `srcset` sur toute image de plus de 600 px.
- Fichiers 4K : jamais servis tels quels, seulement en variantes.

## Limites
- Lighthouse en local mesure une simulation, pas le vrai réseau des visiteurs.
- Les scènes 3D (Studio, Matières) consomment le processeur : leur score de performance est mesuré à part et interprété avec prudence.
