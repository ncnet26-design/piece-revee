# Mettre en service la création d'images du Studio

Le site est déjà en ligne. Pour que « Créer » et « Essayer dans la pièce » produisent de vraies images, il faut remplacer le code du service d'images dans Cloudflare. Votre clé Google actuelle suffit : rien à acheter pour commencer.

## Étape 1 — Remplacer le code du service (5 minutes, gratuit)
1. Ouvrez https://dash.cloudflare.com puis **Workers & Pages** et le worker **piece-revee-ia**.
2. Cliquez sur **Edit code**.
3. Dans GitHub, ouvrez le fichier `workers/ia/worker.js` du projet, cliquez sur **Raw**, sélectionnez tout et copiez.
4. Dans Cloudflare, effacez tout le code et collez. Cliquez sur **Deploy**.
5. Vérification : ouvrez l'adresse du worker dans le navigateur. La page doit afficher `"fournisseurs":["gemini"]`.

## Étape 2 — Stockage des images (déjà prêt)
Les images produites sont gardées 30 jours dans l'espace KV **QUOTA** déjà relié. Pour un stockage durable, vous pourrez plus tard créer un espace R2 et le relier sous le nom **IMAGES**. R2 peut demander d'enregistrer un moyen de paiement chez Cloudflare : c'est à vous de décider.

## Étape 3 (facultative, payante) — Ajouter OpenAI
OpenAI apporte deux choses : une qualité d'image supérieure (jusqu'à 3840 × 2160 en natif) et le bouton **Identifier automatiquement** les meubles d'une image.
- Créer un compte et une clé se fait sur le site d'OpenAI. La facturation est à l'usage ; les tarifs sont sur leur page officielle.
- Dans Cloudflare, ouvrez **Settings → Variables and Secrets**, puis **Add → Secret** avec le nom `OPENAI_API_KEY`. Collez la clé à cet endroit uniquement, jamais dans la conversation ni dans le code.
- Facultatif : la variable `IA_FOURNISSEUR` = `openai` en fait le fournisseur par défaut.

## Plafonds de dépense (déjà actifs)
- 30 images par jour au total, 6 par visiteur.
- 15 $ par mois au total, 1,50 $ par visiteur.

Pour les modifier, ajoutez les variables `IMAGES_JOUR`, `IMAGES_VISITEUR_JOUR`, `BUDGET_MOIS_USD` et `BUDGET_VISITEUR_MOIS_USD`.

## Sans rien configurer, ce qui fonctionne déjà
- **Explorer** :
  - importer n'importe quelle image d'intérieur (par exemple une création faite avec ChatGPT) ;
  - désigner un meuble et préciser ses matières et sa forme ;
  - voir de vraies alternatives à trois niveaux de prix, avec liens et date de vérification.
- **3D** :
  - sélectionner, déplacer, pivoter, remplacer et changer la matière de chaque objet ;
  - lancer un rendu final par lancer de rayons, jusqu'en 4K.
- **Ma liste** : liste d'achats et budget. **Partager** : lien du projet, sans vos photos.
