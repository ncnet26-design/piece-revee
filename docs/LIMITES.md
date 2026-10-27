# Limites connues

Rien n'est caché : voici ce qui ne fonctionne pas encore, ou seulement en partie.

| Sujet | État | Pour lever la limite |
|---|---|---|
| Photos | 8 photos d'architecture (Wikimedia Commons) et 35 photos de lieux ; la recherche Openverse sans clé ne renvoie rien depuis GitHub, donc peu d'intérieurs photographiés | Clé Pexels gratuite (secret GitHub `PEXELS_API_KEY`), puis lancer le robot « Ressources » |
| Produits | Pas de catalogue produit importé : chaque objet renvoie vers la recherche correspondante chez IKEA et Castorama (liens vérifiés par le robot) et vers le site des autres enseignes (Leroy Merlin, Maisons du Monde… bloquent les vérifications automatiques). Aucun prix ni produit inventé ; pas de modèles 3D officiels des enseignes (droits) | Statut légal, puis inscription aux plateformes d'affiliation et `pnpm catalog:ingest` |
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
| Visite 3D et plan | Pièces rectangulaires uniquement (une pièce en L se compose de deux rectangles), un seul niveau, hauteur sous plafond fixe (2,60 m) ; une partie du mobilier en volumes simplifiés (37 modèles 3D photographiés Poly Haven en bibliothèque) ; « Rendu HD » = rendu avec occlusion ambiante, pas un calcul de lumière par lancer de rayons ; ameublement automatique = simple proposition ; les astuces restent sur l'appareil | Pièces de forme libre, étages, bibliothèque de modèles 3D sous licence libre, comptes et modération |
| Dépôt | Sur GitHub (`ncnet26-design/piece-revee`) ; la mise en ligne Cloudflare reste manuelle | Connecter Cloudflare au dépôt GitHub |
| Transformer mon espace | La photo de la pièce sert de point de départ et d'illustration ; elle n'est pas retouchée par une IA (rendu photoréaliste de la pièce transformée : nécessite un service d'images payant ou le mode connecté) | Clé d'un service d'édition d'images, après accord sur le coût |
| Showroom | Teintes et formats génériques (pas de références de marques) ; couleurs à l'écran indicatives ; marbres et zelliges générés à partir de relevés, faute de textures libres de qualité | Échantillons réels en magasin ; flux produits des enseignes |
