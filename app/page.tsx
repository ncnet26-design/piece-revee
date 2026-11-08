import Link from "next/link";
import { ExemplePiece, Hero } from "@/components/home/Hero";
import catalogue from "@/data/catalogue.json";
import indexCatalogue from "@/public/boutique/index.json";
import { MarquesDefilantes } from "@/components/home/MarquesDefilantes";
import { OffreTeaser } from "@/components/OffreTeaser";
import { MentionIA } from "@/components/MentionIA";
import { NOM_STYLE, STYLES as STYLES_CATALOGUE, type ProduitAchetable } from "@/lib/catalogue-achetable";
import { meta } from "@/lib/seo";
import { lienUnsplash, PHOTOS_STYLES } from "@/lib/inspirations-photos";
import { PLANS } from "@core/plans.ts";
import { formatEuros } from "@core/money.ts";
import { JsonLd } from "@/components/JsonLd";
import { PhotoUnsplash } from "@/components/inspirations/PhotoUnsplash";
import { Photo } from "@/components/Photo";

export const metadata = meta({ title: "Pièce Rêvée · Voyez votre pièce refaite avant d'acheter", description: "Une photo de votre pièce et vos inspirations : votre pièce transformée en quelques minutes, et chaque meuble trouvé en vente, du petit budget au haut de gamme. 1 étude offerte.", path: "/" });

/** Enseignes présentes sur le site : celles du catalogue vérifié et celles relevées par le robot. */
const MARQUES = [...new Set([...(catalogue as { produits: ProduitAchetable[] }).produits.map((p) => p.enseigne), ...Object.keys((indexCatalogue as { vendeurs: Record<string, number> }).vendeurs)])]
  .sort((a, b) => a.localeCompare(b, "fr"));
const PASS = PLANS.find((p) => p.id === "pass")!;


const ETAPES: Array<[string, string]> = [
  ["Prenez votre pièce en photo", "Avec votre téléphone, telle qu'elle est aujourd'hui."],
  ["Montrez ce qui vous plaît", "Des images Pinterest, Instagram ou de magazine : on en tire votre style."],
  ["Découvrez-la refaite, achetez", "Touchez un meuble : il est en vente, du petit prix au haut de gamme."],
];

const COMPARATIF: Array<[string, string, string, string]> = [
  ["Voir le résultat avant d'acheter", "Non, il faut imaginer", "Oui, sur planches", "Oui, sur la photo de votre pièce"],
  ["Trouver les meubles", "À vous, site par site", "Liste du décorateur", "Chaque meuble trouvé, cliquable"],
  ["Choix du budget", "À vous de comparer", "Selon le projet", "3 prix pour chaque meuble"],
  ["Délai", "Plusieurs soirées", "Plusieurs rendez-vous", "Quelques minutes"],
  ["Prix", "Gratuit, mais long", "Sur devis", "1 étude offerte, puis dès 14,90 €"],
];

const FAQ: Array<[string, string]> = [
  ["Est-ce que ça marche avec ma pièce ?", "Oui : salon, chambre, cuisine, salle de bain, bureau… Une photo nette, prise à hauteur d'yeux et bien éclairée suffit. Vous pouvez garder les fenêtres, les portes et les murs tels qu'ils sont."],
  ["Les meubles proposés existent-ils vraiment ?", "Oui. Ce sont des produits en vente chez de vraies enseignes, trouvés sur leurs pages ; le prix affiché porte sa date de relevé. Vous achetez directement chez elles, et aucune marque ne paie pour être mise en avant."],
  ["L'image, c'est une vraie photo ?", "C'est une image créée par IA à partir de votre photo, signalée comme telle. Elle montre l'esprit et l'agencement ; les produits proposés sont, eux, bien réels : vérifiez dimensions et couleurs chez l'enseigne."],
  ["Faut-il payer pour essayer ?", "Non. Une étude complète est offerte, sans carte bancaire. Ensuite, le Pass Projet couvre une pièce pendant 30 jours sans abonnement ; l'abonnement Plus couvre tout le logement et se résilie en un clic."],
  ["Que deviennent mes photos ?", "Elles restent dans votre navigateur et ne partent au service qu'au moment de créer le moodboard ou la transformation. Elles ne sont ni revendues ni publiées."],
  ["Et si je n'aime pas le résultat ?", "Demandez une autre version, changez vos inspirations ou une matière : le reste de la pièce ne bouge pas. Et vous ne payez qu'une fois convaincu par l'étude offerte."],
];

