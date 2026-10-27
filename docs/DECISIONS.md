# Décisions techniques

| Décision | Raison | Réversible ? |
|---|---|---|
| Next.js 16 en **export statique** | Hébergeable gratuitement partout ; rapide ; pas de serveur à payer | Oui : retirer `output: "export"` pour repasser en rendu serveur (Vercel Pro) |
| **Cloudflare Pages** plutôt que Vercel | L'offre gratuite de Vercel interdit l'usage commercial ; celle de Cloudflare l'autorise | Oui |
| **Supabase** (Postgres, Auth, Storage, Edge Functions, pgvector, pg_cron, pgmq) | Une seule offre gratuite couvre base, comptes, fichiers, fonctions serveur et files de tâches | Oui (Postgres standard) |
| Noyau métier dans `supabase/functions/_shared/core` | Le même code (offres, quotas, schémas Zod) tourne dans le navigateur, dans Deno et dans les tests | — |
| **Mode démonstration** sans clé | Le site est utilisable et testable de bout en bout sans aucun compte ni dépense | — |
| Claude : Opus 5.5 (étude), Sonnet 5.5 (Camille, contrôles), Haiku 5.5 (mémoire, tri) | Qualité là où elle compte, coût bas ailleurs ; sorties structurées validées par Zod ; repli serveur activé | Oui (`core/costs.ts`) |
| **Enveloppe IA** financée par les ventes | Contrainte « 0 € » : l'IA ne peut jamais coûter plus que ce qu'elle rapporte | — |
| Images : couche `ImageProvider` (Workers AI gratuit par défaut, fal, Replicate, mock) | Démarrer gratuitement, monter en qualité sans réécrire ; contrôle de chaque rendu par Claude Vision | Oui (`IMAGE_PROVIDER`) |
| Galerie en **photos libres** (Unsplash, Pexels, Openverse, Wikimedia Commons) | Gratuit, légal, crédit de l'auteur affiché ; aucune image de marque | — |
| Aucun produit, prix ou lien inventé | Exigence du brief : catalogue alimenté seulement par flux d'affiliation réels ; sinon renvoi vers la page d'accueil de l'enseigne | — |
| RLS stricte + droits par colonne + fonctions serveur révoquées pour `anon`/`authenticated` | Un utilisateur ne peut ni lire les données d'un autre ni modifier son offre ou ses quotas ; testé sous PGlite | — |
| Polices auto-hébergées (sous-ensemble latin, préchargées) | Performance (LCP) et RGPD (aucun appel à Google Fonts) | — |
| Mesure d'audience chargée **après consentement** seulement | CNIL | — |
| Mention « Image générée par IA » sur chaque rendu | AI Act (article 50) | — |
| CSP avec `'unsafe-inline'` | Next.js en export statique insère des scripts en ligne ; pas de serveur pour des nonces | Oui, en passant au rendu serveur |
