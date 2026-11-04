# Audit des images (2026-11-04)

Grille : `direction-artistique-images` (A publiable, B à améliorer, C à refaire). Seuil : 2000 px de large minimum.
Méthode : mesures automatiques (`scripts/audit-images.mjs`), puis examen visuel de chaque groupe sur planches-contact.

## Bilan
- 467 images au total, 91 font 2000 px ou plus.
- Hors sujet : 12 ; note C : 95 ; note B : 83 ; note A : 99.
- À supprimer : 100 tout de suite (hors sujet ou C), 116 quand leur remplaçant existera, 57 à garder, 190 fichiers techniques.
- Les liens « utilisé par » sont des fichiers source ; les textures 3D sont chargées par un chemin calculé, d'où « 0 » parfois.

## Détail
| Fichier | Utilisé par | Taille (px) | Poids | Design d'intérieur | Note | Raison | Action |
|---|---|---|---|---|---|---|---|
| `/apple-icon.png` | layout.tsx | 180×180 | 4 Ko | outil | — | icône / partage, technique | garder (technique) jusqu'au remplacement |
| `/editorial/ia/accueil-table-1024.webp` | boutique/Boutique.tsx, experience/Stage.tsx | 1024×687 | 79 Ko | oui | B | image IA crédible mais beige générique, style peu reconnaissable | supprimer (< 2000 px) dès que le remplaçant existe |
| `/editorial/ia/accueil-table-640.webp` | boutique/Boutique.tsx, experience/Stage.tsx | 640×429 | 35 Ko | oui | B | image IA crédible mais beige générique, style peu reconnaissable | supprimer (< 2000 px) dès que le remplaçant existe |
| `/editorial/ia/accueil-table.webp` | boutique/Boutique.tsx, experience/Stage.tsx | 1600×1073 | 327 Ko | oui | B | image IA crédible mais beige générique, style peu reconnaissable | supprimer (< 2000 px) dès que le remplaçant existe |
| `/editorial/ia/art-deco-contemporain-1024.webp` | experience/page.tsx, page.tsx | 1024×765 | 38 Ko | oui | A | image IA crédible, style lisible (étiquetée IA) | supprimer (< 2000 px) dès que le remplaçant existe |
| `/editorial/ia/art-deco-contemporain-2400.webp` | experience/page.tsx, page.tsx | 2400×1792 | 189 Ko | oui | A | image IA crédible, style lisible (étiquetée IA) | garder |
| `/editorial/ia/art-deco-contemporain-640.webp` | experience/page.tsx, page.tsx | 640×478 | 23 Ko | oui | A | image IA crédible, style lisible (étiquetée IA) | supprimer (< 2000 px) dès que le remplaçant existe |
| `/editorial/ia/art-deco-contemporain.webp` | experience/page.tsx, page.tsx | 1600×1195 | 116 Ko | oui | A | image IA crédible, style lisible (étiquetée IA) | supprimer (< 2000 px) dès que le remplaçant existe |
| `/editorial/ia/brutalisme-raffine-1024.webp` | boutique/Boutique.tsx, photos-variantes.json | 1024×765 | 56 Ko | oui | A | image IA crédible, style lisible (étiquetée IA) | supprimer (< 2000 px) dès que le remplaçant existe |
| `/editorial/ia/brutalisme-raffine-640.webp` | boutique/Boutique.tsx, photos-variantes.json | 640×478 | 30 Ko | oui | A | image IA crédible, style lisible (étiquetée IA) | supprimer (< 2000 px) dès que le remplaçant existe |
| `/editorial/ia/brutalisme-raffine.webp` | boutique/Boutique.tsx, photos-variantes.json | 1600×1195 | 248 Ko | oui | A | image IA crédible, style lisible (étiquetée IA) | supprimer (< 2000 px) dès que le remplaçant existe |
| `/editorial/ia/bureau-1024.webp` | photos-variantes.json, data/inspiration-bank.json | 1024×765 | 59 Ko | oui | B | image IA crédible mais beige générique, style peu reconnaissable | supprimer (< 2000 px) dès que le remplaçant existe |
| `/editorial/ia/bureau-640.webp` | photos-variantes.json, data/inspiration-bank.json | 640×478 | 36 Ko | oui | B | image IA crédible mais beige générique, style peu reconnaissable | supprimer (< 2000 px) dès que le remplaçant existe |
| `/editorial/ia/bureau.webp` | photos-variantes.json, data/inspiration-bank.json | 1600×1195 | 177 Ko | oui | B | image IA crédible mais beige générique, style peu reconnaissable | supprimer (< 2000 px) dès que le remplaçant existe |
| `/editorial/ia/campagne-elegante-1024.webp` | experience/scene.ts, photos-variantes.json | 1024×765 | 34 Ko | oui | A | image IA crédible, style lisible (étiquetée IA) | supprimer (< 2000 px) dès que le remplaçant existe |
| `/editorial/ia/campagne-elegante-640.webp` | experience/scene.ts, photos-variantes.json | 640×478 | 20 Ko | oui | A | image IA crédible, style lisible (étiquetée IA) | supprimer (< 2000 px) dès que le remplaçant existe |
| `/editorial/ia/campagne-elegante.webp` | experience/scene.ts, photos-variantes.json | 1600×1195 | 112 Ko | oui | A | image IA crédible, style lisible (étiquetée IA) | supprimer (< 2000 px) dès que le remplaçant existe |
| `/editorial/ia/chambre-1024.webp` | boutique/Boutique.tsx, photos-variantes.json | 1024×765 | 50 Ko | oui | B | image IA crédible mais beige générique, style peu reconnaissable | supprimer (< 2000 px) dès que le remplaçant existe |
| `/editorial/ia/chambre-640.webp` | boutique/Boutique.tsx, photos-variantes.json | 640×478 | 27 Ko | oui | B | image IA crédible mais beige générique, style peu reconnaissable | supprimer (< 2000 px) dès que le remplaçant existe |
| `/editorial/ia/chambre.webp` | boutique/Boutique.tsx, photos-variantes.json | 1600×1195 | 176 Ko | oui | B | image IA crédible mais beige générique, style peu reconnaissable | supprimer (< 2000 px) dès que le remplaçant existe |
| `/editorial/ia/contemporain-sculptural-1024.webp` | experience/page.tsx, page.tsx | 1024×765 | 17 Ko | oui | B | image IA crédible mais beige générique, style peu reconnaissable | supprimer (< 2000 px) dès que le remplaçant existe |
| `/editorial/ia/contemporain-sculptural-640.webp` | experience/page.tsx, page.tsx | 640×478 | 9 Ko | oui | B | image IA crédible mais beige générique, style peu reconnaissable | supprimer (< 2000 px) dès que le remplaçant existe |
| `/editorial/ia/contemporain-sculptural.webp` | experience/page.tsx, page.tsx | 1600×1195 | 73 Ko | oui | B | image IA crédible mais beige générique, style peu reconnaissable | supprimer (< 2000 px) dès que le remplaçant existe |
| `/editorial/ia/cuisine-1024.webp` | Photo.tsx, photos-variantes.json | 1024×765 | 21 Ko | oui | A | image IA crédible, style lisible (étiquetée IA) | supprimer (< 2000 px) dès que le remplaçant existe |
| `/editorial/ia/cuisine-640.webp` | Photo.tsx, photos-variantes.json | 640×478 | 13 Ko | oui | A | image IA crédible, style lisible (étiquetée IA) | supprimer (< 2000 px) dès que le remplaçant existe |
| `/editorial/ia/cuisine.webp` | Photo.tsx, photos-variantes.json | 1600×1195 | 66 Ko | oui | A | image IA crédible, style lisible (étiquetée IA) | supprimer (< 2000 px) dès que le remplaçant existe |
| `/editorial/ia/dressing-1024.webp` | photos-variantes.json, data/inspiration-bank.json | 1024×765 | 47 Ko | oui | A | image IA crédible, style lisible (étiquetée IA) | supprimer (< 2000 px) dès que le remplaçant existe |
| `/editorial/ia/dressing-640.webp` | photos-variantes.json, data/inspiration-bank.json | 640×478 | 27 Ko | oui | A | image IA crédible, style lisible (étiquetée IA) | supprimer (< 2000 px) dès que le remplaçant existe |
| `/editorial/ia/dressing.webp` | photos-variantes.json, data/inspiration-bank.json | 1600×1195 | 167 Ko | oui | A | image IA crédible, style lisible (étiquetée IA) | supprimer (< 2000 px) dès que le remplaçant existe |
| `/editorial/ia/entree-1024.webp` | photos-variantes.json, data/inspiration-bank.json | 1024×765 | 25 Ko | oui | B | image IA crédible mais beige générique, style peu reconnaissable | supprimer (< 2000 px) dès que le remplaçant existe |
| `/editorial/ia/entree-640.webp` | photos-variantes.json, data/inspiration-bank.json | 640×478 | 14 Ko | oui | B | image IA crédible mais beige générique, style peu reconnaissable | supprimer (< 2000 px) dès que le remplaçant existe |
| `/editorial/ia/entree.webp` | photos-variantes.json, data/inspiration-bank.json | 1600×1195 | 107 Ko | oui | B | image IA crédible mais beige générique, style peu reconnaissable | supprimer (< 2000 px) dès que le remplaçant existe |
| `/editorial/ia/facade-1024.webp` | photos-variantes.json, data/inspiration-bank.json | 1024×765 | 87 Ko | non | B | extérieur : hors du concept (intérieur) | supprimer |
| `/editorial/ia/facade-640.webp` | photos-variantes.json, data/inspiration-bank.json | 640×478 | 43 Ko | non | B | extérieur : hors du concept (intérieur) | supprimer |
| `/editorial/ia/facade.webp` | photos-variantes.json, data/inspiration-bank.json | 1600×1195 | 308 Ko | non | B | extérieur : hors du concept (intérieur) | supprimer |
| `/editorial/ia/haussmannien-renove-1024.webp` | page.tsx, experience/scene.ts | 1024×765 | 55 Ko | oui | A | image IA crédible, style lisible (étiquetée IA) | supprimer (< 2000 px) dès que le remplaçant existe |
| `/editorial/ia/haussmannien-renove-640.webp` | page.tsx, experience/scene.ts | 640×478 | 27 Ko | oui | A | image IA crédible, style lisible (étiquetée IA) | supprimer (< 2000 px) dès que le remplaçant existe |
| `/editorial/ia/haussmannien-renove.webp` | page.tsx, experience/scene.ts | 1600×1195 | 191 Ko | oui | A | image IA crédible, style lisible (étiquetée IA) | supprimer (< 2000 px) dès que le remplaçant existe |
| `/editorial/ia/japandi-essai-1024.webp` | experience/page.tsx, page.tsx | 1024×765 | 43 Ko | oui | B | image IA crédible mais beige générique, style peu reconnaissable | supprimer (< 2000 px) dès que le remplaçant existe |
| `/editorial/ia/japandi-essai-640.webp` | experience/page.tsx, page.tsx | 640×478 | 23 Ko | oui | B | image IA crédible mais beige générique, style peu reconnaissable | supprimer (< 2000 px) dès que le remplaçant existe |
| `/editorial/ia/japandi-essai.webp` | experience/page.tsx, page.tsx | 1600×1195 | 153 Ko | oui | B | image IA crédible mais beige générique, style peu reconnaissable | supprimer (< 2000 px) dès que le remplaçant existe |
| `/editorial/ia/jardin-1024.webp` | photos-variantes.json, data/inspiration-bank.json | 1024×765 | 201 Ko | non | B | extérieur : hors du concept (intérieur) | supprimer |
| `/editorial/ia/jardin-640.webp` | photos-variantes.json, data/inspiration-bank.json | 640×478 | 100 Ko | non | B | extérieur : hors du concept (intérieur) | supprimer |
| `/editorial/ia/jardin.webp` | photos-variantes.json, data/inspiration-bank.json | 1600×1195 | 641 Ko | non | B | extérieur : hors du concept (intérieur) | supprimer |
| `/editorial/ia/luxe-discret-1024.webp` | experience/page.tsx, page.tsx | 1024×765 | 56 Ko | oui | B | image IA crédible mais beige générique, style peu reconnaissable | supprimer (< 2000 px) dès que le remplaçant existe |
| `/editorial/ia/luxe-discret-640.webp` | experience/page.tsx, page.tsx | 640×478 | 29 Ko | oui | B | image IA crédible mais beige générique, style peu reconnaissable | supprimer (< 2000 px) dès que le remplaçant existe |
| `/editorial/ia/luxe-discret.webp` | experience/page.tsx, page.tsx | 1600×1195 | 210 Ko | oui | B | image IA crédible mais beige générique, style peu reconnaissable | supprimer (< 2000 px) dès que le remplaçant existe |
| `/editorial/ia/matiere-boucle-1024.webp` | photos-variantes.json, data/inspiration-bank.json | 1024×765 | 49 Ko | oui | C | image IA de matière : interdite désormais pour les matières | supprimer |
| `/editorial/ia/matiere-boucle-640.webp` | photos-variantes.json, data/inspiration-bank.json | 640×478 | 31 Ko | oui | C | image IA de matière : interdite désormais pour les matières | supprimer |
| `/editorial/ia/matiere-boucle.webp` | photos-variantes.json, data/inspiration-bank.json | 1600×1195 | 129 Ko | oui | C | image IA de matière : interdite désormais pour les matières | supprimer |
| `/editorial/ia/matiere-ceramique-1024.webp` | boutique/Boutique.tsx, photos-variantes.json | 1024×765 | 52 Ko | oui | C | image IA de matière : interdite désormais pour les matières | supprimer |
| `/editorial/ia/matiere-ceramique-640.webp` | boutique/Boutique.tsx, photos-variantes.json | 640×478 | 30 Ko | oui | C | image IA de matière : interdite désormais pour les matières | supprimer |
| `/editorial/ia/matiere-ceramique.webp` | boutique/Boutique.tsx, photos-variantes.json | 1600×1195 | 185 Ko | oui | C | image IA de matière : interdite désormais pour les matières | supprimer |
| `/editorial/ia/matiere-chene-1024.webp` | boutique/Boutique.tsx, photos-variantes.json | 1024×765 | 46 Ko | oui | C | image IA de matière : interdite désormais pour les matières | supprimer |
| `/editorial/ia/matiere-chene-640.webp` | boutique/Boutique.tsx, photos-variantes.json | 640×478 | 23 Ko | oui | C | image IA de matière : interdite désormais pour les matières | supprimer |
| `/editorial/ia/matiere-chene.webp` | boutique/Boutique.tsx, photos-variantes.json | 1600×1195 | 170 Ko | oui | C | image IA de matière : interdite désormais pour les matières | supprimer |
| `/editorial/ia/matiere-enduit-1024.webp` | experience/page.tsx, photos-variantes.json | 1024×765 | 15 Ko | oui | C | image IA de matière : interdite désormais pour les matières | supprimer |
| `/editorial/ia/matiere-enduit-640.webp` | experience/page.tsx, photos-variantes.json | 640×478 | 8 Ko | oui | C | image IA de matière : interdite désormais pour les matières | supprimer |
| `/editorial/ia/matiere-enduit.webp` | experience/page.tsx, photos-variantes.json | 1600×1195 | 61 Ko | oui | C | image IA de matière : interdite désormais pour les matières | supprimer |
| `/editorial/ia/matiere-laiton-1024.webp` | boutique/Boutique.tsx, photos-variantes.json | 1024×765 | 25 Ko | oui | C | image IA de matière : interdite désormais pour les matières | supprimer |
| `/editorial/ia/matiere-laiton-640.webp` | boutique/Boutique.tsx, photos-variantes.json | 640×478 | 15 Ko | oui | C | image IA de matière : interdite désormais pour les matières | supprimer |
| `/editorial/ia/matiere-laiton.webp` | boutique/Boutique.tsx, photos-variantes.json | 1600×1195 | 79 Ko | oui | C | image IA de matière : interdite désormais pour les matières | supprimer |
| `/editorial/ia/matiere-lin-1024.webp` | boutique/Boutique.tsx, photos-variantes.json | 1024×765 | 71 Ko | oui | C | image IA de matière : interdite désormais pour les matières | supprimer |
| `/editorial/ia/matiere-lin-640.webp` | boutique/Boutique.tsx, photos-variantes.json | 640×478 | 33 Ko | oui | C | image IA de matière : interdite désormais pour les matières | supprimer |
| `/editorial/ia/matiere-lin.webp` | boutique/Boutique.tsx, photos-variantes.json | 1600×1195 | 302 Ko | oui | C | image IA de matière : interdite désormais pour les matières | supprimer |
| `/editorial/ia/matiere-marbre-1024.webp` | photos-variantes.json, data/inspiration-bank.json | 1024×765 | 21 Ko | oui | C | image IA de matière : interdite désormais pour les matières | supprimer |
| `/editorial/ia/matiere-marbre-640.webp` | photos-variantes.json, data/inspiration-bank.json | 640×478 | 12 Ko | oui | C | image IA de matière : interdite désormais pour les matières | supprimer |
| `/editorial/ia/matiere-marbre.webp` | photos-variantes.json, data/inspiration-bank.json | 1600×1195 | 54 Ko | oui | C | image IA de matière : interdite désormais pour les matières | supprimer |
| `/editorial/ia/matiere-noyer-1024.webp` | boutique/Boutique.tsx, photos-variantes.json | 1024×765 | 45 Ko | oui | C | image IA de matière : interdite désormais pour les matières | supprimer |
| `/editorial/ia/matiere-noyer-640.webp` | boutique/Boutique.tsx, photos-variantes.json | 640×478 | 26 Ko | oui | C | image IA de matière : interdite désormais pour les matières | supprimer |
| `/editorial/ia/matiere-noyer.webp` | boutique/Boutique.tsx, photos-variantes.json | 1600×1195 | 137 Ko | oui | C | image IA de matière : interdite désormais pour les matières | supprimer |
| `/editorial/ia/matiere-peinture-1024.webp` | boutique/Boutique.tsx, photos-variantes.json | 1024×765 | 16 Ko | oui | C | image IA de matière : interdite désormais pour les matières | supprimer |
| `/editorial/ia/matiere-peinture-640.webp` | boutique/Boutique.tsx, photos-variantes.json | 640×478 | 9 Ko | oui | C | image IA de matière : interdite désormais pour les matières | supprimer |
| `/editorial/ia/matiere-peinture.webp` | boutique/Boutique.tsx, photos-variantes.json | 1600×1195 | 112 Ko | oui | C | image IA de matière : interdite désormais pour les matières | supprimer |
| `/editorial/ia/matiere-pierre-1024.webp` | photos-variantes.json, data/inspiration-bank.json | 1024×765 | 38 Ko | oui | C | image IA de matière : interdite désormais pour les matières | supprimer |
| `/editorial/ia/matiere-pierre-640.webp` | photos-variantes.json, data/inspiration-bank.json | 640×478 | 22 Ko | oui | C | image IA de matière : interdite désormais pour les matières | supprimer |
| `/editorial/ia/matiere-pierre.webp` | photos-variantes.json, data/inspiration-bank.json | 1600×1195 | 141 Ko | oui | C | image IA de matière : interdite désormais pour les matières | supprimer |
| `/editorial/ia/matiere-travertin-1024.webp` | page.tsx, experience/Stage.tsx | 1024×765 | 27 Ko | oui | C | image IA de matière : interdite désormais pour les matières | supprimer |
| `/editorial/ia/matiere-travertin-640.webp` | page.tsx, experience/Stage.tsx | 640×478 | 16 Ko | oui | C | image IA de matière : interdite désormais pour les matières | supprimer |
| `/editorial/ia/matiere-travertin.webp` | page.tsx, experience/Stage.tsx | 1600×1195 | 83 Ko | oui | C | image IA de matière : interdite désormais pour les matières | supprimer |
| `/editorial/ia/matiere-velours-1024.webp` | photos-variantes.json, data/inspiration-bank.json | 1024×765 | 29 Ko | oui | C | image IA de matière : interdite désormais pour les matières | supprimer |
| `/editorial/ia/matiere-velours-640.webp` | photos-variantes.json, data/inspiration-bank.json | 640×478 | 16 Ko | oui | C | image IA de matière : interdite désormais pour les matières | supprimer |
| `/editorial/ia/matiere-velours.webp` | photos-variantes.json, data/inspiration-bank.json | 1600×1195 | 105 Ko | oui | C | image IA de matière : interdite désormais pour les matières | supprimer |
| `/editorial/ia/matiere-verre-1024.webp` | photos-variantes.json, data/inspiration-bank.json | 1024×765 | 52 Ko | oui | C | image IA de matière : interdite désormais pour les matières | supprimer |
| `/editorial/ia/matiere-verre-640.webp` | photos-variantes.json, data/inspiration-bank.json | 640×478 | 29 Ko | oui | C | image IA de matière : interdite désormais pour les matières | supprimer |
| `/editorial/ia/matiere-verre.webp` | photos-variantes.json, data/inspiration-bank.json | 1600×1195 | 163 Ko | oui | C | image IA de matière : interdite désormais pour les matières | supprimer |
| `/editorial/ia/mediterraneen-contemporain-1024.webp` | photos-variantes.json, data/inspiration-bank.json | 1024×765 | 37 Ko | oui | A | image IA crédible, style lisible (étiquetée IA) | supprimer (< 2000 px) dès que le remplaçant existe |
| `/editorial/ia/mediterraneen-contemporain-640.webp` | photos-variantes.json, data/inspiration-bank.json | 640×478 | 21 Ko | oui | A | image IA crédible, style lisible (étiquetée IA) | supprimer (< 2000 px) dès que le remplaçant existe |
| `/editorial/ia/mediterraneen-contemporain.webp` | photos-variantes.json, data/inspiration-bank.json | 1600×1195 | 124 Ko | oui | A | image IA crédible, style lisible (étiquetée IA) | supprimer (< 2000 px) dès que le remplaçant existe |
| `/editorial/ia/mid-century-1024.webp` | boutique/Boutique.tsx, photos-variantes.json | 1024×765 | 54 Ko | oui | A | image IA crédible, style lisible (étiquetée IA) | supprimer (< 2000 px) dès que le remplaçant existe |
| `/editorial/ia/mid-century-640.webp` | boutique/Boutique.tsx, photos-variantes.json | 640×478 | 30 Ko | oui | A | image IA crédible, style lisible (étiquetée IA) | supprimer (< 2000 px) dès que le remplaçant existe |
| `/editorial/ia/mid-century.webp` | boutique/Boutique.tsx, photos-variantes.json | 1600×1195 | 195 Ko | oui | A | image IA crédible, style lisible (étiquetée IA) | supprimer (< 2000 px) dès que le remplaçant existe |
| `/editorial/ia/minimalisme-chaleureux-1024.webp` | boutique/Boutique.tsx, photos-variantes.json | 1024×765 | 23 Ko | oui | B | image IA crédible mais beige générique, style peu reconnaissable | supprimer (< 2000 px) dès que le remplaçant existe |
| `/editorial/ia/minimalisme-chaleureux-640.webp` | boutique/Boutique.tsx, photos-variantes.json | 640×478 | 14 Ko | oui | B | image IA crédible mais beige générique, style peu reconnaissable | supprimer (< 2000 px) dès que le remplaçant existe |
| `/editorial/ia/minimalisme-chaleureux.webp` | boutique/Boutique.tsx, photos-variantes.json | 1600×1195 | 82 Ko | oui | B | image IA crédible mais beige générique, style peu reconnaissable | supprimer (< 2000 px) dès que le remplaçant existe |
| `/editorial/ia/parisien-contemporain-1024.webp` | photos-variantes.json, data/inspiration-bank.json | 1024×765 | 42 Ko | oui | A | image IA crédible, style lisible (étiquetée IA) | supprimer (< 2000 px) dès que le remplaçant existe |
| `/editorial/ia/parisien-contemporain-640.webp` | photos-variantes.json, data/inspiration-bank.json | 640×478 | 23 Ko | oui | A | image IA crédible, style lisible (étiquetée IA) | supprimer (< 2000 px) dès que le remplaçant existe |
| `/editorial/ia/parisien-contemporain.webp` | photos-variantes.json, data/inspiration-bank.json | 1600×1195 | 176 Ko | oui | A | image IA crédible, style lisible (étiquetée IA) | supprimer (< 2000 px) dès que le remplaçant existe |
| `/editorial/ia/salle-a-manger-1024.webp` | boutique/Boutique.tsx, photos-variantes.json | 1024×765 | 32 Ko | oui | A | image IA crédible, style lisible (étiquetée IA) | supprimer (< 2000 px) dès que le remplaçant existe |
| `/editorial/ia/salle-a-manger-640.webp` | boutique/Boutique.tsx, photos-variantes.json | 640×478 | 19 Ko | oui | A | image IA crédible, style lisible (étiquetée IA) | supprimer (< 2000 px) dès que le remplaçant existe |
| `/editorial/ia/salle-a-manger.webp` | boutique/Boutique.tsx, photos-variantes.json | 1600×1195 | 100 Ko | oui | A | image IA crédible, style lisible (étiquetée IA) | supprimer (< 2000 px) dès que le remplaçant existe |
| `/editorial/ia/salle-de-bain-1024.webp` | boutique/Boutique.tsx, photos-variantes.json | 1024×765 | 32 Ko | oui | A | image IA crédible, style lisible (étiquetée IA) | supprimer (< 2000 px) dès que le remplaçant existe |
| `/editorial/ia/salle-de-bain-640.webp` | boutique/Boutique.tsx, photos-variantes.json | 640×478 | 18 Ko | oui | A | image IA crédible, style lisible (étiquetée IA) | supprimer (< 2000 px) dès que le remplaçant existe |
| `/editorial/ia/salle-de-bain.webp` | boutique/Boutique.tsx, photos-variantes.json | 1600×1195 | 117 Ko | oui | A | image IA crédible, style lisible (étiquetée IA) | supprimer (< 2000 px) dès que le remplaçant existe |
| `/editorial/ia/salon-1024.webp` | experience/page.tsx, page.tsx | 1024×765 | 47 Ko | oui | B | image IA crédible mais beige générique, style peu reconnaissable | supprimer (< 2000 px) dès que le remplaçant existe |
| `/editorial/ia/salon-640.webp` | experience/page.tsx, page.tsx | 640×478 | 26 Ko | oui | B | image IA crédible mais beige générique, style peu reconnaissable | supprimer (< 2000 px) dès que le remplaçant existe |
| `/editorial/ia/salon-boucle-noyer-1024.webp` | experience/page.tsx, page.tsx | 1024×572 | 23 Ko | oui | A | image IA crédible, style lisible (étiquetée IA) | supprimer (< 2000 px) dès que le remplaçant existe |
| `/editorial/ia/salon-boucle-noyer-2400.webp` | experience/page.tsx, page.tsx | 2400×1340 | 193 Ko | oui | A | image IA crédible, style lisible (étiquetée IA) | garder |
| `/editorial/ia/salon-boucle-noyer-640.webp` | experience/page.tsx, page.tsx | 640×357 | 12 Ko | oui | A | image IA crédible, style lisible (étiquetée IA) | supprimer (< 2000 px) dès que le remplaçant existe |
| `/editorial/ia/salon-boucle-noyer.webp` | experience/page.tsx, page.tsx | 1600×893 | 101 Ko | oui | A | image IA crédible, style lisible (étiquetée IA) | supprimer (< 2000 px) dès que le remplaçant existe |
| `/editorial/ia/salon-velours-chene-1024.webp` | experience/page.tsx, page.tsx | 1024×572 | 23 Ko | oui | A | image IA crédible, style lisible (étiquetée IA) | supprimer (< 2000 px) dès que le remplaçant existe |
| `/editorial/ia/salon-velours-chene-640.webp` | experience/page.tsx, page.tsx | 640×357 | 12 Ko | oui | A | image IA crédible, style lisible (étiquetée IA) | supprimer (< 2000 px) dès que le remplaçant existe |
| `/editorial/ia/salon-velours-chene.webp` | experience/page.tsx, page.tsx | 1600×893 | 82 Ko | oui | A | image IA crédible, style lisible (étiquetée IA) | supprimer (< 2000 px) dès que le remplaçant existe |
| `/editorial/ia/salon.webp` | experience/page.tsx, page.tsx | 1600×1195 | 168 Ko | oui | B | image IA crédible mais beige générique, style peu reconnaissable | supprimer (< 2000 px) dès que le remplaçant existe |
| `/editorial/ia/scandinave-haut-de-gamme-1024.webp` | boutique/Boutique.tsx, photos-variantes.json | 1024×765 | 50 Ko | oui | B | image IA crédible mais beige générique, style peu reconnaissable | supprimer (< 2000 px) dès que le remplaçant existe |
| `/editorial/ia/scandinave-haut-de-gamme-640.webp` | boutique/Boutique.tsx, photos-variantes.json | 640×478 | 29 Ko | oui | B | image IA crédible mais beige générique, style peu reconnaissable | supprimer (< 2000 px) dès que le remplaçant existe |
| `/editorial/ia/scandinave-haut-de-gamme.webp` | boutique/Boutique.tsx, photos-variantes.json | 1600×1195 | 163 Ko | oui | B | image IA crédible mais beige générique, style peu reconnaissable | supprimer (< 2000 px) dès que le remplaçant existe |
| `/editorial/ia/terrasse-1024.webp` | photos-variantes.json, data/inspiration-bank.json | 1024×765 | 122 Ko | oui | A | image IA crédible, style lisible (étiquetée IA) | supprimer (< 2000 px) dès que le remplaçant existe |
| `/editorial/ia/terrasse-640.webp` | photos-variantes.json, data/inspiration-bank.json | 640×478 | 63 Ko | oui | A | image IA crédible, style lisible (étiquetée IA) | supprimer (< 2000 px) dès que le remplaçant existe |
| `/editorial/ia/terrasse.webp` | photos-variantes.json, data/inspiration-bank.json | 1600×1195 | 465 Ko | oui | A | image IA crédible, style lisible (étiquetée IA) | supprimer (< 2000 px) dès que le remplaçant existe |
| `/editorial/matieres/bois-huile.webp` | — | 1200×1200 | 83 Ko | oui | B | vignette 1200 px recolorée ; aplats sans matière pour verre, laque, peinture, faïence, zellige, marbre | supprimer (< 2000 px) dès que le remplaçant existe |
| `/editorial/matieres/boucle.webp` | — | 1200×1200 | 56 Ko | oui | B | vignette 1200 px recolorée ; aplats sans matière pour verre, laque, peinture, faïence, zellige, marbre | supprimer (< 2000 px) dès que le remplaçant existe |
| `/editorial/matieres/bronze-brosse.webp` | — | 1200×1200 | 13 Ko | oui | B | vignette 1200 px recolorée ; aplats sans matière pour verre, laque, peinture, faïence, zellige, marbre | supprimer (< 2000 px) dès que le remplaçant existe |
| `/editorial/matieres/chene-fume.webp` | — | 1200×1200 | 63 Ko | oui | B | vignette 1200 px recolorée ; aplats sans matière pour verre, laque, peinture, faïence, zellige, marbre | supprimer (< 2000 px) dès que le remplaçant existe |
| `/editorial/matieres/chene-naturel.webp` | — | 1200×1200 | 134 Ko | oui | B | vignette 1200 px recolorée ; aplats sans matière pour verre, laque, peinture, faïence, zellige, marbre | supprimer (< 2000 px) dès que le remplaçant existe |
| `/editorial/matieres/enduit-chaux.webp` | — | 1200×1200 | 98 Ko | oui | B | vignette 1200 px recolorée ; aplats sans matière pour verre, laque, peinture, faïence, zellige, marbre | supprimer (< 2000 px) dès que le remplaçant existe |
| `/editorial/matieres/faience-blanche.webp` | — | 1200×1200 | 3 Ko | oui | C | vignette 1200 px recolorée ; aplats sans matière pour verre, laque, peinture, faïence, zellige, marbre | supprimer |
| `/editorial/matieres/laiton-brosse.webp` | — | 1200×1200 | 14 Ko | oui | B | vignette 1200 px recolorée ; aplats sans matière pour verre, laque, peinture, faïence, zellige, marbre | supprimer (< 2000 px) dès que le remplaçant existe |
| `/editorial/matieres/laque-brillante.webp` | — | 1200×1200 | 11 Ko | oui | C | vignette 1200 px recolorée ; aplats sans matière pour verre, laque, peinture, faïence, zellige, marbre | supprimer |
| `/editorial/matieres/lin-lave.webp` | — | 1200×1200 | 241 Ko | oui | B | vignette 1200 px recolorée ; aplats sans matière pour verre, laque, peinture, faïence, zellige, marbre | supprimer (< 2000 px) dès que le remplaçant existe |
| `/editorial/matieres/marbre-calacatta.webp` | — | 1200×1200 | 4 Ko | oui | C | vignette 1200 px recolorée ; aplats sans matière pour verre, laque, peinture, faïence, zellige, marbre | supprimer |
| `/editorial/matieres/noyer-verni.webp` | — | 1200×1200 | 90 Ko | oui | B | vignette 1200 px recolorée ; aplats sans matière pour verre, laque, peinture, faïence, zellige, marbre | supprimer (< 2000 px) dès que le remplaçant existe |
| `/editorial/matieres/parquet-chevron.webp` | — | 1200×1200 | 197 Ko | oui | B | vignette 1200 px recolorée ; aplats sans matière pour verre, laque, peinture, faïence, zellige, marbre | supprimer (< 2000 px) dès que le remplaçant existe |
| `/editorial/matieres/peinture-mate.webp` | — | 1200×1200 | 10 Ko | oui | C | vignette 1200 px recolorée ; aplats sans matière pour verre, laque, peinture, faïence, zellige, marbre | supprimer |
| `/editorial/matieres/peinture-velours.webp` | — | 1200×1200 | 10 Ko | oui | C | vignette 1200 px recolorée ; aplats sans matière pour verre, laque, peinture, faïence, zellige, marbre | supprimer |
| `/editorial/matieres/pierre-mate.webp` | — | 1200×1200 | 263 Ko | oui | B | vignette 1200 px recolorée ; aplats sans matière pour verre, laque, peinture, faïence, zellige, marbre | supprimer (< 2000 px) dès que le remplaçant existe |
| `/editorial/matieres/pierre-naturelle.webp` | — | 1200×1200 | 347 Ko | oui | B | vignette 1200 px recolorée ; aplats sans matière pour verre, laque, peinture, faïence, zellige, marbre | supprimer (< 2000 px) dès que le remplaçant existe |
| `/editorial/matieres/platre-texture.webp` | — | 1200×1200 | 175 Ko | oui | B | vignette 1200 px recolorée ; aplats sans matière pour verre, laque, peinture, faïence, zellige, marbre | supprimer (< 2000 px) dès que le remplaçant existe |
| `/editorial/matieres/tadelakt.webp` | — | 1200×1200 | 44 Ko | oui | C | vignette 1200 px recolorée ; aplats sans matière pour verre, laque, peinture, faïence, zellige, marbre | supprimer |
| `/editorial/matieres/tapis-laine.webp` | — | 1200×1200 | 58 Ko | oui | B | vignette 1200 px recolorée ; aplats sans matière pour verre, laque, peinture, faïence, zellige, marbre | supprimer (< 2000 px) dès que le remplaçant existe |
| `/editorial/matieres/terrazzo.webp` | — | 1200×1200 | 366 Ko | oui | B | vignette 1200 px recolorée ; aplats sans matière pour verre, laque, peinture, faïence, zellige, marbre | supprimer (< 2000 px) dès que le remplaçant existe |
| `/editorial/matieres/terre-cuite.webp` | — | 1200×1200 | 71 Ko | oui | B | vignette 1200 px recolorée ; aplats sans matière pour verre, laque, peinture, faïence, zellige, marbre | supprimer (< 2000 px) dès que le remplaçant existe |
| `/editorial/matieres/travertin.webp` | InspirationBank.tsx | 1200×1200 | 89 Ko | oui | B | vignette 1200 px recolorée ; aplats sans matière pour verre, laque, peinture, faïence, zellige, marbre | supprimer (< 2000 px) dès que le remplaçant existe |
| `/editorial/matieres/velours-foret.webp` | — | 1200×1200 | 99 Ko | oui | B | vignette 1200 px recolorée ; aplats sans matière pour verre, laque, peinture, faïence, zellige, marbre | supprimer (< 2000 px) dès que le remplaçant existe |
| `/editorial/matieres/verre-clair.webp` | — | 1200×1200 | 3 Ko | oui | C | vignette 1200 px recolorée ; aplats sans matière pour verre, laque, peinture, faïence, zellige, marbre | supprimer |
| `/editorial/matieres/verre-depoli.webp` | — | 1200×1200 | 3 Ko | oui | C | vignette 1200 px recolorée ; aplats sans matière pour verre, laque, peinture, faïence, zellige, marbre | supprimer |
| `/editorial/matieres/verre-fume.webp` | — | 1200×1200 | 17 Ko | oui | C | vignette 1200 px recolorée ; aplats sans matière pour verre, laque, peinture, faïence, zellige, marbre | supprimer |
| `/editorial/matieres/zellige-emeraude.webp` | — | 1200×1200 | 8 Ko | oui | C | vignette 1200 px recolorée ; aplats sans matière pour verre, laque, peinture, faïence, zellige, marbre | supprimer |
| `/editorial/planches/art-deco-contemporain.webp` | data/inspiration-bank.json | 1600×1200 | 16 Ko | oui | B | planche composée d'échantillons, pas une photo | supprimer (< 2000 px) dès que le remplaçant existe |
| `/editorial/planches/brutalisme-raffine.webp` | data/inspiration-bank.json | 1600×1200 | 166 Ko | oui | B | planche composée d'échantillons, pas une photo | supprimer (< 2000 px) dès que le remplaçant existe |
| `/editorial/planches/campagne-elegante.webp` | data/inspiration-bank.json | 1600×1200 | 139 Ko | oui | B | planche composée d'échantillons, pas une photo | supprimer (< 2000 px) dès que le remplaçant existe |
| `/editorial/planches/chambre.webp` | data/inspiration-bank.json | 1600×1200 | 137 Ko | oui | B | planche composée d'échantillons, pas une photo | supprimer (< 2000 px) dès que le remplaçant existe |
| `/editorial/planches/contemporain-sculptural.webp` | data/inspiration-bank.json | 1600×1200 | 65 Ko | oui | B | planche composée d'échantillons, pas une photo | supprimer (< 2000 px) dès que le remplaçant existe |
| `/editorial/planches/dressing.webp` | data/inspiration-bank.json | 1600×1200 | 110 Ko | oui | B | planche composée d'échantillons, pas une photo | supprimer (< 2000 px) dès que le remplaçant existe |
| `/editorial/planches/entree.webp` | data/inspiration-bank.json | 1600×1200 | 72 Ko | oui | B | planche composée d'échantillons, pas une photo | supprimer (< 2000 px) dès que le remplaçant existe |
| `/editorial/planches/facade.webp` | data/inspiration-bank.json | 1600×1200 | 135 Ko | non | B | planche composée d'échantillons, pas une photo | supprimer |
| `/editorial/planches/haussmannien-renove.webp` | data/inspiration-bank.json | 1600×1200 | 85 Ko | oui | B | planche composée d'échantillons, pas une photo | supprimer (< 2000 px) dès que le remplaçant existe |
| `/editorial/planches/japandi.webp` | data/inspiration-bank.json | 1600×1200 | 86 Ko | oui | B | planche composée d'échantillons, pas une photo | supprimer (< 2000 px) dès que le remplaçant existe |
| `/editorial/planches/jardin.webp` | data/inspiration-bank.json | 1600×1200 | 184 Ko | non | B | planche composée d'échantillons, pas une photo | supprimer |
| `/editorial/planches/luxe-discret.webp` | data/inspiration-bank.json | 1600×1200 | 70 Ko | oui | B | planche composée d'échantillons, pas une photo | supprimer (< 2000 px) dès que le remplaçant existe |
| `/editorial/planches/mediterraneen-contemporain.webp` | data/inspiration-bank.json | 1600×1200 | 88 Ko | oui | B | planche composée d'échantillons, pas une photo | supprimer (< 2000 px) dès que le remplaçant existe |
| `/editorial/planches/mid-century.webp` | data/inspiration-bank.json | 1600×1200 | 97 Ko | oui | B | planche composée d'échantillons, pas une photo | supprimer (< 2000 px) dès que le remplaçant existe |
| `/editorial/planches/minimalisme-chaleureux.webp` | data/inspiration-bank.json | 1600×1200 | 101 Ko | oui | B | planche composée d'échantillons, pas une photo | supprimer (< 2000 px) dès que le remplaçant existe |
| `/editorial/planches/parisien-contemporain.webp` | data/inspiration-bank.json | 1600×1200 | 118 Ko | oui | B | planche composée d'échantillons, pas une photo | supprimer (< 2000 px) dès que le remplaçant existe |
| `/editorial/planches/salle-a-manger.webp` | data/inspiration-bank.json | 1600×1200 | 47 Ko | oui | B | planche composée d'échantillons, pas une photo | supprimer (< 2000 px) dès que le remplaçant existe |
| `/editorial/planches/salle-de-bain.webp` | data/inspiration-bank.json | 1600×1200 | 145 Ko | oui | B | planche composée d'échantillons, pas une photo | supprimer (< 2000 px) dès que le remplaçant existe |
| `/editorial/planches/scandinave-haut-de-gamme.webp` | data/inspiration-bank.json | 1600×1200 | 103 Ko | oui | B | planche composée d'échantillons, pas une photo | supprimer (< 2000 px) dès que le remplaçant existe |
| `/editorial/planches/terrasse.webp` | data/inspiration-bank.json | 1600×1200 | 143 Ko | non | B | planche composée d'échantillons, pas une photo | supprimer |
| `/icon-192.png` | layout.tsx, manifest.ts | 192×192 | 4 Ko | outil | — | icône / partage, technique | garder (technique) jusqu'au remplacement |
| `/icon-512.png` | layout.tsx, manifest.ts | 512×512 | 12 Ko | outil | — | icône / partage, technique | garder (technique) jusqu'au remplacement |
| `/icon.svg` | layout.tsx, manifest.ts | 64×64 | 0 Ko | outil | — | icône / partage, technique | garder (technique) jusqu'au remplacement |
| `/inspirations/cuisines-68-1024.webp` | photos-variantes.json, data/inspirations.json | 1024×513 | 58 Ko | oui | C | intérieur kitsch ou rendu de promoteur | supprimer |
| `/inspirations/cuisines-68-640.webp` | photos-variantes.json, data/inspirations.json | 640×440 | 38 Ko | oui | C | intérieur kitsch ou rendu de promoteur | supprimer |
| `/inspirations/cuisines-68.webp` | photos-variantes.json, data/inspirations.json | 1600×801 | 190 Ko | oui | C | intérieur kitsch ou rendu de promoteur | supprimer |
| `/inspirations/villas-10-1024.webp` | photos-variantes.json, data/inspirations.json | 1024×576 | 57 Ko | oui | C | intérieur kitsch ou rendu de promoteur | supprimer |
| `/inspirations/villas-10-640.webp` | photos-variantes.json, data/inspirations.json | 640×440 | 37 Ko | oui | C | intérieur kitsch ou rendu de promoteur | supprimer |
| `/inspirations/villas-10.webp` | photos-variantes.json, data/inspirations.json | 1600×900 | 145 Ko | oui | C | intérieur kitsch ou rendu de promoteur | supprimer |
| `/inspirations/villas-14-1024.webp` | page.tsx, photos-variantes.json | 1024×768 | 65 Ko | oui | B | vraie photo (Villa Tugendhat), belle mais trop petite | supprimer (< 2000 px) dès que le remplaçant existe |
| `/inspirations/villas-14-640.webp` | page.tsx, photos-variantes.json | 640×440 | 31 Ko | oui | B | vraie photo (Villa Tugendhat), belle mais trop petite | supprimer (< 2000 px) dès que le remplaçant existe |
| `/inspirations/villas-14.webp` | page.tsx, photos-variantes.json | 1467×1100 | 175 Ko | oui | B | vraie photo (Villa Tugendhat), belle mais trop petite | supprimer (< 2000 px) dès que le remplaçant existe |
| `/inspirations/villas-15-1024.webp` | photos-variantes.json, data/inspirations.json | 1024×1024 | 76 Ko | oui | B | vraie photo (Villa Tugendhat), belle mais trop petite | supprimer (< 2000 px) dès que le remplaçant existe |
| `/inspirations/villas-15-640.webp` | photos-variantes.json, data/inspirations.json | 640×440 | 38 Ko | oui | B | vraie photo (Villa Tugendhat), belle mais trop petite | supprimer (< 2000 px) dès que le remplaçant existe |
| `/inspirations/villas-15.webp` | photos-variantes.json, data/inspirations.json | 1100×1100 | 129 Ko | oui | B | vraie photo (Villa Tugendhat), belle mais trop petite | supprimer (< 2000 px) dès que le remplaçant existe |
| `/inspirations/villas-16-1024.webp` | page.tsx, photos-variantes.json | 1024×600 | 54 Ko | oui | B | vraie photo (Villa Tugendhat), belle mais trop petite | supprimer (< 2000 px) dès que le remplaçant existe |
| `/inspirations/villas-16-640.webp` | page.tsx, photos-variantes.json | 640×440 | 28 Ko | oui | B | vraie photo (Villa Tugendhat), belle mais trop petite | supprimer (< 2000 px) dès que le remplaçant existe |
| `/inspirations/villas-16.webp` | page.tsx, photos-variantes.json | 1600×937 | 175 Ko | oui | B | vraie photo (Villa Tugendhat), belle mais trop petite | supprimer (< 2000 px) dès que le remplaçant existe |
| `/inspirations/villas-24-1024.webp` | photos-variantes.json, data/inspirations.json | 1024×683 | 90 Ko | non | C | maison vue de l'extérieur, rendu | supprimer |
| `/inspirations/villas-24-640.webp` | photos-variantes.json, data/inspirations.json | 640×440 | 42 Ko | non | C | maison vue de l'extérieur, rendu | supprimer |
| `/inspirations/villas-24.webp` | photos-variantes.json, data/inspirations.json | 1600×1067 | 308 Ko | non | C | maison vue de l'extérieur, rendu | supprimer |
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
| `/materiaux/coton/ao.webp` | data/materials-pbr.json | 2048×2048 | 1489 Ko | oui | C | texture réelle mais couleur contraire au nom (rouge, bleu, rose) | supprimer |
| `/materiaux/coton/basecolor.webp` | data/materials-pbr.json | 2048×2048 | 944 Ko | oui | C | texture réelle mais couleur contraire au nom (rouge, bleu, rose) | supprimer |
| `/materiaux/coton/displacement.webp` | data/materials-pbr.json | 2048×2048 | 1610 Ko | oui | C | texture réelle mais couleur contraire au nom (rouge, bleu, rose) | supprimer |
| `/materiaux/coton/metallic.webp` | data/materials-pbr.json | 2048×2048 | 7 Ko | oui | C | texture réelle mais couleur contraire au nom (rouge, bleu, rose) | supprimer |
| `/materiaux/coton/normal.webp` | data/materials-pbr.json | 2048×2048 | 1054 Ko | oui | C | texture réelle mais couleur contraire au nom (rouge, bleu, rose) | supprimer |
| `/materiaux/coton/roughness.webp` | data/materials-pbr.json | 2048×2048 | 1925 Ko | oui | C | texture réelle mais couleur contraire au nom (rouge, bleu, rose) | supprimer |
| `/materiaux/enduit-chaux/ao.webp` | data/materials-pbr.json | 2048×2048 | 649 Ko | oui | A | texture réelle Poly Haven 2K | garder |
| `/materiaux/enduit-chaux/basecolor.webp` | data/materials-pbr.json | 2048×2048 | 1031 Ko | oui | A | texture réelle Poly Haven 2K | garder |
| `/materiaux/enduit-chaux/displacement.webp` | data/materials-pbr.json | 2048×2048 | 312 Ko | oui | A | texture réelle Poly Haven 2K | garder |
| `/materiaux/enduit-chaux/normal.webp` | data/materials-pbr.json | 2048×2048 | 1436 Ko | oui | A | texture réelle Poly Haven 2K | garder |
| `/materiaux/enduit-chaux/roughness.webp` | data/materials-pbr.json | 2048×2048 | 242 Ko | oui | A | texture réelle Poly Haven 2K | garder |
| `/materiaux/lin-lave/ao.webp` | data/materials-pbr.json | 2048×2048 | 1893 Ko | oui | C | texture réelle mais couleur contraire au nom (rouge, bleu, rose) | supprimer |
| `/materiaux/lin-lave/basecolor.webp` | data/materials-pbr.json | 2048×2048 | 1091 Ko | oui | C | texture réelle mais couleur contraire au nom (rouge, bleu, rose) | supprimer |
| `/materiaux/lin-lave/displacement.webp` | data/materials-pbr.json | 2048×2048 | 1213 Ko | oui | C | texture réelle mais couleur contraire au nom (rouge, bleu, rose) | supprimer |
| `/materiaux/lin-lave/metallic.webp` | data/materials-pbr.json | 2048×2048 | 408 Ko | oui | C | texture réelle mais couleur contraire au nom (rouge, bleu, rose) | supprimer |
| `/materiaux/lin-lave/normal.webp` | data/materials-pbr.json | 2048×2048 | 1378 Ko | oui | C | texture réelle mais couleur contraire au nom (rouge, bleu, rose) | supprimer |
| `/materiaux/lin-lave/roughness.webp` | data/materials-pbr.json | 2048×2048 | 2183 Ko | oui | C | texture réelle mais couleur contraire au nom (rouge, bleu, rose) | supprimer |
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
| `/materiaux/pierre-naturelle/ao.webp` | data/materials-pbr.json | 2048×2048 | 1402 Ko | oui | C | texture réelle mais ce n'est pas la matière annoncée | supprimer |
| `/materiaux/pierre-naturelle/basecolor.webp` | data/materials-pbr.json | 2048×2048 | 1428 Ko | oui | C | texture réelle mais ce n'est pas la matière annoncée | supprimer |
| `/materiaux/pierre-naturelle/displacement.webp` | data/materials-pbr.json | 2048×2048 | 221 Ko | oui | C | texture réelle mais ce n'est pas la matière annoncée | supprimer |
| `/materiaux/pierre-naturelle/normal.webp` | data/materials-pbr.json | 2048×2048 | 1878 Ko | oui | C | texture réelle mais ce n'est pas la matière annoncée | supprimer |
| `/materiaux/pierre-naturelle/roughness.webp` | data/materials-pbr.json | 2048×2048 | 989 Ko | oui | C | texture réelle mais ce n'est pas la matière annoncée | supprimer |
| `/materiaux/platre-texture/ao.webp` | data/materials-pbr.json | 2048×2048 | 1512 Ko | oui | C | texture réelle mais ce n'est pas la matière annoncée | supprimer |
| `/materiaux/platre-texture/basecolor.webp` | data/materials-pbr.json | 2048×2048 | 1450 Ko | oui | C | texture réelle mais ce n'est pas la matière annoncée | supprimer |
| `/materiaux/platre-texture/displacement.webp` | data/materials-pbr.json | 2048×2048 | 460 Ko | oui | C | texture réelle mais ce n'est pas la matière annoncée | supprimer |
| `/materiaux/platre-texture/normal.webp` | data/materials-pbr.json | 2048×2048 | 1384 Ko | oui | C | texture réelle mais ce n'est pas la matière annoncée | supprimer |
| `/materiaux/platre-texture/roughness.webp` | data/materials-pbr.json | 2048×2048 | 1063 Ko | oui | C | texture réelle mais ce n'est pas la matière annoncée | supprimer |
| `/materiaux/tadelakt/ao.webp` | data/materials-pbr.json | 2048×2048 | 358 Ko | oui | A | texture réelle Poly Haven 2K | garder |
| `/materiaux/tadelakt/basecolor.webp` | data/materials-pbr.json | 2048×2048 | 416 Ko | oui | A | texture réelle Poly Haven 2K | garder |
| `/materiaux/tadelakt/displacement.webp` | data/materials-pbr.json | 2048×2048 | 644 Ko | oui | A | texture réelle Poly Haven 2K | garder |
| `/materiaux/tadelakt/normal.webp` | data/materials-pbr.json | 2048×2048 | 1439 Ko | oui | A | texture réelle Poly Haven 2K | garder |
| `/materiaux/tadelakt/roughness.webp` | data/materials-pbr.json | 2048×2048 | 148 Ko | oui | A | texture réelle Poly Haven 2K | garder |
| `/materiaux/terrazzo/ao.webp` | data/materials-pbr.json | 2048×2048 | 110 Ko | oui | C | texture réelle mais ce n'est pas la matière annoncée | supprimer |
| `/materiaux/terrazzo/basecolor.webp` | data/materials-pbr.json | 2048×2048 | 1556 Ko | oui | C | texture réelle mais ce n'est pas la matière annoncée | supprimer |
| `/materiaux/terrazzo/displacement.webp` | data/materials-pbr.json | 2048×2048 | 13 Ko | oui | C | texture réelle mais ce n'est pas la matière annoncée | supprimer |
| `/materiaux/terrazzo/normal.webp` | data/materials-pbr.json | 2048×2048 | 17 Ko | oui | C | texture réelle mais ce n'est pas la matière annoncée | supprimer |
| `/materiaux/terrazzo/roughness.webp` | data/materials-pbr.json | 2048×2048 | 390 Ko | oui | C | texture réelle mais ce n'est pas la matière annoncée | supprimer |
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
| `/materiaux/velours-foret/ao.webp` | data/materials-pbr.json | 2048×2048 | 883 Ko | oui | C | texture réelle mais couleur contraire au nom (rouge, bleu, rose) | supprimer |
| `/materiaux/velours-foret/basecolor.webp` | data/materials-pbr.json | 2048×2048 | 759 Ko | oui | C | texture réelle mais couleur contraire au nom (rouge, bleu, rose) | supprimer |
| `/materiaux/velours-foret/displacement.webp` | data/materials-pbr.json | 2048×2048 | 389 Ko | oui | C | texture réelle mais couleur contraire au nom (rouge, bleu, rose) | supprimer |
| `/materiaux/velours-foret/metallic.webp` | data/materials-pbr.json | 2048×2048 | 1119 Ko | oui | C | texture réelle mais couleur contraire au nom (rouge, bleu, rose) | supprimer |
| `/materiaux/velours-foret/normal.webp` | data/materials-pbr.json | 2048×2048 | 543 Ko | oui | C | texture réelle mais couleur contraire au nom (rouge, bleu, rose) | supprimer |
| `/materiaux/velours-foret/roughness.webp` | data/materials-pbr.json | 2048×2048 | 1737 Ko | oui | C | texture réelle mais couleur contraire au nom (rouge, bleu, rose) | supprimer |
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
| `/og.png` | connexion/page.tsx, experience/page.tsx | 1200×630 | 58 Ko | outil | — | icône / partage, technique | garder (technique) jusqu'au remplacement |
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
