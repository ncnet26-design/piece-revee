# Audit du site (V3) — vérification des points signalés

Site : https://odd-bar-c583.ewanesteves26.workers.dev — vérifié le 13 nov. 2026 (code + page servie).
Statut : **Confirmé** (vrai problème), **Faux positif** (artefact de lecture), **À vérifier** (pas encore contrôlé en navigateur).
Chaque correction aura son test de régression (colonne « Test »), ajouté au moment de la correction.

## Contenu et données produits

| # | Point | Statut | Gravité | Cause | Correction prévue | Test |
|---|---|---|---|---|---|---|
| C1 | Fauteuil « vert à motif » relié à un fauteuil en bois | Confirmé (logique) | Haute | Le libellé du point vient de l'image d'exemple, le produit d'une recherche par mots ; aucune vérification couleur/matière côté serveur | Appliquer `lib/attributs.ts` (accord strict) au choix de l'accueil ; libellé = produit réel ou « le plus proche » | unit `trouves-par-budget` |
| C2 | « Tapis rond » relié à un tapis 133 × 195 cm | **Confirmé** (page servie) | Haute | Un produit sans mot de forme n'est pas écarté ; les dimensions A × B ne sont pas lues comme rectangulaires | Lire les dimensions (A × B ⇒ rectangulaire, Ø ⇒ rond) dans `attributs.ts` | unit `attributs` |
| C3 | Prix datés sans année, dates incohérentes | Confirmé (format « 8 nov. ») | Moyenne | `dateReleve` sans année ; note de bas = date la plus ancienne, fiches = date de chaque produit | Format « 8 nov. 2026 » partout ; libellé « prix relevés entre le … et le … » | unit `date-releve` |
| C4 | Fiches incomplètes ou formats incohérents (24.5/24,5, Ø/⌀, « Ecru », anglais) | Confirmé (données brutes des enseignes) | Moyenne | Titres repris tels quels | Normalisation à l'affichage (virgule, ×, Ø, accents usuels) sans modifier le sens ; titres anglais signalés | unit `normaliser` |
| C5 | Tranches de budget qui se chevauchent | Confirmé (voulu mais non expliqué) | Moyenne | Gamme = tiers de prix **par famille** (un tapis à 80 € peut être « haut de gamme » face à un canapé à 500 € « petit budget ») | Afficher les seuils par famille (« Canapés : petit < 450 €, haut > 1 200 € ») | e2e boutique |
| C6 | 6 869 références / 32 enseignes « invérifiables » ; 162 produits visibles | Partiellement faux positif | Moyenne | Les 6 869 références existent (public/boutique), mais sont chargées par le navigateur : invisibles pour un robot de lecture. Les « 162 » sont l'ancien catalogue vérifié à la main | Rendre la première page de la boutique dans le HTML ; ne plus citer d'enseigne absente (Maisons du Monde, Leroy Merlin, La Redoute ne sont pas dans la boutique) | e2e + crawler |
| C7 | Produits d'occasion (Selency) non signalés | **Confirmé** : 366 produits Selency | Moyenne | Pas de champ « occasion » | Mention « Occasion / vintage » sur les fiches Selency (et toute enseigne de seconde main) | unit + e2e |
| C8 | Liste du salon (accueil) qui mélange les budgets vs total « budget moyen » | À vérifier | Moyenne | Lignes sans produit dans le budget choisi | Total = somme exacte des lignes affichées du budget choisi | unit `PrixPiece` |

## Bugs techniques

