import Link from "next/link";
import { Pricing } from "@/components/Pricing";
import { JsonLd } from "@/components/JsonLd";
import { PLANS } from "@core/plans.ts";
import { meta } from "@/lib/seo";

export const metadata = meta({ title: "Tarifs : une étude offerte, puis Pass ou abonnement", description: "Essayez gratuitement. Pass Projet à 14,90 € sans abonnement, Plus à 9,90 €/mois, offres Pro pour les agents et home stagers.", path: "/tarifs/" });

const FAQ: [string, string][] = [
  ["Ai-je besoin de savoir dessiner ou décorer ?", "Non. Une photo de votre pièce prise au téléphone et quelques images qui vous plaisent suffisent : le moodboard, la pièce transformée et les produits sont proposés pour vous."],
  ["Les produits proposés existent-ils vraiment ?", "Oui. Ce sont des produits en vente chez de vraies enseignes, relevés sur leurs pages ; le prix affiché porte sa date de relevé. Aucune marque ne paie pour être classée."],
  ["Puis-je essayer sans payer ?", "Oui. À l'inscription, une étude complète est offerte, avec un rendu de votre pièce. La galerie, le quiz et la bibliothèque sont gratuits et illimités."],
  ["Quelle différence entre le Pass Projet et l'abonnement Plus ?", "Le Pass Projet se paie une fois et dure 30 jours : idéal pour une seule pièce. Plus est un abonnement mensuel ou annuel pour plusieurs pièces et tout le logement, résiliable à tout moment."],
  ["Comment résilier ?", "Depuis votre compte, en un clic, via le portail de facturation sécurisé. L'accès continue jusqu'à la fin de la période payée."],
  ["Puis-je être remboursé ?", "Vous disposez d'un droit de rétractation de 14 jours, sauf si vous avez demandé à utiliser le service immédiatement et renoncé expressément à ce droit (contenu numérique fourni immédiatement). Écrivez-nous en cas de problème : nous cherchons toujours une solution."],
  ["Que veut dire « usage raisonnable » ?", "Chaque offre inclut des quotas mensuels clairs (études, rendus). Un plafond quotidien évite les abus automatisés ; il n'est jamais atteint par un usage normal."],
  ["Comment gagnez-vous de l'argent avec les liens produits ?", "Certains liens vers les enseignes sont des liens affiliés : nous touchons une petite commission si vous achetez, sans surcoût pour vous. Ils sont toujours signalés, et les recommandations ne dépendent pas des commissions."],
];

const ETUDE: Array<[string, string]> = [
  ["Votre pièce transformée", "Votre photo, redessinée dans le style de vos inspirations, en haute définition et sans filigrane."],
  ["Un moodboard complet", "Palette, matières, style et pièces clés tirés de vos images Pinterest, Instagram ou magazines."],
  ["Tout est cliquable", "Chaque meuble, mur ou sol mène à des produits réels en vente, classés petit budget, budget moyen et haut de gamme."],
  ["Votre liste d'achats", "Les pièces choisies, leurs prix relevés et les liens vers les enseignes, à exporter en PDF."],
];

export default function Page() {
  return (<>
    <section className="pt-6">
      <p className="eyebrow">Tarifs</p>
      <h1 className="mt-3 max-w-[18ch] text-[clamp(44px,6.4vw,88px)]">Votre pièce refaite, <em>pour le prix d'un coussin.</em></h1>
      <p className="mt-5 max-w-[58ch] text-[16px] text-muted">Commencez gratuitement : une étude complète est offerte, sans carte bancaire. Si le résultat vous plaît, le Pass Projet couvre une pièce pendant 30 jours, sans abonnement ; l'abonnement Plus couvre tout le logement.</p>
      <p className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-[13px]">
        <span>✓ Sans carte bancaire pour essayer</span><span>✓ Pass sans abonnement</span><span>✓ Résiliable en un clic</span><span>✓ Paiement sécurisé Stripe</span>
      </p>
    </section>

    <section aria-label="Offres pour les particuliers" className="mt-12"><Pricing ids={["decouverte", "pass", "plus_mensuel", "plus_annuel"]} /></section>

    <section aria-labelledby="h-etude" className="mt-24 border-t border-line pt-14">
      <p className="eyebrow">Ce que contient une étude</p>
      <h2 id="h-etude" className="mt-3 max-w-[20ch] text-[clamp(32px,4vw,56px)]">De la photo de votre pièce <em>au panier.</em></h2>
      <ol className="mt-10 grid list-none gap-px bg-line p-0 sm:grid-cols-2 lg:grid-cols-4">
        {ETUDE.map(([t, d], i) => (
          <li key={t} className="bg-bg p-6">
            <span className="font-display text-[40px] leading-none text-[var(--bronze)]">{String(i + 1).padStart(2, "0")}</span>
            <h3 className="mt-4 text-[17px] font-semibold">{t}</h3>
            <p className="mt-2 text-[14px] text-muted">{d}</p>
          </li>
        ))}
      </ol>
      <div className="mt-8"><Link href="/transformer/" className="btn btn-primary btn-lg">Faire mon étude offerte</Link></div>
    </section>

    <section aria-labelledby="h-pro" className="mt-24 border-t border-line pt-14">
      <p className="eyebrow">Professionnels et crédits</p>
      <h2 id="h-pro" className="mt-3 text-[clamp(28px,3.4vw,44px)]">Agents immobiliers, home stagers, <em>gros projets.</em></h2>
      <div className="mt-8"><Pricing ids={["credits", "pro", "agence"]} /></div>
    </section>

    <p className="notice mt-10">Prix TTC en euros. Paiement sécurisé par Stripe (carte bancaire, Apple Pay, Google Pay). Factures disponibles dans votre compte. Les liens vers les produits peuvent être des <Link href="/legal/affiliation/">liens affiliés</Link>.</p>
    <section className="section max-w-[760px]">
      <h2>Questions fréquentes</h2>
      <div className="mt-4 flex flex-col gap-2">{FAQ.map(([q, a]) => <details key={q} className="panel py-3"><summary className="cursor-pointer font-semibold">{q}</summary><p className="mt-2 text-muted">{a}</p></details>)}</div>
    </section>
    <section className="border-t border-line py-20 text-center">
      <h2 className="mx-auto max-w-[18ch] text-[clamp(36px,5vw,68px)]">Essayez sur votre pièce, <em>c'est offert.</em></h2>
      <div className="mt-8 flex flex-wrap justify-center gap-3"><Link href="/transformer/" className="btn btn-primary btn-lg">Transformer ma pièce</Link></div>
    </section>
    <JsonLd data={{ "@context": "https://schema.org", "@type": "FAQPage", mainEntity: FAQ.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })) }} />
    <JsonLd data={{ "@context": "https://schema.org", "@type": "Product", name: "Pièce Rêvée", description: "Études et rendus d'aménagement intérieur et extérieur", offers: PLANS.filter((p) => p.priceTtc > 0).map((p) => ({ "@type": "Offer", name: p.name, price: (p.priceTtc / 100).toFixed(2), priceCurrency: "EUR" })) }} />
  </>);
}
