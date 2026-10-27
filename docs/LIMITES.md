# Limites connues

Rien n'est caché : voici ce qui ne fonctionne pas encore, ou seulement en partie.

| Sujet | État | Pour lever la limite |
|---|---|---|
| Photos de la galerie | Illustrations dessinées tant que l'import d'images libres n'a pas tourné (API inaccessibles depuis l'environnement de construction) | Clés Unsplash et Pexels gratuites, puis l'action « nightly » |
| Produits | Pas de flux d'affiliation : fourchettes de prix et liens vers les pages d'accueil des enseignes, jamais de prix inventé | Statut légal, puis inscription aux plateformes d'affiliation et `pnpm catalog:ingest` |
| Paiement | Code complet (Checkout, portail, webhook, droits) testé unitairement ; désactivé en démonstration | Statut légal + compte Stripe (mode test puis live) |
| Camille en démonstration | Répond à partir des 31 fiches de connaissances sourcées, sans IA | Clé Anthropic (mode connecté) |
| Rendus en démonstration | Illustrations dessinées, pas de photo transformée | Supabase + Workers AI (gratuit) ou autre fournisseur |
| Retouche par zone | La demande est enregistrée côté serveur mais pas encore exécutée ; annoncée « bientôt » sur les offres, pas vendue | Brancher un fournisseur d'inpainting après le banc d'essai |
| Home staging en lot, multi-utilisateurs, marque blanche, alertes de prix | Non livrés ; affichés « bientôt » | Développement ultérieur |
| Filigrane | Les rendus gratuits portent une mention affichée, pas un filigrane incrusté dans le fichier | Incrustation côté serveur |
| Connexion Apple | Absente (compte développeur payant) | Plus tard, sur les revenus |
| Sources | Liens vers les pages d'accueil des organismes, non vérifiés fiche par fiche (`consulted: null`) | Vérification humaine |
| Sécurité | CSP avec `'unsafe-inline'` (contrainte de l'export statique) | Rendu serveur avec nonces |
| Performance | Lighthouse mobile (performance) ≈ 84 à 95 selon les pages ; accessibilité, bonnes pratiques et SEO à 100 sur les pages publiques ; LCP ≈ 2,7 à 3,8 s en simulation 4G lente (objectif 2,5 s) | Hébergement CDN réel (Cloudflare) améliore en général ce chiffre |
| Textes juridiques | Brouillons à faire relire ; éditeur et médiateur à compléter | Voir `docs/A_FAIRE.md` |
| Dépôt | Pas encore poussé sur GitHub | Compte GitHub d'Ewan |
