# Pièce Rêvée

Plateforme web (mobile d'abord, installable en PWA) d'aménagement intérieur **et** extérieur :
une **visite 3D** où l'on se promène de pièce en pièce et où tout se modifie (meubles, couleurs, murs, sols, styles), une photo de la pièce ou du jardin → une étude d'aménagement (palette, zones, besoins, tutos),
des rendus de l'espace transformé, des produits réels d'enseignes, et **Camille**, assistante IA
en architecture d'intérieur et en paysage, disponible à chaque étape.

**Planche de matières 3D** (`/planche/`) pour composer une ambiance avec de vrais échantillons et l'exporter en HD.
Matières en textures photographiées (Poly Haven, CC0), bibliothèque de 37 meubles 3D réalistes, rendu HD téléchargeable,
et pour chaque objet des liens « Où l'acheter » vers IKEA, Castorama, Leroy Merlin, Maisons du Monde et d'autres enseignes.

> **Ressources libres** : textures, modèles 3D, photos et liens d'enseignes sont récupérés et vérifiés par le robot GitHub
> « Ressources » (`.github/workflows/ressources.yml`, lancement manuel dans l'onglet *Actions*). Crédits dans `public/*/LICENCES.txt`.

> **Budget : 0 €.** Tout repose sur des offres gratuites (Cloudflare Pages, Supabase Free, GitHub).
> L'IA n'est financée que par les ventes (voir [docs/COSTS.md](docs/COSTS.md)).

## Démarrer en moins de 10 minutes (mode démonstration, aucune clé)

Prérequis : Node 22+ et pnpm 10 (`corepack enable`).

```bash
pnpm install
pnpm dev            # http://localhost:3000
```

Sans variable d'environnement, le site fonctionne entièrement en **mode démonstration** :
projets stockés dans le navigateur, étude d'exemple adaptée au style choisi, Camille répond
à partir de la base de connaissances sourcée, paiement désactivé (boutons explicatifs).

```bash
pnpm build          # export statique dans out/
pnpm start          # sert out/ sur http://localhost:3000
```

## Vérifications

```bash
pnpm typecheck      # TypeScript strict
pnpm lint           # ESLint (Next core-web-vitals + typescript)
pnpm test           # Vitest : noyau, contenu, démo, Camille, catalogue, RLS (PGlite)
pnpm check:functions  # vérification Deno des Edge Functions
pnpm build && pnpm test:e2e   # Playwright + axe (accessibilité) sur l'export
```

## Passer en mode connecté (toujours gratuit)

1. **Supabase** (offre gratuite) : créer un projet, puis
   `supabase link --project-ref <ref>` et `supabase db push` (migrations dans `supabase/migrations`),
   `psql … -f supabase/seed.sql` (base de connaissances), `supabase functions deploy`.
2. Copier `.env.example` en `.env.local` et remplir `NEXT_PUBLIC_SUPABASE_URL` et `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
3. Déclarer les secrets serveur : `supabase secrets set ANTHROPIC_API_KEY=… IP_HASH_SALT=…`
4. **Cloudflare Pages** (offre gratuite, usage commercial autorisé) : relier le dépôt GitHub,
   commande `pnpm build`, dossier `out`. Les en-têtes de sécurité sont dans `public/_headers`,
   le redirecteur d'affiliation dans `functions/go/[id].ts`.
5. **Stripe** : seulement après création d'un statut (micro-entreprise). Créer les 6 prix en mode test,
   renseigner les `STRIPE_PRICE_*`, puis le webhook vers `…/functions/v1/stripe-webhook`.

Le détail pas à pas est dans [docs/RUNBOOK.md](docs/RUNBOOK.md).

## Organisation

| Dossier | Contenu |
|---|---|
| `app/` | Pages Next.js (export statique) |
| `components/`, `lib/` | Interface et logique client |
| `content/` | Contenu éditorial sourcé : 60 matières, 30 accords, 85 meubles cultes, 40 lieux, 51 plantes, 20 styles, guides, 31 fiches de connaissances, galerie |
| `supabase/functions/_shared/core/` | Noyau métier partagé navigateur/serveur : offres, quotas, enveloppe IA, schémas Zod, appariement catalogue, garde-fous |
| `supabase/functions/` | Edge Functions : étude, affinage, Camille, rendus, Stripe, export et suppression de compte, PDF, maintenance |
| `supabase/migrations/` | Schéma Postgres, RLS, stockage, tâches planifiées |
| `prompts/` | Prompts versionnés |
| `scripts/` | Import d'images libres, ingestion de flux produits, évaluation des rendus |
| `tests/` | Unitaires, SQL (RLS), bout en bout |

## Documentation

- [docs/A_FAIRE.md](docs/A_FAIRE.md) — **ce qui reste à faire de votre côté** (comptes, statut, relecture juridique)
- [docs/DECISIONS.md](docs/DECISIONS.md) — choix techniques et leurs raisons
- [docs/COSTS.md](docs/COSTS.md) — tarifs, coûts IA, enveloppe, rentabilité
- [docs/DATA_SOURCES.md](docs/DATA_SOURCES.md) — origine des contenus et des images, licences
- [docs/RUNBOOK.md](docs/RUNBOOK.md) — mise en ligne, exploitation, incidents
- [docs/LIMITES.md](docs/LIMITES.md) — limites connues
- [CHANGELOG.md](CHANGELOG.md)
