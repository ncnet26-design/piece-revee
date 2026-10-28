---
name: design-premium
description: Direction artistique et UX haut de gamme de Pièce Rêvée : hiérarchie, typographie, espacements, états de chargement, mobile, accessibilité, animations sobres. À utiliser pour toute nouvelle interface ou refonte d'écran.
---

# Design UI/UX premium

## Principes
- La pièce (image ou 3D) occupe l'essentiel de l'écran ; les outils sont discrets (barre flottante, panneau latéral sur ordinateur, feuille glissée depuis le bas sur mobile — voir `components/studio/Panel.tsx`).
- Typographie : titres serrés (`tracking-tight`), surtitres en petites capitales espacées (`text-[11px] uppercase tracking-[.2em]`), chiffres en `tabular-nums`.
- Couleurs : fond chaud `#F4F1EA`/`#FBFAF8`, encre `#1d1d1f`, gris texte `#5F5F67` (contraste AA vérifié), accent laiton `#C9A564` utilisé avec parcimonie.
- Un composant n'existe que s'il aide à comprendre, choisir ou agir. Pas de bannière, pas de logo de marque mis en avant.
- Animations : 200–350 ms, `cubic-bezier(.2,.8,.2,1)`, toujours désactivées avec `prefers-reduced-motion`.
- Chargements : squelette animé + durée écoulée + fournisseur ; une erreur est toujours visible (`role="alert"`) avec « Réessayer » si possible. Jamais d'animation qui laisse croire qu'un traitement est fini.

## Accessibilité
- Boutons nommés (`aria-label` si icône seule), `aria-pressed` pour les bascules, focus visible, Échap ferme les panneaux, focus déplacé sur le titre à l'ouverture.
- Liens externes : `target="_blank" rel="noopener noreferrer nofollow"` + mention « (nouvel onglet) » en `sr-only`.
- Zones tactiles ≥ 36 px ; tester sur Pixel 7 (projet Playwright `mobile`).

## Validation
- axe sans violation (`tests/e2e/studio.spec.ts`).
- Captures desktop et mobile relues : rien ne déborde, la pièce reste visible quand une fiche est ouverte.
