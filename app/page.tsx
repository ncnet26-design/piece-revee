import Link from "next/link";
import { MATERIALS, PLACES, PLANTS, STYLES } from "@/content/index";
import { StyleCard } from "@/components/cards";
import { MaterialSwatch } from "@/components/Visual";
import { Photo } from "@/components/Photo";
import { PLANS } from "@core/plans.ts";
import { formatEuros } from "@core/money.ts";
import { COLLECTIONS, bestLandscape, byCollection } from "@/lib/photos";
import { REAL_TEXTURES } from "@/lib/textures";
import { RETAILERS } from "@/lib/retailers";
import { meta } from "@/lib/seo";
import { HomeTools } from "@/components/HomeTools";
import { Presentations } from "@/components/Presentations";
import { HomeBoard } from "@/components/HomeBoard";
import { MaterialsMarquee, RevealOnScroll } from "@/components/Motion";
import { VARIANT_COUNT, familyById } from "@/lib/showroom/catalog";

const DESIGN_OBJECTS = familyById.get("objets")!.axes.reduce((n, a) => n * a.options.length, 1);
import { LIBRARY_MODELS, frenchName } from "@/lib/home3d/library";

const SHOWCASE = ["mid_century_lounge_chair", "modern_arm_chair_01", "gallinera_chair", "modern_ceiling_lamp_01", "Chandelier_01", "marble_bust_01", "ceramic_vase_04", "brass_vase_03"]
  .map((id) => LIBRARY_MODELS.find((m) => m.id === id)!).filter(Boolean);

export const metadata = meta({ title: "Pièce Rêvée · Votre intérieur rêvé, réellement faisable", description: "Visitez et transformez votre logement en 3D, avec de vraies matières et de vrais meubles à acheter. Architecture d'intérieur et paysage pour tous.", path: "/" });

/** Matières mises en avant : d'abord celles qui ont une vraie texture photographiée. */
const FEATURED = ["m-chene", "m-travertin", "m-terrazzo", "m-lin", "m-velours", "m-zellige", "m-carrare", "m-tomette", "m-brique", "m-cannage", "m-beton", "m-noyer"]
  .map((id) => MATERIALS.find((m) => m.id === id)!).filter(Boolean)
  .sort((a, b) => Number(b.id in REAL_TEXTURES) - Number(a.id in REAL_TEXTURES)).slice(0, 8);

