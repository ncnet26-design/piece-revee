# Système de design Pièce Rêvée

**Ambiance visée : un studio d'architecture.** Papier chaud, encre profonde et un bronze discret. La profondeur vient des images, des matières et de l'espace, pas des ombres ni des couleurs vives.

La source de vérité est `app/globals.css` : les jetons sont dans `:root`, et Tailwind les expose via `@theme inline`. Les règles d'usage se trouvent dans les compétences `premium-art-direction` et `frontend-design`.

## 1. Couleurs

| Jeton | Clair | Sombre | Classe Tailwind | Usage |
|---|---|---|---|---|
| `--bg` | `#F4F1EB` | `#14130F` | `bg-bg` | Fond de page (papier) |
| `--surface` | `#FBFAF7` | `#1C1B17` | `bg-surface` | Cartes, panneaux, champs |
| `--soft` | `#EAE5DC` | `#25231E` | `bg-soft` | Fond d'image en chargement, zones secondaires |
| `--ink` | `#1B1A17` | `#F1ECE3` | `text-ink` | Texte principal, bouton principal |
| `--muted` | `#625C53` | `#A39C90` | `text-muted` | Texte secondaire (contraste ≥ 5,3:1 sur les fonds clairs) |
| `--line` | `#DDD6CB` | `#33302A` | `border-line` | Filets, bordures |
| `--bronze` | `#7A5B30` | `#D2AE7E` | `text-bronze` | Accent rare (un par écran au plus) |
| `--good` / `--warn` / `--danger` | `#2B6B3A` / `#8A5A0E` / `#A3312A` | variantes claires | — | États uniquement |
| `--scrim` | noir chaud à 50 % | 60 % | — | Fond des fenêtres modales |

Interdits :
- violet, bleu « application » ou dégradés vifs ;
- couleurs codées en dur, sauf les couleurs de matières et de palettes, qui sont des données.

## 2. Typographie

| Rôle | Police | Taille | Réglages |
|---|---|---|---|
| Titre de page (h1) | Instrument Serif 400 | `clamp(44px, 6.4vw, 84px)` | interligne 1,02, approche −0,012 em ; seconde partie en `<em>` italique gris |
| Titre de section (h2) | Instrument Serif 400 | `clamp(34px, 4.4vw, 58px)` | idem |
| Titre de carte | Instrument Serif 400 | 23 à 28 px | — |
| Sous-titre d'interface (h3, h4) | Onest 600 | 15 à 18 px | approche −0,015 em |
| Texte courant | Onest | 15,5 px | interligne 1,6, largeur max. 68 caractères (`.prose-w`) |
| Surtitre (`.eyebrow`) | Onest 600 | 11,5 px | capitales, espacement 0,14 em, gris |
| Données techniques | JetBrains Mono | 12 px | références, codes |

Toutes les polices sont auto-hébergées et sous licence SIL OFL (`public/fonts/LICENCES.txt`). Un écran utilise au plus trois tailles de texte.

## 3. Espacements, rayons, ombres
- **Base de 4 px.** Valeurs : 4, 8, 12, 16, 24, 32, 48, 72 et 112.
  - 72 à 112 entre deux sections.
  - 24 à 32 entre les blocs d'une section.
- **Gouttière** : 16 px minimum sur mobile, avec les zones sûres respectées (`.wrap`, largeur max. 1320 px).
- **Rayons** :
  - `--r-s` 8 px pour les champs et les petites vignettes ;
  - `--r` 12 px pour les cartes et les images ;
  - `--r-l` 16 px pour les panneaux et les fenêtres ;
  - 999 px pour les boutons et les pastilles.
- **Ombres.** `--shadow` reste presque invisible. Elle sert seulement au survol d'un bouton principal et aux panneaux flottants.

## 4. Composants

### Boutons (`.btn`)
| Variante | Classe | Usage |
|---|---|---|
| Principal | `btn btn-primary` | **Une** action principale par écran (« Commencer un projet ») |
| Secondaire | `btn` | Actions secondaires |
| Discret | `btn btn-ghost` | Barres d'outils, icônes |
| Sur image | `btn btn-light` | Au-dessus d'une photographie |
| Tailles | `btn-sm`, `btn-lg` | 36 px minimum de zone tactile |

Le bouton est toujours un `<button>` ou un `<a>` réel, avec un nom accessible.

### Navigation
- **En-tête (ordinateur).** Le logo, puis quatre entrées : Studio, Inspirations, Matières, Planches. Une action « Commencer un projet » termine l'en-tête.
- **Barre d'onglets (mobile).** Les mêmes quatre entrées, plus Camille. Elle est fixée en bas et respecte la zone sûre.
- **Pied de page.** Il donne accès aux outils secondaires : Transformer, Concept, Maquette 3D, Mon projet d'étude, Ma maison.

### Champs
- `.input` pour les textes, listes et zones de saisie.
- Libellé visible, ou `aria-label` pour une recherche.
- Bordure `--line`, bordure `--accent` au focus.

### Cartes
- L'image est au format 4:3 ou 4:5, sur fond `--soft`, avec un léger zoom de 2,5 % au survol.
- Sous l'image : un surtitre, un titre serif et une méta en gris.
- Pas de bordure ni d'ombre : l'image fait la carte.

### Panneaux
`components/studio/Panel.tsx` s'affiche en panneau latéral sur ordinateur et en feuille glissée depuis le bas sur mobile. Il porte un titre, une fermeture par Échap et un focus déplacé à l'ouverture.

### Fenêtres
- `<dialog>` natif avec `showModal()`, fond `--scrim` et rayon 14 à 16 px.
- Un bouton « Fermer » nommé.
- Défilement interne au-delà de 92 vh.

### Avant / après
`components/BeforeAfter.tsx` est un curseur accessible (rôle `slider`). Ses libellés « Comparer : A et B » nomment les deux états.

### Bandeau de version
`components/LegacyNotice.tsx` signale honnêtement un outil secondaire ou une première version et renvoie vers le Studio.

## 5. États
- **Chargement.**
  - Squelette sur fond `--soft`, durée écoulée et nom du service.
  - Jamais de faux pourcentage.
- **Erreur.**
  - `role="alert"` et un message en clair : quoi, pourquoi, que faire.
  - Un bouton « Réessayer » quand c'est possible.
- **Vide.** Une phrase utile et une action, par exemple « Aucun favori pour l'instant : touchez ♡ sur une inspiration pour la garder ici. »
- **Donnée incertaine.**
  - « Estimation », « Donnée de démonstration » ou « Vérifié le … ».
  - Niveaux de confiance pour les plans techniques.

## 6. Images
- **Types.** Photographies d'architecture créditées, gros plans de matières, planches composées, rendus 3D et images générées. Chaque image est étiquetée par son type.
- **Formats.** WebP ; 1600 px pour un grand format, 640 px pour une vignette ; chargement différé hors du premier écran.
- **Inventaire.** Toutes les images figurent dans `docs/ASSETS.md`, avec leur provenance et leur licence.

## 7. Mouvement
- Durées de 200 à 350 ms ; zoom d'image de 700 ms ; courbe `cubic-bezier(.2,.8,.2,1)`.
- Tout est désactivé avec `prefers-reduced-motion`.
- Aucune animation qui retarde l'affichage du contenu.

## 8. Contrôle
- `npx playwright test` : axe WCAG 2.2 AA et absence de débordement à 390 px.
- `node scripts/qa-captures.mjs` : captures à trois tailles et relecture avec la grille de `docs/qa/README.md`.
