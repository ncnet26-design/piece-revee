# Pièce Rêvée — règles permanentes (relues à chaque session)

@AGENTS.md

## Le concept (ne jamais le perdre de vue)
Aider n'importe qui à refaire son intérieur, quel que soit son budget. On choisit une pièce et un style, on voit une inspiration réaliste, et chaque meuble et chaque matière visibles mènent à un vrai produit, cliquable et achetable en ligne, classé par budget : **petit, moyen, haut de gamme**. Niveau visé : un studio de design haut de gamme de Los Angeles. Tout ce qui ne sert pas ce concept disparaît.

## Obligations avant d'agir
- Avant toute image : skills `direction-artistique-images` et `signatures-styles`.
- Avant toute matière : skill `matieres-4k`.
- Avant tout produit : skill `catalogue-ameublement`.
- Relire `docs/ERREURS.md` et `PROGRESS.md` ; y noter chaque erreur et chaque avancée.

## Images
- Vraies photos d'abord (Pexels téléchargeable ; Unsplash : ses URLs et le crédit du photographe). Génération seulement si aucune photo ne convient, règles `anti-rendu-ia`, toujours étiquetée « Image générée par IA ».
- Matières : textures réelles CC0 (Poly Haven, ambientCG), jamais d'IA. Original 4K gardé pour le zoom.
- Largeur minimale 2000 px. Versions web AVIF + WebP (640, 1280, 1920, 3840), toujours `srcset` + `sizes`.
- Une inspiration montre au moins 4 marqueurs de son style et aucun défaut de la grille de rejet ; on la reconnaît sans lire le titre.
- Photo produit d'enseigne : affichée depuis son site (adresse seulement, jamais copiée ni stockée), dessin au trait en secours ; « Voir chez [enseigne] ».
- Chaque image est ouverte et regardée avant publication. Crédits dans `credits.md`.

## Produits
- Aucun produit, prix ou lien inventé. Chaque produit : page vérifiée, date de vérification, gamme, styles, pièce, matière, couleur. Dimensions seulement si relevées.
- Un prix affiché a sa date de relevé. Aucune marque ne paie pour être classée. `affiliate_url` vide tant qu'il n'y a pas d'affiliation.

## Charte graphique
- Palette : fond `#F4F1EB`, surface `#FBFAF7`, encre `#1B1A17`, gris `#625C53`, filet `#DDD6CB`, bronze `#7A5B30`. Jetons de `app/globals.css`, aucune couleur codée en dur.
- Polices : Instrument Serif pour les titres seulement (h1 56–128 px, h2 40–72 px) ; Onest pour tout le reste (16 px, interlignage 1,6) ; surtitres en capitales 11 px. Trois tailles maximum par écran.
- Rayons : 0 pour les images, 2 px cartes et champs, 999 boutons et pastilles. Formats d'image : 16:9, 4:5, 3:2, 1:1.
- Espacements 4, 8, 12, 16, 24, 32, 48, 64, 96, 144 ; sections de 96 à 144 px sur ordinateur, 64 sur mobile. Grille 12 colonnes, 1440 px max.
- Cartes sans ombre ni bordure (l'image fait la carte). Mouvement : fondu et léger zoom au survol, rien qui cache le contenu.

## Règles du propriétaire
- Répondre en français, simplement, le résultat d'abord. Le propriétaire n'est pas développeur.
- Rien de payant sans accord explicite (chiffrer, montrer, attendre « oui »). Aucune clé dans la conversation ni dans le code.
- Demander avant : supprimer plus de 20 fichiers d'un coup, ajouter un service payant, changer le concept.
- Bâtiment : jamais de certification électrique, plomberie ou structure ; une estimation n'est pas un devis.

## Façon de travailler
- Avant « terminé » : `pnpm typecheck && pnpm lint && pnpm test`, `pnpm build`, `npx playwright test`, captures ordinateur et mobile ouvertes et regardées.
- Pas d'accès internet direct dans la session : téléchargements et vérifications via les robots GitHub Actions.
- Commits : lignes d'attribution de la session, aucun identifiant de modèle ; `workers/ia/worker.js` est compilé, jamais modifié à la main.
