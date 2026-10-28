---
name: frontend-design
description: Construire les interfaces de Pièce Rêvée avec le système de design (jetons, typographie, boutons, champs, cartes, panneaux, fenêtres, états de chargement et d'erreur), accessibles et responsives, en Next.js 16 export statique, React 19 et Tailwind 4. À utiliser pour tout composant ou page, toute refonte d'écran, et pour corriger un problème d'accessibilité ou de mobile.
---

# Conception d'interface (front-end)

## Rôle
Traduire la direction artistique (`premium-art-direction`) en composants cohérents, accessibles et rapides. Les règles détaillées sont dans `docs/DESIGN-SYSTEM.md`.

## Quand l'utiliser
- Pour créer ou modifier un composant de `components/` ou une page de `app/`.
- Pour corriger une violation axe, un débordement mobile ou une incohérence visuelle.

## Principes
- **Next.js 16 en export statique.**
  - Lire `node_modules/next/dist/docs/` avant d'utiliser une API.
  - Pas de code serveur à l'exécution. Les secrets restent dans le worker Cloudflare, jamais côté client.
- **Jetons uniquement** : `bg-bg`, `bg-surface`, `bg-soft`, `text-ink`, `text-muted`, `border-line` et les variables CSS de `app/globals.css`. Pas de couleur codée en dur, sauf palette de matière.
- **Composants de base** :
  - classes `btn`, `btn-primary`, `btn-ghost`, `btn-sm` et `btn-lg` ;
  - classes `input` et `eyebrow` ;
  - `<dialog>` natif pour les fenêtres ;
  - `components/studio/Panel.tsx` pour les panneaux.
- **Accessibilité.**
  - Boutons nommés, avec `aria-label` si l'icône est seule.
  - `aria-pressed` pour les bascules, `aria-live` pour les compteurs.
  - Focus visible ; Échap ferme.
  - Liens externes avec `rel="noopener noreferrer"` et la mention « (nouvel onglet) » en `sr-only`.
- **Mobile d'abord.**
  - Zones tactiles d'au moins 36 px.
  - Barre d'onglets en bas : ne pas placer d'action critique dessous.
  - Tester sur Pixel 7.
- **États.**
  - Chargement : squelette et durée.
  - Erreur : `role="alert"`, avec un bouton « Réessayer ».
  - Vide : une phrase utile et une action.
  - Jamais d'animation qui simule un traitement terminé.
- **Animations** de 200 à 350 ms, `cubic-bezier(.2,.8,.2,1)`, coupées par `prefers-reduced-motion`.
- **Dépendances.** Pas de nouvelle dépendance sans besoin réel ; licence compatible avec un usage commercial.

## Étapes
1. Lire le besoin et la section correspondante de `docs/DESIGN-SYSTEM.md`.
2. Réutiliser un composant existant (`InspirationBank`, `BeforeAfter`, `LegacyNotice`, `Panel`) avant d'en créer un.
3. Écrire le composant avec les jetons, puis ses états (chargement, vide, erreur).
4. Ajouter ou mettre à jour un test Playwright (`tests/e2e/`) qui joue le parcours et passe axe.
5. Lancer `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm build` et `npx playwright test`.
6. Faire les captures à trois tailles (`node scripts/qa-captures.mjs`) et les relire.

## Erreurs à éviter
- Couleurs `#5F5F67` ou `#7C3AED` codées en dur.
- Boutons avec seulement une icône, sans nom accessible.
- `<div onClick>` à la place d'un bouton.
- Texte gris trop clair (contraste inférieur à 4,5:1).
- Grilles qui débordent sur mobile.
- Clés API dans le client.
- `localStorage` sans `try/catch`.

## Critères d'acceptation
- Zéro violation axe WCAG 2.2 AA.
- Aucun débordement horizontal à 390 px.
- Les tests de parcours passent sur ordinateur et mobile.
- Aucune couleur hors jetons, sauf données de matière.

## Exemples
- `components/InspirationBank.tsx` :
  - onglets en `aria-pressed` ;
  - recherche nommée « Rechercher une inspiration » ;
  - compteur `aria-live` ;
  - fenêtre `<dialog>` ;
  - favoris en `localStorage` protégé.
- `components/LegacyNotice.tsx` : un bandeau sobre qui annonce honnêtement qu'un outil est une première version et renvoie vers le Studio.
