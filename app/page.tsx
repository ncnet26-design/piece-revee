import Link from "next/link";
import bank from "@/content/data/inspiration-bank.json";
import { BeforeAfter } from "@/components/BeforeAfter";
import { ShopTheLook } from "@/components/ShopTheLook";
import { materialById } from "@/lib/materials/schema";
import { meta } from "@/lib/seo";

export const metadata = meta({ title: "Pièce Rêvée · Studio d'architecture intérieure", description: "Photographiez votre pièce, ajoutez vos inspirations : votre pièce transformée, et chaque meuble, couleur ou matière cliquable pour l'acheter.", path: "/" });

type Entry = { id: string; type: string; title: string; subtitle: string; image: { src: string } | null; palette: string[] };
const STYLES = ["contemporain-sculptural", "japandi", "haussmannien-renove"].map((id) => (bank as Entry[]).find((e) => e.id === id)!);
const MATIERES = ([["travertin", "travertin"], ["noyer-verni", "noyer"], ["boucle", "boucle"], ["enduit-chaux", "enduit"], ["laiton-brosse", "laiton"], ["velours-foret", "velours"]] as const)
  .map(([id, photo]) => ({ ...materialById(id)!, photo: `/editorial/ia/matiere-${photo}-640.webp` }));
const PORTES: Array<[string, string, string, string]> = [
  ["/transformer/", "Transformer ma pièce", "Votre photo, vos inspirations, votre pièce transformée.", "/editorial/ia/salon-velours-chene-640.webp"],
  ["/galerie/", "Inspirations", "Douze styles, onze espaces, treize matières.", "/editorial/ia/japandi-essai-640.webp"],
  ["/boutique/", "La boutique", "Des milliers de pièces réelles, relevées chaque nuit.", "/editorial/ia/luxe-discret-640.webp"],
  ["/showroom/", "Matières", "Bois, pierres, enduits, tissus, dans toutes leurs nuances.", "/editorial/ia/matiere-travertin-640.webp"],
];

