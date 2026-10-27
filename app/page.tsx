import Link from "next/link";
import { MATERIALS, PLACES, PLANTS, STYLES } from "@/content/index";
import { HomeInspirations } from "@/components/HomeBits";
import { StyleCard } from "@/components/cards";
import { MaterialSwatch } from "@/components/Visual";
import { Photo } from "@/components/Photo";
import { PLANS } from "@core/plans.ts";
import { formatEuros } from "@core/money.ts";
import { COLLECTIONS, bestLandscape, byCollection } from "@/lib/photos";
import { REAL_TEXTURES } from "@/lib/textures";
import { RETAILERS } from "@/lib/retailers";
import { meta } from "@/lib/seo";

export const metadata = meta({ title: "Pièce Rêvée · Votre intérieur rêvé, réellement faisable", description: "Visitez et transformez votre logement en 3D, avec de vraies matières et de vrais meubles à acheter. Architecture d'intérieur et paysage pour tous.", path: "/" });

/** Matières mises en avant : d'abord celles qui ont une vraie texture photographiée. */
const FEATURED = ["m-chene", "m-travertin", "m-terrazzo", "m-lin", "m-velours", "m-zellige", "m-carrare", "m-tomette", "m-brique", "m-cannage", "m-beton", "m-noyer"]
  .map((id) => MATERIALS.find((m) => m.id === id)!).filter(Boolean)
  .sort((a, b) => Number(b.id in REAL_TEXTURES) - Number(a.id in REAL_TEXTURES)).slice(0, 8);

