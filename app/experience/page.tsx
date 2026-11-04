import { readFileSync } from "node:fs";
import { join } from "node:path";
import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { BeforeAfter } from "@/components/BeforeAfter";
import { Photo } from "@/components/Photo";
import { Composer, Stage } from "@/components/experience/Stage";
import type { IndexCatalogue, ProduitCatalogue } from "@/lib/catalogue";
import { meta } from "@/lib/seo";

export const metadata = meta({
  title: "Votre pièce, rêvée puis réelle",
  description: "Une photo de votre pièce, vos inspirations : votre moodboard, votre pièce transformée, et chaque meuble, matière ou couleur cliquable vers des produits réellement en vente.",
  path: "/experience/",
});

/** Chiffres réels du catalogue, lus à la publication du site (rien n'est estimé ni arrondi à la hausse). */
function chiffres() {
  try {
    const dir = join(process.cwd(), "public/catalogue");
    const idx = JSON.parse(readFileSync(join(dir, "index.json"), "utf8")) as IndexCatalogue & { vendeurs: Record<string, number> };
    let photos = 0;
    for (const f of Object.keys(idx.familles)) {
      try { photos += (JSON.parse(readFileSync(join(dir, `${f}.json`), "utf8")) as ProduitCatalogue[]).filter((p) => p.i).length; } catch { /* famille absente */ }
    }
    const enseignes = Object.entries(idx.vendeurs).filter(([, n]) => n > 0).sort((a, b) => b[1] - a[1]).map(([n]) => n);
    return { total: idx.total, photos, enseignes, date: new Date(idx.updatedAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }) };
  } catch { return null; }
}

const fr = (n: number) => n.toLocaleString("fr-FR");
const DARK_BTN = "btn btn-lg border-[#F2EEE6]/35 bg-transparent text-[#F2EEE6] hover:border-[#F2EEE6] hover:bg-[#F2EEE6]/5";

function Chap({ n, titre, children, wide = false }: { n: string; titre: ReactNode; children: ReactNode; wide?: boolean }) {
  return (
    <div className={wide ? "max-w-[880px]" : "max-w-[520px]"}>
      <p className="m-0 text-[11.5px] font-semibold uppercase tracking-[.24em] text-[#C99467]">{n}</p>
      <h2 className="mt-4 text-[clamp(38px,5vw,72px)] leading-[.98] text-[#F2EEE6] [&_em]:text-[#D4A57A]">{titre}</h2>
      <div className="mt-5 text-[16.5px] leading-relaxed text-[#F2EEE6]/78">{children}</div>
    </div>
  );
}

