# Audit visuel — mesures automatiques

Généré par `node scripts/audit-visuel.mjs` le 2026-11-03. La notation A/B/C est dans `docs/AUDIT-REFONTE.md`.

| Groupe | Images | Ratios | Saturation moyenne | Poids moyen |
|---|---:|---|---:|---:|
| Images IA : styles | 13 | 1.339 | 0.24 | 156 Ko |
| Images IA : espaces | 11 | 1.339 | 0.27 | 227 Ko |
| Images IA : matières | 13 | 1.339 | 0.28 | 132 Ko |
| Images IA : accueil et Studio | 3 | 1.491, 1.792 | 0.16 | 170 Ko |
| Gros plans de textures (composés) | 28 | 1 | 0.24 | 92 Ko |
| Planches de style (composées) | 20 | 1.333 | 0.17 | 105 Ko |
| Photographies d'architecture | 6 | 1.998, 1.778, 1.334, 1, 1.708, 1.5 | 0.17 | 187 Ko |
| Anciens visuels | 4 | 0.8, 1.778, 1.333 | 0.21 | 86 Ko |

Ratios différents sur l'ensemble : 11 (0.8, 1, 1.333, 1.334, 1.339, 1.491, 1.5, 1.708, 1.778, 1.792, 1.998).

## Styles trop proches (palette la plus semblable)

| Image | Image | Écart de palette (0 = identique) | Écart de structure (/64) |
|---|---|---:|---:|
| art-deco-contemporain-2400.webp | art-deco-contemporain.webp | 0.005 | 0 |
| chambre.webp | haussmannien-renove.webp | 0.095 | 22 |
| chambre.webp | mid-century.webp | 0.109 | 32 |
| cuisine.webp | haussmannien-renove.webp | 0.11 | 32 |
| chambre.webp | parisien-contemporain.webp | 0.111 | 28 |
| salon.webp | scandinave-haut-de-gamme.webp | 0.116 | 36 |
| chambre.webp | minimalisme-chaleureux.webp | 0.119 | 45 |
| mid-century.webp | parisien-contemporain.webp | 0.121 | 32 |
| haussmannien-renove.webp | mid-century.webp | 0.124 | 36 |
| chambre.webp | cuisine.webp | 0.127 | 32 |
| contemporain-sculptural.webp | minimalisme-chaleureux.webp | 0.14 | 29 |
| japandi-essai.webp | parisien-contemporain.webp | 0.144 | 19 |
| cuisine.webp | minimalisme-chaleureux.webp | 0.145 | 29 |
| japandi-essai.webp | mid-century.webp | 0.145 | 27 |
| japandi-essai.webp | minimalisme-chaleureux.webp | 0.146 | 36 |

## Quasi-doublons

- /editorial/ia/art-deco-contemporain-2400.webp ≈ /editorial/ia/art-deco-contemporain.webp
- /editorial/ia/salon-boucle-noyer.webp ≈ /editorial/ia/salon-velours-chene.webp
- /editorial/matieres/boucle.webp ≈ /editorial/matieres/tapis-laine.webp
- /editorial/matieres/enduit-chaux.webp ≈ /editorial/matieres/peinture-velours.webp
- /editorial/matieres/faience-blanche.webp ≈ /editorial/matieres/marbre-calacatta.webp
- /editorial/matieres/faience-blanche.webp ≈ /editorial/matieres/peinture-mate.webp
- /editorial/matieres/faience-blanche.webp ≈ /editorial/matieres/peinture-velours.webp
- /editorial/matieres/faience-blanche.webp ≈ /editorial/matieres/verre-clair.webp
- /editorial/matieres/faience-blanche.webp ≈ /editorial/matieres/verre-depoli.webp
- /editorial/matieres/marbre-calacatta.webp ≈ /editorial/matieres/peinture-mate.webp
- /editorial/matieres/marbre-calacatta.webp ≈ /editorial/matieres/peinture-velours.webp
- /editorial/matieres/marbre-calacatta.webp ≈ /editorial/matieres/verre-clair.webp
- /editorial/matieres/marbre-calacatta.webp ≈ /editorial/matieres/verre-depoli.webp
- /editorial/matieres/peinture-mate.webp ≈ /editorial/matieres/peinture-velours.webp
- /editorial/matieres/peinture-mate.webp ≈ /editorial/matieres/verre-clair.webp
- /editorial/matieres/peinture-mate.webp ≈ /editorial/matieres/verre-depoli.webp
- /editorial/matieres/peinture-velours.webp ≈ /editorial/matieres/verre-clair.webp
- /editorial/matieres/peinture-velours.webp ≈ /editorial/matieres/verre-depoli.webp
- /editorial/matieres/verre-clair.webp ≈ /editorial/matieres/verre-depoli.webp
- /editorial/planches/haussmannien-renove.webp ≈ /editorial/planches/parisien-contemporain.webp
