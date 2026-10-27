# Exploitation

## 1. Développement local

```bash
pnpm install
pnpm dev                 # mode démonstration si aucune variable Supabase
pnpm check               # typecheck + lint + tests unitaires
```

## 2. Mise en place de Supabase (offre gratuite)

```bash
npx supabase login
npx supabase link --project-ref <ref>
npx supabase db push                          # migrations 000001 à 000005
psql "$DATABASE_URL" -f supabase/seed.sql     # base de connaissances de Camille
npx supabase secrets set SITE_URL=https://piece-revee.pages.dev IP_HASH_SALT=$(openssl rand -hex 16)
npx supabase functions deploy                 # toutes les Edge Functions
```

Tâches nocturnes (purge RGPD, contrôle du catalogue) : dans **SQL Editor**, enregistrer deux secrets Vault :

```sql
select vault.create_secret('https://<ref>.supabase.co/functions/v1', 'functions_url');
select vault.create_secret('<clé service_role>', 'service_role_key');
```

Premier administrateur : après votre première connexion,
`insert into public.user_roles (user_id, role) values ('<votre uuid>', 'admin');` puis ouvrir `/admin/`.

Auth : dans **Authentication → URL Configuration**, ajouter `https://piece-revee.pages.dev/**` aux URL de redirection.

## 3. Cloudflare Pages

- Build : `pnpm build`, sortie `out`, `NODE_VERSION=22`.
- Variables : toutes les `NEXT_PUBLIC_*` (build), et `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `IP_HASH_SALT` (redirecteur `/go/`).
- En-têtes de sécurité : `public/_headers`.

## 4. Stripe (après création du statut)

1. Mode **test** d'abord. Créer 6 produits et prix : Pass 14,90 € (unique), Plus 9,90 €/mois, Plus 69 €/an,
   Crédits 4,90 € (unique), Pro 29 €/mois, Pro Agence 79 €/mois.
2. `supabase secrets set STRIPE_SECRET_KEY=sk_test_… STRIPE_PRICE_PASS=price_… …`
3. Webhook vers `https://<ref>.supabase.co/functions/v1/stripe-webhook`, événements :
   `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `charge.refunded`.
   Copier le secret dans `STRIPE_WEBHOOK_SECRET`.
4. Tester avec la carte `4242 4242 4242 4242`. Activer le portail client dans Stripe (gestion de l'abonnement).
5. Passage en **live** : uniquement avec votre accord, en remplaçant les clés et les prix.

## 5. Surveillance

- `/admin/` : chiffre d'affaires, enveloppe IA, coût moyen par étude, signalements à modérer.
- Journaux : Supabase → Edge Functions → Logs (chaque appel IA est journalisé avec son coût).
- Alerte e-mail (facultative) via Resend si une étude coûte plus que `STUDY_COST_ALERT_CENTS`.

## 6. Incidents

| Symptôme | Cause probable | Action |
|---|---|---|
| « Service momentanément indisponible » sur les études | Enveloppe IA vide ou crédits Anthropic épuisés | Vérifier `/admin/` ; recharger les crédits à la main si les ventes le permettent |
| Rendus absents, étude présente | Quota gratuit Workers AI atteint | Attendre le lendemain ou définir `IMAGE_PROVIDER_FALLBACK` |
| Paiement accepté mais offre non activée | Webhook mal configuré | Stripe → Webhooks → renvoyer l'événement ; vérifier `STRIPE_WEBHOOK_SECRET` |
| Base proche de 500 Mo | Offre gratuite Supabase | Réduire la durée de conservation des photos, purger les journaux |
| Projet Supabase en pause | Inactivité de 7 jours (offre gratuite) | Le relancer dans le tableau de bord ; le trafic régulier l'évite |

## 7. Suppression de compte et export (RGPD)

Fonctions `account-export` (archive JSON) et `account-delete` (suppression complète, photos comprises), accessibles depuis `/compte/`.
