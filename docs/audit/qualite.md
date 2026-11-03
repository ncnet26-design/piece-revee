# Audit qualité — mesures automatiques

Généré par `node scripts/audit-qualite.mjs` le 2026-11-03 (site servi en local, Lighthouse mobile simulé).

| Page | Perf. | Access. | Bonnes pr. | SEO | LCP | CLS | TBT | Poids |
|---|---:|---:|---:|---:|---|---|---|---|
| / | 42 | 100 | 100 | 100 | 7.9 s | 0 | 2,990 ms | Total size was 906 KiB |
| /transformer/ | 94 | 100 | 100 | 100 | 0.9 s | 0.001 | 290 ms | Total size was 738 KiB |
| /galerie/ | 92 | 98 | 100 | 100 | 3.3 s | 0.001 | 100 ms | Total size was 939 KiB |
| /boutique/ | 76 | 100 | 100 | 100 | 0.9 s | 0.525 | 200 ms | Total size was 1,428 KiB |
| /showroom/ | 70 | 100 | 100 | 100 | 0.9 s | 0.01 | 12,870 ms | Total size was 985 KiB |
| /studio/ | 87 | 100 | 100 | 100 | 3.2 s | 0 | 300 ms | Total size was 839 KiB |
| /planche/ | 55 | 100 | 100 | 100 | 2.5 s | 0 | 19,790 ms | Total size was 2,406 KiB |
| /matieres/ | 68 | 100 | 100 | 100 | 3.4 s | 0 | 1,230 ms | Total size was 1,033 KiB |
| /matieres/travertin/ | 64 | 100 | 100 | 100 | 3.1 s | 0 | 3,120 ms | Total size was 911 KiB |
| /styles/ | 72 | 100 | 100 | 100 | 0.9 s | 0 | 2,090 ms | Total size was 770 KiB |
| /accords/ | 89 | 100 | 100 | 100 | 3.8 s | 0 | 50 ms | Total size was 2,269 KiB |
| /lieux/ | 99 | 100 | 96 | 100 | 0.9 s | 0 | 120 ms | Total size was 772 KiB |
| /plantes/ | 100 | 100 | 100 | 100 | 0.9 s | 0 | 70 ms | Total size was 771 KiB |
| /mobilier/ | 85 | 100 | 100 | 100 | 3.9 s | 0 | 200 ms | Total size was 1,126 KiB |

## Images servies

| Page | Écran | Images | Sans srcset (>600 px) | Trop lourdes (>1,5×) | Trop petites (floues) | Non différées hors écran | Formats | Débordement | Illustrations dessinées |
|---|---|---:|---:|---:|---:|---:|---|---|---:|
| / | mobile | 19 | 19 | 2 | 4 | 0 | webp | non | 0 |
| / | ordinateur | 19 | 19 | 19 | 0 | 0 | webp | non | 0 |
| /transformer/ | mobile | 0 | 0 | 0 | 0 | 0 |  | non | 0 |
| /transformer/ | ordinateur | 0 | 0 | 0 | 0 | 0 |  | non | 0 |
| /galerie/ | mobile | 12 | 12 | 0 | 12 | 0 | webp | non | 0 |
| /galerie/ | ordinateur | 12 | 12 | 12 | 0 | 0 | webp | non | 0 |
| /boutique/ | mobile | 0 | 0 | 0 | 0 | 0 |  | non | 0 |
| /boutique/ | ordinateur | 0 | 0 | 0 | 0 | 0 |  | non | 0 |
| /showroom/ | mobile | 0 | 0 | 0 | 0 | 0 |  | non | 17 |
| /showroom/ | ordinateur | 0 | 0 | 0 | 0 | 0 |  | non | 17 |
| /studio/ | mobile | 1 | 1 | 0 | 0 | 0 | webp | non | 0 |
| /studio/ | ordinateur | 1 | 1 | 0 | 0 | 0 | webp | non | 0 |
| /planche/ | mobile | 0 | 0 | 0 | 0 | 0 |  | non | 28 |
| /planche/ | ordinateur | 0 | 0 | 0 | 0 | 0 |  | non | 28 |
| /matieres/ | mobile | 26 | 26 | 0 | 0 | 0 | webp | non | 34 |
| /matieres/ | ordinateur | 26 | 26 | 26 | 0 | 0 | webp | non | 34 |
| /matieres/travertin/ | mobile | 3 | 3 | 1 | 0 | 0 | webp | non | 1 |
| /matieres/travertin/ | ordinateur | 3 | 3 | 3 | 0 | 0 | webp | non | 1 |
| /styles/ | mobile | 0 | 0 | 0 | 0 | 0 |  | non | 20 |
| /styles/ | ordinateur | 0 | 0 | 0 | 0 | 0 |  | non | 20 |
| /accords/ | mobile | 48 | 48 | 30 | 0 | 0 | webp | non | 42 |
| /accords/ | ordinateur | 48 | 48 | 48 | 0 | 0 | webp | non | 42 |
| /lieux/ | mobile | 0 | 0 | 0 | 0 | 0 |  | non | 40 |
| /lieux/ | ordinateur | 0 | 0 | 0 | 0 | 0 |  | non | 40 |
| /plantes/ | mobile | 0 | 0 | 0 | 0 | 0 |  | non | 0 |
| /plantes/ | ordinateur | 0 | 0 | 0 | 0 | 0 |  | non | 0 |
| /mobilier/ | mobile | 77 | 77 | 48 | 0 | 0 | webp | non | 178 |
| /mobilier/ | ordinateur | 77 | 77 | 77 | 0 | 0 | webp | non | 178 |

### Détail des images floues (mobile)

- / : /editorial/ia/salon-velours-chene-640.webp (640px pour 358px affichés ×3) ; /editorial/ia/japandi-essai-640.webp (640px pour 358px affichés ×3) ; /editorial/ia/luxe-discret-640.webp (640px pour 358px affichés ×3) ; /editorial/ia/matiere-travertin-640.webp (640px pour 358px affichés ×3)
- /galerie/ : /editorial/ia/parisien-contemporain-640.webp (640px pour 358px affichés ×3) ; /editorial/ia/haussmannien-renove-640.webp (640px pour 358px affichés ×3) ; /editorial/ia/minimalisme-chaleureux-640.webp (640px pour 358px affichés ×3) ; /editorial/ia/scandinave-haut-de-gamme-640.webp (640px pour 358px affichés ×3) ; /editorial/ia/japandi-essai-640.webp (640px pour 358px affichés ×3)