export default function Page() {
  const c = chiffres();
  const chapters: ReactNode[] = [
    <div key="0" className="max-w-[880px]">
      <p className="xp-rise m-0 text-[11.5px] font-semibold uppercase tracking-[.24em] text-[#F2EEE6]/70" style={{ "--d": ".2s" } as CSSProperties}>Pièce Rêvée · architecture intérieure</p>
      <h1 className="mt-5 text-[clamp(56px,9.2vw,148px)] leading-[.9] text-[#F2EEE6]">
        <span className="xp-rise block" style={{ "--d": ".45s" } as CSSProperties}>Votre pièce, <em className="text-[#C99467]">rêvée.</em></span>
        <span className="xp-rise block" style={{ "--d": "1.6s" } as CSSProperties}>Puis réelle.</span>
      </h1>
      <p className="xp-rise mt-7 max-w-[46ch] text-[17px] leading-relaxed text-[#F2EEE6]/80" style={{ "--d": "2.4s" } as CSSProperties}>Une photo de votre pièce, vos inspirations : nous la transformons dans cet esprit, puis chaque meuble, matière et couleur devient cliquable vers des produits réellement en vente.</p>
      <div className="xp-rise mt-9 flex flex-wrap gap-3" style={{ "--d": "2.8s" } as CSSProperties}>
        <Link href="/transformer/" className="btn btn-light btn-lg">Transformer ma pièce</Link>
        <a href="#piece" className={DARK_BTN}>Voir comment ça marche ↓</a>
      </div>
    </div>,
    <Chap key="1" n="01 — Votre pièce" titre={<>Aujourd'hui, <em>elle ressemble à ça.</em></>}>
      <p className="m-0">Une simple photo suffit. L'IA repère les murs, le sol et chaque meuble de votre pièce pour savoir ce qui peut changer, et ce qui reste.</p>
    </Chap>,
    <Chap key="2" n="02 — Vos inspirations" titre={<>Ce qui vous plaît, <em>d'où qu'il vienne.</em></>}>
      <p className="m-0">Pinterest, Instagram, un magazine, une capture d'écran : ajoutez vos images. Nous en retenons l'esprit (les matières, la palette, les formes), jamais l'architecture d'un autre lieu.</p>
    </Chap>,
    <Chap key="3" n="03 — Votre moodboard" titre={<>Une direction, <em>avant le moindre achat.</em></>}>
      <p className="m-0">Style, palette, matières et pièces clés sont tirés de vos images et réunis sur une planche. Vous savez où vous allez avant de dépenser quoi que ce soit.</p>
    </Chap>,
    <Chap key="4" n="04 — La transformation" titre={<>Mêmes murs, <em>autre caractère.</em></>}>
      <p className="m-0">Votre pièce est réimaginée dans cet esprit : nouvelles matières, nouveaux meubles, même lumière. L'image est générée par IA : c'est une proposition à discuter, pas un relevé de chantier.</p>
    </Chap>,
    <Chap key="5" n="05 — Tout est cliquable" titre={<>Touchez, <em>trouvez, achetez.</em></>}>
      <p className="m-0">Touchez un meuble, un mur, un sol : des produits réels, leur prix relevé sur le site du vendeur avec sa date, et le lien pour l'acheter. Essayez d'autres finitions : la pièce change, les liens aussi.</p>
      <Composer />
    </Chap>,
  ];

  return (
    <>
      <Stage chapters={chapters} />

      <div className="bleed bg-[#0C0E0B] text-[#F2EEE6]">
        {/* ——— Bénéfices ——— */}
        <section aria-labelledby="h-pourquoi" className="wrap border-t border-[#F2EEE6]/12 py-24 sm:py-32">
          <p className="m-0 text-[11.5px] font-semibold uppercase tracking-[.24em] text-[#C99467]">Pourquoi Pièce Rêvée</p>
          <h2 id="h-pourquoi" className="mt-4 max-w-[16ch] text-[clamp(40px,5.4vw,80px)] leading-[.98]">Décider en voyant, <em className="text-[#F2EEE6]/60">pas en imaginant.</em></h2>
          <ul className="mt-16 grid list-none gap-12 p-0 md:grid-cols-3">
            {[
              ["Voir avant de dépenser", "Votre pièce transformée vient avant les achats. Vous comparez des directions, vous gardez celle qui vous ressemble."],
              ["Des produits qui existent", "Chaque suggestion mène à une vraie page produit. Un prix n'est affiché que s'il a été relevé, toujours avec sa date."],
              ["Votre goût, pas un modèle", "Tout part de vos inspirations à vous, pas d'un style imposé ni d'une marque qui paierait pour être mise en avant."],
            ].map(([t, d], i) => (
              <li key={t} className="border-t border-[#F2EEE6]/15 pt-6">
                <p className="m-0 font-display text-[44px] leading-none text-[#C99467]">0{i + 1}</p>
                <h3 className="mt-5 text-[21px] font-medium text-[#F2EEE6]">{t}</h3>
                <p className="mt-3 max-w-[38ch] text-[15.5px] leading-relaxed text-[#F2EEE6]/70">{d}</p>
              </li>
            ))}
          </ul>
        </section>

        {/* ——— Services ——— */}
        <section aria-labelledby="h-outils" className="wrap py-24 sm:py-32">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="m-0 text-[11.5px] font-semibold uppercase tracking-[.24em] text-[#C99467]">Le studio</p>
              <h2 id="h-outils" className="mt-4 max-w-[18ch] text-[clamp(40px,5.4vw,80px)] leading-[.98]">Cinq façons <em className="text-[#F2EEE6]/60">de commencer.</em></h2>
            </div>
            <p className="m-0 max-w-[42ch] text-[15px] text-[#F2EEE6]/65">Chaque outil s'ouvre directement depuis cette page.</p>
          </div>
          <ul className="mt-14 grid list-none gap-x-5 gap-y-12 p-0 sm:grid-cols-2 lg:grid-cols-6">
            {([
              ["/transformer/", "Transformer ma pièce", "Votre photo, vos inspirations, votre pièce transformée et cliquable.", "/editorial/ia/salon-velours-chene.webp", "lg:col-span-3"],
              ["/boutique/", "La boutique", c ? `${fr(c.total)} produits suivis, relevés sur les sites des enseignes.` : "Des produits réels, relevés sur les sites des enseignes.", "/editorial/ia/luxe-discret.webp", "lg:col-span-3"],
              ["/galerie/", "Inspirations", "Des styles et des espaces pour trouver votre direction.", "/editorial/ia/japandi-essai.webp", "lg:col-span-2"],
              ["/showroom/", "Matières", "Bois, pierres, enduits, tissus, dans leurs nuances.", "/editorial/ia/matiere-enduit.webp", "lg:col-span-2"],
              ["/studio/", "Studio 3D", "Composer la pièce en 3D, objet par objet.", "/editorial/ia/contemporain-sculptural.webp", "lg:col-span-2"],
            ] as const).map(([href, t, d, img, span]) => (
              <li key={href} className={span}>
                <Link href={href} className="group block text-[#F2EEE6] no-underline">
                  <span className="block overflow-hidden bg-[#1a1c18]">
                    <Photo src={img} alt="" sizes="(min-width:1024px) 50vw, (min-width:640px) 50vw, 100vw" className="aspect-[3/2] w-full object-cover opacity-90 transition duration-700 group-hover:scale-[1.03] group-hover:opacity-100 motion-reduce:transition-none" />
                  </span>
                  <span className="mt-5 flex items-baseline justify-between gap-4">
                    <span className="font-display text-[30px] leading-tight">{t}</span>
                    <span aria-hidden className="text-[#C99467] transition group-hover:translate-x-1">→</span>
                  </span>
                  <span className="mt-1 block max-w-[46ch] text-[14.5px] text-[#F2EEE6]/65">{d}</span>
                </Link>
              </li>
            ))}
          </ul>
          <p className="mt-8 text-[12px] text-[#F2EEE6]/50">Images générées par IA.</p>
        </section>

        {/* ——— Avant / après ——— */}
        <section aria-labelledby="h-avant" className="wrap grid items-center gap-12 py-24 sm:py-32 lg:grid-cols-[1fr_1.6fr] lg:gap-20">
          <div>
            <p className="m-0 text-[11.5px] font-semibold uppercase tracking-[.24em] text-[#C99467]">Personnaliser</p>
            <h2 id="h-avant" className="mt-4 text-[clamp(40px,5.4vw,80px)] leading-[.98]">Une matière change, <em className="text-[#F2EEE6]/60">tout change.</em></h2>
            <p className="mt-6 max-w-[40ch] text-[15.5px] leading-relaxed text-[#F2EEE6]/70">Bouclé et noyer, ou velours vert et chêne fumé : même pièce, même lumière. Faites glisser pour comparer.</p>
          </div>
          <div>
            <BeforeAfter ratio="16 / 9" labelBefore="Bouclé et noyer" labelAfter="Velours et chêne fumé"
              before={<Photo src="/editorial/ia/salon-boucle-noyer.webp" sizes="(min-width:1024px) 60vw, 100vw" alt="Salon : canapé bouclé crème, buffet cannelé en noyer" />}
              after={<Photo src="/editorial/ia/salon-velours-chene.webp" sizes="(min-width:1024px) 60vw, 100vw" alt="Même salon : canapé en velours vert, buffet en chêne fumé" />} />
            <p className="mt-3 text-[12px] text-[#F2EEE6]/50">Images générées par IA : même pièce, seules deux matières changent.</p>
          </div>
        </section>

        {/* ——— Preuves : des chiffres relevés, pas des promesses ——— */}
        {c && (
          <section aria-labelledby="h-preuves" className="wrap border-t border-[#F2EEE6]/12 py-24 sm:py-32">
            <p className="m-0 text-[11.5px] font-semibold uppercase tracking-[.24em] text-[#C99467]">Ce qui est déjà là</p>
            <h2 id="h-preuves" className="mt-4 max-w-[20ch] text-[clamp(40px,5.4vw,80px)] leading-[.98]">Des produits réels, <em className="text-[#F2EEE6]/60">relevés chaque nuit.</em></h2>
            <dl className="mt-16 grid gap-10 sm:grid-cols-3">
              {[[fr(c.total), "produits suivis dans la boutique"], [fr(c.photos), "avec la photo publiée par l'enseigne"], [String(c.enseignes.length), "enseignes françaises et européennes, et quelques américaines"]].map(([v, l]) => (
                <div key={l} className="border-t border-[#F2EEE6]/15 pt-6">
                  <dt className="sr-only">{l}</dt>
                  <dd className="m-0 font-display text-[clamp(56px,7vw,104px)] leading-none tabular-nums text-[#F2EEE6]">{v}</dd>
                  <dd className="m-0 mt-3 max-w-[30ch] text-[14.5px] text-[#F2EEE6]/65">{l}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-14 text-[11.5px] font-semibold uppercase tracking-[.2em] text-[#F2EEE6]/50">Produits relevés chez</p>
            <p className="mt-4 max-w-[110ch] font-display text-[clamp(22px,2.4vw,34px)] leading-snug text-[#F2EEE6]/85">
              {c.enseignes.map((e, i) => <span key={e}>{e}{i < c.enseignes.length - 1 ? <span aria-hidden className="mx-3 text-[#C99467]">·</span> : null}</span>)}
            </p>
            <p className="mt-6 max-w-[70ch] text-[12.5px] text-[#F2EEE6]/55">Chiffres du catalogue au {c.date}. Produits relevés automatiquement sur les pages publiques des enseignes, dans le respect de leurs règles d'accès ; aucun partenariat, aucune marque ne paie pour être classée.</p>
          </section>
        )}

        {/* ——— Engagements ——— */}
        <section aria-labelledby="h-engagements" className="wrap py-24 sm:py-32">
          <p className="m-0 text-[11.5px] font-semibold uppercase tracking-[.24em] text-[#C99467]">Nos engagements</p>
          <h2 id="h-engagements" className="mt-4 max-w-[18ch] text-[clamp(40px,5.4vw,80px)] leading-[.98]">Ce que nous <em className="text-[#F2EEE6]/60">ne faisons pas.</em></h2>
          <ul className="mt-14 grid list-none gap-px bg-[#F2EEE6]/12 p-0 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["Inventer un prix", "Pas de prix relevé : nous écrivons « prix sur le site »."],
              ["Cacher l'IA", "Chaque image générée par IA est signalée comme telle."],
              ["Vendre un classement", "Aucune marque ne paie pour apparaître ou passer devant."],
              ["Remplacer un pro", "Une estimation n'est pas un devis ; l'électricité, la plomberie et la structure relèvent d'un professionnel."],
            ].map(([t, d]) => (
              <li key={t} className="bg-[#0C0E0B] p-7">
                <h3 className="m-0 text-[18px] font-medium text-[#F2EEE6]"><span aria-hidden className="mr-2 text-[#C99467]">×</span>{t}</h3>
                <p className="mt-3 text-[14.5px] leading-relaxed text-[#F2EEE6]/65">{d}</p>
              </li>
            ))}
          </ul>
        </section>

        {/* ——— Appel final ——— */}
        <section aria-labelledby="h-fin" className="relative overflow-hidden border-t border-[#F2EEE6]/12">
          <Photo src="/editorial/ia/art-deco-contemporain.webp" alt="" sizes="100vw" className="absolute inset-0 size-full object-cover opacity-35" />
          <div aria-hidden className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(12,14,11,.35),rgba(12,14,11,.92))]" />
          <div className="wrap relative py-32 text-center sm:py-44">
            <h2 id="h-fin" className="mx-auto max-w-[14ch] text-[clamp(48px,7.4vw,120px)] leading-[.92]">À votre tour, <em className="text-[#C99467]">rêvez-la.</em></h2>
            <p className="mx-auto mt-6 max-w-[44ch] text-[16.5px] text-[#F2EEE6]/75">Une photo de votre pièce et quelques inspirations suffisent pour commencer.</p>
            <div className="mt-10 flex flex-wrap justify-center gap-3">
              <Link href="/transformer/" className="btn btn-light btn-lg">Transformer ma pièce</Link>
              <Link href="/boutique/" className={DARK_BTN}>Ouvrir la boutique</Link>
            </div>
            <p className="mt-14 text-[11px] text-[#F2EEE6]/45">Image de fond générée par IA.</p>
          </div>
        </section>
      </div>
    </>
  );
}
