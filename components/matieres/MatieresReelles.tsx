import Link from "next/link";
import data from "@/data/catalogue.json";
import matieres4k from "@/content/data/matieres-4k.json";
import { NOM_GAMME, troisParGamme, type Gamme, type ProduitAchetable } from "@/lib/catalogue-achetable";

type Credit = { source: string; id: string; nom: string; auteurs: string[]; licence: string; url: string; dimensions_m: number[] | null; largeur: number; hauteur: number };

/** Nom affiché et libellé « matière » des produits du catalogue, par texture. */
export const MATIERES_REELLES: Record<string, { nom: string; produits?: string }> = {
  "chene-huile": { nom: "Chêne huilé", produits: "chêne" }, "chene-fume": { nom: "Chêne fumé", produits: "chêne" },
  "parquet-point-de-hongrie": { nom: "Parquet point de Hongrie", produits: "chêne" }, noyer: { nom: "Noyer", produits: "noyer" },
  travertin: { nom: "Travertin", produits: "travertin" }, "marbre-carrare": { nom: "Marbre blanc veiné", produits: "marbre" },
  terrazzo: { nom: "Terrazzo", produits: "terrazzo" }, "beton-cire": { nom: "Béton lissé", produits: "béton" }, "enduit-chaux": { nom: "Enduit à la chaux" },
  "lin-lave": { nom: "Lin lavé, bleu", produits: "lin" }, bouclette: { nom: "Bouclette", produits: "bouclette" }, velours: { nom: "Velours", produits: "velours" },
  cuir: { nom: "Cuir", produits: "cuir" }, rotin: { nom: "Rotin tressé", produits: "rotin" }, brique: { nom: "Brique" },
  "terre-cuite-emaillee": { nom: "Terre cuite émaillée", produits: "céramique" }, "terre-cuite": { nom: "Carreaux de terre cuite", produits: "terre cuite" },
  "pierre-calcaire": { nom: "Pierre calcaire", produits: "pierre" }, ardoise: { nom: "Ardoise" },
};

const prix = (n: number) => n.toLocaleString("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: n % 1 ? 2 : 0 });

/**
 * Matériauthèque en textures réelles (photographies CC0 en 4K), présentée comme une planche de matières d'architecte :
 * code, échantillon, source et échelle réelle, puis trois produits achetables (un par gamme).
 */
export function MatieresReelles() {
  const credits = matieres4k as Record<string, Credit>;
  const produits = (data as { produits: ProduitAchetable[] }).produits;
  const liste = Object.keys(MATIERES_REELLES).filter((k) => credits[k]);
  if (!liste.length) return null;
  return (
    <section aria-labelledby="h-reelles" className="mb-24">
      <p className="eyebrow">Planche de matières</p>
      <h2 id="h-reelles" className="mt-3 max-w-[20ch] text-[clamp(36px,4.6vw,64px)]">De vraies matières, <em>photographiées en 4K.</em></h2>
      <p className="mt-4 max-w-[62ch] text-[15px] text-muted">Textures photographiées libres de droits (Poly Haven, ambientCG), à leur échelle réelle. Chaque matière renvoie à trois pièces en vente : petit budget, budget moyen et haut de gamme.</p>
      <ol className="mt-12 grid list-none gap-x-6 gap-y-16 p-0 sm:grid-cols-2 lg:grid-cols-3">
        {liste.map((k, i) => {
          const c = credits[k]!, m = MATIERES_REELLES[k]!;
          const base = `/matieres/${k}`;
          const trio = m.produits ? troisParGamme(produits, m.produits) : {};
          return (
            <li key={k} className="flex flex-col">
              <a href={`${base}/original-4k.webp`} target="_blank" rel="noopener" className="group relative block aspect-square overflow-hidden bg-soft">
                <picture>
                  <source type="image/avif" srcSet={`${base}/640.avif 640w, ${base}/1280.avif 1280w, ${base}/1920.avif 1920w, ${base}/3840.avif 3840w`} sizes="(min-width:1024px) 31vw, (min-width:640px) 48vw, 100vw" />
                  <img src={`${base}/1280.webp`} srcSet={`${base}/640.webp 640w, ${base}/1280.webp 1280w, ${base}/1920.webp 1920w, ${base}/3840.webp 3840w`} sizes="(min-width:1024px) 31vw, (min-width:640px) 48vw, 100vw"
                    alt={`${m.nom} : texture photographiée`} width={1280} height={1280} loading={i < 3 ? "eager" : "lazy"} decoding="async" className="size-full object-cover transition duration-700 group-hover:scale-[1.04]" />
                </picture>
                <span className="absolute right-3 top-3 bg-surface/90 px-2 py-1 font-mono text-[10.5px] text-ink">MAT-{String(i + 1).padStart(2, "0")}</span>
                <span className="absolute bottom-3 right-3 bg-ink/80 px-2 py-1 text-[11px] text-white opacity-0 transition group-hover:opacity-100 group-focus-visible:opacity-100">Voir en 4K ↗</span>
              </a>
              <div className="mt-4 flex items-baseline justify-between gap-3 border-b border-line pb-2">
                <h3 className="font-display text-[26px] font-normal leading-tight">{m.nom}</h3>
                {c.dimensions_m && <span className="shrink-0 font-mono text-[11px] text-muted">{c.dimensions_m.map((d) => d.toLocaleString("fr-FR", { maximumFractionDigits: 2 })).join(" × ")} m</span>}
              </div>
              <p className="mt-2 text-[11px] text-muted">{c.source} · {c.nom} · {c.auteurs.join(", ")} · {c.licence} · <a href={c.url} target="_blank" rel="noopener noreferrer" className="underline">source</a></p>
              {m.produits && (
                <ul className="mt-4 list-none divide-y divide-line border-y border-line p-0">
                  {(["petit", "moyen", "haut"] as Gamme[]).map((g) => {
                    const p = trio[g];
                    return (
                      <li key={g} className="flex items-baseline gap-3 py-2.5 text-[13px]">
                        <span className="w-[7.5rem] shrink-0 text-[10.5px] font-semibold uppercase tracking-[.12em] text-muted">{NOM_GAMME[g]}</span>
                        {p ? (
                          <a href={p.url} target="_blank" rel="noopener noreferrer nofollow" className="min-w-0 flex-1 no-underline hover:underline">
                            <span className="line-clamp-1">{p.nom}</span><span className="text-muted"> · {p.enseigne}</span><span className="sr-only"> (nouvel onglet)</span>
                          </a>
                        ) : <span className="flex-1 text-muted">Pas encore de produit vérifié</span>}
                        {p && <span className="shrink-0 font-semibold tabular-nums">{prix(p.prix)}</span>}
                      </li>
                    );
                  })}
                </ul>
              )}
              {m.produits && <Link href={`/boutique/?matiere=${encodeURIComponent(m.produits)}#selection`} className="mt-3 self-start text-[13px] underline decoration-[var(--bronze)] underline-offset-4">Toutes les pièces en {m.produits}</Link>}
            </li>
          );
        })}
      </ol>
      <p className="mt-10 text-[11.5px] text-muted">Prix relevés et vérifiés sur les pages des enseignes (date sur la page catalogue). Liste complète des sources : crédits des matières.</p>
    </section>
  );
}
