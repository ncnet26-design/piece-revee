# Journal des erreurs et leçons

À relire avant chaque travail. Chaque erreur commise sur le projet est notée avec sa correction et la règle qui l'évite.
Le but du site ne change pas : **photo de sa pièce + inspirations → moodboard → pièce transformée → chaque meuble, matière ou couleur cliquable vers de vrais produits.**

## Règles de base (rappel)
- Réponses en français, simples, le résultat d'abord.
- Rien de payant sans accord explicite (génération d'images, appels d'API payants comme Perplexity, services).
- Aucune clé dans la conversation ni dans le code.
- Ne rien inventer : produits, prix, avis, chiffres, promesses. Un prix a toujours sa date de relevé ; une image IA est signalée.
- Avant « terminé » : typecheck, lint, tests, build, tests de parcours, captures ordinateur et mobile.

## Façon de décider
| Erreur | Correction | Règle |
|---|---|---|
| Après « les images sont moches », j'ai enchaîné des changements visuels (meubles 3D importés) sans valider la direction | Changement annulé avant publication | Quand le propriétaire n'est pas satisfait : m'arrêter, proposer 2 ou 3 directions avec un aperçu, attendre son choix avant de toucher au visuel |

## Contenu et honnêteté
| Erreur | Correction | Règle |
|---|---|---|
| Phrase non vérifiée sur la page Expérience (« limitée par jour pour garder le service gratuit ») | Retirée avant publication | Toute affirmation sur le service doit être vérifiée dans le code ou les données |
| Aucun avis client disponible | Section « preuves » faite de chiffres réels du catalogue, aucun témoignage | Ne jamais fabriquer d'avis ; demander les vrais |

## Catalogue (robot)
| Erreur | Correction | Règle |
|---|---|---|
| Noms de produits « #REF! » (erreur de tableur publiée par une enseigne) et entités HTML non décodées (`&#39;`, `&amp;`) : 414 noms abîmés | `nomProduit()` décode les entités et remplace un nom vide ou en erreur par le titre tiré de l'adresse ; `decodeEntites()` dans le lecteur de fiches | Contrôler un échantillon de noms après chaque passage du robot |
| Famille « peinture » remplie de rouleaux, disques de meuleuse, toiles à peindre, tableaux et meubles « vernis » | Règle resserrée (peinture murale, contenance, lasure, sous-couche) + liste `OUTIL` exclue | Une famille se vérifie sur un échantillon réel, pas seulement sur des exemples inventés |
| Anneaux de tringle, colle à carrelage, fixations de miroir comptés comme produits | Exclus par `estAccessoire` au reclassement (`scripts/reclasser-catalogue.ts`) | Reclasser le catalogue publié après chaque correction de règle |
| Bougeoirs rangés dans « luminaires » | Règle « déco » prioritaire pour bougeoirs et photophores | Les rayons des enseignes ne valent pas classement |
| IKEA lu en suisse (fr-CH), pages de catégorie prises pour des produits, accessoires dans les résultats | Score des plans de site en français, filtres de pages produit, `estAccessoire` | Vérifier la langue et le type de page avant d'importer |
| Enseignes qui refusent les robots (Zara Home, La Redoute, Leroy Merlin…) | Respect du refus (403/429 → « interdit ») | Ne jamais contourner un refus ; proposer les flux d'affiliation |

