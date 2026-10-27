# Banc d'essai des rendus

Mettez ici les photos d'évaluation (30 au total, dont au moins 8 extérieures), **uniquement sous licence libre** (Unsplash, Pexels, CC0, CC BY) ou vos propres photos.

1. Copiez les fichiers dans `eval/photos/` (JPEG).
2. Complétez `eval/manifest.json` : pour chaque photo, l'espace, le style visé, la source et la licence.
3. Lancez `pnpm eval:renders` avec les clés des fournisseurs à comparer (variables `FAL_KEY`, `REPLICATE_API_TOKEN`, `CLOUDFLARE_*`).

Le script produit `eval/report.html` : photo d'origine et rendus côte à côte, temps et coût par image, et une colonne de notation humaine (fidèle ou non, artefacts).
Coût indicatif d'un passage complet : 30 photos × 3 fournisseurs ≈ 3 à 6 € (à financer par l'enveloppe IA).
