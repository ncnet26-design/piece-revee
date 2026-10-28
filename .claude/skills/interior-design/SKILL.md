---
name: interior-design
description: Raisonnement d'architecte d'intérieur pour Pièce Rêvée : lire une pièce, volumes, ouvertures, circulations, échelle du mobilier, palettes, styles de la banque d'inspiration, briefs IA sans marque, critique d'un rendu. À utiliser pour rédiger un brief, composer une scène 3D, enrichir la banque d'inspiration ou juger une proposition.
---

# Architecture intérieure

## Rôle
Penser comme un architecte d'intérieur. On part de l'espace, de la lumière et de l'usage, puis on choisit les matières, et seulement à la fin le mobilier. Les produits viennent en dernier.

## Quand l'utiliser
- Pour rédiger ou corriger un brief (champ `brief` et `prompt` de `content/data/inspiration-bank.json`, `workers/ia/src/prompts.ts`).
- Pour composer ou modifier une scène 3D (`lib/studio/scene.ts`).
- Pour analyser une image d'inspiration ou critiquer un rendu.

## Principes
- **Lire la pièce.**
  - Relever les murs, les ouvertures, la hauteur sous plafond, l'orientation de la lumière et ce qui est à garder (cheminée, moulures, sol).
  - Séparer ce qui est vu, mesuré, estimé et inconnu.
  - Ne jamais conclure qu'un mur est non porteur à partir d'une image.
- **Repères dimensionnels.**
  - Circulation de 80 à 90 cm.
  - Canapé : 40 à 45 cm jusqu'à la table basse ; profondeur de 85 à 95 cm.
  - Table basse : la moitié aux deux tiers de la longueur du canapé.
  - Assise à 42–45 cm.
  - Tapis sous les pieds avant, avec 20 à 30 cm de sol visible autour.
- **Lumière en trois couches** : générale, d'ambiance et d'accent. Les températures restent cohérentes (2700 à 3000 K le soir).
- **Palette 60 / 30 / 10.**
  - Une dominante, une secondaire et un accent.
  - Les métaux sont répétés deux ou trois fois.
  - Au plus trois essences ou pierres par pièce.
- **Styles de référence** (banque d'inspiration) :
  - Parisien contemporain, Haussmannien rénové, Minimalisme chaleureux, Scandinave haut de gamme ;
  - Japandi, Brutalisme raffiné, Mid-century, Art déco contemporain ;
  - Méditerranéen contemporain, Maison de campagne élégante, Luxe discret, Contemporain sculptural.
  - Chacun a sa palette, ses matières et ses pièces types.
- **Mobilier original.** Les briefs décrivent des formes, des proportions et des matières, jamais une marque ni un modèle commercial.

## Étapes
1. Usage : qui vit là, ce que l'on y fait, ce que l'on garde.
2. Lumière : les ouvertures, l'heure et l'ambiance voulue.
3. Matières : sol, murs, puis une pièce maîtresse. On choisit des identifiants de `content/data/materials-premium.json`.
4. Implantation : les circulations d'abord, puis les assises, puis les tables et l'éclairage.
5. Brief : une phrase d'ambiance, puis les pièces avec forme, matière et finition, puis les contraintes à conserver.
6. Contrôle du rendu :
   - géométrie et ouvertures inchangées, échelle crédible, matières lisibles ;
   - aucune modification non demandée.

## Erreurs à éviter
- Accumuler des styles.
- Tout aligner contre les murs.
- Choisir un tapis trop petit ou une table basse trop haute.
- Mettre cinq bois différents dans une même pièce.
- Utiliser un éclairage uniquement zénithal.
- Citer des marques dans un brief.
- Annoncer une conformité électrique ou de plomberie.

## Critères d'acceptation
- Chaque proposition nomme l'espace, la lumière, trois à cinq matières de la bibliothèque et une pièce maîtresse.
- Les dimensions annoncées respectent les repères. Toute estimation est signalée comme telle.
- Le brief ne contient aucun nom de marque.

## Exemples
- Brief Japandi : « Séjour japandi baigné d'une lumière du matin. Sol en chêne fumé, murs en enduit à la chaux. Banquette basse en lin lavé, table basse ronde en chêne massif aux arêtes adoucies. Une céramique en terre cuite. Mobilier original, sans marque, perspective et fenêtres conservées. »
- Critique : « Le canapé paraît profond de 1,30 m : à ramener à 95 cm. Le tapis s'arrête avant les pieds avant : passer à 240 × 300. »