/** Accueil construit comme une page de vente : promesse, problème, solution, démonstration, comparaison, preuves, prix, objections, appel. */
export default function Home() {
  return (
    <>
      {/* 1. Promesse et démonstration */}
      <Hero />

      {/* 2. Preuve immédiate : les enseignes */}
      <MarquesDefilantes marques={MARQUES} />

      {/* 3. La solution en trois étapes, illustrée */}
      <section id="comment" aria-labelledby="h-comment" className="scroll-mt-24 py-20 sm:py-28">
        <div className="mx-auto max-w-[760px] text-center">
          <p className="eyebrow">Comment ça marche</p>
          <h2 id="h-comment" className="mt-4 text-[clamp(36px,4.6vw,64px)]">Trois étapes, <em>c'est tout.</em></h2>
        </div>
        <ol className="mt-14 grid list-none gap-12 p-0 md:grid-cols-3 md:gap-10">
          {ETAPES.map(([t, d], i) => (
            <li key={t} className="relative">
              {i < 2 && <span aria-hidden className="absolute -right-8 top-[30%] hidden text-[28px] text-[var(--bronze)] md:block">→</span>}
              <div className="mb-5 flex items-center gap-3">
                <span className="grid size-11 shrink-0 place-items-center rounded-full bg-ink font-display text-[22px] text-surface">{i + 1}</span>
                <h3 className="text-[20px] font-semibold leading-tight">{t}</h3>
              </div>
              <div className="relative aspect-[4/3] overflow-hidden bg-soft">
                {i === 0 && <><Photo src="/editorial/ia/salon-avant.webp" alt="Exemple : la pièce telle qu'elle est aujourd'hui" sizes="(min-width:768px) 33vw, 100vw" className="block aspect-[4/3] w-full object-cover" /><MentionIA /></>}
                {i === 1 && (
                  <div className="grid size-full grid-cols-3 gap-1.5 p-3">
                    {[1, 2, 3].map((k) => <PhotoUnsplash key={k} p={PHOTOS_STYLES.japandi[k]!} alt="" sizes="12vw" className="aspect-[3/4]" credit={false} />)}
                    <div className="col-span-3 flex items-center gap-1.5">{["#E6DCCB", "#C9B79C", "#8A7052", "#5C4636", "#2F2A24"].map((c) => <span key={c} className="h-6 flex-1 rounded-[2px]" style={{ background: c }} />)}</div>
                  </div>
                )}
                {i === 2 && <><Photo src="/editorial/ia/salon-apres.webp" alt="Exemple : la même pièce refaite" sizes="(min-width:768px) 33vw, 100vw" className="block aspect-[4/3] w-full object-cover" /><MentionIA /><span className="absolute left-3 top-3 flex gap-1">{["Petit budget", "Moyen", "Haut de gamme"].map((g) => <span key={g} className="rounded-full bg-white/90 px-2 py-0.5 text-[10.5px] font-semibold text-ink">{g}</span>)}</span></>}
              </div>
              <p className="mt-4 text-[15px] text-muted">{d}</p>
              {i === 1 && <p className="mt-2 text-[11px] text-muted">Photos : {([1, 2, 3].map((k) => PHOTOS_STYLES.japandi[k]!)).map((p, k) => <span key={p.ref}>{k ? ", " : ""}<a href={lienUnsplash(p.auteur_url)} target="_blank" rel="noopener noreferrer" className="underline">{p.auteur}</a></span>)} sur <a href={lienUnsplash("https://unsplash.com")} target="_blank" rel="noopener noreferrer" className="underline">Unsplash</a></p>}
            </li>
          ))}
        </ol>
        <div className="mt-14 text-center"><Link href="/transformer/" className="btn btn-primary btn-lg">Transformer ma pièce →</Link></div>
      </section>

      {/* 4. Démonstration : on touche les meubles, on voit les prix */}
      <ExemplePiece />

      {/* 6. Comparaison avec les autres façons de faire */}
      <section aria-labelledby="h-comparatif" className="border-t border-line py-20 sm:py-28">
        <div className="mx-auto max-w-[760px] text-center">
          <p className="eyebrow">Pourquoi Pièce Rêvée</p>
          <h2 id="h-comparatif" className="mt-4 text-[clamp(36px,4.6vw,64px)]">Le résultat d'un décorateur, <em>la simplicité en plus.</em></h2>
        </div>
        <div className="mx-auto mt-12 max-w-[1080px] overflow-x-auto" tabIndex={0} role="region" aria-label="Comparatif, défilable">
          <table className="w-full min-w-[640px] border-collapse text-left text-[14.5px]">
            <thead>
              <tr className="border-b border-ink text-[11px] uppercase tracking-[.14em] text-muted">
                <th scope="col" className="py-3 pr-4 font-semibold"><span className="sr-only">Critère</span></th>
                <th scope="col" className="py-3 pr-4 font-semibold">Seul, sur Pinterest</th>
                <th scope="col" className="py-3 pr-4 font-semibold">Avec un décorateur</th>
                <th scope="col" className="bg-ink px-4 py-3 font-semibold text-surface">Avec Pièce Rêvée</th>
              </tr>
            </thead>
            <tbody>
              {COMPARATIF.map(([c, a, b, n]) => (
                <tr key={c} className="border-b border-line">
                  <th scope="row" className="py-4 pr-4 font-semibold">{c}</th>
                  <td className="py-4 pr-4 text-muted">{a}</td>
                  <td className="py-4 pr-4 text-muted">{b}</td>
                  <td className="bg-surface px-4 py-4 font-semibold">✓ {n}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* 9. Styles en vraies photos */}
      <section aria-labelledby="h-styles" className="border-t border-line py-20 sm:py-28">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div><p className="eyebrow">Inspirations</p><h2 id="h-styles" className="mt-4 text-[clamp(36px,4.4vw,60px)]">Pas d'idée ? <em>Huit styles pour commencer.</em></h2></div>
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

      {/* 10. Prix */}
      <OffreTeaser titre={`Essayez gratuitement. Ensuite, ${formatEuros(PASS.priceTtc)} la pièce.`} />

      {/* 11. Objections */}
      <section aria-labelledby="h-faq" className="border-t border-line py-20 sm:py-28">
        <div className="mx-auto max-w-[760px]">
          <p className="eyebrow text-center">Questions fréquentes</p>
          <h2 id="h-faq" className="mt-4 text-center text-[clamp(36px,4.6vw,64px)]">Vos questions, <em>nos réponses.</em></h2>
          <div className="mt-12 divide-y divide-line border-y border-line">
            {FAQ.map(([q, r]) => (
              <details key={q} className="group py-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[17px] font-semibold">{q}<span aria-hidden className="text-[22px] font-normal text-muted transition group-open:rotate-45">+</span></summary>
                <p className="mt-3 text-[15px] text-muted">{r}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* 12. Dernier appel */}
      <section aria-labelledby="h-final" className="bleed border-t border-line bg-surface py-24 text-center sm:py-32">
        <h2 id="h-final" className="mx-auto max-w-[18ch] text-[clamp(40px,5.6vw,84px)]">Votre pièce rêvée est <em>à une photo.</em></h2>
        <p className="mx-auto mt-6 max-w-[46ch] text-[16px] text-muted">Une étude complète offerte, sans carte bancaire. Vous ne payez que si vous voulez aller plus loin.</p>
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <Link href="/transformer/" className="btn btn-primary btn-lg">Essayer gratuitement</Link>
          <Link href="/tarifs/" className="btn btn-lg">Voir les tarifs</Link>
        </div>
      </section>
      <JsonLd data={{ "@context": "https://schema.org", "@type": "FAQPage", mainEntity: FAQ.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })) }} />
    </>
  );
}
