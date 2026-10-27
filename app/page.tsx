import Link from "next/link";
import { FURNITURE, MATERIALS, PAIRINGS, PLACES, PLANTS, STYLES } from "@/content/index";
import { HeroCompare, HomeInspirations } from "@/components/HomeBits";
import { PairingCard, StyleCard } from "@/components/cards";
import { PLANS } from "@core/plans.ts";
import { formatEuros } from "@core/money.ts";
import { meta } from "@/lib/seo";

export const metadata = meta({ title: "Pièce Rêvée · Votre intérieur rêvé, réellement faisable", description: "Une photo de votre pièce ou de votre jardin : rendus de votre espace transformé, vrais produits à acheter, tutos et conseils à chaque étape.", path: "/" });

const INTERIOR = ["Salon", "Chambre", "Cuisine", "Salle de bain", "Bureau", "Entrée", "Chambre d'enfant", "Dressing", "Combles"];
const EXTERIOR = ["Jardin", "Terrasse", "Balcon", "Cour", "Allée", "Façade", "Piscine", "Potager", "Toit-terrasse"];

export default function Home() {
  const pass = PLANS.find((p) => p.id === "pass")!;
  return (
    <>
      <section className="grid items-center gap-8 pt-2 lg:grid-cols-[1fr_1.05fr]">
        <div>
          <span className="eyebrow">Architecture d'intérieur et paysage pour tous</span>
          <h1 className="mt-2 font-display text-[clamp(40px,6.4vw,86px)] font-extrabold leading-[.95] tracking-[-.045em]">
            Votre intérieur rêvé, <em className="not-italic text-accent">réellement</em> faisable.
          </h1>
          <p className="my-5 max-w-[46ch] text-lg text-muted">Une photo de votre pièce ou de votre jardin. Recevez des rendus de <b className="text-ink">votre</b> espace transformé, de vrais produits à acheter, et un guide pour tout réaliser, étape par étape.</p>
          <div className="flex flex-wrap gap-2.5"><Link className="btn btn-primary btn-lg" href="/visite-3d/">Visiter en 3D</Link><Link className="btn btn-lg" href="/projet/">Transformer mon espace</Link></div>
          <ul className="mt-5 flex flex-wrap gap-x-5 gap-y-1 p-0 text-[13px] text-muted" style={{ listStyle: "none" }}>
            <li>✓ 1 étude complète offerte</li><li>✓ Sans abonnement possible</li><li>✓ Intérieur et extérieur</li>
          </ul>
        </div>
        <HeroCompare />
      </section>

      <section className="mt-12 grid gap-3 md:grid-cols-3" aria-label="Comment ça marche">
        {[["1", "Une photo, une envie", "Votre pièce ou votre extérieur, votre style, votre budget, ce que vous gardez."],
          ["2", "Votre espace, transformé", "Trois rendus fidèles à vos murs et à vos fenêtres, une palette de vraies teintes, un plan annoté."],
          ["3", "Réalisé, pas seulement rêvé", "Produits réels à acheter, tutos, artisans, et des conseils à chaque étape."]].map(([n, t, d]) => (
          <div key={n} className="panel flex flex-col gap-1.5"><span className="mono text-accent">{n}</span><h2 className="text-xl">{t}</h2><p className="text-sm text-muted">{d}</p></div>
        ))}
      </section>

      <section className="section">
        <h2>Dedans comme dehors</h2>
        <p className="mb-4 mt-1.5 max-w-[62ch] text-muted">Du salon au balcon, de la salle de bain au potager : tout votre logement, avec un fil conducteur d'une pièce à l'autre.</p>
        <div className="grid gap-4 md:grid-cols-2">
          {[["Intérieur", INTERIOR], ["Extérieur", EXTERIOR]].map(([title, list]) => (
            <div key={title as string} className="panel"><h3 className="mb-3 text-2xl">{title as string}</h3><div className="flex flex-wrap gap-1.5">{(list as string[]).map((s) => <span key={s} className="tag">{s}</span>)}</div></div>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="vhead"><div><h2 className="h2">Inspirations du moment</h2><p>Reconnaissez-vous dans un style, puis appliquez-le à votre propre pièce.</p></div><Link className="btn btn-sm" href="/galerie/">Toute la galerie</Link></div>
        <HomeInspirations />
      </section>

      <section className="section">
        <div className="vhead"><div><h2 className="h2">Trouvez votre style</h2><p>Douze styles d'intérieur, huit styles de jardin, expliqués simplement.</p></div><Link className="btn btn-sm" href="/quiz/">Faire le quiz</Link></div>
        <div className="grid-cards">{STYLES.filter((_, i) => i % 3 === 0).slice(0, 4).map((s) => <StyleCard key={s.id} s={s} />)}</div>
      </section>

      <section className="section">
        <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {[[`${MATERIALS.length} matières`, "Matériauthèque", "/matieres/"], [`${PAIRINGS.length} accords`, "Accords de matières", "/accords/"], [`${FURNITURE.length} pièces`, "Mobilier culte", "/mobilier/"], [`${PLACES.length} lieux`, "Lieux d'exception", "/lieux/"], [`${PLANTS.length} plantes`, "Fiches plantes", "/plantes/"]].map(([n, t, h]) => (
            <Link key={h} href={h!} className="panel flex flex-col gap-1 text-ink no-underline hover:border-ink"><span className="mono text-accent">{n}</span><span className="font-display text-xl font-semibold">{t}</span></Link>
          ))}
        </div>
        <div className="grid-cards wide">{PAIRINGS.slice(0, 3).map((p) => <PairingCard key={p.id} p={p} />)}</div>
      </section>

      <section className="section panel flex flex-col items-start gap-3 md:flex-row md:items-center md:justify-between">
        <div><h2 className="h2">Une pièce à refaire ?</h2><p className="mt-1 text-muted">Le Pass Projet : 3 études, 30 rendus HD et Camille illimitée pendant 30 jours, pour {formatEuros(pass.priceTtc)}, sans abonnement.</p></div>
        <div className="flex gap-2"><Link className="btn" href="/tarifs/">Voir les tarifs</Link><Link className="btn btn-primary" href="/projet/">Essayer gratuitement</Link></div>
      </section>
    </>
  );
}