| # | Point | Statut | Gravité | Cause | Correction prévue |
|---|---|---|---|---|---|
| T1 | `/inspirations/` en erreur | Confirmé 404, **aucun lien interne** vers cette adresse (le site utilise `/galerie/`) | Faible | Adresse devinée | Redirection `/inspirations/` → `/galerie/` |
| T2 | « Chargement de la boutique… » | Confirmé pour les robots (contenu chargé côté navigateur) | Moyenne | Chargement différé | Première page rendue dans le HTML |
| T3 | Icônes sans libellé (/moodboard/, /compte/) | **Faux positif** : `aria-label` présents (« Moodboard, 0 élément », « Mon compte ») | — | — | — |
| T4 | Balises meta visibles | À vérifier en navigateur | — | — | — |
| T5 | Canonique vers `piece-revee.pages.dev` | **Confirmé, critique** : ce domaine **n'existe pas** (aucune réponse) | Haute | `lib/site.ts` (valeur par défaut) | Domaine principal à choisir (question au propriétaire), puis canoniques, sitemap, Open Graph |
| T6 | Carrousel dupliqué pour lecteurs d'écran, étapes doublées, flèche manquante | À vérifier (la copie du carrousel est en `aria-hidden`) | Faible | — | — |
| T7 | Textes alternatifs vides ou en anglais | À vérifier (images d'enseignes : `alt=""` décoratif voulu ; photos Unsplash : alt français) | Moyenne | — | — |
| T8 | « Commencer » renvoie vers la page en cours ; « Créer » du pied de page | À vérifier (« Commencer » → `/transformer/`, donc « page en cours » seulement sur /transformer/) | Faible | — | Masquer « Commencer » sur /transformer/ |

## Parcours de transformation

| # | Point | Statut | Correction prévue |
|---|---|---|---|
| P1 | Pas de délai, d'écran d'attente, de messages d'erreur | Partiellement faux positif : écran d'attente par étapes, messages HEIC / trop petite / sombre / floue existent ; **délai non annoncé** | Annoncer « 30 s à 1 min » avant l'envoi |
| P2 | Étape 3 non présentée avant l'envoi | Confirmé | Encadré « Ce que vous recevez » (rendu, meubles réels, liste d'achats, 3 budgets) |
| P3 | Compte ou paiement nécessaire ? non dit | Confirmé | « Gratuit, sans compte ni carte » au-dessus du bouton |
| P4 | « Souhaits » facultatif mais « ce qui compte le plus » | Confirmé (formulation contradictoire) | Reformuler : « Facultatif. Si vous l'écrivez, l'IA l'applique en priorité. » |

## Tarifs et confiance

| # | Point | Statut | Correction prévue |
|---|---|---|---|
| R1 | 7 formules, Pass et Plus se cannibalisent | Confirmé | Proposition de grille (décision du propriétaire) |
| R2 | Quotas incohérents (liste / tableau / FAQ) | À vérifier ligne par ligne | Une seule source (`core/plans`) pour tous les affichages |
| R3 | Essai 7 jours : carte ? fin d'essai ? | Confirmé (non dit) | Texte clair ; mais paiements non branchés (Stripe) : à décider |
| R4 | « Bientôt inclus » dans les offres | Confirmé | Page « Feuille de route » séparée |
| R5 | « Aucune marque ne paie » vs liens affiliés | Confirmé (formulation à corriger, aucun lien affilié actif aujourd'hui) | Formulation exacte de l'affiliation + mention sur les liens concernés quand ils existeront |
| R6 | Pas de garantie, pas de preuve sociale | Confirmé | Garantie : décision du propriétaire ; avis : collecte réelle seulement |

## Constats supplémentaires (mon audit)

| # | Constat | Gravité |
|---|---|---|
| S1 | Robot interne (13 nov., 330 pages × 2) : 0 erreur JS, 0 lien interne mort, 0 image cassée, 0 débordement | — |
| S2 | Liens produits externes non vérifiés en masse (pages disparues possibles) | Haute |
| S3 | Rendu non contrôlé avant affichage (pas de note qualité) | Haute |
| S4 | Service IA en ligne en retard sur le code (règle « payant aux abonnés » non déployée) | Haute |
| S5 | Lighthouse, temps de chargement, liens externes : à mesurer (étape 2) | — |
