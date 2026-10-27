# Tarifs, coûts et garde-fous

## Offres (prix TTC)

| Offre | Prix | Contenu livré aujourd'hui | Bientôt (sans surcoût) |
|---|---|---|---|
| Découverte | 0 € | 1 étude complète, 3 rendus d'essai par mois (filigrane), Camille 10 messages/jour, galerie, quiz et bibliothèques illimités | |
| Pass Projet | 14,90 € une fois, 30 jours | 3 études, 30 rendus HD, PDF, Camille illimitée | Retouche par zone |
| Plus | 9,90 €/mois ou 69 €/an, essai 7 jours | 10 études et 60 rendus HD par mois, « Ma maison », PDF | Retouche par zone, alertes de prix |
| Crédits | 4,90 € les 15 rendus, valables 12 mois | Rendus HD à l'unité | |
| Pro | 29 €/mois | 30 études et 100 rendus par mois, export HD sans filigrane | Home staging en lot |
| Pro Agence | 79 €/mois | 100 études et 400 rendus par mois | Multi-utilisateurs, marque blanche |

Repères concurrents relevés le 26/10/2026 sur des agrégateurs (à confirmer sur les sites officiels) :
Interior AI 19 à 49 $/mois, ReimagineHome 14 $/mois, RoomGPT 9 à 29 $, Collov 39 $ les 150 images.
Pièce Rêvée est moins chère sur l'abonnement et la seule à proposer un achat unique par projet.

La source de vérité est `supabase/functions/_shared/core/plans.ts` (page Tarifs, quotas serveur et Stripe s'y réfèrent).

## Coût IA estimé par usage

| Usage | Coût estimé |
|---|---|
| Étude complète (Opus 5.5, vision + étude) | ≈ 0,35 à 0,48 € |
| 3 rendus contrôlés | ≈ 0,28 à 0,37 € (0 € de rendu avec le quota gratuit Workers AI, reste le contrôle) |
| Message à Camille (Sonnet 5.5) | ≈ 0,013 € |

Tarifs Claude utilisés dans `core/costs.ts` (par million de jetons, entrée/sortie) : Opus 4/20 $, Sonnet 2/10 $, Haiku 0,10/0,50 $.

## Garde-fous

- **Enveloppe IA** : chaque vente crédite l'enveloppe du coût IA attendu ; 15 % du chiffre d'affaires financent l'offre gratuite.
  Enveloppe vide → les fonctions IA se suspendent proprement (message clair, aucune dette).
- **Plafond** de 1,50 € de dépense IA par jour et par utilisateur.
- **Alerte** si le coût d'une étude dépasse `STUDY_COST_ALERT_CENTS` (1,20 € par défaut).
- Cache des analyses de photo, limites de débit par utilisateur et par IP.

## Coût fixe

**0 €** : Cloudflare Pages (gratuit, usage commercial autorisé), Supabase Free (500 Mo de base, 1 Go de stockage ;
les photos inactives sont supprimées automatiquement, après 12 mois par défaut, réglable par l'utilisateur), GitHub Actions, sous-domaine `pages.dev`.
Seules dépenses variables : commission Stripe par vente (1,5 % + 0,25 € pour une carte européenne) et l'IA, prélevée sur l'enveloppe.
