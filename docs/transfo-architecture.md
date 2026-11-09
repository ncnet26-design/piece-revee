# Nouvelle transformation de pièce : architecture et coûts

Identifiants et prix lus le 9 nov. 2026 sur les pages publiques de fal.ai (robot `verifier-fal.yml`, journal GitHub Actions).
Rien n'est activé tant que le propriétaire n'a pas dit « oui » au budget.

## Modèles d'édition vérifiés sur fal.ai

| Rôle | Identifiant exact | Prix affiché | Remarques |
|---|---|---|---|
| Désencombrement + design (1er choix) | `fal-ai/nano-banana-pro/edit` | **0,15 $ / image** (1K ou 2K ; 4K plus cher) | Gemini 3 Pro Image ; la page indique aussi la version Nano Banana d'origine à 0,039 $ |
| Secours 1 | `fal-ai/bytedance/seedream/v4.5/edit` | **0,04 $ / image** | Jusqu'à 4 mégapixels, 10 images de référence |
| Secours 2 | `fal-ai/gpt-image-1.5/edit` | **0,05 $** (qualité moyenne, 1536×1024), **0,20 $** (haute) | « GPT Image 2 » : aucune page trouvée sur fal.ai (`fal-ai/gpt-image-1/edit-image` → 404) |
| Autre piste | `fal-ai/flux-2-pro/edit` | 0,03 $ le 1er mégapixel + 0,015 $ par mégapixel suivant | — |
| Autre piste | `fal-ai/flux-pro/kontext` | 0,04 $ / image | — |

Vision (analyse et contrôle qualité) : Gemini Flash avec la clé Google déjà en place (quelques millièmes de dollar par appel), ou Mistral Small gratuit chez Cloudflare (moins précis).

## Coût d'une transformation (6 étapes)

| Étape | Nano Banana Pro | Seedream 4.5 |
|---|---|---|
| 2. Analyse (vision) | ≈ 0,003 $ | ≈ 0,003 $ |
| 3. Désencombrement (si encombrée ou meublée) | 0,15 $ | 0,04 $ |
| 4. Design | 0,15 $ | 0,04 $ |
| 5. Contrôle qualité (vision) | ≈ 0,003 $ | ≈ 0,003 $ |
| Nouvel essai si note < 8 (≈ 1 fois sur 3, estimation) | + 0,05 $ en moyenne | + 0,013 $ |
| **Total moyen** | **≈ 0,36 $** (≈ 0,33 €) | **≈ 0,10 $** |
| Pire cas (2 essais ratés + secours) | ≈ 0,55 $ | ≈ 0,20 $ |

Pass Projet à 14,90 € pour 3 études : coût IA ≤ 1,65 $ dans le pire cas, marge préservée.

## Banc de test (20 photos × 3 styles = 60 transformations)

| Modèle principal | Coût estimé d'un passage complet |
|---|---|
| Nano Banana Pro | ≈ 22 $ |
| Seedream 4.5 | ≈ 6 $ |

Le banc est relancé avant chaque mise en ligne : prévoir ce coût à chaque fois, ou un banc réduit (5 photos × 1 style ≈ 2 $).

## Ce qu'il faut pour démarrer

1. Accord explicite du propriétaire sur : le modèle principal, la limite par transformation (proposée : 0,60 $), le plafond mensuel (actuel : 15 $ ; à revoir) et le coût du banc.
2. Un compte fal.ai créé par le propriétaire, avec du crédit prépayé, et sa clé enregistrée comme secret du service (`FAL_KEY`), jamais dans le code ni dans la conversation.
   Variante sans nouveau compte : Nano Banana Pro directement chez Google avec la clé Gemini existante (tarif Google à vérifier de la même façon).
3. Accès réseau du robot à fal.ai (déjà possible depuis GitHub Actions).

## Architecture (côté serveur, Cloudflare Worker + file de tâches)

1. Réception : JPEG/PNG/WebP/HEIC → JPEG, rotation EXIF appliquée puis métadonnées supprimées, 2048 px max, refus < 800 px, floue ou sans pièce (verdict de l'analyse).
2. Analyse (JSON strict validé) : type de pièce, angle et hauteur de vue, lumière, éléments fixes avec position, éléments mobiles, contraintes.
3. Désencombrement si nécessaire (consigne DECLUTTER du skill `transformation-piece`).
4. Design (consigne REDESIGN < 120 mots, construite depuis l'analyse, les signatures du style, le budget et 4 à 6 produits du catalogue).
5. Contrôle qualité : note sur 10 ; < 8 → nouvel essai avec le défaut cité ; 2 échecs → secours ; jamais de résultat < 8 sans message honnête.
6. Finition : agrandissement, AVIF + WebP, repérage des meubles → produits du catalogue dans le budget, curseur avant/après.

Tâche asynchrone suivie par étape (« Analyse de la pièce… », « Désencombrement… », « Création du design… », « Contrôle qualité… »), journal par transformation (modèles, consignes, notes, durée, coût), suppression des photos après 30 jours.
