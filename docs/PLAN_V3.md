# Plan V3 — valeur, zéro bug, premium, puis conversion

Ordre non négociable : valeur → zéro bug → premium → conversion. Aucune technique de vente tant que les seuils de l'étape 1 ne sont pas atteints.
Contraintes : rien de payant sans accord ; pas de déploiement en production sans accord ; commits locaux.

## Étape 1 — La valeur (rendu, produits, parcours)

| # | Tâche | Skill | Critère de réussite | Estimation |
|---|---|---|---|---|
| 1.1 | Correspondance stricte meuble ↔ produit partout (accueil, résultat, boutique), dimensions lues (A × B, Ø) | correspondance-meuble-produit | 0 contradiction matière/couleur/forme sur l'accueil et 20 cas tests | 0,5 j |
| 1.2 | Libellé honnête « produit exact » / « produit le plus proche » sur chaque point cliquable | correspondance-meuble-produit | Chaque fiche porte l'un des deux | 0,5 j |
| 1.3 | Contrôle qualité automatique du rendu (vision gratuite) : note /10, nouvel essai si < 8, jamais montré sous 8 sans message | controle-qualite-image | Aucun rendu < 8 affiché sur le banc | 1 j |
| 1.4 | Contrôle produit par vision : chaque meuble du rendu comparé à l'image du produit lié | correspondance-meuble-produit | ≥ 90 % de correspondance sur le banc | 1 j |
| 1.5 | Script de vérification du catalogue (titre/image/prix contre la page de l'enseigne), retrait des pages mortes | verification-fiche-produit | 100 % des fiches affichées vérifiées < 7 j | 1 j (+ robot) |
| 1.6 | Dates avec année, occasion signalée, seuils de budget expliqués, total exact | normalisation-catalogue | Tests unitaires verts | 0,5 j |
| 1.7 | Parcours : délai annoncé, « ce que vous recevez », « gratuit sans compte », souhaits reformulés, bascule 3 budgets sur le résultat | redaction-interface | e2e verts, revue microcopie | 0,5 j |
| 1.8 | Banc d'essai 40 photos (toutes pièces et conditions) + `eval/RAPPORT.html` | banc-d-essai-ia | Rapport produit, seuils mesurés | 1 j + part gratuite (≈ 4 pièces 9B / jour) |

Limite réelle : la part gratuite Cloudflare (10 000 unités/jour) ne permet que quelques rendus 9B par jour ; un banc de 40 photos × 3 styles prendra plusieurs jours en gratuit, ou ≈ 6 à 22 $ en payant (fal.ai) — décision du propriétaire.

## Étape 2 — Zéro bug et premium

| # | Tâche | Skill | Critère |
|---|---|---|---|
| 2.1 | Domaine unique, canoniques, sitemap, Open Graph avant/après | seo | Canonique = domaine choisi sur toutes les pages |
| 2.2 | Corriger chaque point de `AUDIT_SITE.md` avec un test | revue-de-code, tests-e2e-playwright | 0 point ouvert |
| 2.3 | Crawler liens internes + liens produits externes | verification-fiche-produit | 0 lien mort affiché |
| 2.4 | Lighthouse mobile ≥ 90 sur 6 pages clés, LCP < 2,5 s, 0 erreur console | performance-web | Rapport Lighthouse |
| 2.5 | Accessibilité RGAA/WCAG AA (axe + revue) | accessibilite-rgaa | 0 violation axe sérieuse |
| 2.6 | Boutique rendue dans le HTML (première page), photos produits ≥ 480 px | performance-web | Contenu visible sans JavaScript |

## Étape 3 — Prouver puis convertir (après validation des seuils)

Galerie d'avant/après réels (filtres pièce/style/budget), « une pièce, trois budgets », vidéos, démo sans inscription, valeur avant paiement (rendu basse définition), grille simplifiée (proposition à valider), transparence affiliation, mesure du tunnel. Interdits : faux avis, fausse urgence, cases précochées, prix barrés fictifs, résiliation compliquée.

## Livrables
`docs/AUDIT_SITE.md` (fait, version 1), `docs/SKILLS.md`, `eval/RAPPORT.html`, site corrigé, accueil et galerie de preuves, proposition de grille, tableau de bord de conversion, `docs/A_FAIRE_PAR_MOI.md`.