/** Accueil : une proposition claire, des images d'abord, chaque section mène à une action réelle. */
export default function Home() {
  return (
    <>
      {/* ——— Ouverture : image plein cadre ——— */}
      <section className="bleed relative -mt-7 overflow-hidden bg-[#141712] text-white">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/editorial/ia/art-deco-contemporain-2400.webp" alt="Salle à manger : murs laqués vert bouteille, table en marbre, chaises en velours rouille" className="absolute inset-0 size-full object-cover opacity-90" fetchPriority="high" />
        <div aria-hidden className="absolute inset-0 bg-[linear-gradient(90deg,rgba(12,14,11,.82)_0%,rgba(12,14,11,.45)_45%,rgba(12,14,11,.05)_75%)]" />
        <div className="wrap relative flex min-h-[min(86vh,880px)] flex-col justify-end pb-14 pt-32 sm:pb-20">
          <p className="text-[11.5px] font-semibold uppercase tracking-[.22em] text-white/75">Studio d'architecture intérieure</p>
          <h1 className="mt-5 max-w-[13ch] text-[clamp(52px,8vw,124px)] leading-[.92] text-white">L'intérieur, dessiné <em className="text-white/70">avant d'être construit.</em></h1>
          <p className="mt-7 max-w-[46ch] text-[17px] leading-relaxed text-white/80">Photographiez votre pièce, ajoutez vos inspirations : nous la transformons dans cet esprit, et chaque meuble, couleur ou matière devient cliquable pour l'acheter.</p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Link href="/transformer/" className="btn btn-light btn-lg">Transformer ma pièce</Link>
            <Link href="/boutique/" className="btn btn-lg border-white/40 bg-transparent text-white hover:border-white">Ouvrir la boutique</Link>
          </div>
          <p className="mt-10 text-[11px] text-white/55">Image générée par IA</p>
        </div>
      </section>

      {/* ——— Quatre portes d'entrée ——— */}
      <section aria-labelledby="h-portes" className="py-16 sm:py-20">
        <h2 id="h-portes" className="sr-only">Par où commencer</h2>
        <ul className="grid list-none gap-5 p-0 sm:grid-cols-2 lg:grid-cols-4">
          {PORTES.map(([href, t, d, img]) => (
            <li key={href}>
              <Link href={href} className="group block no-underline">
                <span className="block overflow-hidden rounded-[6px] bg-soft">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img} alt="" loading="lazy" className="aspect-[4/5] w-full object-cover transition duration-700 group-hover:scale-[1.03]" />
                </span>
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

      {/* ——— Shop the look ——— */}
      <section aria-labelledby="h-achat" className="py-24">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <div><p className="eyebrow">Du rendu à l'achat</p><h2 id="h-achat" className="mt-4 text-[clamp(36px,4.4vw,60px)]">Touchez une pièce, <em>trouvez-la en vente.</em></h2></div>
          <p className="max-w-[40ch] text-[14px] text-muted">Chaque élément de l'image renvoie à des produits réels de la boutique, avec leur prix relevé et le lien pour l'acheter.</p>
        </div>
        <ShopTheLook />
      </section>

      {/* ——— Styles ——— */}
      <section aria-labelledby="h-styles" className="py-20">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div><p className="eyebrow">Inspirations</p><h2 id="h-styles" className="mt-4 text-[clamp(36px,4.4vw,60px)]">Douze styles, <em>chacun une famille de matières.</em></h2></div>
          <Link href="/galerie/" className="btn">Tous les styles</Link>
        </div>
        <ul className="mt-12 grid list-none gap-8 p-0 md:grid-cols-3">
          {STYLES.map((s) => (
            <li key={s.id}>
              <Link href="/galerie/" className="group block no-underline">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={s.image!.src} alt={`Planche de matières : ${s.title}`} loading="lazy" className="aspect-[4/3] w-full rounded-[10px] object-cover transition duration-700 group-hover:scale-[1.015]" />
                <p className="mt-4 text-[11px] font-semibold uppercase tracking-[.16em] text-muted">{s.subtitle}</p>
                <h3 className="mt-1 font-display text-[28px] font-normal">{s.title}</h3>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* ——— Personnalisation ——— */}
      <section aria-labelledby="h-perso" className="grid items-center gap-10 py-20 lg:grid-cols-[1fr_1.5fr] lg:gap-16">
        <div>
          <p className="eyebrow">Personnaliser</p>
          <h2 id="h-perso" className="mt-4 text-[clamp(36px,4.4vw,60px)]">Même pièce, <em>autre caractère.</em></h2>
          <p className="mt-6 max-w-[40ch] text-[15px] text-muted">Bouclé et noyer, ou velours vert et chêne fumé : on change une matière, le reste de la pièce ne bouge pas. Dans le Studio, la scène 3D fait de même pour chaque objet.</p>
          <Link href="/studio/?etape=3d" className="btn mt-8">Ouvrir la scène 3D</Link>
        </div>
        <div>
          {/* eslint-disable @next/next/no-img-element */}
          <BeforeAfter ratio="16 / 9" labelBefore="Bouclé et noyer" labelAfter="Velours et chêne fumé"
            before={<img src="/editorial/ia/salon-boucle-noyer.webp" alt="Salon : canapé bouclé crème, buffet cannelé en noyer" loading="lazy" />}
            after={<img src="/editorial/ia/salon-velours-chene.webp" alt="Même salon : canapé en velours vert, buffet en chêne fumé" loading="lazy" />} />
          {/* eslint-enable @next/next/no-img-element */}
          <p className="mt-3 text-[12px] text-muted">Images générées par IA : même pièce, seules deux matières changent.</p>
        </div>
      </section>

      {/* ——— Matières ——— */}
      <section aria-labelledby="h-matieres" className="py-20">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div><p className="eyebrow">Matières</p><h2 id="h-matieres" className="mt-4 text-[clamp(36px,4.4vw,60px)]">De vraies matières, <em>à la bonne échelle.</em></h2></div>
          <Link href="/showroom/" className="btn">La matériauthèque</Link>
        </div>
        <ul className="mt-12 grid list-none grid-cols-2 gap-x-5 gap-y-8 p-0 sm:grid-cols-3 lg:grid-cols-6">
          {MATIERES.map((m) => (
            <li key={m.id}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={m.photo} alt={m.name} loading="lazy" className="aspect-square w-full rounded-[8px] object-cover" />
              <p className="mt-3 text-[14px] font-medium">{m.name}</p>
              <p className="text-[12.5px] text-muted">{m.finish}</p>
            </li>
          ))}
        </ul>
        <p className="mt-6 text-[12px] text-muted">Images générées par IA. Dans la scène 3D, les matières utilisent des textures photographiées (Poly Haven, ambientCG, CC0).</p>
      </section>

      {/* ——— Références ——— */}
      <section aria-labelledby="h-ref" className="py-20">
        <p className="eyebrow">Références</p>
        <h2 id="h-ref" className="mt-4 max-w-[18ch] text-[clamp(36px,4.4vw,60px)]">Apprendre des maîtres, <em>pas les copier.</em></h2>
        <div className="mt-12 grid gap-6 md:grid-cols-[1.4fr_1fr]">
          {([["villas-14", "Le séjour vitré"], ["villas-16", "La bibliothèque"]] as const).map(([id, t]) => (
            <figure key={id} className="m-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`/inspirations/${id}.webp`} alt={`Villa Tugendhat : ${t.toLowerCase()}`} loading="lazy" className="aspect-[4/3] w-full rounded-[10px] object-cover" />
              <figcaption className="mt-3 flex justify-between gap-4 text-[12px] text-muted"><span>Villa Tugendhat — {t}</span><span>Mike Duchstein · CC BY-SA 4.0</span></figcaption>
            </figure>
          ))}
        </div>
      </section>

      {/* ——— Appel final ——— */}
      <section className="border-t border-line py-24 text-center">
        <h2 className="mx-auto max-w-[16ch] text-[clamp(40px,5.6vw,80px)]">Votre pièce, <em>en vrai.</em></h2>
        <div className="mt-9 flex flex-wrap justify-center gap-3">
          <Link href="/transformer/" className="btn btn-primary btn-lg">Transformer ma pièce</Link>
          <Link href="/showroom/" className="btn btn-lg btn-ghost">Voir les matières</Link>
        </div>
      </section>
    </>
  );
}