## 3D et images
| Erreur | Correction | Règle |
|---|---|---|
| Matières « plates » : seules les couleurs des textures étaient utilisées, sans relief ni rugosité | Cartes de normales et de rugosité, éclairage HDR d'intérieur, rendu neutre (pas de dominante orange) | Une matière PBR = couleur + relief + rugosité, à l'échelle réelle |
| Texture « travertin » du projet = dallage de pierre (Marble 01), inutilisable pour une table | Travertin généré (veines horizontales et pores) | Regarder chaque texture avant de l'utiliser, ne pas se fier au nom du dossier |
| Enduit « chaux » gris et taché, velours rouge, lin bleu | Relief de la texture seulement, couleur choisie | Teinter par la couleur du matériau, garder la carte de relief |
| Ouverture de la page Expérience décevante (boîte grise immobile) | Ouverture sur la pièce rêvée, dessinée trait par trait puis éclairée | La première image doit montrer le résultat promis |
| Sol « avant » plus beau que prévu (parquet stratifié) | Sol gris uni | L'état « avant » doit être clairement terne pour que la transformation se voie |
| Texte posé sur les zones claires de la 3D | Décalage de l'image vers la droite sur ordinateur, vers le haut sur téléphone | Toujours vérifier la lisibilité sur captures aux étapes clés |
| Rendu 3D en continu : 134 s de blocage mesurés (Lighthouse mobile) | Redessin seulement pendant le défilement ou l'animation, démarrage au premier geste sur téléphone, shaders préparés en parallèle | Ne jamais laisser une boucle de rendu tourner pour rien |
| Image d'ouverture publiée sans l'avoir regardée : capturée au début de l'animation, scène presque vide | Retirée aussitôt, ancienne photo remise | Ouvrir et regarder chaque image avant de la publier, sans exception |
| Robot matières : recherche ambientCG par nom au lieu de l'identifiant (10 échecs), puis envoi de 135 Mo d'un bloc refusé par GitHub | Recherche par identifiant, envoi matière par matière | Tester une source avec un seul élément avant un lot ; découper les gros envois |
| Envois GitHub refusés (erreurs 500/502 passagères) pendant les robots et mes propres envois | Nouvelles tentatives avec pauses croissantes | Tout envoi automatique doit réessayer ; vérifier que la branche distante a bien reçu le commit |
| Métaux et enduits lisses : leur carte de couleur seule paraît plate (laiton = papier jaune) | Non publiés | Un métal se montre rendu avec ses reflets, jamais en carte de couleur seule |
| Node ne passait pas par le relais réseau (ENOTFOUND) alors que curl oui | `NODE_USE_ENV_PROXY=1` | Pour un script Node avec internet dans la session, activer le relais |
| Images de 2400 px chargées sur téléphone (accueil à 42/100) | Composant `Photo` avec tailles 640/1024/1600 | Toujours `srcset` + `sizes` |

## Code et outils
| Erreur | Correction | Règle |
|---|---|---|
| Constante exportée d'un fichier « use client » utilisée côté serveur | Données déplacées dans un module neutre | Un module client n'exporte que des composants |
| Accueil qui téléchargeait 1,2 Mo de catalogue | Calcul fait à la publication | Calculer au build ce qui ne dépend pas du visiteur |
| Saut de mise en page dû aux polices | Préchargement des polices de titres | Précharger les polices visibles au-dessus de la ligne de flottaison |
| Points cliquables sans nom pour les lecteurs d'écran (mobile) | `aria-label` | Lancer axe sur ordinateur ET mobile |
| 4 images supprimées comme « inutilisées » alors qu'elles sont chargées par un chemin calculé (planche, tests) | Remises aussitôt | Avant de supprimer, chercher aussi le dossier et les préfixes dynamiques (`/visuels/${…}`), et lancer les tests |
| `pkill -f "serve out"` a tué le terminal lui-même | Ne plus utiliser `pkill -f` avec un motif présent dans la commande | — |
| Politique de sécurité qui bloquait les images du service IA | `img-src https:` | Tester la page publiée, pas seulement en local |

## Connecteurs
- Context7 et Firecrawl : refusés par le réseau de la machine de travail (« fetch failed », HTTP 403) le 4 novembre ; Poly Haven et ambientCG aussi. Passer par les robots GitHub Actions pour télécharger des ressources libres.
- Perplexity : chaque appel est payant sur la clé du propriétaire → ne pas l'utiliser sans accord.

## 4 novembre — Photos Unsplash : des rendus 3D parmi les « photos »
- Constat : sur les planches wabi-sabi et contemporain, une bonne part des candidates étaient des images de synthèse (auteurs Deconovo, Taitopia Render, Max Harlynking, mentions « 3D render »).
- Correction : le robot écarte ces auteurs et les descriptions « render/3D/CGI » ; choix enregistrés par identifiant de photo (plus par numéro de planche, qui change à chaque recherche).
- Rappel : `pkill -f` dans la même commande tue le terminal de la session ; arrêter un serveur autrement.

## 5 novembre — Recherche en ligne « accélérée » : plus aucun résultat
- Constat (signalé par le propriétaire) : après la mise en ligne, l'IA disait ne rien trouver.
- Causes probables : modèle léger (Gemini 3.5 Flash Lite à réflexion courte) mis en ligne sans essai réel, liens Google coupés à 2,5 s, et produits jetés quand leur page n'était pas lue à temps.
- Correction : retour au modèle habituel et aux délais d'origine ; un lien trouvé par Google reste montré même si sa page est lente. Leçon : ne jamais changer le modèle d'un service payant sans un essai réel chiffré et accepté.
