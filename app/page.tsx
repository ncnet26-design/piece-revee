import Link from "next/link";
import { BeforeAfter } from "@/components/BeforeAfter";
import { ShopTheLook } from "@/components/ShopTheLook";
import { ChoixPieceStyle, type Apercu } from "@/components/home/ChoixPieceStyle";
import catalogue from "@/data/catalogue.json";
import indexCatalogue from "@/public/catalogue/index.json";
import { MarquesDefilantes } from "@/components/home/MarquesDefilantes";
import { OffreTeaser } from "@/components/OffreTeaser";
import { MentionIA } from "@/components/MentionIA";
import { GAMMES, NOM_STYLE, PIECES, STYLES as STYLES_CATALOGUE, type ProduitAchetable } from "@/lib/catalogue-achetable";
import { meta } from "@/lib/seo";
import { lienUnsplash, PHOTOS_STYLES, srcsetUnsplash, tailleUnsplash, type PhotoStyle } from "@/lib/inspirations-photos";
import { PhotoUnsplash } from "@/components/inspirations/PhotoUnsplash";
import { Photo } from "@/components/Photo";

export const metadata = meta({ title: "Pièce Rêvée · Studio d'architecture intérieure", description: "Photographiez votre pièce, ajoutez vos inspirations : votre pièce transformée, et chaque meuble, couleur ou matière cliquable pour l'acheter.", path: "/" });

/** Enseignes présentes sur le site : celles du catalogue vérifié et celles relevées par le robot. */
const MARQUES = [...new Set([...(catalogue as { produits: ProduitAchetable[] }).produits.map((p) => p.enseigne), ...Object.keys((indexCatalogue as { vendeurs: Record<string, number> }).vendeurs)])]
  .sort((a, b) => a.localeCompare(b, "fr"));
/** Vraies photos (Unsplash) pour l'ouverture et les portes d'entrée. */
const OUVERTURE = PHOTOS_STYLES.haussmannien[0]!;
const PORTES: Array<[string, string, string, string | PhotoStyle]> = [
  ["/transformer/", "Transformer ma pièce", "Votre photo, vos inspirations, votre pièce transformée.", PHOTOS_STYLES.scandinave[0]!],
  ["/galerie/", "Inspirations", "Huit styles en vraies photos, reliés aux pièces en vente.", PHOTOS_STYLES.japandi[0]!],
  ["/catalogue/", "Le catalogue", "Votre style, à votre budget : des pièces réelles, vérifiées.", PHOTOS_STYLES["mid-century"][0]!],
  ["/boutique/", "La boutique", "Plus de 30 000 meubles et objets de 27 enseignes, revérifiés chaque nuit.", PHOTOS_STYLES.boheme[0]!],
];

/** Aperçu du catalogue vérifié par pièce et style : 3 pièces par gamme (calculé à la publication). */
const PRIORITE = ["canape", "lit", "table-manger", "fauteuil", "table-basse", "chaise", "rangement", "tapis", "luminaire", "lampadaire", "salle-de-bain", "robinetterie", "rideau", "deco"];
const APERCU: Apercu = (() => {
  const l = (catalogue as { produits: ProduitAchetable[] }).produits, out: Apercu = {};
  for (const p of PIECES) for (const st of STYLES_CATALOGUE) {
    const k = `${p}|${st}`; out[k] = {};
    for (const g of GAMMES) {
      const c = l.filter((x) => x.piece.includes(p) && x.styles.includes(st) && x.gamme === g).sort((a, b) => a.prix - b.prix);
      // Les grandes pièces d'abord (canapé, lit, table…), une par type de meuble.
      const rang = (f: string) => { const i = PRIORITE.indexOf(f); return i < 0 ? 99 : i; };
      const vus = new Set<string>(), ex = [...c].sort((a, b) => rang(a.famille) - rang(b.famille)).filter((x) => !vus.has(x.famille) && vus.add(x.famille)).slice(0, 3);
      if (c.length) out[k]![g] = { n: c.length, min: c[0]!.prix, exemples: ex.map((x) => ({ nom: x.nom, enseigne: x.enseigne, prix: x.prix, url: x.url })) };
    }
  }
  return out;
})();

