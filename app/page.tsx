import Link from "next/link";
import bank from "@/content/data/inspiration-bank.json";
import { BeforeAfter } from "@/components/BeforeAfter";
import { productById } from "@/lib/products/schema";
import { materialById } from "@/lib/materials/schema";
import { meta } from "@/lib/seo";

export const metadata = meta({ title: "Pièce Rêvée · Studio d'architecture intérieure", description: "Imaginez la pièce, choisissez de vraies matières, manipulez-la en 3D et trouvez où acheter chaque meuble.", path: "/" });

type Entry = { id: string; type: string; title: string; subtitle: string; image: { src: string } | null; palette: string[] };
const STYLES = ["contemporain-sculptural", "japandi", "haussmannien-renove"].map((id) => (bank as Entry[]).find((e) => e.id === id)!);
const MATIERES = ["travertin", "noyer-verni", "boucle", "enduit-chaux", "laiton-brosse", "velours-foret"].map((id) => materialById(id)!);
const ALTERNATIVES = ["drawer-oris-effet-travertin", "kave-drasi-ronde-90", "gubi-epic-coffee-table-round"].map((id) => productById(id)!);
const TIER: Record<string, string> = { economique: "Économique", intermediaire: "Intermédiaire", premium: "Premium" };

/** Accueil : une proposition claire, des images d'abord, chaque section mène à une action réelle. */
export default function Home() {
  return (
    <>
      {/* ——— Ouverture ——— */}
      <section className="grid items-end gap-10 pb-16 pt-6 lg:grid-cols-[1fr_1.15fr] lg:gap-16 lg:pt-12">
        <div className="lg:pb-6">
          <p className="eyebrow">Studio d'architecture intérieure</p>
          <h1 className="mt-5 text-[clamp(48px,7vw,104px)] leading-[.96]">L'intérieur, dessiné <em>avant d'être construit.</em></h1>
          <p className="mt-7 max-w-[44ch] text-[17px] leading-relaxed text-muted">Imaginez la pièce, choisissez de vraies matières, manipulez-la en 3D, puis trouvez où acheter chaque meuble.</p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Link href="/studio/?etape=creer" className="btn btn-primary btn-lg">Commencer un projet</Link>
            <Link href="/galerie/" className="btn btn-lg btn-ghost">Trouver mon style</Link>
          </div>
        </div>
        <figure className="relative m-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/inspirations/villas-15.webp" alt="Mur d'onyx et chaise longue dans la villa Tugendhat (Mies van der Rohe, 1930)" className="aspect-[4/5] w-full rounded-[10px] object-cover sm:aspect-[5/4] lg:aspect-[4/5]" fetchPriority="high" />
          <figcaption className="mt-3 flex justify-between gap-4 text-[12px] text-muted"><span>Villa Tugendhat, Brno — Mies van der Rohe, 1930</span><span>Photo Mike Duchstein · CC BY-SA 4.0</span></figcaption>
        </figure>
      </section>

      {/* ——— Trois gestes ——— */}
      <section aria-labelledby="h-gestes" className="border-y border-line py-14">
        <h2 id="h-gestes" className="sr-only">Comment ça marche</h2>
        <ol className="grid list-none gap-10 p-0 md:grid-cols-3">
          {[
            ["01", "Imaginer", "Partez d'une photo de votre pièce, d'une image qui vous inspire ou d'un style. Rien à remplir d'autre."],
            ["02", "Matérialiser", "Travertin, noyer, bouclé, enduit à la chaux : de vraies matières photographiées, en 3D, à la bonne échelle."],
            ["03", "Sourcer", "Touchez un meuble : des modèles ressemblants vendus aujourd'hui, à trois niveaux de prix, avec leur source."],
          ].map(([n, t, d]) => (
            <li key={n}>
              <p className="font-display text-[44px] leading-none text-bronze">{n}</p>
              <h3 className="mt-4 text-[19px]">{t}</h3>
              <p className="mt-2 max-w-[38ch] text-[15px] text-muted">{d}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* ——— Du rendu à l'achat ——— */}
      <section aria-labelledby="h-achat" className="grid items-center gap-10 py-24 lg:grid-cols-[1.3fr_1fr] lg:gap-16">
        <figure className="relative m-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/editorial/rendus/table-travertin.webp" alt="Table basse galet en travertin dans la pièce témoin du Studio" loading="lazy" className="aspect-[16/11] w-full rounded-[10px] object-cover" />
          <span aria-hidden className="absolute left-[46%] top-[52%] grid size-7 place-items-center rounded-full bg-white/95 shadow-[0_0_0_7px_rgba(255,255,255,.3)]"><span className="size-2.5 rounded-full bg-ink" /></span>
          <figcaption className="mt-3 text-[12px] text-muted">Rendu 3D du Studio · table basse dessinée par Pièce Rêvée</figcaption>
        </figure>
        <div>
          <p className="eyebrow">Du rendu à l'achat</p>
          <h2 id="h-achat" className="mt-4 text-[clamp(36px,4.4vw,60px)]">Un meuble dessiné, <em>trois façons de l'avoir.</em></h2>
          <ul className="mt-8 list-none divide-y divide-line border-y border-line p-0">
            {ALTERNATIVES.map((p) => (
              <li key={p.id} className="flex items-baseline justify-between gap-4 py-4">
                <span><span className="block text-[11px] font-semibold uppercase tracking-[.14em] text-muted">{TIER[p.tier]} · {p.brand}</span><span className="text-[15px]">{p.name}</span></span>
                <span className="shrink-0 text-[15px] font-medium tabular-nums">{p.price?.text.replace(/ \(.*\)/, "")}</span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-[12px] text-muted">Prix relevés sur les sites des enseignes le 28 octobre 2026. Aucune marque ne paie pour être classée.</p>
          <Link href="/studio/?etape=3d" className="btn btn-primary mt-8">Essayer dans la pièce 3D</Link>
        </div>
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
          <p className="mt-6 max-w-[40ch] text-[15px] text-muted">Bouclé et noyer, ou velours vert et chêne fumé : dans la scène 3D, chaque objet change de matière sans toucher au reste.</p>
          <Link href="/studio/?etape=3d" className="btn mt-8">Ouvrir la scène 3D</Link>
        </div>
        <div>
          {/* eslint-disable @next/next/no-img-element */}
          <BeforeAfter ratio="16 / 11" labelBefore="Bouclé et noyer" labelAfter="Velours et chêne fumé"
            before={<img src="/editorial/rendus/variante-a.webp" alt="Pièce témoin : canapé bouclé, buffet en noyer" loading="lazy" />}
            after={<img src="/editorial/rendus/variante-b.webp" alt="Pièce témoin : canapé en velours vert, buffet en chêne fumé" loading="lazy" />} />
          {/* eslint-enable @next/next/no-img-element */}
          <p className="mt-3 text-[12px] text-muted">Rendus 3D temps réel du Studio, sans retouche.</p>
        </div>
      </section>

      {/* ——— Matières ——— */}
      <section aria-labelledby="h-matieres" className="py-20">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div><p className="eyebrow">Matières</p><h2 id="h-matieres" className="mt-4 text-[clamp(36px,4.4vw,60px)]">Photographiées, <em>pas imitées.</em></h2></div>
          <Link href="/showroom/" className="btn">La matériauthèque</Link>
        </div>
        <ul className="mt-12 grid list-none grid-cols-2 gap-x-5 gap-y-8 p-0 sm:grid-cols-3 lg:grid-cols-6">
          {MATIERES.map((m) => (
            <li key={m.id}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`/editorial/matieres/${m.id}.webp`} alt={m.name} loading="lazy" className="aspect-square w-full rounded-[8px] object-cover" />
              <p className="mt-3 text-[14px] font-medium">{m.name}</p>
              <p className="text-[12.5px] text-muted">{m.finish}</p>
            </li>
          ))}
        </ul>
        <p className="mt-6 text-[12px] text-muted">Textures Poly Haven et ambientCG (CC0). Métaux : textures calculées.</p>
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
          <Link href="/studio/?etape=creer" className="btn btn-primary btn-lg">Commencer un projet</Link>
          <Link href="/showroom/" className="btn btn-lg btn-ghost">Voir les matières</Link>
        </div>
      </section>
    </>
  );
}
