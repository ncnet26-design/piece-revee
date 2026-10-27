# À faire de votre côté

Le code est terminé et testé en **mode démonstration**. Pour le mettre en ligne et encaisser,
certaines étapes exigent **votre identité ou votre accord** : je ne crée aucun compte et
n'engage aucune dépense à votre place. Tout ce qui suit est gratuit, sauf mention contraire.

## 1. Mettre le site en ligne gratuitement (environ 30 minutes)

- [ ] **Compte GitHub** (au nom d'Ewan) : créer un dépôt privé `piece-revee` et y pousser ce dossier
      (`git remote add origin … && git push -u origin main`).
- [ ] **Cloudflare** (gratuit) : Workers & Pages → Créer → Pages → relier le dépôt.
      Commande de build `pnpm build`, dossier de sortie `out`, variable `NODE_VERSION=22`.
      Résultat : `https://piece-revee.pages.dev`, en mode démonstration.

## 2. Activer les comptes et l'IA (gratuit, puis payé par les ventes)

- [ ] **Supabase** (offre gratuite) : créer un projet en région UE (Francfort ou Paris), puis suivre `docs/RUNBOOK.md` §2.
- [ ] Renseigner `NEXT_PUBLIC_SUPABASE_URL` et `NEXT_PUBLIC_SUPABASE_ANON_KEY` dans Cloudflare Pages, puis redéployer.
- [ ] **Connexion Google** (gratuite) : console Google Cloud → identifiants OAuth → coller l'ID et le secret dans Supabase Auth.
      La connexion par lien e-mail fonctionne sans rien configurer.
- [ ] **Cloudflare Workers AI** (quota quotidien gratuit) : créer un jeton « Workers AI » pour les rendus.
- [ ] **Clé Anthropic** : à créer **seulement quand des ventes rentrent**. Les crédits se rechargent à la main ;
      l'enveloppe IA du site coupe l'IA si le budget est épuisé, donc pas de mauvaise surprise.

## 3. Encaisser (nécessite un statut légal)

- [ ] **Micro-entreprise** : déclaration gratuite sur `formalites.entreprises.gouv.fr` (SIRET sous 1 à 4 semaines).
- [ ] **Stripe** : ouvrir le compte avec le SIRET, créer les 6 prix (voir `docs/COSTS.md`), tester en mode test,
      puis passer en live **après votre accord explicite**. Stripe ne coûte rien hors commission par vente.
- [ ] **Affiliation** (Awin, Effiliation, Amazon Partenaires…) : inscription gratuite mais un SIRET est généralement demandé.
      En attendant, le site renvoie vers les pages d'accueil des enseignes, sans lien affilié ni prix inventé.

## 4. Contenu et juridique

- [ ] Remplir `NEXT_PUBLIC_PUBLISHER_NAME` et `NEXT_PUBLIC_CONTACT_EMAIL` (mentions légales).
- [ ] **Relire les 6 documents juridiques** (`content/legal.ts`) : ce sont des brouillons sérieux mais pas un avis d'avocat.
      Points à compléter : hébergeurs, médiateur de la consommation (obligatoire pour vendre à des particuliers ;
      certains sont gratuits pour les micro-entrepreneurs), droit de rétractation.
- [ ] **Images libres** : créer des clés gratuites Unsplash et Pexels, les ajouter aux secrets GitHub
      (`UNSPLASH_ACCESS_KEY`, `PEXELS_API_KEY`) et lancer l'action « nightly » (ou `pnpm images:import`).
      La galerie passe alors des illustrations dessinées aux vraies photos, avec auteur et licence affichés.
- [ ] Vérifier les liens officiels de `content/sources.ts` (champ `consulted` à dater après vérification).
- [ ] Fournir 10 à 20 photos de vos propres pièces pour le banc d'essai des rendus (`eval/README.md`).

## 5. Plus tard, sur les revenus

- Nom de domaine (environ 10 €/an).
- Connexion Apple (compte développeur payant, 99 $/an).
- Fournisseur d'images plus haut de gamme (fal ou Replicate) si le banc d'essai le justifie.
