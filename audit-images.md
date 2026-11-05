# Audit des images (2026-11-05)

Grille : `direction-artistique-images` (A publiable, B à améliorer, C à refaire). Seuil : 2000 px de large minimum.
Méthode : mesures automatiques (`scripts/audit-images.mjs`), puis examen visuel de chaque groupe sur planches-contact.

## Bilan
- 418 images au total, 111 font 2000 px ou plus.
- Hors sujet : 0 ; note C : 4 ; note B : 0 ; note A : 224.
- À supprimer : 0 tout de suite (hors sujet ou C), 6 quand leur remplaçant existera, 218 à garder, 190 fichiers techniques.
- Les liens « utilisé par » sont des fichiers source ; les textures 3D sont chargées par un chemin calculé, d'où « 0 » parfois.

## Détail
| Fichier | Utilisé par | Taille (px) | Poids | Design d'intérieur | Note | Raison | Action |
|---|---|---|---|---|---|---|---|
| `/apple-icon.png` | layout.tsx | 180×180 | 4 Ko | outil | — | icône / partage, technique | garder (technique) jusqu'au remplacement |
| `/editorial/ia/salon-boucle-noyer-1024.webp` | page.tsx, Photo.tsx | 1024×572 | 23 Ko | oui | A | image IA crédible, style lisible (étiquetée IA) | supprimer (< 2000 px) dès que le remplaçant existe |
| `/editorial/ia/salon-boucle-noyer-2400.webp` | page.tsx, Photo.tsx | 2400×1340 | 193 Ko | oui | A | image IA crédible, style lisible (étiquetée IA) | garder |
| `/editorial/ia/salon-boucle-noyer-640.webp` | page.tsx, Photo.tsx | 640×357 | 12 Ko | oui | A | image IA crédible, style lisible (étiquetée IA) | supprimer (< 2000 px) dès que le remplaçant existe |
| `/editorial/ia/salon-boucle-noyer.webp` | page.tsx, Photo.tsx | 1600×893 | 101 Ko | oui | A | image IA crédible, style lisible (étiquetée IA) | supprimer (< 2000 px) dès que le remplaçant existe |
| `/editorial/ia/salon-velours-chene-1024.webp` | page.tsx, photos-variantes.json | 1024×572 | 23 Ko | oui | A | image IA crédible, style lisible (étiquetée IA) | supprimer (< 2000 px) dès que le remplaçant existe |
| `/editorial/ia/salon-velours-chene-640.webp` | page.tsx, photos-variantes.json | 640×357 | 12 Ko | oui | A | image IA crédible, style lisible (étiquetée IA) | supprimer (< 2000 px) dès que le remplaçant existe |
| `/editorial/ia/salon-velours-chene.webp` | page.tsx, photos-variantes.json | 1600×893 | 82 Ko | oui | A | image IA crédible, style lisible (étiquetée IA) | supprimer (< 2000 px) dès que le remplaçant existe |
| `/icon-192.png` | layout.tsx, manifest.ts | 192×192 | 4 Ko | outil | — | icône / partage, technique | garder (technique) jusqu'au remplacement |
| `/icon-512.png` | layout.tsx, manifest.ts | 512×512 | 12 Ko | outil | — | icône / partage, technique | garder (technique) jusqu'au remplacement |
| `/icon.svg` | layout.tsx, manifest.ts | 64×64 | 0 Ko | outil | — | icône / partage, technique | garder (technique) jusqu'au remplacement |
| `/materiaux/bois-huile/ao.webp` | data/materials-pbr.json | 2048×2048 | 1721 Ko | oui | A | texture réelle Poly Haven 2K | garder |
| `/materiaux/bois-huile/basecolor.webp` | data/materials-pbr.json | 2048×2048 | 395 Ko | oui | A | texture réelle Poly Haven 2K | garder |
| `/materiaux/bois-huile/normal.webp` | data/materials-pbr.json | 2048×2048 | 189 Ko | oui | A | texture réelle Poly Haven 2K | garder |
| `/materiaux/bois-huile/roughness.webp` | data/materials-pbr.json | 2048×2048 | 345 Ko | oui | A | texture réelle Poly Haven 2K | garder |
| `/materiaux/boucle/ao.webp` | data/materials-pbr.json | 2048×2048 | 498 Ko | oui | A | texture réelle Poly Haven 2K | garder |
| `/materiaux/boucle/basecolor.webp` | data/materials-pbr.json | 2048×2048 | 322 Ko | oui | A | texture réelle Poly Haven 2K | garder |
| `/materiaux/boucle/displacement.webp` | data/materials-pbr.json | 2048×2048 | 196 Ko | oui | A | texture réelle Poly Haven 2K | garder |
| `/materiaux/boucle/metallic.webp` | data/materials-pbr.json | 2048×2048 | 24 Ko | oui | A | texture réelle Poly Haven 2K | garder |
| `/materiaux/boucle/normal.webp` | data/materials-pbr.json | 2048×2048 | 307 Ko | oui | A | texture réelle Poly Haven 2K | garder |
| `/materiaux/boucle/roughness.webp` | data/materials-pbr.json | 2048×2048 | 986 Ko | oui | A | texture réelle Poly Haven 2K | garder |
| `/materiaux/chene-fume/ao.webp` | data/materials-pbr.json | 2048×2048 | 789 Ko | oui | A | texture réelle Poly Haven 2K | garder |
| `/materiaux/chene-fume/basecolor.webp` | data/materials-pbr.json | 2048×2048 | 339 Ko | oui | A | texture réelle Poly Haven 2K | garder |
| `/materiaux/chene-fume/displacement.webp` | data/materials-pbr.json | 2048×2048 | 43 Ko | oui | A | texture réelle Poly Haven 2K | garder |
| `/materiaux/chene-fume/normal.webp` | data/materials-pbr.json | 2048×2048 | 97 Ko | oui | A | texture réelle Poly Haven 2K | garder |
| `/materiaux/chene-fume/roughness.webp` | data/materials-pbr.json | 2048×2048 | 1139 Ko | oui | A | texture réelle Poly Haven 2K | garder |
| `/materiaux/chene-naturel/ao.webp` | data/materials-pbr.json | 2048×2048 | 427 Ko | oui | A | texture réelle Poly Haven 2K | garder |
| `/materiaux/chene-naturel/basecolor.webp` | data/materials-pbr.json | 2048×2048 | 686 Ko | oui | A | texture réelle Poly Haven 2K | garder |
| `/materiaux/chene-naturel/displacement.webp` | data/materials-pbr.json | 2048×2048 | 8 Ko | oui | A | texture réelle Poly Haven 2K | garder |
| `/materiaux/chene-naturel/normal.webp` | data/materials-pbr.json | 2048×2048 | 435 Ko | oui | A | texture réelle Poly Haven 2K | garder |
| `/materiaux/chene-naturel/roughness.webp` | data/materials-pbr.json | 2048×2048 | 1808 Ko | oui | A | texture réelle Poly Haven 2K | garder |
| `/materiaux/enduit-chaux/ao.webp` | data/materials-pbr.json | 2048×2048 | 649 Ko | oui | A | texture réelle Poly Haven 2K | garder |
| `/materiaux/enduit-chaux/basecolor.webp` | data/materials-pbr.json | 2048×2048 | 1031 Ko | oui | A | texture réelle Poly Haven 2K | garder |
| `/materiaux/enduit-chaux/displacement.webp` | data/materials-pbr.json | 2048×2048 | 312 Ko | oui | A | texture réelle Poly Haven 2K | garder |
| `/materiaux/enduit-chaux/normal.webp` | data/materials-pbr.json | 2048×2048 | 1436 Ko | oui | A | texture réelle Poly Haven 2K | garder |
| `/materiaux/enduit-chaux/roughness.webp` | data/materials-pbr.json | 2048×2048 | 242 Ko | oui | A | texture réelle Poly Haven 2K | garder |
| `/materiaux/noyer-verni/ao.webp` | data/materials-pbr.json | 2048×2048 | 943 Ko | oui | A | texture réelle Poly Haven 2K | garder |
| `/materiaux/noyer-verni/basecolor.webp` | data/materials-pbr.json | 2048×2048 | 420 Ko | oui | A | texture réelle Poly Haven 2K | garder |
| `/materiaux/noyer-verni/displacement.webp` | data/materials-pbr.json | 2048×2048 | 27 Ko | oui | A | texture réelle Poly Haven 2K | garder |
| `/materiaux/noyer-verni/normal.webp` | data/materials-pbr.json | 2048×2048 | 196 Ko | oui | A | texture réelle Poly Haven 2K | garder |
| `/materiaux/noyer-verni/roughness.webp` | data/materials-pbr.json | 2048×2048 | 1262 Ko | oui | A | texture réelle Poly Haven 2K | garder |
| `/materiaux/parquet-chevron/ao.webp` | data/materials-pbr.json | 2048×2048 | 246 Ko | oui | A | texture réelle Poly Haven 2K | garder |
| `/materiaux/parquet-chevron/basecolor.webp` | data/materials-pbr.json | 2048×2048 | 941 Ko | oui | A | texture réelle Poly Haven 2K | garder |
| `/materiaux/parquet-chevron/displacement.webp` | data/materials-pbr.json | 2048×2048 | 160 Ko | oui | A | texture réelle Poly Haven 2K | garder |
| `/materiaux/parquet-chevron/normal.webp` | data/materials-pbr.json | 2048×2048 | 150 Ko | oui | A | texture réelle Poly Haven 2K | garder |
| `/materiaux/parquet-chevron/roughness.webp` | data/materials-pbr.json | 2048×2048 | 734 Ko | oui | A | texture réelle Poly Haven 2K | garder |
| `/materiaux/pierre-mate/ao.webp` | data/materials-pbr.json | 2048×2048 | 474 Ko | oui | A | texture réelle Poly Haven 2K | garder |
| `/materiaux/pierre-mate/basecolor.webp` | data/materials-pbr.json | 2048×2048 | 1119 Ko | oui | A | texture réelle Poly Haven 2K | garder |
| `/materiaux/pierre-mate/displacement.webp` | data/materials-pbr.json | 2048×2048 | 221 Ko | oui | A | texture réelle Poly Haven 2K | garder |
| `/materiaux/pierre-mate/normal.webp` | data/materials-pbr.json | 2048×2048 | 994 Ko | oui | A | texture réelle Poly Haven 2K | garder |
| `/materiaux/pierre-mate/roughness.webp` | data/materials-pbr.json | 2048×2048 | 730 Ko | oui | A | texture réelle Poly Haven 2K | garder |
| `/materiaux/tadelakt/ao.webp` | data/materials-pbr.json | 2048×2048 | 358 Ko | oui | A | texture réelle Poly Haven 2K | garder |
| `/materiaux/tadelakt/basecolor.webp` | data/materials-pbr.json | 2048×2048 | 416 Ko | oui | A | texture réelle Poly Haven 2K | garder |
| `/materiaux/tadelakt/displacement.webp` | data/materials-pbr.json | 2048×2048 | 644 Ko | oui | A | texture réelle Poly Haven 2K | garder |
| `/materiaux/tadelakt/normal.webp` | data/materials-pbr.json | 2048×2048 | 1439 Ko | oui | A | texture réelle Poly Haven 2K | garder |
| `/materiaux/tadelakt/roughness.webp` | data/materials-pbr.json | 2048×2048 | 148 Ko | oui | A | texture réelle Poly Haven 2K | garder |
| `/materiaux/terre-cuite/ao.webp` | data/materials-pbr.json | 2048×2048 | 882 Ko | oui | A | texture réelle Poly Haven 2K | garder |
| `/materiaux/terre-cuite/basecolor.webp` | data/materials-pbr.json | 2048×2048 | 357 Ko | oui | A | texture réelle Poly Haven 2K | garder |
| `/materiaux/terre-cuite/displacement.webp` | data/materials-pbr.json | 2048×2048 | 103 Ko | oui | A | texture réelle Poly Haven 2K | garder |
| `/materiaux/terre-cuite/normal.webp` | data/materials-pbr.json | 2048×2048 | 536 Ko | oui | A | texture réelle Poly Haven 2K | garder |
| `/materiaux/terre-cuite/roughness.webp` | data/materials-pbr.json | 2048×2048 | 988 Ko | oui | A | texture réelle Poly Haven 2K | garder |
| `/materiaux/travertin/ao.webp` | data/materials-pbr.json | 2048×2048 | 9 Ko | oui | A | texture réelle Poly Haven 2K | garder |
| `/materiaux/travertin/basecolor.webp` | data/materials-pbr.json | 2048×2048 | 395 Ko | oui | A | texture réelle Poly Haven 2K | garder |
| `/materiaux/travertin/displacement.webp` | data/materials-pbr.json | 2048×2048 | 8 Ko | oui | A | texture réelle Poly Haven 2K | garder |
| `/materiaux/travertin/normal.webp` | data/materials-pbr.json | 2048×2048 | 10 Ko | oui | A | texture réelle Poly Haven 2K | garder |
| `/materiaux/travertin/roughness.webp` | data/materials-pbr.json | 2048×2048 | 63 Ko | oui | A | texture réelle Poly Haven 2K | garder |
| `/matieres/ardoise/1280.avif` | — | 1280×1280 | 176 Ko | oui | A | texture réelle 4K (Poly Haven / ambientCG) ; les petites tailles sont ses versions web | garder |
| `/matieres/ardoise/1280.webp` | — | 1280×1280 | 276 Ko | oui | A | texture réelle 4K (Poly Haven / ambientCG) ; les petites tailles sont ses versions web | garder |
| `/matieres/ardoise/1920.avif` | — | 1920×1920 | 480 Ko | oui | A | texture réelle 4K (Poly Haven / ambientCG) ; les petites tailles sont ses versions web | garder |
| `/matieres/ardoise/1920.webp` | — | 1920×1920 | 721 Ko | oui | A | texture réelle 4K (Poly Haven / ambientCG) ; les petites tailles sont ses versions web | garder |
| `/matieres/ardoise/3840.avif` | — | 3840×3840 | 2238 Ko | oui | A | texture réelle 4K (Poly Haven / ambientCG) ; les petites tailles sont ses versions web | garder |
| `/matieres/ardoise/3840.webp` | — | 3840×3840 | 3298 Ko | oui | A | texture réelle 4K (Poly Haven / ambientCG) ; les petites tailles sont ses versions web | garder |
| `/matieres/ardoise/640.avif` | — | 640×640 | 37 Ko | oui | A | texture réelle 4K (Poly Haven / ambientCG) ; les petites tailles sont ses versions web | garder |
| `/matieres/ardoise/640.webp` | — | 640×640 | 60 Ko | oui | A | texture réelle 4K (Poly Haven / ambientCG) ; les petites tailles sont ses versions web | garder |
| `/matieres/ardoise/original-4k.webp` | — | 4096×4096 | 6664 Ko | oui | A | texture réelle 4K (Poly Haven / ambientCG) ; les petites tailles sont ses versions web | garder |
| `/matieres/beton-cire/1280.avif` | — | 1280×1280 | 30 Ko | oui | A | texture réelle 4K (Poly Haven / ambientCG) ; les petites tailles sont ses versions web | garder |
| `/matieres/beton-cire/1280.webp` | — | 1280×1280 | 76 Ko | oui | A | texture réelle 4K (Poly Haven / ambientCG) ; les petites tailles sont ses versions web | garder |
| `/matieres/beton-cire/1920.avif` | — | 1920×1920 | 97 Ko | oui | A | texture réelle 4K (Poly Haven / ambientCG) ; les petites tailles sont ses versions web | garder |
| `/matieres/beton-cire/1920.webp` | — | 1920×1920 | 234 Ko | oui | A | texture réelle 4K (Poly Haven / ambientCG) ; les petites tailles sont ses versions web | garder |
| `/matieres/beton-cire/3840.avif` | — | 3840×3840 | 496 Ko | oui | A | texture réelle 4K (Poly Haven / ambientCG) ; les petites tailles sont ses versions web | garder |
| `/matieres/beton-cire/3840.webp` | — | 3840×3840 | 943 Ko | oui | A | texture réelle 4K (Poly Haven / ambientCG) ; les petites tailles sont ses versions web | garder |
| `/matieres/beton-cire/640.avif` | — | 640×640 | 6 Ko | oui | A | texture réelle 4K (Poly Haven / ambientCG) ; les petites tailles sont ses versions web | garder |
| `/matieres/beton-cire/640.webp` | — | 640×640 | 15 Ko | oui | A | texture réelle 4K (Poly Haven / ambientCG) ; les petites tailles sont ses versions web | garder |
| `/matieres/beton-cire/original-4k.webp` | — | 4096×4096 | 3180 Ko | oui | A | texture réelle 4K (Poly Haven / ambientCG) ; les petites tailles sont ses versions web | garder |
| `/matieres/bouclette/1280.avif` | data/inspiration-bank.json | 1280×1261 | 73 Ko | oui | A | texture réelle 4K (Poly Haven / ambientCG) ; les petites tailles sont ses versions web | garder |
| `/matieres/bouclette/1280.webp` | data/inspiration-bank.json | 1280×1261 | 128 Ko | oui | A | texture réelle 4K (Poly Haven / ambientCG) ; les petites tailles sont ses versions web | garder |
| `/matieres/bouclette/1920.avif` | — | 1920×1892 | 118 Ko | oui | A | texture réelle 4K (Poly Haven / ambientCG) ; les petites tailles sont ses versions web | garder |
| `/matieres/bouclette/1920.webp` | — | 1920×1892 | 217 Ko | oui | A | texture réelle 4K (Poly Haven / ambientCG) ; les petites tailles sont ses versions web | garder |
| `/matieres/bouclette/3840.avif` | — | 3840×3784 | 264 Ko | oui | A | texture réelle 4K (Poly Haven / ambientCG) ; les petites tailles sont ses versions web | garder |
| `/matieres/bouclette/3840.webp` | — | 3840×3784 | 542 Ko | oui | A | texture réelle 4K (Poly Haven / ambientCG) ; les petites tailles sont ses versions web | garder |
| `/matieres/bouclette/640.avif` | — | 640×631 | 30 Ko | oui | A | texture réelle 4K (Poly Haven / ambientCG) ; les petites tailles sont ses versions web | garder |
| `/matieres/bouclette/640.webp` | — | 640×631 | 50 Ko | oui | A | texture réelle 4K (Poly Haven / ambientCG) ; les petites tailles sont ses versions web | garder |
| `/matieres/bouclette/original-4k.webp` | — | 4096×4036 | 1707 Ko | oui | A | texture réelle 4K (Poly Haven / ambientCG) ; les petites tailles sont ses versions web | garder |
| `/matieres/brique/1280.avif` | — | 1280×1280 | 104 Ko | oui | A | texture réelle 4K (Poly Haven / ambientCG) ; les petites tailles sont ses versions web | garder |
| `/matieres/brique/1280.webp` | — | 1280×1280 | 163 Ko | oui | A | texture réelle 4K (Poly Haven / ambientCG) ; les petites tailles sont ses versions web | garder |
| `/matieres/brique/1920.avif` | — | 1920×1920 | 250 Ko | oui | A | texture réelle 4K (Poly Haven / ambientCG) ; les petites tailles sont ses versions web | garder |
| `/matieres/brique/1920.webp` | — | 1920×1920 | 397 Ko | oui | A | texture réelle 4K (Poly Haven / ambientCG) ; les petites tailles sont ses versions web | garder |
| `/matieres/brique/3840.avif` | — | 3840×3840 | 1169 Ko | oui | A | texture réelle 4K (Poly Haven / ambientCG) ; les petites tailles sont ses versions web | garder |
| `/matieres/brique/3840.webp` | — | 3840×3840 | 1914 Ko | oui | A | texture réelle 4K (Poly Haven / ambientCG) ; les petites tailles sont ses versions web | garder |
| `/matieres/brique/640.avif` | — | 640×640 | 31 Ko | oui | A | texture réelle 4K (Poly Haven / ambientCG) ; les petites tailles sont ses versions web | garder |
| `/matieres/brique/640.webp` | — | 640×640 | 43 Ko | oui | A | texture réelle 4K (Poly Haven / ambientCG) ; les petites tailles sont ses versions web | garder |
| `/matieres/brique/original-4k.webp` | — | 4096×4096 | 5452 Ko | oui | A | texture réelle 4K (Poly Haven / ambientCG) ; les petites tailles sont ses versions web | garder |
| `/matieres/chene-fume/1280.avif` | — | 1280×1280 | 36 Ko | oui | A | texture réelle 4K (Poly Haven / ambientCG) ; les petites tailles sont ses versions web | garder |
| `/matieres/chene-fume/1280.webp` | — | 1280×1280 | 77 Ko | oui | A | texture réelle 4K (Poly Haven / ambientCG) ; les petites tailles sont ses versions web | garder |
| `/matieres/chene-fume/1920.avif` | — | 1920×1920 | 76 Ko | oui | A | texture réelle 4K (Poly Haven / ambientCG) ; les petites tailles sont ses versions web | garder |
| `/matieres/chene-fume/1920.webp` | — | 1920×1920 | 170 Ko | oui | A | texture réelle 4K (Poly Haven / ambientCG) ; les petites tailles sont ses versions web | garder |
| `/matieres/chene-fume/3840.avif` | — | 3840×3840 | 225 Ko | oui | A | texture réelle 4K (Poly Haven / ambientCG) ; les petites tailles sont ses versions web | garder |
| `/matieres/chene-fume/3840.webp` | — | 3840×3840 | 489 Ko | oui | A | texture réelle 4K (Poly Haven / ambientCG) ; les petites tailles sont ses versions web | garder |
| `/matieres/chene-fume/640.avif` | — | 640×640 | 10 Ko | oui | A | texture réelle 4K (Poly Haven / ambientCG) ; les petites tailles sont ses versions web | garder |
| `/matieres/chene-fume/640.webp` | — | 640×640 | 22 Ko | oui | A | texture réelle 4K (Poly Haven / ambientCG) ; les petites tailles sont ses versions web | garder |
| `/matieres/chene-fume/original-4k.webp` | — | 4096×4096 | 1340 Ko | oui | A | texture réelle 4K (Poly Haven / ambientCG) ; les petites tailles sont ses versions web | garder |
| `/matieres/chene-huile/1280.avif` | data/inspiration-bank.json | 1280×1280 | 65 Ko | oui | A | texture réelle 4K (Poly Haven / ambientCG) ; les petites tailles sont ses versions web | garder |
| `/matieres/chene-huile/1280.webp` | data/inspiration-bank.json | 1280×1280 | 121 Ko | oui | A | texture réelle 4K (Poly Haven / ambientCG) ; les petites tailles sont ses versions web | garder |
| `/matieres/chene-huile/1920.avif` | — | 1920×1920 | 151 Ko | oui | A | texture réelle 4K (Poly Haven / ambientCG) ; les petites tailles sont ses versions web | garder |
| `/matieres/chene-huile/1920.webp` | — | 1920×1920 | 305 Ko | oui | A | texture réelle 4K (Poly Haven / ambientCG) ; les petites tailles sont ses versions web | garder |
| `/matieres/chene-huile/3840.avif` | — | 3840×3840 | 1104 Ko | oui | A | texture réelle 4K (Poly Haven / ambientCG) ; les petites tailles sont ses versions web | garder |
| `/matieres/chene-huile/3840.webp` | — | 3840×3840 | 2036 Ko | oui | A | texture réelle 4K (Poly Haven / ambientCG) ; les petites tailles sont ses versions web | garder |
| `/matieres/chene-huile/640.avif` | — | 640×640 | 18 Ko | oui | A | texture réelle 4K (Poly Haven / ambientCG) ; les petites tailles sont ses versions web | garder |
| `/matieres/chene-huile/640.webp` | — | 640×640 | 31 Ko | oui | A | texture réelle 4K (Poly Haven / ambientCG) ; les petites tailles sont ses versions web | garder |
| `/matieres/chene-huile/original-4k.webp` | — | 4096×4096 | 5416 Ko | oui | A | texture réelle 4K (Poly Haven / ambientCG) ; les petites tailles sont ses versions web | garder |
| `/matieres/cuir/1280.avif` | — | 1280×1280 | 116 Ko | oui | A | texture réelle 4K (Poly Haven / ambientCG) ; les petites tailles sont ses versions web | garder |
| `/matieres/cuir/1280.webp` | — | 1280×1280 | 210 Ko | oui | A | texture réelle 4K (Poly Haven / ambientCG) ; les petites tailles sont ses versions web | garder |
| `/matieres/cuir/1920.avif` | — | 1920×1920 | 309 Ko | oui | A | texture réelle 4K (Poly Haven / ambientCG) ; les petites tailles sont ses versions web | garder |
| `/matieres/cuir/1920.webp` | — | 1920×1920 | 523 Ko | oui | A | texture réelle 4K (Poly Haven / ambientCG) ; les petites tailles sont ses versions web | garder |
| `/matieres/cuir/3840.avif` | — | 3840×3840 | 1093 Ko | oui | A | texture réelle 4K (Poly Haven / ambientCG) ; les petites tailles sont ses versions web | garder |
| `/matieres/cuir/3840.webp` | — | 3840×3840 | 1722 Ko | oui | A | texture réelle 4K (Poly Haven / ambientCG) ; les petites tailles sont ses versions web | garder |
| `/matieres/cuir/640.avif` | boutique/Boutique.tsx | 640×640 | 21 Ko | oui | A | texture réelle 4K (Poly Haven / ambientCG) ; les petites tailles sont ses versions web | garder |
| `/matieres/cuir/640.webp` | boutique/Boutique.tsx | 640×640 | 45 Ko | oui | A | texture réelle 4K (Poly Haven / ambientCG) ; les petites tailles sont ses versions web | garder |
| `/matieres/cuir/original-4k.webp` | — | 4096×4096 | 4322 Ko | oui | A | texture réelle 4K (Poly Haven / ambientCG) ; les petites tailles sont ses versions web | garder |
| `/matieres/enduit-chaux/1280.avif` | data/inspiration-bank.json | 1280×1280 | 370 Ko | oui | A | texture réelle 4K (Poly Haven / ambientCG) ; les petites tailles sont ses versions web | garder |
| `/matieres/enduit-chaux/1280.webp` | data/inspiration-bank.json | 1280×1280 | 477 Ko | oui | A | texture réelle 4K (Poly Haven / ambientCG) ; les petites tailles sont ses versions web | garder |
| `/matieres/enduit-chaux/1920.avif` | — | 1920×1920 | 840 Ko | oui | A | texture réelle 4K (Poly Haven / ambientCG) ; les petites tailles sont ses versions web | garder |
| `/matieres/enduit-chaux/1920.webp` | — | 1920×1920 | 1103 Ko | oui | A | texture réelle 4K (Poly Haven / ambientCG) ; les petites tailles sont ses versions web | garder |
| `/matieres/enduit-chaux/3840.avif` | — | 3840×3840 | 2108 Ko | oui | A | texture réelle 4K (Poly Haven / ambientCG) ; les petites tailles sont ses versions web | garder |
| `/matieres/enduit-chaux/3840.webp` | — | 3840×3840 | 3323 Ko | oui | A | texture réelle 4K (Poly Haven / ambientCG) ; les petites tailles sont ses versions web | garder |
| `/matieres/enduit-chaux/640.avif` | boutique/Boutique.tsx | 640×640 | 76 Ko | oui | A | texture réelle 4K (Poly Haven / ambientCG) ; les petites tailles sont ses versions web | garder |
| `/matieres/enduit-chaux/640.webp` | boutique/Boutique.tsx | 640×640 | 103 Ko | oui | A | texture réelle 4K (Poly Haven / ambientCG) ; les petites tailles sont ses versions web | garder |
| `/matieres/enduit-chaux/original-4k.webp` | — | 4096×4096 | 6157 Ko | oui | A | texture réelle 4K (Poly Haven / ambientCG) ; les petites tailles sont ses versions web | garder |
| `/matieres/lin-lave/1280.avif` | data/inspiration-bank.json | 1280×1283 | 144 Ko | oui | A | texture réelle 4K (Poly Haven / ambientCG) ; les petites tailles sont ses versions web | garder |
| `/matieres/lin-lave/1280.webp` | data/inspiration-bank.json | 1280×1283 | 343 Ko | oui | A | texture réelle 4K (Poly Haven / ambientCG) ; les petites tailles sont ses versions web | garder |
| `/matieres/lin-lave/1920.avif` | — | 1920×1924 | 380 Ko | oui | A | texture réelle 4K (Poly Haven / ambientCG) ; les petites tailles sont ses versions web | garder |
| `/matieres/lin-lave/1920.webp` | — | 1920×1924 | 803 Ko | oui | A | texture réelle 4K (Poly Haven / ambientCG) ; les petites tailles sont ses versions web | garder |
| `/matieres/lin-lave/3840.avif` | — | 3840×3848 | 1086 Ko | oui | A | texture réelle 4K (Poly Haven / ambientCG) ; les petites tailles sont ses versions web | garder |
| `/matieres/lin-lave/3840.webp` | — | 3840×3848 | 2198 Ko | oui | A | texture réelle 4K (Poly Haven / ambientCG) ; les petites tailles sont ses versions web | garder |
| `/matieres/lin-lave/640.avif` | boutique/Boutique.tsx | 640×641 | 12 Ko | oui | A | texture réelle 4K (Poly Haven / ambientCG) ; les petites tailles sont ses versions web | garder |
| `/matieres/lin-lave/640.webp` | boutique/Boutique.tsx | 640×641 | 38 Ko | oui | A | texture réelle 4K (Poly Haven / ambientCG) ; les petites tailles sont ses versions web | garder |
| `/matieres/lin-lave/original-4k.webp` | — | 4096×4105 | 5147 Ko | oui | A | texture réelle 4K (Poly Haven / ambientCG) ; les petites tailles sont ses versions web | garder |
| `/matieres/marbre-carrare/1280.avif` | data/inspiration-bank.json | 1280×1280 | 58 Ko | oui | A | texture réelle 4K (Poly Haven / ambientCG) ; les petites tailles sont ses versions web | garder |
| `/matieres/marbre-carrare/1280.webp` | data/inspiration-bank.json | 1280×1280 | 95 Ko | oui | A | texture réelle 4K (Poly Haven / ambientCG) ; les petites tailles sont ses versions web | garder |
| `/matieres/marbre-carrare/1920.avif` | — | 1920×1920 | 110 Ko | oui | A | texture réelle 4K (Poly Haven / ambientCG) ; les petites tailles sont ses versions web | garder |
| `/matieres/marbre-carrare/1920.webp` | — | 1920×1920 | 181 Ko | oui | A | texture réelle 4K (Poly Haven / ambientCG) ; les petites tailles sont ses versions web | garder |
| `/matieres/marbre-carrare/3840.avif` | — | 3840×3840 | 272 Ko | oui | A | texture réelle 4K (Poly Haven / ambientCG) ; les petites tailles sont ses versions web | garder |
| `/matieres/marbre-carrare/3840.webp` | — | 3840×3840 | 470 Ko | oui | A | texture réelle 4K (Poly Haven / ambientCG) ; les petites tailles sont ses versions web | garder |
| `/matieres/marbre-carrare/640.avif` | — | 640×640 | 18 Ko | oui | A | texture réelle 4K (Poly Haven / ambientCG) ; les petites tailles sont ses versions web | garder |
| `/matieres/marbre-carrare/640.webp` | — | 640×640 | 29 Ko | oui | A | texture réelle 4K (Poly Haven / ambientCG) ; les petites tailles sont ses versions web | garder |
| `/matieres/marbre-carrare/original-4k.webp` | — | 4096×4096 | 1185 Ko | oui | A | texture réelle 4K (Poly Haven / ambientCG) ; les petites tailles sont ses versions web | garder |
| `/matieres/noyer/1280.avif` | data/inspiration-bank.json | 1280×1280 | 27 Ko | oui | A | texture réelle 4K (Poly Haven / ambientCG) ; les petites tailles sont ses versions web | garder |
| `/matieres/noyer/1280.webp` | data/inspiration-bank.json | 1280×1280 | 62 Ko | oui | A | texture réelle 4K (Poly Haven / ambientCG) ; les petites tailles sont ses versions web | garder |
| `/matieres/noyer/1920.avif` | — | 1920×1920 | 53 Ko | oui | A | texture réelle 4K (Poly Haven / ambientCG) ; les petites tailles sont ses versions web | garder |
| `/matieres/noyer/1920.webp` | — | 1920×1920 | 132 Ko | oui | A | texture réelle 4K (Poly Haven / ambientCG) ; les petites tailles sont ses versions web | garder |
| `/matieres/noyer/3840.avif` | — | 3840×3840 | 202 Ko | oui | A | texture réelle 4K (Poly Haven / ambientCG) ; les petites tailles sont ses versions web | garder |
| `/matieres/noyer/3840.webp` | — | 3840×3840 | 509 Ko | oui | A | texture réelle 4K (Poly Haven / ambientCG) ; les petites tailles sont ses versions web | garder |
| `/matieres/noyer/640.avif` | boutique/Boutique.tsx | 640×640 | 8 Ko | oui | A | texture réelle 4K (Poly Haven / ambientCG) ; les petites tailles sont ses versions web | garder |
| `/matieres/noyer/640.webp` | boutique/Boutique.tsx | 640×640 | 16 Ko | oui | A | texture réelle 4K (Poly Haven / ambientCG) ; les petites tailles sont ses versions web | garder |
| `/matieres/noyer/original-4k.webp` | — | 4096×4096 | 2099 Ko | oui | A | texture réelle 4K (Poly Haven / ambientCG) ; les petites tailles sont ses versions web | garder |
| `/matieres/parquet-point-de-hongrie/1280.avif` | — | 1280×1280 | 133 Ko | oui | A | texture réelle 4K (Poly Haven / ambientCG) ; les petites tailles sont ses versions web | garder |
| `/matieres/parquet-point-de-hongrie/1280.webp` | — | 1280×1280 | 229 Ko | oui | A | texture réelle 4K (Poly Haven / ambientCG) ; les petites tailles sont ses versions web | garder |
| `/matieres/parquet-point-de-hongrie/1920.avif` | — | 1920×1920 | 345 Ko | oui | A | texture réelle 4K (Poly Haven / ambientCG) ; les petites tailles sont ses versions web | garder |
| `/matieres/parquet-point-de-hongrie/1920.webp` | — | 1920×1920 | 592 Ko | oui | A | texture réelle 4K (Poly Haven / ambientCG) ; les petites tailles sont ses versions web | garder |
| `/matieres/parquet-point-de-hongrie/3840.avif` | — | 3840×3840 | 1298 Ko | oui | A | texture réelle 4K (Poly Haven / ambientCG) ; les petites tailles sont ses versions web | garder |
| `/matieres/parquet-point-de-hongrie/3840.webp` | — | 3840×3840 | 2279 Ko | oui | A | texture réelle 4K (Poly Haven / ambientCG) ; les petites tailles sont ses versions web | garder |
| `/matieres/parquet-point-de-hongrie/640.avif` | boutique/Boutique.tsx | 640×640 | 27 Ko | oui | A | texture réelle 4K (Poly Haven / ambientCG) ; les petites tailles sont ses versions web | garder |
| `/matieres/parquet-point-de-hongrie/640.webp` | boutique/Boutique.tsx | 640×640 | 48 Ko | oui | A | texture réelle 4K (Poly Haven / ambientCG) ; les petites tailles sont ses versions web | garder |
| `/matieres/parquet-point-de-hongrie/original-4k.webp` | — | 4096×4096 | 5505 Ko | oui | A | texture réelle 4K (Poly Haven / ambientCG) ; les petites tailles sont ses versions web | garder |
| `/matieres/pierre-calcaire/1280.avif` | data/inspiration-bank.json | 1280×1280 | 87 Ko | oui | A | texture réelle 4K (Poly Haven / ambientCG) ; les petites tailles sont ses versions web | garder |
| `/matieres/pierre-calcaire/1280.webp` | data/inspiration-bank.json | 1280×1280 | 149 Ko | oui | A | texture réelle 4K (Poly Haven / ambientCG) ; les petites tailles sont ses versions web | garder |
| `/matieres/pierre-calcaire/1920.avif` | — | 1920×1920 | 231 Ko | oui | A | texture réelle 4K (Poly Haven / ambientCG) ; les petites tailles sont ses versions web | garder |
| `/matieres/pierre-calcaire/1920.webp` | — | 1920×1920 | 390 Ko | oui | A | texture réelle 4K (Poly Haven / ambientCG) ; les petites tailles sont ses versions web | garder |
| `/matieres/pierre-calcaire/3840.avif` | — | 3840×3840 | 950 Ko | oui | A | texture réelle 4K (Poly Haven / ambientCG) ; les petites tailles sont ses versions web | garder |
| `/matieres/pierre-calcaire/3840.webp` | — | 3840×3840 | 1554 Ko | oui | A | texture réelle 4K (Poly Haven / ambientCG) ; les petites tailles sont ses versions web | garder |
| `/matieres/pierre-calcaire/640.avif` | boutique/Boutique.tsx | 640×640 | 21 Ko | oui | A | texture réelle 4K (Poly Haven / ambientCG) ; les petites tailles sont ses versions web | garder |
| `/matieres/pierre-calcaire/640.webp` | boutique/Boutique.tsx | 640×640 | 33 Ko | oui | A | texture réelle 4K (Poly Haven / ambientCG) ; les petites tailles sont ses versions web | garder |
| `/matieres/pierre-calcaire/original-4k.webp` | — | 4096×4096 | 4225 Ko | oui | A | texture réelle 4K (Poly Haven / ambientCG) ; les petites tailles sont ses versions web | garder |
| `/matieres/rotin/1280.avif` | — | 1280×1280 | 51 Ko | oui | A | texture réelle 4K (Poly Haven / ambientCG) ; les petites tailles sont ses versions web | garder |
| `/matieres/rotin/1280.webp` | — | 1280×1280 | 77 Ko | oui | A | texture réelle 4K (Poly Haven / ambientCG) ; les petites tailles sont ses versions web | garder |
| `/matieres/rotin/1920.avif` | — | 1920×1920 | 86 Ko | oui | A | texture réelle 4K (Poly Haven / ambientCG) ; les petites tailles sont ses versions web | garder |
| `/matieres/rotin/1920.webp` | — | 1920×1920 | 134 Ko | oui | A | texture réelle 4K (Poly Haven / ambientCG) ; les petites tailles sont ses versions web | garder |
| `/matieres/rotin/3840.avif` | — | 3840×3840 | 257 Ko | oui | A | texture réelle 4K (Poly Haven / ambientCG) ; les petites tailles sont ses versions web | garder |
| `/matieres/rotin/3840.webp` | — | 3840×3840 | 467 Ko | oui | A | texture réelle 4K (Poly Haven / ambientCG) ; les petites tailles sont ses versions web | garder |
| `/matieres/rotin/640.avif` | — | 640×640 | 23 Ko | oui | A | texture réelle 4K (Poly Haven / ambientCG) ; les petites tailles sont ses versions web | garder |
| `/matieres/rotin/640.webp` | — | 640×640 | 30 Ko | oui | A | texture réelle 4K (Poly Haven / ambientCG) ; les petites tailles sont ses versions web | garder |
| `/matieres/rotin/original-4k.webp` | — | 4096×4096 | 1423 Ko | oui | A | texture réelle 4K (Poly Haven / ambientCG) ; les petites tailles sont ses versions web | garder |
| `/matieres/terrazzo/1280.avif` | — | 1280×1280 | 103 Ko | oui | A | texture réelle 4K (Poly Haven / ambientCG) ; les petites tailles sont ses versions web | garder |
| `/matieres/terrazzo/1280.webp` | — | 1280×1280 | 138 Ko | oui | A | texture réelle 4K (Poly Haven / ambientCG) ; les petites tailles sont ses versions web | garder |
| `/matieres/terrazzo/1920.avif` | — | 1920×1920 | 164 Ko | oui | A | texture réelle 4K (Poly Haven / ambientCG) ; les petites tailles sont ses versions web | garder |
| `/matieres/terrazzo/1920.webp` | — | 1920×1920 | 235 Ko | oui | A | texture réelle 4K (Poly Haven / ambientCG) ; les petites tailles sont ses versions web | garder |
| `/matieres/terrazzo/3840.avif` | — | 3840×3840 | 372 Ko | oui | A | texture réelle 4K (Poly Haven / ambientCG) ; les petites tailles sont ses versions web | garder |
| `/matieres/terrazzo/3840.webp` | — | 3840×3840 | 577 Ko | oui | A | texture réelle 4K (Poly Haven / ambientCG) ; les petites tailles sont ses versions web | garder |
| `/matieres/terrazzo/640.avif` | — | 640×640 | 46 Ko | oui | A | texture réelle 4K (Poly Haven / ambientCG) ; les petites tailles sont ses versions web | garder |
| `/matieres/terrazzo/640.webp` | — | 640×640 | 58 Ko | oui | A | texture réelle 4K (Poly Haven / ambientCG) ; les petites tailles sont ses versions web | garder |
| `/matieres/terrazzo/original-4k.webp` | — | 4096×4096 | 1374 Ko | oui | A | texture réelle 4K (Poly Haven / ambientCG) ; les petites tailles sont ses versions web | garder |
| `/matieres/terre-cuite/1280.avif` | — | 1280×1280 | 156 Ko | oui | A | texture réelle 4K (Poly Haven / ambientCG) ; les petites tailles sont ses versions web | garder |
| `/matieres/terre-cuite/1280.webp` | — | 1280×1280 | 271 Ko | oui | A | texture réelle 4K (Poly Haven / ambientCG) ; les petites tailles sont ses versions web | garder |
| `/matieres/terre-cuite/1920.avif` | — | 1920×1920 | 452 Ko | oui | A | texture réelle 4K (Poly Haven / ambientCG) ; les petites tailles sont ses versions web | garder |
| `/matieres/terre-cuite/1920.webp` | — | 1920×1920 | 723 Ko | oui | A | texture réelle 4K (Poly Haven / ambientCG) ; les petites tailles sont ses versions web | garder |
| `/matieres/terre-cuite/3840.avif` | — | 3840×3840 | 1588 Ko | oui | A | texture réelle 4K (Poly Haven / ambientCG) ; les petites tailles sont ses versions web | garder |
| `/matieres/terre-cuite/3840.webp` | — | 3840×3840 | 2614 Ko | oui | A | texture réelle 4K (Poly Haven / ambientCG) ; les petites tailles sont ses versions web | garder |
| `/matieres/terre-cuite/640.avif` | boutique/Boutique.tsx | 640×640 | 23 Ko | oui | A | texture réelle 4K (Poly Haven / ambientCG) ; les petites tailles sont ses versions web | garder |
| `/matieres/terre-cuite/640.webp` | boutique/Boutique.tsx | 640×640 | 46 Ko | oui | A | texture réelle 4K (Poly Haven / ambientCG) ; les petites tailles sont ses versions web | garder |
| `/matieres/terre-cuite/original-4k.webp` | — | 4096×4096 | 5798 Ko | oui | A | texture réelle 4K (Poly Haven / ambientCG) ; les petites tailles sont ses versions web | garder |
| `/matieres/travertin/1280.avif` | data/inspiration-bank.json | 1280×1280 | 105 Ko | oui | A | texture réelle 4K (Poly Haven / ambientCG) ; les petites tailles sont ses versions web | garder |
| `/matieres/travertin/1280.webp` | data/inspiration-bank.json | 1280×1280 | 185 Ko | oui | A | texture réelle 4K (Poly Haven / ambientCG) ; les petites tailles sont ses versions web | garder |
| `/matieres/travertin/1920.avif` | — | 1920×1920 | 228 Ko | oui | A | texture réelle 4K (Poly Haven / ambientCG) ; les petites tailles sont ses versions web | garder |
| `/matieres/travertin/1920.webp` | — | 1920×1920 | 410 Ko | oui | A | texture réelle 4K (Poly Haven / ambientCG) ; les petites tailles sont ses versions web | garder |
| `/matieres/travertin/3840.avif` | — | 3840×3840 | 749 Ko | oui | A | texture réelle 4K (Poly Haven / ambientCG) ; les petites tailles sont ses versions web | garder |
| `/matieres/travertin/3840.webp` | — | 3840×3840 | 1367 Ko | oui | A | texture réelle 4K (Poly Haven / ambientCG) ; les petites tailles sont ses versions web | garder |
| `/matieres/travertin/640.avif` | — | 640×640 | 29 Ko | oui | A | texture réelle 4K (Poly Haven / ambientCG) ; les petites tailles sont ses versions web | garder |
| `/matieres/travertin/640.webp` | — | 640×640 | 50 Ko | oui | A | texture réelle 4K (Poly Haven / ambientCG) ; les petites tailles sont ses versions web | garder |
| `/matieres/travertin/original-4k.webp` | — | 4096×4096 | 3736 Ko | oui | A | texture réelle 4K (Poly Haven / ambientCG) ; les petites tailles sont ses versions web | garder |
| `/matieres/velours/1280.avif` | data/inspiration-bank.json | 1280×1231 | 112 Ko | oui | A | texture réelle 4K (Poly Haven / ambientCG) ; les petites tailles sont ses versions web | garder |
| `/matieres/velours/1280.webp` | data/inspiration-bank.json | 1280×1231 | 206 Ko | oui | A | texture réelle 4K (Poly Haven / ambientCG) ; les petites tailles sont ses versions web | garder |
| `/matieres/velours/1920.avif` | — | 1920×1847 | 289 Ko | oui | A | texture réelle 4K (Poly Haven / ambientCG) ; les petites tailles sont ses versions web | garder |
| `/matieres/velours/1920.webp` | — | 1920×1847 | 553 Ko | oui | A | texture réelle 4K (Poly Haven / ambientCG) ; les petites tailles sont ses versions web | garder |
| `/matieres/velours/3840.avif` | — | 3840×3695 | 1059 Ko | oui | A | texture réelle 4K (Poly Haven / ambientCG) ; les petites tailles sont ses versions web | garder |
| `/matieres/velours/3840.webp` | — | 3840×3695 | 1930 Ko | oui | A | texture réelle 4K (Poly Haven / ambientCG) ; les petites tailles sont ses versions web | garder |
| `/matieres/velours/640.avif` | — | 640×616 | 3 Ko | oui | A | texture réelle 4K (Poly Haven / ambientCG) ; les petites tailles sont ses versions web | garder |
| `/matieres/velours/640.webp` | — | 640×616 | 24 Ko | oui | A | texture réelle 4K (Poly Haven / ambientCG) ; les petites tailles sont ses versions web | garder |
| `/matieres/velours/original-4k.webp` | — | 4096×3941 | 5079 Ko | oui | A | texture réelle 4K (Poly Haven / ambientCG) ; les petites tailles sont ses versions web | garder |
| `/models/thumbs/ArmChair_01.webp` | — | 240×240 | 8 Ko | oui | — | vignette technique du Studio 3D (240 px) | garder (technique) jusqu'au remplacement |
| `/models/thumbs/Chandelier_01.webp` | — | 240×240 | 9 Ko | oui | — | vignette technique du Studio 3D (240 px) | garder (technique) jusqu'au remplacement |
| `/models/thumbs/Chandelier_02.webp` | — | 240×240 | 6 Ko | oui | — | vignette technique du Studio 3D (240 px) | garder (technique) jusqu'au remplacement |
| `/models/thumbs/ClassicConsole_01.webp` | — | 240×240 | 13 Ko | oui | — | vignette technique du Studio 3D (240 px) | garder (technique) jusqu'au remplacement |
| `/models/thumbs/CoffeeTable_01.webp` | — | 240×240 | 4 Ko | oui | — | vignette technique du Studio 3D (240 px) | garder (technique) jusqu'au remplacement |
| `/models/thumbs/GreenChair_01.webp` | — | 240×240 | 8 Ko | oui | — | vignette technique du Studio 3D (240 px) | garder (technique) jusqu'au remplacement |
| `/models/thumbs/Ottoman_01.webp` | — | 240×240 | 7 Ko | oui | — | vignette technique du Studio 3D (240 px) | garder (technique) jusqu'au remplacement |
| `/models/thumbs/Sofa_01.webp` | — | 240×240 | 7 Ko | oui | — | vignette technique du Studio 3D (240 px) | garder (technique) jusqu'au remplacement |
| `/models/thumbs/antique_ceramic_vase_01.webp` | — | 240×240 | 9 Ko | oui | — | vignette technique du Studio 3D (240 px) | garder (technique) jusqu'au remplacement |
| `/models/thumbs/bar_chair_round_01.webp` | — | 240×240 | 6 Ko | oui | — | vignette technique du Studio 3D (240 px) | garder (technique) jusqu'au remplacement |
| `/models/thumbs/book_encyclopedia_set_01.webp` | — | 240×240 | 11 Ko | oui | — | vignette technique du Studio 3D (240 px) | garder (technique) jusqu'au remplacement |
| `/models/thumbs/brass_candleholders.webp` | — | 240×240 | 10 Ko | oui | — | vignette technique du Studio 3D (240 px) | garder (technique) jusqu'au remplacement |
| `/models/thumbs/brass_vase_01.webp` | — | 240×240 | 5 Ko | oui | — | vignette technique du Studio 3D (240 px) | garder (technique) jusqu'au remplacement |
| `/models/thumbs/brass_vase_02.webp` | — | 240×240 | 5 Ko | oui | — | vignette technique du Studio 3D (240 px) | garder (technique) jusqu'au remplacement |
| `/models/thumbs/brass_vase_03.webp` | — | 240×240 | 7 Ko | oui | — | vignette technique du Studio 3D (240 px) | garder (technique) jusqu'au remplacement |
| `/models/thumbs/brass_vase_04.webp` | — | 240×240 | 5 Ko | oui | — | vignette technique du Studio 3D (240 px) | garder (technique) jusqu'au remplacement |
| `/models/thumbs/carved_wooden_plate.webp` | — | 240×240 | 4 Ko | oui | — | vignette technique du Studio 3D (240 px) | garder (technique) jusqu'au remplacement |
| `/models/thumbs/ceramic_pot.webp` | — | 240×240 | 6 Ko | oui | — | vignette technique du Studio 3D (240 px) | garder (technique) jusqu'au remplacement |
| `/models/thumbs/ceramic_vase_01.webp` | — | 240×240 | 3 Ko | oui | — | vignette technique du Studio 3D (240 px) | garder (technique) jusqu'au remplacement |
| `/models/thumbs/ceramic_vase_02.webp` | — | 240×240 | 3 Ko | oui | — | vignette technique du Studio 3D (240 px) | garder (technique) jusqu'au remplacement |
| `/models/thumbs/ceramic_vase_03.webp` | — | 240×240 | 3 Ko | oui | — | vignette technique du Studio 3D (240 px) | garder (technique) jusqu'au remplacement |
| `/models/thumbs/ceramic_vase_04.webp` | — | 240×240 | 3 Ko | oui | — | vignette technique du Studio 3D (240 px) | garder (technique) jusqu'au remplacement |
| `/models/thumbs/chinese_armchair.webp` | — | 240×240 | 8 Ko | oui | — | vignette technique du Studio 3D (240 px) | garder (technique) jusqu'au remplacement |
| `/models/thumbs/chinese_console_table.webp` | — | 240×240 | 6 Ko | oui | — | vignette technique du Studio 3D (240 px) | garder (technique) jusqu'au remplacement |
| `/models/thumbs/chinese_screen_panels.webp` | — | 240×240 | 8 Ko | oui | — | vignette technique du Studio 3D (240 px) | garder (technique) jusqu'au remplacement |
| `/models/thumbs/chinese_stool.webp` | — | 240×240 | 6 Ko | oui | — | vignette technique du Studio 3D (240 px) | garder (technique) jusqu'au remplacement |
| `/models/thumbs/chinese_tea_table.webp` | — | 240×240 | 6 Ko | oui | — | vignette technique du Studio 3D (240 px) | garder (technique) jusqu'au remplacement |
| `/models/thumbs/coffee_table_round_01.webp` | — | 240×240 | 4 Ko | oui | — | vignette technique du Studio 3D (240 px) | garder (technique) jusqu'au remplacement |
| `/models/thumbs/dead_quiver_branch_01.webp` | — | 240×240 | 4 Ko | oui | — | vignette technique du Studio 3D (240 px) | garder (technique) jusqu'au remplacement |
| `/models/thumbs/dining_chair_02.webp` | — | 240×240 | 4 Ko | oui | — | vignette technique du Studio 3D (240 px) | garder (technique) jusqu'au remplacement |
| `/models/thumbs/dry_branches_medium_01.webp` | — | 240×240 | 4 Ko | oui | — | vignette technique du Studio 3D (240 px) | garder (technique) jusqu'au remplacement |
| `/models/thumbs/dry_quiver_leaf.webp` | — | 240×240 | 6 Ko | oui | — | vignette technique du Studio 3D (240 px) | garder (technique) jusqu'au remplacement |
| `/models/thumbs/gallinera_chair.webp` | — | 240×240 | 7 Ko | oui | — | vignette technique du Studio 3D (240 px) | garder (technique) jusqu'au remplacement |
| `/models/thumbs/gallinera_table.webp` | — | 240×240 | 6 Ko | oui | — | vignette technique du Studio 3D (240 px) | garder (technique) jusqu'au remplacement |
| `/models/thumbs/lambis_shell.webp` | — | 240×240 | 7 Ko | oui | — | vignette technique du Studio 3D (240 px) | garder (technique) jusqu'au remplacement |
| `/models/thumbs/marble_bust_01.webp` | — | 240×240 | 6 Ko | oui | — | vignette technique du Studio 3D (240 px) | garder (technique) jusqu'au remplacement |
| `/models/thumbs/mid_century_lounge_chair.webp` | — | 240×240 | 7 Ko | oui | — | vignette technique du Studio 3D (240 px) | garder (technique) jusqu'au remplacement |
| `/models/thumbs/modern_arm_chair_01.webp` | — | 240×240 | 9 Ko | oui | — | vignette technique du Studio 3D (240 px) | garder (technique) jusqu'au remplacement |
| `/models/thumbs/modern_ceiling_lamp_01.webp` | — | 240×240 | 4 Ko | oui | — | vignette technique du Studio 3D (240 px) | garder (technique) jusqu'au remplacement |
| `/models/thumbs/modern_coffee_table_01.webp` | — | 240×240 | 6 Ko | oui | — | vignette technique du Studio 3D (240 px) | garder (technique) jusqu'au remplacement |
| `/models/thumbs/modern_coffee_table_02.webp` | — | 240×240 | 6 Ko | oui | — | vignette technique du Studio 3D (240 px) | garder (technique) jusqu'au remplacement |
| `/models/thumbs/modern_wooden_cabinet.webp` | — | 240×240 | 6 Ko | oui | — | vignette technique du Studio 3D (240 px) | garder (technique) jusqu'au remplacement |
| `/models/thumbs/ornate_mirror_01.webp` | — | 240×240 | 6 Ko | oui | — | vignette technique du Studio 3D (240 px) | garder (technique) jusqu'au remplacement |
| `/models/thumbs/planter_pot_clay.webp` | — | 240×240 | 5 Ko | oui | — | vignette technique du Studio 3D (240 px) | garder (technique) jusqu'au remplacement |
| `/models/thumbs/potted_plant_01.webp` | — | 240×240 | 13 Ko | oui | — | vignette technique du Studio 3D (240 px) | garder (technique) jusqu'au remplacement |
| `/models/thumbs/potted_plant_02.webp` | — | 240×240 | 13 Ko | oui | — | vignette technique du Studio 3D (240 px) | garder (technique) jusqu'au remplacement |
| `/models/thumbs/potted_plant_04.webp` | — | 240×240 | 10 Ko | oui | — | vignette technique du Studio 3D (240 px) | garder (technique) jusqu'au remplacement |
| `/models/thumbs/round_wooden_table_01.webp` | — | 240×240 | 6 Ko | oui | — | vignette technique du Studio 3D (240 px) | garder (technique) jusqu'au remplacement |
| `/models/thumbs/round_wooden_table_02.webp` | — | 240×240 | 4 Ko | oui | — | vignette technique du Studio 3D (240 px) | garder (technique) jusqu'au remplacement |
| `/models/thumbs/side_table_tall_01.webp` | — | 240×240 | 4 Ko | oui | — | vignette technique du Studio 3D (240 px) | garder (technique) jusqu'au remplacement |
| `/models/thumbs/sofa_02.webp` | — | 240×240 | 6 Ko | oui | — | vignette technique du Studio 3D (240 px) | garder (technique) jusqu'au remplacement |
| `/models/thumbs/throw_pillows_01.webp` | — | 240×240 | 7 Ko | oui | — | vignette technique du Studio 3D (240 px) | garder (technique) jusqu'au remplacement |
| `/models/thumbs/wall_clock.webp` | — | 240×240 | 6 Ko | oui | — | vignette technique du Studio 3D (240 px) | garder (technique) jusqu'au remplacement |
| `/models/thumbs/wf_anisotropy_barn_lamp.webp` | — | 240×240 | 6 Ko | oui | — | vignette technique du Studio 3D (240 px) | garder (technique) jusqu'au remplacement |
| `/models/thumbs/wf_diffuse_transmission_plant.webp` | — | 240×240 | 7 Ko | oui | — | vignette technique du Studio 3D (240 px) | garder (technique) jusqu'au remplacement |
| `/models/thumbs/wf_glam_velvet_sofa.webp` | — | 240×240 | 5 Ko | oui | — | vignette technique du Studio 3D (240 px) | garder (technique) jusqu'au remplacement |
| `/models/thumbs/wf_glass_vase_flowers.webp` | — | 240×240 | 11 Ko | oui | — | vignette technique du Studio 3D (240 px) | garder (technique) jusqu'au remplacement |
| `/models/thumbs/wf_iridescence_lamp.webp` | — | 240×240 | 4 Ko | oui | — | vignette technique du Studio 3D (240 px) | garder (technique) jusqu'au remplacement |
| `/models/thumbs/wf_sheen_chair.webp` | — | 240×240 | 6 Ko | oui | — | vignette technique du Studio 3D (240 px) | garder (technique) jusqu'au remplacement |
| `/models/thumbs/wf_specular_silk_pouf.webp` | — | 240×240 | 5 Ko | oui | — | vignette technique du Studio 3D (240 px) | garder (technique) jusqu'au remplacement |
| `/models/thumbs/wicker_basket_01.webp` | — | 240×240 | 13 Ko | oui | — | vignette technique du Studio 3D (240 px) | garder (technique) jusqu'au remplacement |
| `/models/thumbs/wicker_basket_02.webp` | — | 240×240 | 8 Ko | oui | — | vignette technique du Studio 3D (240 px) | garder (technique) jusqu'au remplacement |
| `/models/thumbs/wooden_bowl_02.webp` | — | 240×240 | 7 Ko | oui | — | vignette technique du Studio 3D (240 px) | garder (technique) jusqu'au remplacement |
| `/models/thumbs/wooden_candlestick.webp` | — | 240×240 | 4 Ko | oui | — | vignette technique du Studio 3D (240 px) | garder (technique) jusqu'au remplacement |
| `/og.png` | catalogue/page.tsx, connexion/page.tsx | 1200×630 | 58 Ko | outil | — | icône / partage, technique | garder (technique) jusqu'au remplacement |
| `/textures/m-ardoise/diff.webp` | data/materials-premium.json | 1024×1024 | 195 Ko | oui | — | carte de texture 3D 1024 px (Poly Haven) : à remplacer par la 4K (étape 3) | garder (technique) jusqu'au remplacement |
| `/textures/m-ardoise/nor.webp` | data/materials-premium.json | 1024×1024 | 224 Ko | oui | — | carte de texture 3D 1024 px (Poly Haven) : à remplacer par la 4K (étape 3) | garder (technique) jusqu'au remplacement |
| `/textures/m-ardoise/rough.webp` | data/materials-premium.json | 1024×1024 | 76 Ko | oui | — | carte de texture 3D 1024 px (Poly Haven) : à remplacer par la 4K (étape 3) | garder (technique) jusqu'au remplacement |
| `/textures/m-bambou/diff.webp` | — | 1024×1024 | 102 Ko | oui | — | carte de texture 3D 1024 px (Poly Haven) : à remplacer par la 4K (étape 3) | garder (technique) jusqu'au remplacement |
| `/textures/m-bambou/nor.webp` | — | 1024×1024 | 98 Ko | oui | — | carte de texture 3D 1024 px (Poly Haven) : à remplacer par la 4K (étape 3) | garder (technique) jusqu'au remplacement |
| `/textures/m-bambou/rough.webp` | — | 1024×1024 | 86 Ko | oui | — | carte de texture 3D 1024 px (Poly Haven) : à remplacer par la 4K (étape 3) | garder (technique) jusqu'au remplacement |
| `/textures/m-beton/diff.webp` | — | 1024×1024 | 43 Ko | oui | — | carte de texture 3D 1024 px (Poly Haven) : à remplacer par la 4K (étape 3) | garder (technique) jusqu'au remplacement |
| `/textures/m-beton/nor.webp` | — | 1024×1024 | 70 Ko | oui | — | carte de texture 3D 1024 px (Poly Haven) : à remplacer par la 4K (étape 3) | garder (technique) jusqu'au remplacement |
| `/textures/m-beton/rough.webp` | — | 1024×1024 | 152 Ko | oui | — | carte de texture 3D 1024 px (Poly Haven) : à remplacer par la 4K (étape 3) | garder (technique) jusqu'au remplacement |
| `/textures/m-bouleau/diff.webp` | — | 1024×1024 | 254 Ko | oui | — | carte de texture 3D 1024 px (Poly Haven) : à remplacer par la 4K (étape 3) | garder (technique) jusqu'au remplacement |
| `/textures/m-bouleau/nor.webp` | — | 1024×1024 | 106 Ko | oui | — | carte de texture 3D 1024 px (Poly Haven) : à remplacer par la 4K (étape 3) | garder (technique) jusqu'au remplacement |
| `/textures/m-bouleau/rough.webp` | — | 1024×1024 | 284 Ko | oui | — | carte de texture 3D 1024 px (Poly Haven) : à remplacer par la 4K (étape 3) | garder (technique) jusqu'au remplacement |
| `/textures/m-brique/diff.webp` | — | 1024×1024 | 117 Ko | oui | — | carte de texture 3D 1024 px (Poly Haven) : à remplacer par la 4K (étape 3) | garder (technique) jusqu'au remplacement |
| `/textures/m-brique/nor.webp` | — | 1024×1024 | 346 Ko | oui | — | carte de texture 3D 1024 px (Poly Haven) : à remplacer par la 4K (étape 3) | garder (technique) jusqu'au remplacement |
| `/textures/m-brique/rough.webp` | — | 1024×1024 | 14 Ko | oui | — | carte de texture 3D 1024 px (Poly Haven) : à remplacer par la 4K (étape 3) | garder (technique) jusqu'au remplacement |
| `/textures/m-chaux/diff.webp` | data/materials-premium.json | 1024×1024 | 228 Ko | oui | — | carte de texture 3D 1024 px (Poly Haven) : à remplacer par la 4K (étape 3) | garder (technique) jusqu'au remplacement |
| `/textures/m-chaux/nor.webp` | data/materials-premium.json | 1024×1024 | 212 Ko | oui | — | carte de texture 3D 1024 px (Poly Haven) : à remplacer par la 4K (étape 3) | garder (technique) jusqu'au remplacement |
| `/textures/m-chaux/rough.webp` | data/materials-premium.json | 1024×1024 | 133 Ko | oui | — | carte de texture 3D 1024 px (Poly Haven) : à remplacer par la 4K (étape 3) | garder (technique) jusqu'au remplacement |
| `/textures/m-chene/diff.webp` | data/materials-premium.json | 1024×1024 | 162 Ko | oui | — | carte de texture 3D 1024 px (Poly Haven) : à remplacer par la 4K (étape 3) | garder (technique) jusqu'au remplacement |
| `/textures/m-chene/nor.webp` | data/materials-premium.json | 1024×1024 | 19 Ko | oui | — | carte de texture 3D 1024 px (Poly Haven) : à remplacer par la 4K (étape 3) | garder (technique) jusqu'au remplacement |
| `/textures/m-chene/rough.webp` | data/materials-premium.json | 1024×1024 | 100 Ko | oui | — | carte de texture 3D 1024 px (Poly Haven) : à remplacer par la 4K (étape 3) | garder (technique) jusqu'au remplacement |
| `/textures/m-chenefume/diff.webp` | data/materials-premium.json | 1024×1024 | 123 Ko | oui | — | carte de texture 3D 1024 px (Poly Haven) : à remplacer par la 4K (étape 3) | garder (technique) jusqu'au remplacement |
| `/textures/m-chenefume/nor.webp` | data/materials-premium.json | 1024×1024 | 18 Ko | oui | — | carte de texture 3D 1024 px (Poly Haven) : à remplacer par la 4K (étape 3) | garder (technique) jusqu'au remplacement |
| `/textures/m-chenefume/rough.webp` | data/materials-premium.json | 1024×1024 | 153 Ko | oui | — | carte de texture 3D 1024 px (Poly Haven) : à remplacer par la 4K (étape 3) | garder (technique) jusqu'au remplacement |
| `/textures/m-ciment/diff.webp` | — | 1024×1024 | 241 Ko | oui | — | carte de texture 3D 1024 px (Poly Haven) : à remplacer par la 4K (étape 3) | garder (technique) jusqu'au remplacement |
| `/textures/m-ciment/nor.webp` | — | 1024×1024 | 28 Ko | oui | — | carte de texture 3D 1024 px (Poly Haven) : à remplacer par la 4K (étape 3) | garder (technique) jusqu'au remplacement |
| `/textures/m-ciment/rough.webp` | — | 1024×1024 | 265 Ko | oui | — | carte de texture 3D 1024 px (Poly Haven) : à remplacer par la 4K (étape 3) | garder (technique) jusqu'au remplacement |
| `/textures/m-composite/diff.webp` | — | 1024×1024 | 185 Ko | oui | — | carte de texture 3D 1024 px (Poly Haven) : à remplacer par la 4K (étape 3) | garder (technique) jusqu'au remplacement |
| `/textures/m-composite/nor.webp` | — | 1024×1024 | 161 Ko | oui | — | carte de texture 3D 1024 px (Poly Haven) : à remplacer par la 4K (étape 3) | garder (technique) jusqu'au remplacement |
| `/textures/m-composite/rough.webp` | — | 1024×1024 | 28 Ko | oui | — | carte de texture 3D 1024 px (Poly Haven) : à remplacer par la 4K (étape 3) | garder (technique) jusqu'au remplacement |
| `/textures/m-corten/diff.webp` | — | 1024×1024 | 220 Ko | oui | — | carte de texture 3D 1024 px (Poly Haven) : à remplacer par la 4K (étape 3) | garder (technique) jusqu'au remplacement |
| `/textures/m-corten/nor.webp` | — | 1024×1024 | 230 Ko | oui | — | carte de texture 3D 1024 px (Poly Haven) : à remplacer par la 4K (étape 3) | garder (technique) jusqu'au remplacement |
| `/textures/m-corten/rough.webp` | — | 1024×1024 | 235 Ko | oui | — | carte de texture 3D 1024 px (Poly Haven) : à remplacer par la 4K (étape 3) | garder (technique) jusqu'au remplacement |
| `/textures/m-cuir/nor.webp` | — | 1024×1024 | 339 Ko | oui | — | carte de texture 3D 1024 px (Poly Haven) : à remplacer par la 4K (étape 3) | garder (technique) jusqu'au remplacement |
| `/textures/m-cuir/rough.webp` | — | 1024×1024 | 375 Ko | oui | — | carte de texture 3D 1024 px (Poly Haven) : à remplacer par la 4K (étape 3) | garder (technique) jusqu'au remplacement |
| `/textures/m-feutre/nor.webp` | — | 1024×1024 | 316 Ko | oui | — | carte de texture 3D 1024 px (Poly Haven) : à remplacer par la 4K (étape 3) | garder (technique) jusqu'au remplacement |
| `/textures/m-feutre/rough.webp` | — | 1024×1024 | 299 Ko | oui | — | carte de texture 3D 1024 px (Poly Haven) : à remplacer par la 4K (étape 3) | garder (technique) jusqu'au remplacement |
| `/textures/m-gravier/diff.webp` | — | 1024×1024 | 341 Ko | oui | — | carte de texture 3D 1024 px (Poly Haven) : à remplacer par la 4K (étape 3) | garder (technique) jusqu'au remplacement |
| `/textures/m-gravier/nor.webp` | — | 1024×1024 | 510 Ko | oui | — | carte de texture 3D 1024 px (Poly Haven) : à remplacer par la 4K (étape 3) | garder (technique) jusqu'au remplacement |
| `/textures/m-gravier/rough.webp` | — | 1024×1024 | 294 Ko | oui | — | carte de texture 3D 1024 px (Poly Haven) : à remplacer par la 4K (étape 3) | garder (technique) jusqu'au remplacement |
| `/textures/m-gres/diff.webp` | data/materials-premium.json | 1024×1024 | 50 Ko | oui | — | carte de texture 3D 1024 px (Poly Haven) : à remplacer par la 4K (étape 3) | garder (technique) jusqu'au remplacement |
| `/textures/m-gres/nor.webp` | data/materials-premium.json | 1024×1024 | 63 Ko | oui | — | carte de texture 3D 1024 px (Poly Haven) : à remplacer par la 4K (étape 3) | garder (technique) jusqu'au remplacement |
| `/textures/m-gres/rough.webp` | data/materials-premium.json | 1024×1024 | 195 Ko | oui | — | carte de texture 3D 1024 px (Poly Haven) : à remplacer par la 4K (étape 3) | garder (technique) jusqu'au remplacement |
| `/textures/m-jute/diff.webp` | — | 1024×1024 | 258 Ko | oui | — | carte de texture 3D 1024 px (Poly Haven) : à remplacer par la 4K (étape 3) | garder (technique) jusqu'au remplacement |
| `/textures/m-jute/nor.webp` | — | 1024×1024 | 291 Ko | oui | — | carte de texture 3D 1024 px (Poly Haven) : à remplacer par la 4K (étape 3) | garder (technique) jusqu'au remplacement |
| `/textures/m-jute/rough.webp` | — | 1024×1024 | 358 Ko | oui | — | carte de texture 3D 1024 px (Poly Haven) : à remplacer par la 4K (étape 3) | garder (technique) jusqu'au remplacement |
| `/textures/m-lin/diff.webp` | data/materials-premium.json | 1024×1024 | 229 Ko | oui | — | carte de texture 3D 1024 px (Poly Haven) : à remplacer par la 4K (étape 3) | garder (technique) jusqu'au remplacement |
| `/textures/m-lin/nor.webp` | data/materials-premium.json | 1024×1024 | 294 Ko | oui | — | carte de texture 3D 1024 px (Poly Haven) : à remplacer par la 4K (étape 3) | garder (technique) jusqu'au remplacement |
| `/textures/m-lin/rough.webp` | data/materials-premium.json | 1024×1024 | 479 Ko | oui | — | carte de texture 3D 1024 px (Poly Haven) : à remplacer par la 4K (étape 3) | garder (technique) jusqu'au remplacement |
| `/textures/m-metro/diff.webp` | — | 1024×1024 | 71 Ko | oui | — | carte de texture 3D 1024 px (Poly Haven) : à remplacer par la 4K (étape 3) | garder (technique) jusqu'au remplacement |
| `/textures/m-metro/nor.webp` | — | 1024×1024 | 112 Ko | oui | — | carte de texture 3D 1024 px (Poly Haven) : à remplacer par la 4K (étape 3) | garder (technique) jusqu'au remplacement |
| `/textures/m-metro/rough.webp` | — | 1024×1024 | 82 Ko | oui | — | carte de texture 3D 1024 px (Poly Haven) : à remplacer par la 4K (étape 3) | garder (technique) jusqu'au remplacement |
| `/textures/m-noyer/diff.webp` | data/materials-premium.json | 1024×1024 | 76 Ko | oui | — | carte de texture 3D 1024 px (Poly Haven) : à remplacer par la 4K (étape 3) | garder (technique) jusqu'au remplacement |
| `/textures/m-noyer/nor.webp` | data/materials-premium.json | 1024×1024 | 14 Ko | oui | — | carte de texture 3D 1024 px (Poly Haven) : à remplacer par la 4K (étape 3) | garder (technique) jusqu'au remplacement |
| `/textures/m-noyer/rough.webp` | data/materials-premium.json | 1024×1024 | 280 Ko | oui | — | carte de texture 3D 1024 px (Poly Haven) : à remplacer par la 4K (étape 3) | garder (technique) jusqu'au remplacement |
| `/textures/m-pierre-seche/diff.webp` | — | 1024×1024 | 191 Ko | oui | — | carte de texture 3D 1024 px (Poly Haven) : à remplacer par la 4K (étape 3) | garder (technique) jusqu'au remplacement |
| `/textures/m-pierre-seche/nor.webp` | — | 1024×1024 | 374 Ko | oui | — | carte de texture 3D 1024 px (Poly Haven) : à remplacer par la 4K (étape 3) | garder (technique) jusqu'au remplacement |
| `/textures/m-pierre-seche/rough.webp` | — | 1024×1024 | 20 Ko | oui | — | carte de texture 3D 1024 px (Poly Haven) : à remplacer par la 4K (étape 3) | garder (technique) jusqu'au remplacement |
| `/textures/m-pin/diff.webp` | — | 1024×1024 | 66 Ko | oui | — | carte de texture 3D 1024 px (Poly Haven) : à remplacer par la 4K (étape 3) | garder (technique) jusqu'au remplacement |
| `/textures/m-pin/nor.webp` | — | 1024×1024 | 103 Ko | oui | — | carte de texture 3D 1024 px (Poly Haven) : à remplacer par la 4K (étape 3) | garder (technique) jusqu'au remplacement |
| `/textures/m-pin/rough.webp` | — | 1024×1024 | 17 Ko | oui | — | carte de texture 3D 1024 px (Poly Haven) : à remplacer par la 4K (étape 3) | garder (technique) jusqu'au remplacement |
| `/textures/m-stratifie/diff.webp` | — | 1024×1024 | 113 Ko | oui | — | carte de texture 3D 1024 px (Poly Haven) : à remplacer par la 4K (étape 3) | garder (technique) jusqu'au remplacement |
| `/textures/m-stratifie/nor.webp` | — | 1024×1024 | 18 Ko | oui | — | carte de texture 3D 1024 px (Poly Haven) : à remplacer par la 4K (étape 3) | garder (technique) jusqu'au remplacement |
| `/textures/m-stratifie/rough.webp` | — | 1024×1024 | 22 Ko | oui | — | carte de texture 3D 1024 px (Poly Haven) : à remplacer par la 4K (étape 3) | garder (technique) jusqu'au remplacement |
| `/textures/m-tadelakt/diff.webp` | data/materials-premium.json | 1024×1024 | 57 Ko | oui | — | carte de texture 3D 1024 px (Poly Haven) : à remplacer par la 4K (étape 3) | garder (technique) jusqu'au remplacement |
| `/textures/m-tadelakt/nor.webp` | data/materials-premium.json | 1024×1024 | 274 Ko | oui | — | carte de texture 3D 1024 px (Poly Haven) : à remplacer par la 4K (étape 3) | garder (technique) jusqu'au remplacement |
| `/textures/m-tadelakt/rough.webp` | data/materials-premium.json | 1024×1024 | 26 Ko | oui | — | carte de texture 3D 1024 px (Poly Haven) : à remplacer par la 4K (étape 3) | garder (technique) jusqu'au remplacement |
| `/textures/m-teck/diff.webp` | — | 1024×1024 | 206 Ko | oui | — | carte de texture 3D 1024 px (Poly Haven) : à remplacer par la 4K (étape 3) | garder (technique) jusqu'au remplacement |
| `/textures/m-teck/nor.webp` | — | 1024×1024 | 103 Ko | oui | — | carte de texture 3D 1024 px (Poly Haven) : à remplacer par la 4K (étape 3) | garder (technique) jusqu'au remplacement |
| `/textures/m-teck/rough.webp` | — | 1024×1024 | 224 Ko | oui | — | carte de texture 3D 1024 px (Poly Haven) : à remplacer par la 4K (étape 3) | garder (technique) jusqu'au remplacement |
| `/textures/m-terrazzo/diff.webp` | data/materials-premium.json | 1024×1024 | 353 Ko | oui | — | carte de texture 3D 1024 px (Poly Haven) : à remplacer par la 4K (étape 3) | garder (technique) jusqu'au remplacement |
| `/textures/m-terrazzo/nor.webp` | data/materials-premium.json | 1024×1024 | 3 Ko | oui | — | carte de texture 3D 1024 px (Poly Haven) : à remplacer par la 4K (étape 3) | garder (technique) jusqu'au remplacement |
| `/textures/m-terrazzo/rough.webp` | data/materials-premium.json | 1024×1024 | 71 Ko | oui | — | carte de texture 3D 1024 px (Poly Haven) : à remplacer par la 4K (étape 3) | garder (technique) jusqu'au remplacement |
| `/textures/m-tomette/diff.webp` | — | 1024×1024 | 285 Ko | oui | — | carte de texture 3D 1024 px (Poly Haven) : à remplacer par la 4K (étape 3) | garder (technique) jusqu'au remplacement |
| `/textures/m-tomette/nor.webp` | — | 1024×1024 | 233 Ko | oui | — | carte de texture 3D 1024 px (Poly Haven) : à remplacer par la 4K (étape 3) | garder (technique) jusqu'au remplacement |
| `/textures/m-tomette/rough.webp` | — | 1024×1024 | 274 Ko | oui | — | carte de texture 3D 1024 px (Poly Haven) : à remplacer par la 4K (étape 3) | garder (technique) jusqu'au remplacement |
| `/textures/m-travertin/diff.webp` | — | 1024×1024 | 57 Ko | oui | — | carte de texture 3D 1024 px (Poly Haven) : à remplacer par la 4K (étape 3) | garder (technique) jusqu'au remplacement |
| `/textures/m-travertin/nor.webp` | — | 1024×1024 | 8 Ko | oui | — | carte de texture 3D 1024 px (Poly Haven) : à remplacer par la 4K (étape 3) | garder (technique) jusqu'au remplacement |
| `/textures/m-travertin/rough.webp` | — | 1024×1024 | 21 Ko | oui | — | carte de texture 3D 1024 px (Poly Haven) : à remplacer par la 4K (étape 3) | garder (technique) jusqu'au remplacement |
| `/textures/m-velours/diff.webp` | data/materials-premium.json | 1024×1024 | 111 Ko | oui | — | carte de texture 3D 1024 px (Poly Haven) : à remplacer par la 4K (étape 3) | garder (technique) jusqu'au remplacement |
| `/textures/m-velours/nor.webp` | data/materials-premium.json | 1024×1024 | 110 Ko | oui | — | carte de texture 3D 1024 px (Poly Haven) : à remplacer par la 4K (étape 3) | garder (technique) jusqu'au remplacement |
| `/textures/m-velours/rough.webp` | data/materials-premium.json | 1024×1024 | 394 Ko | oui | — | carte de texture 3D 1024 px (Poly Haven) : à remplacer par la 4K (étape 3) | garder (technique) jusqu'au remplacement |
| `/textures/tx-beton/diff.webp` | data/materials-premium.json | 1024×1024 | 105 Ko | oui | — | carte de texture 3D 1024 px (Poly Haven) : à remplacer par la 4K (étape 3) | garder (technique) jusqu'au remplacement |
| `/textures/tx-beton/nor.webp` | data/materials-premium.json | 1024×1024 | 44 Ko | oui | — | carte de texture 3D 1024 px (Poly Haven) : à remplacer par la 4K (étape 3) | garder (technique) jusqu'au remplacement |
| `/textures/tx-beton/rough.webp` | data/materials-premium.json | 1024×1024 | 9 Ko | oui | — | carte de texture 3D 1024 px (Poly Haven) : à remplacer par la 4K (étape 3) | garder (technique) jusqu'au remplacement |
| `/textures/tx-bois-fin/diff.webp` | data/materials-premium.json | 1024×1024 | 84 Ko | oui | — | carte de texture 3D 1024 px (Poly Haven) : à remplacer par la 4K (étape 3) | garder (technique) jusqu'au remplacement |
| `/textures/tx-bois-fin/nor.webp` | data/materials-premium.json | 1024×1024 | 29 Ko | oui | — | carte de texture 3D 1024 px (Poly Haven) : à remplacer par la 4K (étape 3) | garder (technique) jusqu'au remplacement |
| `/textures/tx-bois-fin/rough.webp` | data/materials-premium.json | 1024×1024 | 70 Ko | oui | — | carte de texture 3D 1024 px (Poly Haven) : à remplacer par la 4K (étape 3) | garder (technique) jusqu'au remplacement |
| `/textures/tx-bouclette/diff.webp` | data/materials-premium.json | 1024×1024 | 113 Ko | oui | — | carte de texture 3D 1024 px (Poly Haven) : à remplacer par la 4K (étape 3) | garder (technique) jusqu'au remplacement |
| `/textures/tx-bouclette/nor.webp` | data/materials-premium.json | 1024×1024 | 98 Ko | oui | — | carte de texture 3D 1024 px (Poly Haven) : à remplacer par la 4K (étape 3) | garder (technique) jusqu'au remplacement |
| `/textures/tx-bouclette/rough.webp` | data/materials-premium.json | 1024×1024 | 277 Ko | oui | — | carte de texture 3D 1024 px (Poly Haven) : à remplacer par la 4K (étape 3) | garder (technique) jusqu'au remplacement |
| `/textures/tx-chene/diff.webp` | data/materials-premium.json | 1024×1024 | 103 Ko | oui | — | carte de texture 3D 1024 px (Poly Haven) : à remplacer par la 4K (étape 3) | garder (technique) jusqu'au remplacement |
| `/textures/tx-chene/nor.webp` | data/materials-premium.json | 1024×1024 | 44 Ko | oui | — | carte de texture 3D 1024 px (Poly Haven) : à remplacer par la 4K (étape 3) | garder (technique) jusqu'au remplacement |
| `/textures/tx-chene/rough.webp` | data/materials-premium.json | 1024×1024 | 344 Ko | oui | — | carte de texture 3D 1024 px (Poly Haven) : à remplacer par la 4K (étape 3) | garder (technique) jusqu'au remplacement |
| `/textures/tx-chine/diff.webp` | — | 1024×1024 | 389 Ko | oui | — | carte de texture 3D 1024 px (Poly Haven) : à remplacer par la 4K (étape 3) | garder (technique) jusqu'au remplacement |
| `/textures/tx-chine/nor.webp` | — | 1024×1024 | 326 Ko | oui | — | carte de texture 3D 1024 px (Poly Haven) : à remplacer par la 4K (étape 3) | garder (technique) jusqu'au remplacement |
| `/textures/tx-chine/rough.webp` | — | 1024×1024 | 397 Ko | oui | — | carte de texture 3D 1024 px (Poly Haven) : à remplacer par la 4K (étape 3) | garder (technique) jusqu'au remplacement |
| `/textures/tx-cotele/diff.webp` | — | 1024×1024 | 208 Ko | oui | — | carte de texture 3D 1024 px (Poly Haven) : à remplacer par la 4K (étape 3) | garder (technique) jusqu'au remplacement |
| `/textures/tx-cotele/nor.webp` | — | 1024×1024 | 337 Ko | oui | — | carte de texture 3D 1024 px (Poly Haven) : à remplacer par la 4K (étape 3) | garder (technique) jusqu'au remplacement |
| `/textures/tx-cotele/rough.webp` | — | 1024×1024 | 465 Ko | oui | — | carte de texture 3D 1024 px (Poly Haven) : à remplacer par la 4K (étape 3) | garder (technique) jusqu'au remplacement |
| `/textures/tx-coton/diff.webp` | data/materials-premium.json | 1024×1024 | 25 Ko | oui | — | carte de texture 3D 1024 px (Poly Haven) : à remplacer par la 4K (étape 3) | garder (technique) jusqu'au remplacement |
| `/textures/tx-coton/nor.webp` | data/materials-premium.json | 1024×1024 | 79 Ko | oui | — | carte de texture 3D 1024 px (Poly Haven) : à remplacer par la 4K (étape 3) | garder (technique) jusqu'au remplacement |
| `/textures/tx-coton/rough.webp` | data/materials-premium.json | 1024×1024 | 225 Ko | oui | — | carte de texture 3D 1024 px (Poly Haven) : à remplacer par la 4K (étape 3) | garder (technique) jusqu'au remplacement |
| `/textures/tx-cuir/diff.webp` | data/materials-premium.json | 1024×1024 | 181 Ko | oui | — | carte de texture 3D 1024 px (Poly Haven) : à remplacer par la 4K (étape 3) | garder (technique) jusqu'au remplacement |
| `/textures/tx-cuir/nor.webp` | data/materials-premium.json | 1024×1024 | 296 Ko | oui | — | carte de texture 3D 1024 px (Poly Haven) : à remplacer par la 4K (étape 3) | garder (technique) jusqu'au remplacement |
| `/textures/tx-cuir/rough.webp` | data/materials-premium.json | 1024×1024 | 465 Ko | oui | — | carte de texture 3D 1024 px (Poly Haven) : à remplacer par la 4K (étape 3) | garder (technique) jusqu'au remplacement |
| `/textures/tx-cuir-vieilli/diff.webp` | — | 1024×1024 | 285 Ko | oui | — | carte de texture 3D 1024 px (Poly Haven) : à remplacer par la 4K (étape 3) | garder (technique) jusqu'au remplacement |
| `/textures/tx-cuir-vieilli/nor.webp` | — | 1024×1024 | 143 Ko | oui | — | carte de texture 3D 1024 px (Poly Haven) : à remplacer par la 4K (étape 3) | garder (technique) jusqu'au remplacement |
| `/textures/tx-cuir-vieilli/rough.webp` | — | 1024×1024 | 432 Ko | oui | — | carte de texture 3D 1024 px (Poly Haven) : à remplacer par la 4K (étape 3) | garder (technique) jusqu'au remplacement |
| `/textures/tx-enduit/diff.webp` | data/materials-premium.json | 1024×1024 | 4 Ko | oui | — | carte de texture 3D 1024 px (Poly Haven) : à remplacer par la 4K (étape 3) | garder (technique) jusqu'au remplacement |
| `/textures/tx-enduit/nor.webp` | data/materials-premium.json | 1024×1024 | 121 Ko | oui | — | carte de texture 3D 1024 px (Poly Haven) : à remplacer par la 4K (étape 3) | garder (technique) jusqu'au remplacement |
| `/textures/tx-enduit/rough.webp` | data/materials-premium.json | 1024×1024 | 113 Ko | oui | — | carte de texture 3D 1024 px (Poly Haven) : à remplacer par la 4K (étape 3) | garder (technique) jusqu'au remplacement |
| `/textures/tx-enduit-nuage/diff.webp` | data/materials-premium.json | 1024×1024 | 365 Ko | oui | — | carte de texture 3D 1024 px (Poly Haven) : à remplacer par la 4K (étape 3) | garder (technique) jusqu'au remplacement |
| `/textures/tx-enduit-nuage/nor.webp` | data/materials-premium.json | 1024×1024 | 79 Ko | oui | — | carte de texture 3D 1024 px (Poly Haven) : à remplacer par la 4K (étape 3) | garder (technique) jusqu'au remplacement |
| `/textures/tx-enduit-nuage/rough.webp` | data/materials-premium.json | 1024×1024 | 430 Ko | oui | — | carte de texture 3D 1024 px (Poly Haven) : à remplacer par la 4K (étape 3) | garder (technique) jusqu'au remplacement |
| `/textures/tx-laine/diff.webp` | studio/engine.ts, data/materials-premium.json | 1024×1024 | 282 Ko | oui | — | carte de texture 3D 1024 px (Poly Haven) : à remplacer par la 4K (étape 3) | garder (technique) jusqu'au remplacement |
| `/textures/tx-laine/nor.webp` | studio/engine.ts, data/materials-premium.json | 1024×1024 | 350 Ko | oui | — | carte de texture 3D 1024 px (Poly Haven) : à remplacer par la 4K (étape 3) | garder (technique) jusqu'au remplacement |
| `/textures/tx-laine/rough.webp` | studio/engine.ts, data/materials-premium.json | 1024×1024 | 361 Ko | oui | — | carte de texture 3D 1024 px (Poly Haven) : à remplacer par la 4K (étape 3) | garder (technique) jusqu'au remplacement |
| `/textures/tx-nubuck/diff.webp` | — | 1024×1024 | 119 Ko | oui | — | carte de texture 3D 1024 px (Poly Haven) : à remplacer par la 4K (étape 3) | garder (technique) jusqu'au remplacement |
| `/textures/tx-nubuck/nor.webp` | — | 1024×1024 | 218 Ko | oui | — | carte de texture 3D 1024 px (Poly Haven) : à remplacer par la 4K (étape 3) | garder (technique) jusqu'au remplacement |
| `/textures/tx-nubuck/rough.webp` | — | 1024×1024 | 370 Ko | oui | — | carte de texture 3D 1024 px (Poly Haven) : à remplacer par la 4K (étape 3) | garder (technique) jusqu'au remplacement |
| `/visuels/cuisine-3d.webp` | — | 1200×1500 | 72 Ko | oui | C | ancien rendu 3D plat ; encore chargé par la planche (chemin calculé « vis- ») et par les tests | supprimer après avoir retiré son usage dans la planche et les tests |
| `/visuels/hero-3d.webp` | — | 2000×1125 | 93 Ko | oui | C | ancien rendu 3D plat ; encore chargé par la planche (chemin calculé « vis- ») et par les tests | supprimer après avoir retiré son usage dans la planche et les tests |
| `/visuels/planche-hero.webp` | — | 1600×1200 | 97 Ko | oui | C | ancien rendu 3D plat ; encore chargé par la planche (chemin calculé « vis- ») et par les tests | supprimer après avoir retiré son usage dans la planche et les tests |
| `/visuels/visite-3d.webp` | — | 1200×1500 | 82 Ko | oui | C | ancien rendu 3D plat ; encore chargé par la planche (chemin calculé « vis- ») et par les tests | supprimer après avoir retiré son usage dans la planche et les tests |