export default function Home() {
  const pass = PLANS.find((p) => p.id === "pass")!;
  const hero = bestLandscape(byCollection("interieurs")) ?? bestLandscape(byCollection("villas"));
  const collections = COLLECTIONS.map((c) => ({ ...c, photo: bestLandscape(byCollection(c.id)) })).filter((c) => c.photo).slice(0, 6);
  return (
    <>
      {/* ——— Ouverture plein écran ——— */}
      <section className="relative left-1/2 -mt-7 w-screen -translate-x-1/2 overflow-hidden bg-[#161512] text-white" style={{ minHeight: "min(92svh, 920px)" }}>
        {hero
          ? <Photo photo={hero} priority className="absolute inset-0 h-full w-full [&>img]:opacity-90" />
          // eslint-disable-next-line @next/next/no-img-element
          : <img src="/visuels/hero-3d.webp" alt="Salon en 3D réalisé avec Pièce Rêvée : canapé en velours, parquet de chêne, vue sur le jardin" className="absolute inset-0 h-full w-full object-cover opacity-90" fetchPriority="high" />}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-black/10" />
        <div className="wrap relative flex min-h-[inherit] flex-col justify-end pb-14 pt-32 sm:pb-20" style={{ minHeight: "min(92svh, 920px)" }}>
          <span className="font-ui text-[12px] font-semibold uppercase tracking-[.22em] text-[#E9DCC6]">Architecture d'intérieur et paysage pour tous</span>
          <h1 className="mt-4 max-w-[14ch] text-[clamp(52px,9vw,128px)] leading-[.92] text-white">Votre intérieur rêvé, <em className="text-[#E9DCC6]">réellement</em> faisable.</h1>
          <p className="mt-6 max-w-[52ch] text-[17px] text-white/85 sm:text-lg">Dessinez votre logement, visitez-le en 3D, essayez de vraies matières et de vrais meubles, puis achetez-les en un clic chez les enseignes que vous connaissez.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link className="btn btn-lg btn-light" href="/visite-3d/">Visiter en 3D</Link>
            <Link className="btn btn-lg border-white/40 bg-transparent text-white hover:border-white" href="/projet/">Transformer mon espace</Link>
          </div>
        </div>
      </section>

      {/* ——— Promesse ——— */}
      <section className="mx-auto mt-24 max-w-[980px] text-center sm:mt-32">
        <span className="eyebrow">Pièce Rêvée</span>
        <p className="mt-5 font-display text-[clamp(30px,4.2vw,54px)] leading-[1.12]">Du plan à la dernière poignée de porte, <em className="text-bronze">chaque choix</em> se voit avant d'être fait, et s'achète pour de vrai.</p>
      </section>

      {/* ——— Trois façons ——— */}
      <section className="section grid gap-5 md:grid-cols-3" aria-label="Ce que vous pouvez faire">
        {[
          { href: "/visite-3d/", img: "/visuels/visite-3d.webp", kicker: "01 · Visite 3D", title: "Promenez-vous chez vous", text: "Dessinez vos pièces aux vraies mesures, puis déplacez-vous de l'entrée au jardin. Tout se modifie d'un geste." },
          { href: "/projet/", img: "/visuels/etude.webp", kicker: "02 · Étude sur photo", title: "Une photo, un projet complet", text: "Palette, plan annoté, liste d'achats et tutos, à partir d'une simple photo de votre pièce." },
          { href: "/matieres/", img: "/visuels/matieres.webp", kicker: "03 · Matériauthèque", title: "De vraies matières", text: "Parquets, pierres, tissus, enduits : textures photographiées, fiches d'entretien et prix indicatifs." },
        ].map((f) => (
          <Link key={f.href} href={f.href} className="group relative block overflow-hidden rounded-[var(--r-l)] bg-[#161512] text-white no-underline" style={{ aspectRatio: "4 / 5" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={f.img} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover opacity-90 transition-transform duration-700 group-hover:scale-[1.04]" />
            <span aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
            <span className="absolute inset-x-0 bottom-0 flex flex-col gap-2 p-6">
              <span className="font-ui text-[11.5px] font-semibold uppercase tracking-[.2em] text-[#E9DCC6]">{f.kicker}</span>
              <span className="font-display text-[32px] leading-[1.05]">{f.title}</span>
              <span className="text-[14.5px] text-white/80">{f.text}</span>
            </span>
          </Link>
        ))}
      </section>

      {/* ——— Matières ——— */}
      <section className="section">
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

      {/* ——— Biens d'exception ——— */}
      {collections.length > 0 && (
        <section className="section">
          <div className="vhead"><div><span className="eyebrow">Inspirations</span><h2 className="h2 mt-2">Châteaux, gîtes, lofts : <em>s'inspirer du réel</em></h2><p>Des photos libres de droits de vrais lieux, classées par type de bien.</p></div><Link className="btn" href="/galerie/">Toutes les inspirations</Link></div>
          <div className="grid gap-4 md:grid-cols-6">
            {collections.map((c, i) => (
              <Link key={c.id} href={`/galerie/?collection=${c.id}`} className={`group relative block overflow-hidden rounded-[var(--r-l)] text-white no-underline ${i === 0 ? "md:col-span-4 md:row-span-2" : "md:col-span-2"}`} style={{ aspectRatio: i === 0 ? "4 / 3" : "4 / 3" }}>
                <Photo photo={c.photo!} className="absolute inset-0 h-full w-full [&>img]:transition-transform [&>img]:duration-700 group-hover:[&>img]:scale-[1.04]" />
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
        <ul className="m-0 grid list-none grid-cols-2 gap-3 p-0 sm:grid-cols-3">
          {RETAILERS.map((r) => <li key={r.id} className="rounded-[var(--r-s)] border border-line bg-surface px-4 py-5 text-center font-ui text-[15px] font-semibold">{r.name}</li>)}
        </ul>
      </section>

      {/* ——— Galerie par style ——— */}
      <section className="section">
        <div className="vhead"><div><span className="eyebrow">Galerie</span><h2 className="h2 mt-2">Reconnaissez <em>votre</em> style</h2><p>{STYLES.length} styles d'intérieur et de jardin, expliqués simplement et applicables à votre pièce.</p></div><Link className="btn" href="/quiz/">Faire le quiz</Link></div>
        <HomeInspirations />
      </section>

      {/* ——— Comment ça marche ——— */}
      <section className="section">
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