export default function Home() {
  const pass = PLANS.find((p) => p.id === "pass")!;
  const collections = COLLECTIONS.map((c) => ({ ...c, photo: bestLandscape(byCollection(c.id)) })).filter((c) => c.photo).slice(0, 6);
  return (
    <>
      {/* ——— Ouverture ——— */}
      <section className="pb-12 pt-8 text-center sm:pt-16">
        <h1 className="mx-auto max-w-[18ch] text-[clamp(44px,6.6vw,96px)] leading-[.98]">Votre intérieur rêvé, <em>réellement faisable.</em></h1>
        <p className="mx-auto mt-6 max-w-[56ch] text-[17px] text-muted sm:text-[19px]">Transformez une photo de votre pièce, composez des planches de vraies matières en 3D, générez des concepts éditoriaux, puis retrouvez chaque référence chez les enseignes.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link className="btn btn-lg btn-primary" href="/transformer/">Transformer ma pièce</Link>
          <Link className="btn btn-lg" href="/showroom/">Explorer le showroom</Link>
        </div>
        <p className="mt-5 text-[13.5px] text-muted">Gratuit, sans compte · {Object.keys(REAL_TEXTURES).length + 13} matières photographiées · {LIBRARY_MODELS.length + DESIGN_OBJECTS} objets 3D · {VARIANT_COUNT.toLocaleString("fr-FR")} déclinaisons</p>
      </section>
      <RevealOnScroll />
      <HomeTools />
      <MaterialsMarquee />
      <div data-reveal><HomeBoard /></div>

      {/* ——— Enseignes ——— */}
      <section className="mt-16 border-y border-line py-6" aria-label="Enseignes vers lesquelles mènent nos liens">
        <p className="text-center text-[12.5px] uppercase tracking-[.18em] text-muted">Retrouvez les produits chez</p>
        <ul className="m-0 mt-4 flex list-none flex-wrap items-center justify-center gap-x-10 gap-y-3 p-0 font-display text-[clamp(20px,2.2vw,28px)] text-ink/70">
          {RETAILERS.map((r) => <li key={r.id}>{r.name}</li>)}
        </ul>
      </section>

      {/* ——— Promesse ——— */}
      <section className="mx-auto mt-24 max-w-[980px] text-center sm:mt-32">
        <span className="eyebrow">Pièce Rêvée</span>
        <p className="mt-5 font-display text-[clamp(30px,4.2vw,54px)] leading-[1.12]">Du plan à la dernière poignée de porte, <em className="text-muted">chaque choix</em> se voit avant d'être fait, et s'achète pour de vrai.</p>
      </section>

      {/* ——— Présentations ——— */}
      <section data-reveal className="section" aria-labelledby="h-pres">
        <div className="vhead"><div><h2 id="h-pres" className="h2">Des présentations <em>prêtes à partager.</em></h2><p>Chaque projet devient une planche éditoriale : l'image de la pièce, la matière vedette et toutes les références assorties.</p></div><Link className="btn" href="/concept/">Générer un concept</Link></div>
        <Presentations />
      </section>

      {/* ——— Matières ——— */}
      <section data-reveal className="section">
        <div className="vhead"><div><span className="eyebrow">Matériauthèque</span><h2 className="h2 mt-2">Des matières <em>vraies</em>, pas des imitations</h2><p>{MATERIALS.length} matières documentées : origine, usages, entretien, pose, prix indicatif et alternative économique.</p></div><Link className="btn" href="/matieres/">Toutes les matières</Link></div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {FEATURED.map((m) => (
            <Link key={m.id} href={`/matieres/${m.slug}/`} className="group text-ink no-underline">
              <span className="block overflow-hidden rounded-[var(--r)] bg-soft" style={{ aspectRatio: "1 / 1" }}>
                <MaterialSwatch texture={m.texture} colors={m.colors} seed={m.id} width={420} height={420} label={`Échantillon dessiné : ${m.name}`} className="h-full w-full transition-transform duration-700 group-hover:scale-[1.05]" />
              </span>
              <span className="mt-3 block font-display text-[22px] leading-tight">{m.name}</span>
              <span className="text-[13px] text-muted">{m.family} · {m.priceRange}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* ——— Bibliothèque 3D ——— */}
      <section data-reveal className="section">
        <div className="vhead"><div><span className="eyebrow">Bibliothèque 3D</span><h2 className="h2 mt-2">Des objets <em>photographiés</em>, pas dessinés</h2><p>{LIBRARY_MODELS.length} meubles et objets numérisés en 3D (licence libre) à poser sur vos planches et dans votre visite.</p></div><Link className="btn" href="/planche/">Les essayer</Link></div>
        <ul className="m-0 grid list-none grid-cols-3 gap-3 p-0 sm:grid-cols-4 lg:grid-cols-8">
          {SHOWCASE.map((m) => (
            <li key={m.id} className="rounded-[var(--r)] bg-soft p-3 text-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`/models/thumbs/${m.id}.webp`} alt="" width={240} height={240} loading="lazy" className="mx-auto aspect-square w-full object-contain" />
              <span className="mt-2 block truncate text-[12.5px]">{frenchName(m)}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* ——— Biens d'exception ——— */}
      {collections.length > 0 && (
        <section className="section">
          <div className="vhead"><div><span className="eyebrow">Inspirations</span><h2 className="h2 mt-2">Châteaux, gîtes, lofts : <em>s'inspirer du réel</em></h2><p>Des photos libres de droits de vrais lieux, classées par type de bien.</p></div><Link className="btn" href="/galerie/">Toutes les inspirations</Link></div>
          <div className="grid gap-4 md:grid-cols-6">
            {collections.map((c, i) => (
              <Link key={c.id} href={`/galerie/?collection=${c.id}`} className={`group relative block overflow-hidden rounded-[var(--r-l)] text-white no-underline ${i === 0 ? "md:col-span-4 md:row-span-2" : "md:col-span-2"}`} style={{ aspectRatio: i === 0 ? "4 / 3" : "4 / 3" }}>
                <Photo photo={c.photo!} inLink className="absolute inset-0 h-full w-full [&>img]:transition-transform [&>img]:duration-700 group-hover:[&>img]:scale-[1.04]" />
                <span aria-hidden="true" className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                <span className="pointer-events-none absolute bottom-0 left-0 p-5"><span className="block font-display text-[clamp(24px,2.4vw,34px)] leading-tight">{c.label}</span><span className="mt-1 block max-w-[40ch] text-[13.5px] text-white/80">{c.blurb}</span></span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ——— Acheter pour de vrai ——— */}
      <section className="section grid items-center gap-10 rounded-[var(--r-l)] bg-soft p-8 sm:p-14 lg:grid-cols-2">
        <div>
          <span className="eyebrow">Vrais meubles, vraies enseignes</span>
          <h2 className="h2 mt-2">Ce que vous voyez, <em>vous pouvez l'acheter</em></h2>
          <p className="mt-4 max-w-[52ch] text-muted">Chaque meuble, chaque sol, chaque peinture de votre projet mène directement aux produits correspondants chez les grandes enseignes françaises, avec leurs prix et leurs disponibilités du jour.</p>
          <Link className="btn btn-primary mt-6" href="/visite-3d/">Essayer dans ma pièce</Link>
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/visuels/hero-3d.webp" width={2000} height={1125} loading="lazy" alt="Salon de la visite 3D : canapé en velours bleu, parquet en point de Hongrie, ouverture sur la terrasse" className="h-auto w-full rounded-[var(--r)] shadow-[var(--shadow)]" />
      </section>

      {/* ——— Comment ça marche ——— */}
      <section data-reveal className="section">
        <span className="eyebrow">Comment ça marche</span>
        <div className="mt-6 grid gap-10 md:grid-cols-3">
          {[["Dessinez", "Vos pièces aux vraies mesures, vos portes et fenêtres, ou partez d'un modèle : studio, deux-pièces, maison avec jardin."],
            ["Composez", "Murs, sols, meubles, tissus, styles : essayez tout en 3D, avec les conseils de Camille et les bons repères d'aménagement."],
            ["Réalisez", "Liste d'achats chez les vraies enseignes, guides pas à pas, artisans : votre projet passe du rêve au chantier."]].map(([t, d], i) => (
            <div key={t} className="border-t border-ink pt-5">
              <span className="font-display text-[56px] leading-none text-bronze">0{i + 1}</span>
              <h3 className="mt-3 text-[34px]">{t}</h3>
              <p className="mt-2 text-muted">{d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ——— Styles ——— */}
      <section className="section">
        <div className="vhead"><div><span className="eyebrow">Styles</span><h2 className="h2 mt-2">Japandi, art déco, <em>méditerranéen</em>…</h2></div><Link className="btn" href="/styles/">Tous les styles</Link></div>
        <div className="grid-cards">{STYLES.filter((_, i) => i % 3 === 0).slice(0, 4).map((s) => <StyleCard key={s.id} s={s} />)}</div>
      </section>

      {/* ——— Offre ——— */}
      <section className="section relative overflow-hidden rounded-[var(--r-l)] bg-[#161512] p-8 text-[#F2EEE6] sm:p-14" style={{ colorScheme: "dark" }}>
        <span className="font-ui text-[11.5px] font-semibold uppercase tracking-[.2em] text-[#D2AE7E]">Sans abonnement</span>
        <h2 className="mt-3 max-w-[18ch] text-[clamp(36px,5vw,64px)] text-white">Une pièce à refaire ? <em className="text-[#D2AE7E]">Commencez gratuitement.</em></h2>
        <p className="mt-4 max-w-[56ch] text-[#B9B2A6]">Visite 3D, matériauthèque et une étude complète offertes. Le Pass Projet donne 3 études, 30 rendus HD et Camille illimitée pendant 30 jours pour {formatEuros(pass.priceTtc)}.</p>
        <div className="mt-7 flex flex-wrap gap-3"><Link className="btn btn-lg btn-light" href="/visite-3d/">Commencer</Link><Link className="btn btn-lg border-white/30 bg-transparent text-white hover:border-white" href="/tarifs/">Voir les tarifs</Link></div>
        <p className="mt-10 text-[12.5px] text-[#8C857A]">{MATERIALS.length} matières · {PLACES.length} lieux d'exception · {PLANTS.length} plantes · {STYLES.length} styles</p>
      </section>
    </>
  );
}