/** Accueil : une proposition claire, des images d'abord, chaque section mène à une action réelle. */
export default function Home() {
  return (
    <>
      {/* ——— Ouverture : image plein cadre ——— */}
      <section className="bleed relative -mt-7 overflow-hidden bg-[#141712] text-white">
        <picture>
          <source type="image/avif" srcSet={srcsetUnsplash(OUVERTURE.src, "avif")} sizes="100vw" />
          <img src={tailleUnsplash(OUVERTURE.src, 1920, "webp")} srcSet={srcsetUnsplash(OUVERTURE.src, "webp")} sizes="100vw" alt="Appartement haussmannien : parquet point de Hongrie, moulures, lustre et grandes fenêtres" fetchPriority="high" decoding="async" className="absolute inset-0 size-full object-cover opacity-90" />
        </picture>
        <div aria-hidden className="absolute inset-0 bg-[linear-gradient(0deg,rgba(12,14,11,.9)_0%,rgba(12,14,11,.62)_55%,rgba(12,14,11,.3)_100%)] sm:bg-[linear-gradient(90deg,rgba(12,14,11,.82)_0%,rgba(12,14,11,.45)_45%,rgba(12,14,11,.05)_75%)]" />
        <div className="wrap relative flex min-h-[min(86vh,880px)] flex-col justify-end pb-14 pt-32 sm:pb-20">
          <p className="text-[11.5px] font-semibold uppercase tracking-[.22em] text-white/75">Studio d'architecture intérieure</p>
          <h1 className="mt-5 max-w-[13ch] text-[clamp(52px,8vw,124px)] leading-[.92] text-white">L'intérieur, dessiné <em className="text-white/70">avant d'être construit.</em></h1>
          <p className="mt-7 max-w-[46ch] text-[17px] leading-relaxed text-white/80">Photographiez votre pièce, ajoutez vos inspirations : nous la transformons dans cet esprit, et chaque meuble, couleur ou matière devient cliquable pour l'acheter.</p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Link href="/transformer/" className="btn btn-light btn-lg">Essayer gratuitement</Link>
            <Link href="/catalogue/" className="btn btn-lg border-white/40 bg-transparent text-white hover:border-white">Ouvrir le catalogue</Link>
          </div>
          <p className="mt-5 text-[13px] text-white/75">1 étude complète offerte · sans carte bancaire · des produits réels à chaque budget</p>
          <p className="mt-8 text-[11px] text-white/55">Photo <a href={lienUnsplash(OUVERTURE.auteur_url)} target="_blank" rel="noopener noreferrer" className="text-white/70 underline">{OUVERTURE.auteur}</a> sur <a href={lienUnsplash(OUVERTURE.page)} target="_blank" rel="noopener noreferrer" className="text-white/70 underline">Unsplash</a></p>
        </div>
      </section>

      <MarquesDefilantes marques={MARQUES} />

      {/* ——— Quatre portes d'entrée ——— */}
      <section aria-labelledby="h-portes" className="py-16 sm:py-20">
        <h2 id="h-portes" className="sr-only">Par où commencer</h2>
        <ul className="grid list-none gap-5 p-0 sm:grid-cols-2 lg:grid-cols-4">
          {PORTES.map(([href, t, d, img]) => (
            <li key={href}>
              <Link href={href} className="group block no-underline">
                {typeof img === "string" ? (
                  <span className="block overflow-hidden bg-soft">
                    <Photo src={img} alt="" sizes="(min-width:1024px) 25vw, (min-width:640px) 50vw, 100vw" className="aspect-[4/5] w-full object-cover transition duration-700 group-hover:scale-[1.03]" />
                  </span>
                ) : <PhotoUnsplash p={img} alt="" sizes="(min-width:1024px) 25vw, (min-width:640px) 50vw, 100vw" className="aspect-[4/5]" credit={false} />}
                <span className="mt-4 flex items-baseline justify-between gap-3">
                  <span className="font-display text-[26px] leading-tight text-ink">{t}</span>
                  <span aria-hidden className="text-muted transition group-hover:translate-x-1 group-hover:text-ink">→</span>
                </span>
                <span className="mt-1 block text-[14px] text-muted">{d}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* ——— Trois gestes ——— */}
      <section aria-labelledby="h-gestes" className="border-y border-line py-14">
        <h2 id="h-gestes" className="sr-only">Comment ça marche</h2>
        <ol className="grid list-none gap-10 p-0 md:grid-cols-3">
          {[
            ["01", "Votre pièce", "Une photo de la pièce telle qu'elle est, et vos inspirations : Pinterest, Instagram, magazine, capture d'écran."],
            ["02", "Votre moodboard", "Style, palette, matières et pièces clés tirés de vos inspirations, puis votre pièce transformée dans cet esprit."],
            ["03", "Tout est cliquable", "Touchez un meuble, un mur, un sol : des modèles et des teintes réels, à trois niveaux de prix, avec leurs liens."],
          ].map(([n, t, d]) => (
            <li key={n}>
              <p className="font-display text-[44px] leading-none text-bronze">{n}</p>
              <h3 className="mt-4 text-[19px]">{t}</h3>
              <p className="mt-2 max-w-[38ch] text-[15px] text-muted">{d}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* ——— Le concept en un geste : pièce + style → pièces réelles par budget ——— */}
      <section aria-labelledby="h-choix" className="border-t border-line py-20 sm:py-24">
        <p className="eyebrow">Votre pièce, votre style, votre budget</p>
        <h2 id="h-choix" className="mt-4 max-w-[20ch] text-[clamp(40px,5vw,72px)]">Refaire son intérieur, <em>à chaque budget.</em></h2>
        <div className="mt-12"><ChoixPieceStyle apercu={APERCU} /></div>
      </section>

      {/* ——— Shop the look ——— */}
      <section aria-labelledby="h-achat" className="py-24">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <div><p className="eyebrow">Du rendu à l'achat</p><h2 id="h-achat" className="mt-4 text-[clamp(36px,4.4vw,60px)]">Touchez une pièce, <em>trouvez-la en vente.</em></h2></div>
          <p className="max-w-[40ch] text-[14px] text-muted">Chaque élément de l'image renvoie à des produits réels de la boutique, avec leur prix relevé et le lien pour l'acheter.</p>
        </div>
        <ShopTheLook />
      </section>

      {/* ——— Personnalisation ——— */}
      <section aria-labelledby="h-perso" className="grid items-center gap-10 py-20 lg:grid-cols-[1fr_1.5fr] lg:gap-16">
        <div>
          <p className="eyebrow">Personnaliser</p>
          <h2 id="h-perso" className="mt-4 text-[clamp(36px,4.4vw,60px)]">Même pièce, <em>autre caractère.</em></h2>
          <p className="mt-6 max-w-[40ch] text-[15px] text-muted">Bouclé et noyer, ou velours vert et chêne fumé : on change une matière, le reste de la pièce ne bouge pas. Avec votre photo, chaque matière proposée mène à de vrais produits.</p>
          <Link href="/transformer/" className="btn mt-8">Essayer avec ma pièce</Link>
        </div>
        <div>
          <div className="relative">
          <BeforeAfter ratio="16 / 9" labelBefore="Bouclé et noyer" labelAfter="Velours et chêne fumé"
            before={<Photo src="/editorial/ia/salon-boucle-noyer.webp" sizes="(min-width:1024px) 60vw, 100vw" alt="Salon : canapé bouclé crème, buffet cannelé en noyer" />}
            after={<Photo src="/editorial/ia/salon-velours-chene.webp" sizes="(min-width:1024px) 60vw, 100vw" alt="Même salon : canapé en velours vert, buffet en chêne fumé" />} />
          <MentionIA className="bottom-2.5 left-2.5" />
          </div>
          <p className="mt-3 text-[12px] text-muted">Même pièce, seules deux matières changent.</p>
        </div>
      </section>


      {/* ——— Styles : vraies photos ——— */}
      <section aria-labelledby="h-styles" className="py-20">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div><p className="eyebrow">Inspirations</p><h2 id="h-styles" className="mt-4 text-[clamp(36px,4.4vw,60px)]">Huit styles, <em>en vraies photos.</em></h2></div>
          <Link href="/galerie/" className="btn">Toutes les inspirations</Link>
        </div>
        <ul className="mt-12 grid list-none grid-cols-2 gap-x-4 gap-y-10 p-0 lg:grid-cols-4">
          {STYLES_CATALOGUE.map((st) => {
            const p = PHOTOS_STYLES[st]?.[0];
            if (!p) return null;
            return (
              <li key={st} className="group relative">
                <PhotoUnsplash p={p} alt={`Intérieur ${NOM_STYLE[st].toLowerCase()} : ${p.alt}`} sizes="(min-width:1024px) 25vw, 50vw" className="aspect-[4/5]" />
                <h3 className="mt-2 font-display text-[26px] font-normal leading-tight"><Link href={`/galerie/#style-${st}`} className="no-underline after:absolute after:inset-x-0 after:top-0 after:aspect-[4/5]">{NOM_STYLE[st]}</Link></h3>
              </li>
            );
          })}
        </ul>
      </section>

      <OffreTeaser />

      {/* ——— Appel final ——— */}
      <section className="border-t border-line py-24 text-center">
        <h2 className="mx-auto max-w-[16ch] text-[clamp(40px,5.6vw,80px)]">Votre pièce, <em>en vrai.</em></h2>
        <div className="mt-9 flex flex-wrap justify-center gap-3">
          <Link href="/transformer/" className="btn btn-primary btn-lg">Faire mon étude offerte</Link>
          <Link href="/tarifs/" className="btn btn-lg btn-ghost">Voir les tarifs</Link>
        </div>
      </section>
    </>
  );
}
