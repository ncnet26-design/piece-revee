# Audit de la transformation de pièce (9 novembre 2026)

Périmètre lu : `components/parcours/Parcours.tsx`, `Resultat.tsx`, `Chargement.tsx`, `lib/photo.ts`, `lib/ia.ts`, `lib/ia-jobs.ts`,
`workers/ia/src/{index,providers,prompts,plan,jobs,analyse,validate,config,compteur}.ts`.

## 1. Chaîne actuelle

1. Navigateur : la photo est vérifiée (`preparePhoto`), réduite, puis les inspirations sont lues par Gemini (`/v2/moodboard`), qui en tire un style.
2. `POST /v2/jobs` (Cloudflare Worker), avec deux chemins :
   - IA gratuite de Cloudflare : analyse de la photo par Mistral Small (vision, plan objet par objet), puis dessin par FLUX.2 klein 9B (4B quand la part du jour est entamée) ;
   - en secours : Gemini (« nano banana »), payant, dans le plafond de 15 $ par mois.
3. Le navigateur interroge l'état de la tâche jusqu'à 8 minutes, puis `/v2/analyse` (Gemini) repère les meubles pour les points cliquables et les produits.

## 2. Bugs et faiblesses

| # | Gravité | Constat | Où |
|---|---|---|---|
| 1 | **Bloquant** | La photo envoyée à l'IA est l'aperçu en 1024 px (`setRoom(r.photo.dataUrl)`), pas la version 2048 préparée : la qualité est perdue dès le départ. | Parcours.tsx `onRoom` |
| 2 | **Bloquant** | L'IA gratuite (FLUX.2 klein) n'accepte que des images de 512 px en entrée : elle « devine » la pièce, invente des éléments (fenêtre à la place d'une armoire à pharmacie), confond des objets (pot de fleurs à la place d'un lustre), et ne sort qu'en 1024 px. | providers.ts `cloudflare` |
| 3 | **Bloquant** | Pas d'étape de désencombrement : une pièce en désordre ou un gros plan (canapé couvert de vêtements, évier plein) donne une pièce inventée. | Toute la chaîne |
| 4 | **Bloquant** | Aucun contrôle qualité : un résultat raté (structure changée, meubles déformés) est montré tel quel. | index.ts `run` |
| 5 | Grave | Le type de pièce n'était pas transmis (corrigé le 9 nov. : choix obligatoire) ; les inspirations étaient recopiées comme photos (corrigé : style en texte). | Parcours.tsx, prompts.ts |
| 6 | Grave | Consigne de dessin très longue (≈ 3 500 caractères), pas d'ancre de taille ni de position par meuble, pas de produits du catalogue dans la consigne. | prompts.ts `buildPrompt` |
| 7 | Grave | HEIC : sur Chrome, Android et Windows, la photo est refusée avec un message qui promet une conversion « sur nos serveurs » qui n'existe pas. | photo.ts |
| 8 | Moyen | Rotation EXIF : confiée à `createImageBitmap` (respectée par les navigateurs récents, sans garantie partout) ; aucun contrôle côté serveur. | photo.ts |
| 9 | Moyen | Pas de refus des photos trop petites (< 800 px) ni de celles qui ne montrent pas une pièce ; « floue » et « sombre » ne sont que des avertissements. | photo.ts, Parcours.tsx |
| 10 | Moyen | La création de la tâche fait le dessin **dans** la requête (`run` attendu avant la réponse) : 20 à 60 s d'attente sans retour d'étape ; la page affiche une animation, pas l'avancement réel. | index.ts `/v2/jobs` |
| 11 | Moyen | Part gratuite partagée par tout le compte (10 000 unités par jour) : environ 3 images 9B par jour, puis 4B, puis Gemini payant. Épuisée le 9 nov. par les tests. | jobs.ts |
| 12 | Moyen | Le repérage des meubles (points cliquables) et le choix des produits sont faits après coup sur l'image finale, sans lien avec les produits proposés au modèle. | Resultat.tsx, analyse.ts |
| 13 | Faible | Pas de journal par transformation (modèle, consigne, durée, coût) consultable. | index.ts |
| 14 | Faible | Photos gardées 2 jours dans KV, images produites 30 jours ; la politique de confidentialité ne précise pas ces durées. | jobs.ts, /legal/confidentialite |
| 15 | Faible | Pas d'agrandissement haute définition ni de versions AVIF/WebP du résultat. | — |

## 3. Tests sur photos réelles (9 nov., chaîne gratuite)

Photos libres de droits (Wikimedia Commons). Résultats complets sur la branche `robot/test-transfo`.

| Photo | Modèle | Résultat | Défaut |
|---|---|---|---|
| Salle de bain années 50 (Infrogmation, CC BY 2.0) | klein 4B sans plan | Pièce gardée, demandes appliquées | Armoire à pharmacie remplacée par une fenêtre |
| Même salle de bain | klein 9B + plan | Très fidèle | Aucun visible |
| Chambre de musée (CC BY-SA 4.0) | klein 9B + plan | Fidèle : armoire, porte, lit | Alcôve du lit simplifiée |
| Chambre d'hôtel Lutetia (CC BY 2.0) | klein 4B | Demandes appliquées | Fenêtre ajoutée qui n'existait pas |
| Cuisine bleue et blanche (CC0) | klein 4B | Agencement gardé | Légère perte de netteté |
| Canapé couvert de vêtements, gros plan (domaine public) | klein 4B + plan | **Échec** : pièce entièrement inventée | Pas de désencombrement, cadrage trop serré |
| Évier en désordre, gros plan (domaine public) | klein 4B + plan | **Échec** : cuisine inventée | Idem |
| FLUX.2 dev sur les deux premières | dev + plan | **Échec** : redessine une autre pièce | Modèle écarté |

Le test « pièces entières en désordre » n'a pas pu tourner : part gratuite du jour épuisée.

## 4. Conclusion

La chaîne gratuite ne peut pas atteindre « 90 % de résultats notés 8/10 ou plus » : entrée limitée à 512 px, pas de désencombrement, pas de contrôle qualité.
La nouvelle architecture en 6 étapes du cahier des charges corrige les points 1 à 4, 6, 7, 9, 10, 12, 13 et 15. Elle demande des modèles payants (édition d'image et vision) : coût et accord à obtenir avant de l'activer (voir `docs/transfo-architecture.md`).
