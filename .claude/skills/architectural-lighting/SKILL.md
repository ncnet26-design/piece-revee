---
name: architectural-lighting
description: Éclairage photographique crédible dans les scènes 3D et les consignes IA de Pièce Rêvée : lumière des fenêtres, HDR d'intérieur, ombres douces, exposition, balance des blancs. À utiliser pour régler lib/studio/engine.ts ou écrire un brief de rendu.
---

# Éclairage architectural

## Dans le moteur (`lib/studio/engine.ts`)
- Lumière principale = soleil entrant par les fenêtres du mur du fond (`DirectionalLight` chaude 5000–5600 K équivalent, ombres PCF douces, `radius` 6, carte 2048 sur ordinateur).
- Lumière d'ambiance = HDR d'intérieur photographié (`/3d/apartment.exr`, intensité 0,75) — c'est lui qui donne les reflets crédibles sur métaux et vernis.
- Occlusion ambiante GTAO (qualité « haute ») pour les ombres de contact ; désactivée sur appareil modeste.
- Tone mapping `NeutralToneMapping`, exposition ≈ 1,05 : couleurs de matières fidèles, pas de blancs brûlés.
- Rendu final : lancer de rayons (rebonds 6) → lumière indirecte réelle.

## Contrôle
- Hautes lumières brûlées < 0,5 % (`scripts/rendu-controle.mjs`), noirs avec détail, ombres cohérentes avec la fenêtre.
- Pas de halo artificiel, pas de lumière qui « vient de nulle part ».

## Consigne IA (extrait réutilisable)
« soft natural daylight with physically correct bounce light and soft contact shadows, no blown highlights » (déjà dans `workers/ia/src/prompts.ts`).
